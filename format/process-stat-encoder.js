'use strict'

const fs = require('fs')
const path = require('path')
const stream = require('stream')
const protobuf = require('protocol-buffers')

const messages = protobuf(
  fs.readFileSync(path.resolve(__dirname, 'process-stat.proto'))
)

class ProcessStatEncoder extends stream.Transform {
  constructor (options) {
    super(Object.assign({
      readableObjectMode: false,
      writableObjectMode: true
    }, options))
  }

  _transform (stat, encoding, callback) {
    callback(null, messages.ProcessStat.encode(stat))
  }
}

module.exports = ProcessStatEncoder
