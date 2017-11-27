'use strict'

const fs = require('fs')
const path = require('path')
const stream = require('stream')
const protobuf = require('protocol-buffers')

const messages = protobuf(
  fs.readFileSync(path.resolve(__dirname, 'process-stat.proto'))
)

const FRAME_PREFIX_SIZE = 2 // uint16 is 2 bytes

class ProcessStatEncoder extends stream.Transform {
  constructor (options) {
    super(Object.assign({
      readableObjectMode: false,
      writableObjectMode: true
    }, options))
  }

  _transform (message, encoding, callback) {
    const messageLength = messages.ProcessStat.encodingLength(message)

    const framedMessage = Buffer.alloc(messageLength + FRAME_PREFIX_SIZE)
    framedMessage.writeUInt16BE(messageLength, 0)
    messages.ProcessStat.encode(message, framedMessage, FRAME_PREFIX_SIZE)

    callback(null, framedMessage)
  }
}

module.exports = ProcessStatEncoder
