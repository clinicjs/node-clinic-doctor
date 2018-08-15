'use strict'

const fs = require('fs')
const getLoggingPaths = require('../collect/get-logging-paths.js')
const analysis = require('../analysis/index.js')
const SystemInfoDecoder = require('../format/system-info-decoder.js')
const TraceEventDecoder = require('../format/trace-event-decoder.js')
const ProcessStatDecoder = require('../format/process-stat-decoder.js')
const TraceEventToCSV = require('./trace-event-to-csv.js')
const ProcessStatToCSV = require('./process-stat-to-csv.js')

if (process.argv.length < 3) {
  console.error('usage: node sample-to-csv.js pid.clinic-doctor')
  process.exit(1)
}

// Load data
const paths = getLoggingPaths({ path: process.argv[2] })
const systemInfoReader = fs.createReadStream(paths['/systeminfo'])
  .pipe(new SystemInfoDecoder())
const traceEventReader = fs.createReadStream(paths['/traceevent'])
  .pipe(new TraceEventDecoder(systemInfoReader))
const processStatReader = fs.createReadStream(paths['/processstat'])
  .pipe(new ProcessStatDecoder())

analysis(traceEventReader, processStatReader)
  .once('data', function (result) {
    const systemInfoReader = fs.createReadStream(paths['/systeminfo'])
      .pipe(new SystemInfoDecoder())

    fs.createReadStream(paths['/traceevent'])
      .pipe(new TraceEventDecoder(systemInfoReader))
      .pipe(new TraceEventToCSV(result.interval))
      .pipe(fs.createWriteStream(paths['/traceevent'] + '.csv'))

    fs.createReadStream(paths['/processstat'])
      .pipe(new ProcessStatDecoder())
      .pipe(new ProcessStatToCSV(result.interval))
      .pipe(fs.createWriteStream(paths['/processstat'] + '.csv'))
  })

console.log('csv file saved at:')
console.log(`  ${paths['/traceevent']}.csv`)
console.log(`  ${paths['/processstat']}.csv`)
