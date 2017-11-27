'use strict'

const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const AbstractEncoder = require('./abstract-encoder.js')

const messages = protobuf(
  fs.readFileSync(path.resolve(__dirname, 'process-stat.proto'))
)

class ProcessStatEncoder extends AbstractEncoder {
  constructor (options) {
    super(messages.ProcessStat, options)
  }
}

module.exports = ProcessStatEncoder
