'use strict'

const fs = require('fs')
const GCEvent = require('./collect/gc-event.js')
const ProcessStat = require('./collect/process-stat.js')
const getLoggingPaths = require('./collect/get-logging-paths.js')
const GCEventEncoder = require('./format/gc-event-encoder.js')
const ProcessStatEncoder = require('./format/process-stat-encoder.js')

// create encoding files and directory
const paths = getLoggingPaths(process.pid)
fs.mkdirSync(paths['/'])

const processStatEncoder = new ProcessStatEncoder()
processStatEncoder.pipe(fs.createWriteStream(paths['/processstat']))

const gcEventsEncoder = new GCEventEncoder()
gcEventsEncoder.pipe(fs.createWriteStream(paths['/gcevent']))

// save gc-events
const gcEvent = new GCEvent()
gcEvent.on('event', function (info) {
  gcEventsEncoder.write(info)
})

// sample every 10ms
const processStat = new ProcessStat(parseInt(
  process.env.NODE_CLINIC_DOCTOR_SAMPLE_INTERVAL, 10
))

// keep sample time unrefed such it doesn't interfer too much
let timer = null
function scheduleSample () {
  timer = setTimeout(saveSample, processStat.sampleInterval)
  timer.unref()
}

function saveSample () {
  const sample = processStat.sample()
  processStatEncoder.write(sample)
  processStat.refresh()

  scheduleSample()
}

// start
scheduleSample()
gcEvent.start()

// before process exits, flush the encoded data to the sample file
process.once('beforeexit', function () {
  clearTimeout(timer)
  gcEvent.stop()

  processStatEncoder.end()
  gcEventsEncoder.end()
})
