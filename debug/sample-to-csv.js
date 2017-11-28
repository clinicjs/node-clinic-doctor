'use strict'

const fs = require('fs')
const ProcessStatToCSV = require('./process-stat-to-csv.js')
const getLoggingPaths = require('../collect/get-logging-paths.js')
const ProcessStatDecoder = require('../format/process-stat-decoder.js')

// Load data
const paths = getLoggingPaths({ path: process.argv[2] })
const processStatReader = fs.createReadStream(paths['/processstat'])
  .pipe(new ProcessStatDecoder())

processStatReader
  .pipe(new ProcessStatToCSV())
  .pipe(process.stdout)
