'use strict'

const fs = require('fs')
const path = require('path')
const pump = require('pump')
const browserify = require('browserify')
const { spawn } = require('child_process')
const base64stream = require('base64-stream')
const streamTemplate = require('stream-template')
const getSampleFilename = require('./collect/get-sample-filename.js')
const ProcessStateDecoder = require('./format/decoder.js')
const ProcessStateAnalysis = require('./analysis/index.js')
const CreateRecommendation = require('./recommendations/index.js')
const stream = require('stream')

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
    const proc = spawn(args[0], ['-r', samplerPath].concat(args.slice(1)), {
      stdio: 'inherit',
      env: Object.assign({
        'NODE_CLINIC_DOCTOR_SAMPLE_INTERVAL': this.sampleInterval
      }, process.env)
    })

    // relay SIGINT to process
    process.once('SIGINT', () => proc.kill('SIGINT'))

    proc.once('exit', function (code, signal) {
      // the process did not exit normally
      if (code !== 0 && signal !== 'SIGINT') {
        if (code !== null) {
          return callback(new Error(`process exited with exit code ${code}`))
        } else {
          return callback(new Error(`process exited by signal ${signal}`))
        }
      }

      // filename is defined my the child pid
      callback(null, getSampleFilename(proc.pid))
    })
  }

  visualize (dataFilename, outputFilename, callback) {
    const fakeDataPath = path.join(__dirname, 'visualizer', 'data.json')
    const stylePath = path.join(__dirname, 'visualizer', 'style.css')
    const scriptPath = path.join(__dirname, 'visualizer', 'main.js')

    // construct the data file
    const dataSource = fs.createReadStream(dataFilename)
    // encode the datafile as a base64 JSON string
    const dataBase64 = dataSource
      .pipe(base64stream.encode())
    // analyse datafile and output issue list and recommendation
    const analysis = dataSource
      .pipe(new ProcessStateDecoder())
      .pipe(new ProcessStateAnalysis())

    const recommendation = analysis
      .pipe(new CreateRecommendation())

    const analysisStringified = analysis
      .pipe(new stream.Transform({
        readableObjectMode: false,
        writableObjectMode: true,
        transform (data, encoding, callback) {
          callback(null, JSON.stringify(data))
        }
      }))

    const dataFile = streamTemplate`
      {
        "file": "${dataBase64}",
        "analysis": ${analysisStringified},
        "recommendation": ${recommendation}
      }
    `

    // create script-file stream
    const b = browserify({
      'basedir': __dirname,
      // 'debug': true,
      'noParse': [fakeDataPath]
    })
    b.transform('brfs')
    b.require(dataFile, {
      'file': fakeDataPath
    })
    b.add(scriptPath)
    const scriptFile = b.bundle()

    // create style-file stream
    const styleFile = fs.createReadStream(stylePath)

    // build output file
    const outputFile = streamTemplate`
      <!DOCTYPE html>
      <meta charset="utf8">
      <title>Clinic Doctor</title>

      <style>${styleFile}</style>

      <div id="banner"></div>
      <div id="menu"></div>
      <div id="graph"></div>
      <div id="recommendation-space"></div>
      <div id="recommendation"></div>

      <script>${scriptFile}</script>
    `

    pump(
      outputFile,
      fs.createWriteStream(outputFilename),
      callback
    )
  }
}

module.exports = ClinicDoctor
