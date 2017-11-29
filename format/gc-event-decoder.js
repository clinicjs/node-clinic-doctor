'use strict'

const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const AbstractDecoder = require('./abstract-decoder.js')

const messages = protobuf(
  fs.readFileSync(path.resolve(__dirname, 'gc-event.proto'))
)

const typeLookup = Object.keys(messages.GCEvent.EventType)

class GCEventDecoder extends AbstractDecoder {
  constructor (options) {
    super(messages.GCEvent, options)

    this._storage = new Map()
  }

  push (message) {
    if (message === null) return super.push(message)

    if (this._storage.has(message.type)) {
      if (message.phase !== messages.GCEvent.Phase.END) {
        return this.emit(new Error(`Unexpected phase: ${message.phase}`))
      }
      // recived END phase, emit combined event
      const startTimestamp = this._storage.get(message.type)
      this._storage.delete(message.type)

      super.push({
        startTimestamp: startTimestamp,
        endTimestamp: message.timestamp,
        type: typeLookup[message.type]
      })
    } else {
      if (message.phase !== messages.GCEvent.Phase.BEGIN) {
        return this.emit(new Error(`Unexpected phase: ${message.phase}`))
      }
      // recived BEGIN phase, store startTimestamp
      this._storage.set(message.type, message.timestamp)
    }
  }
}

module.exports = GCEventDecoder
