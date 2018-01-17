'use strict'

const stream = require('stream')

exports.Transform = extend(stream.Transform)
exports.Readable = extend(stream.Readable)
exports.Writable = extend(stream.Writable)
exports.Duplex = extend(stream.Duplex)

function extend (Class) {
  class Destroyable extends Class {
    _destroy (err) {
      if (err) this.emit('error', err)
      this.emit('close')
    }
  }

  return Destroyable
}
