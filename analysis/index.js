'use strict'

const stream = require('stream')

class ProcessStateDecoder extends stream.Transform {
  constructor (options) {
    super(Object.assign({
      readableObjectMode: false,
      writableObjectMode: true
    }, options))
  }

  _transform (chunk, encoding, callback) {
    callback(null)
  }

  _flush (callback) {
    this.push(JSON.stringify({
      'issues': {
        'delay': true,
        'cpu': false,
        'memory': {
          'rss': false,
          'heapTotal': true,
          'heapUsed': true
        },
        'handles': false
      },
      'issueCategory': 'gc'
    }))
    callback(null)
  }
}

module.exports = ProcessStateDecoder
