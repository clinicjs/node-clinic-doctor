'use strict'

const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const AbstractEncoder = require('./abstract-encoder.js')

const messages = protobuf(
  fs.readFileSync(path.resolve(__dirname, 'gc-event.proto'))
)

class GCEventEncoder extends AbstractEncoder {
  constructor (options) {
    super(messages.GCEvent, options)
  }

  _transform (message, encoding, callback) {
    super._transform({
      timestamp: message.timestamp,
      phase: messages.GCEvent.Phase[message.phase],
      type: messages.GCEvent.EventType[message.type]
    }, encoding, callback)
  }
}

module.exports = GCEventEncoder
