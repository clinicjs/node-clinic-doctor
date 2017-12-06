'use strict'

const fs = require('fs')
const getLoggingPaths = require('../collect/get-logging-paths.js')
const analysis = require('../analysis/index.js')
const GCEventDecoder = require('../format/gc-event-decoder.js')
const ProcessStatDecoder = require('../format/process-stat-decoder.js')
const GCEventToCSV = require('./gc-event-to-csv.js')
const ProcessStatToCSV = require('./process-stat-to-csv.js')

if (process.argv.length < 3) {
  console.error('usage: node sample-to-csv.js pid.clinic-doctor')
  process.exit(1)
}

// Load data
const paths = getLoggingPaths({ path: process.argv[2] })
const gcEventReader = fs.createReadStream(paths['/gcevent'])
  .pipe(new GCEventDecoder())
const processStatReader = fs.createReadStream(paths['/processstat'])
  .pipe(new ProcessStatDecoder())

analysis(gcEventReader, processStatReader)
  .once('data', function (result) {
    fs.createReadStream(paths['/gcevent'])
      .pipe(new GCEventDecoder())
      .pipe(new GCEventToCSV(result.interval))
      .pipe(fs.createWriteStream(paths['/gcevent'] + '.csv'))

    fs.createReadStream(paths['/processstat'])
      .pipe(new ProcessStatDecoder())
      .pipe(new ProcessStatToCSV(result.interval))
      .pipe(fs.createWriteStream(paths['/processstat'] + '.csv'))
  })

console.log('csv file saved at:')
console.log(`  ${paths['/gcevent']}.csv`)
console.log(`  ${paths['/processstat']}.csv`)
