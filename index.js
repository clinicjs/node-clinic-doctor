'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const pump = require('pump')
const pumpify = require('pumpify')
const stream = require('./lib/destroyable-stream')
const { spawn } = require('child_process')
const analysis = require('./analysis/index.js')
const Stringify = require('streaming-json-stringify')
const browserify = require('browserify')
const streamTemplate = require('stream-template')
const getLoggingPaths = require('./collect/get-logging-paths.js')
const SystemInfoDecoder = require('./format/system-info-decoder.js')
const TraceEventDecoder = require('./format/trace-event-decoder.js')
const ProcessStatDecoder = require('./format/process-stat-decoder.js')
const RenderRecommendations = require('./recommendations/index.js')

class ClinicDoctor {
  constructor (settings = {}) {
    // define default parameters
    const {
      sampleInterval = 10
    } = settings

    this.sampleInterval = sampleInterval
  }

  collect (args, callback) {
    const samplerPath = path.resolve(__dirname, 'sampler.js')

    // run program, but inject the sampler
    const logArgs = [
      '-r', samplerPath,
      '--trace-events-enabled', '--trace-event-categories', 'v8'
    ]
    const proc = spawn(args[0], args.slice(1), {
      stdio: 'inherit',
      env: Object.assign({}, process.env, {
        NODE_OPTIONS: logArgs.join(' ') + (
          process.env.NODE_OPTIONS ? ' ' + process.env.NODE_OPTIONS : ''
        ),
        NODE_CLINIC_DOCTOR_SAMPLE_INTERVAL: this.sampleInterval
      })
    })

    // get logging directory structure
    const paths = getLoggingPaths({ identifier: proc.pid })

    // relay SIGINT to process
    process.once('SIGINT', function () {
      // we cannot kill(SIGINT) on windows but it seems
      // to relay the ctrl-c signal per default, so only do this
      // if not windows
      /* istanbul ignore else: windows hack */
      if (os.platform() !== 'win32') proc.kill('SIGINT')
    })

    proc.once('exit', function (code, signal) {
      // Windows exit code STATUS_CONTROL_C_EXIT 0xC000013A returns 3221225786
      // if not caught. See https://msdn.microsoft.com/en-us/library/cc704588.aspx
      /* istanbul ignore next: windows hack */
      if (code === 3221225786 && os.platform() === 'win32') signal = 'SIGINT'

      // Abort if the process did not exit normally.
      if (code !== 0 && signal !== 'SIGINT') {
        if (code !== null) {
          return callback(
            new Error(`process exited with exit code ${code}`),
            paths['/']
          )
        } else {
          return callback(
            new Error(`process exited by signal ${signal}`),
            paths['/']
          )
        }
      }

      // move trace_event file to logging directory
      fs.rename(
        'node_trace.1.log', paths['/traceevent'],
        function (err) {
          if (err) return callback(err, paths['/'])
          callback(null, paths['/'])
        }
      )
    })
  }

  visualize (dataDirname, outputFilename, callback) {
    const fakeDataPath = path.join(__dirname, 'visualizer', 'data.json')
    const stylePath = path.join(__dirname, 'visualizer', 'style.css')
    const scriptPath = path.join(__dirname, 'visualizer', 'main.js')
    const logoPath = path.join(__dirname, 'visualizer', 'app-logo.svg')
    const nearFormLogoPath = path.join(__dirname, 'visualizer', 'nearform-logo.svg')

    // Load data
    const paths = getLoggingPaths({ path: dataDirname })

    const systemInfoReader = pumpify.obj(
      fs.createReadStream(paths['/systeminfo']),
      new SystemInfoDecoder()
    )
    const traceEventReader = pumpify.obj(
      fs.createReadStream(paths['/traceevent']),
      new TraceEventDecoder(systemInfoReader)
    )
    const processStatReader = pumpify.obj(
      fs.createReadStream(paths['/processstat']),
      new ProcessStatDecoder()
    )

    // create analysis
    const analysisStringified = pumpify(
      analysis(traceEventReader, processStatReader),
      new stream.Transform({
        readableObjectMode: false,
        writableObjectMode: true,
        transform (data, encoding, callback) {
          callback(null, JSON.stringify(data))
        }
      })
    )

    const traceEventStringify = pumpify(
      traceEventReader,
      new Stringify({
        seperator: ',\n',
        stringifier: JSON.stringify
      })
    )

    const processStatStringify = pumpify(
      processStatReader,
      new Stringify({
        seperator: ',\n',
        stringifier: JSON.stringify
      })
    )

    const dataFile = streamTemplate`
      {
        "traceEvent": ${traceEventStringify},
        "processStat": ${processStatStringify},
        "analysis": ${analysisStringified}
      }
    `

    // render recommendations as HTML templates
    const recommendations = new RenderRecommendations()

    // open logo
    const logoFile = fs.createReadStream(logoPath)
    const nearFormLogoFile = fs.createReadStream(nearFormLogoPath)

    // create script-file stream
    const b = browserify({
      'basedir': __dirname,
      // 'debug': true,
      'noParse': [fakeDataPath]
    })
    b.require(dataFile, {
      'file': fakeDataPath
    })
    b.add(scriptPath)
    b.transform('brfs')
    const scriptFile = b.bundle()

    // create style-file stream
    const styleFile = fs.createReadStream(stylePath)

    // forward dataFile errors to the scriptFile explicitly
    // we cannot use destroy until nodejs/node#18172 and nodejs/node#18171 are fixed
    dataFile.on('error', (err) => scriptFile.emit('error', err))

    // build output file
    const outputFile = streamTemplate`
      <!DOCTYPE html>
      <html lang="en">
      <meta charset="utf8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Clinic Doctor</title>

      <style>${styleFile}</style>

      <div id="banner">
        ${logoFile}
        <a href="https://nearform.com" title="nearForm" target="_blank">${nearFormLogoFile}</a>
      </div>
      <div id="front-matter">
        <div id="alert"></div>
        <div id="menu"></div>
      </div>
      <div id="graph"></div>
      <div id="recommendation-space"></div>
      <div id="recommendation"></div>

      ${recommendations}

      <script>${scriptFile}</script>
      </html>
    `

    pump(
      outputFile,
      fs.createWriteStream(outputFilename),
      callback
    )
  }
}

module.exports = ClinicDoctor
