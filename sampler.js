'use strict'

const fs = require('fs')
const path = require('path')
const ProcessStat = require('./collect/process-stat.js')
const ProcessStatEncoder = require('./format/process-stat-encoder.js')
const getSampleFilename = require('./collect/get-sample-filename.js')

// setup encoded stats file
const encoder = new ProcessStatEncoder()
encoder.pipe(
  fs.createWriteStream(path.resolve(getSampleFilename(process.pid)))
)

// sample every 10ms
const stat = new ProcessStat(parseInt(
  process.env.NODE_CLINIC_DOCTOR_SAMPLE_INTERVAL, 10
))

// keep sample time unrefed such it doesn't interfer too much
let timer = null
function scheduleSample () {
  timer = setTimeout(saveSample, stat.sampleInterval)
  timer.unref()
}

function saveSample () {
  const sample = stat.sample()
  encoder.write(sample)
  stat.refresh()

  scheduleSample()
}

// start sampler
scheduleSample()

// before process exits, flush the encoded data to the sample file
process.once('beforeexit', function () {
  clearTimeout(timer)
  encoder.end()
})
