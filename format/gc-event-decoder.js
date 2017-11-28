'use strict'

const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const AbstractDecoder = require('./abstract-decoder.js')

const messages = protobuf(
  fs.readFileSync(path.resolve(__dirname, 'gc-event.proto'))
)

const phaseLookup = Object.keys(messages.GCEvent.Phase)
const typeLookup = Object.keys(messages.GCEvent.EventType)

class GCEventDecoder extends AbstractDecoder {
  constructor (options) {
    super(messages.GCEvent, options)
  }

  push (message) {
    if (message === null) return super.push(message)
    super.push({
      timestamp: message.timestamp,
      phase: phaseLookup[message.phase],
      type: typeLookup[message.type]
    })
  }
}

module.exports = GCEventDecoder
