'use strict'

const stream = require('../lib/destroyable-stream')

const FRAME_PREFIX_SIZE = 2 // uint16 is 2 bytes

class AbstractDecoder extends stream.Transform {
  constructor (messageType, options) {
    super(Object.assign({
      readableObjectMode: true,
      writableObjectMode: false
    }, options))

    this._messageType = messageType

    this._buffers = []
    this._bufferedLength = 0
    this._nextMessageLength = FRAME_PREFIX_SIZE
    this._awaitFramePrefix = true
  }

  _transform (chunk, encoding, callback) {
    // Join buffers if the concated buffer contains an object
    if (this._bufferedLength > 0 &&
        this._bufferedLength + chunk.length >= this._nextMessageLength) {
      chunk = Buffer.concat(this._buffers.concat([chunk]))
      this._buffers = []
      this._bufferedLength = 0
    }

    // decode as long as there is an entire object
    // This is implemented as a very basic state machine:
    while (chunk.length >= this._nextMessageLength) {
      switch (this._awaitFramePrefix) {
        case true:
          this._nextMessageLength = chunk.readUInt16BE(0)
          chunk = chunk.slice(FRAME_PREFIX_SIZE)
          this._awaitFramePrefix = false
          break
        case false:
          this.push(
            this._messageType.decode(chunk.slice(0, this._nextMessageLength))
          )
          chunk = chunk.slice(this._nextMessageLength)
          this._nextMessageLength = FRAME_PREFIX_SIZE
          this._awaitFramePrefix = true
          break
      }
    }

    // add remaining chunk if there is data left
    if (chunk.length > 0) {
      this._buffers.push(chunk)
      this._bufferedLength += chunk.length
    }

    callback(null)
  }
}

module.exports = AbstractDecoder
