'use strict'

const stream = require('stream')

class ProcessStateDecoder extends stream.Transform {
  constructor (options) {
    super(Object.assign({
      readableObjectMode: false,
      writableObjectMode: true
    }, options))

    this.data = []
  }

  _transform (chunk, encoding, callback) {
    this.data.push(chunk)
    callback(null)
  }

  _flush (callback) {
    const interval = [
      Math.floor(0.2 * this.data.length),
      Math.floor(0.8 * this.data.length)
    ]

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
      'interval': [
        this.data[interval[0]].timestamp,
        this.data[interval[1]].timestamp
      ],
      'issueCategory': 'gc'
    }))
    callback(null)
  }
}

module.exports = ProcessStateDecoder
