'use strict'

const ProcessStateDecoder = require('../format/decoder.js')
const ProcessStateToCSV = require('./process-state-to-csv.js')

process.stdin
  .pipe(new ProcessStateDecoder())
  .pipe(new ProcessStateToCSV())
  .pipe(process.stdout)
