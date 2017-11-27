'use strict'

const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const AbstractDecoder = require('./abstract-decoder.js')

const messages = protobuf(
  fs.readFileSync(path.resolve(__dirname, 'process-stat.proto'))
)

class ProcessStatDecoder extends AbstractDecoder {
  constructor (options) {
    super(messages.ProcessStat, options)
  }
}

module.exports = ProcessStatDecoder
