'use strict'

const events = require('events')
const fs = require('fs')
const os = require('os')
const path = require('path')
const pump = require('pump')
const pumpify = require('pumpify')
const stream = require('./lib/destroyable-stream')
const { spawn } = require('child_process')
const Analysis = require('./analysis/index.js')
const Stringify = require('streaming-json-stringify')
const browserify = require('browserify')
const streamTemplate = require('stream-template')
const joinTrace = require('node-trace-log-join')
const getLoggingPaths = require('@nearform/clinic-common').getLoggingPaths('doctor')
const SystemInfoDecoder = require('./format/system-info-decoder.js')
const TraceEventDecoder = require('./format/trace-event-decoder.js')
const ProcessStatDecoder = require('./format/process-stat-decoder.js')
const RenderRecommendations = require('./recommendations/index.js')
const minifyStream = require('minify-stream')
const v8 = require('v8')
const HEAP_MAX = v8.getHeapStatistics().heap_size_limit

class ClinicDoctor extends events.EventEmitter {
  constructor (settings = {}) {
    super()

    // define default parameters
    const {
      sampleInterval = 10,
      detectPort = false,
      debug = false,
      dest = null
    } = settings

    this.sampleInterval = sampleInterval
    this.detectPort = detectPort
    this.debug = debug
    this.path = dest
  }

  collect (args, callback) {
    // run program, but inject the sampler
    const logArgs = [
      '-r', 'no-cluster.js',
      '-r', 'sampler.js',
      '--trace-events-enabled', '--trace-event-categories', 'v8'
    ]

    const stdio = ['inherit', 'inherit', 'inherit']

    if (this.detectPort) {
      logArgs.push('-r', 'detect-port.js')
      stdio.push('pipe')
    }

    const customEnv = {
      // use NODE_PATH to work around issues with spaces in inject path
      NODE_PATH: path.join(__dirname, 'injects'),
      NODE_OPTIONS: logArgs.join(' ') + (
        process.env.NODE_OPTIONS ? ' ' + process.env.NODE_OPTIONS : ''
      ),
      NODE_CLINIC_DOCTOR_SAMPLE_INTERVAL: this.sampleInterval
    }

    if (this.path) {
      customEnv.NODE_CLINIC_DOCTOR_DATA_PATH = this.path
    }

    const proc = spawn(args[0], args.slice(1), {
      stdio,
      env: Object.assign({}, process.env, customEnv)
    })

    if (this.detectPort) {
      proc.stdio[3].once('data', data => this.emit('port', Number(data), proc, () => proc.stdio[3].destroy()))
    }

    // get logging directory structure
    const options = { identifier: proc.pid, path: this.path }
    const paths = getLoggingPaths(options)
    // relay SIGINT to process
    process.once('SIGINT', function () {
      // we cannot kill(SIGINT) on windows but it seems
      // to relay the ctrl-c signal per default, so only do this
      // if not windows
      /* istanbul ignore next */
      if (os.platform() !== 'win32') proc.kill('SIGINT')
    })

    proc.once('exit', (code, signal) => {
      // Windows exit code STATUS_CONTROL_C_EXIT 0xC000013A returns 3221225786
      // if not caught. See https://msdn.microsoft.com/en-us/library/cc704588.aspx
      /* istanbul ignore next */
      if (code === 3221225786 && os.platform() === 'win32') signal = 'SIGINT'

      // report if the process did not exit normally.
      if (code !== 0 && signal !== 'SIGINT') {
        /* istanbul ignore next */
        if (code !== null) {
          console.error(`process exited with exit code ${code}`)
        } else {
          /* istanbul ignore next */
          return callback(
            new Error(`process exited by signal ${signal}`),
            paths['/']
          )
        }
      }

      this.emit('analysing')

      // move trace_event file to logging directory
      joinTrace(
        'node_trace.*.log', paths['/traceevent'],
        function (err) {
          /* istanbul ignore if: the node_trace file should always exists */
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
    const clinicFaviconPath = path.join(__dirname, 'visualizer', 'clinic-favicon.png.b64')

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
      new Analysis(traceEventReader, processStatReader),
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

    const hasFreeMemory = () => {
      const used = process.memoryUsage().heapTotal / HEAP_MAX
      if (used > 0.5) {
        systemInfoReader.destroy()
        traceEventReader.destroy()
        processStatReader.destroy()
        analysisStringified.destroy()
        this.emit('truncate')
        this.emit('warning', 'Truncating input data due to memory constrains')
      }
    }

    const checkHeapInterval = setInterval(hasFreeMemory, 50)

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
    const clinicFaviconBase64 = fs.createReadStream(clinicFaviconPath)

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
    let scriptFile = b.bundle()

    if (!this.debug) {
      scriptFile = scriptFile.pipe(minifyStream({ sourceMap: false, mangle: false }))
    }

    // create style-file stream
    const styleFile = fs.createReadStream(stylePath)

    // forward dataFile errors to the scriptFile explicitly
    // we cannot use destroy until nodejs/node#18172 and nodejs/node#18171 are fixed
    dataFile.on('error', (err) => scriptFile.emit('error', err))

    // build output file
    const outputFile = streamTemplate`
      <!DOCTYPE html>
      <html lang="en" class="grid-layout">
      <meta charset="utf8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="shortcut icon" type="image/png" href="${clinicFaviconBase64}">
      <title>Clinic Doctor</title>

      <style>${styleFile}</style>

      <div id="banner">
        <a id="main-logo" href="https://github.com/nearform/node-clinic-doctor" title="Clinic Doctor on GitHub" target="_blank">
          ${logoFile} <span>Doctor</span>
        </a>
        <a id="company-logo" href="https://nearform.com" title="nearForm" target="_blank">
          ${nearFormLogoFile}
        </a>
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
      function (err) {
        clearInterval(checkHeapInterval)
        callback(err)
      }
    )
  }
}

module.exports = ClinicDoctor
