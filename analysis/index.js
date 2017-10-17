'use strict'

const stream = require('stream')
const guessInterval = require('./guess-interval.js')

class ProcessStateDecoder extends stream.Transform {
  constructor (options) {
    super(Object.assign({
      readableObjectMode: false,
      writableObjectMode: true
    }, options))

    this.data = []
  }

  _transform (datum, encoding, callback) {
    this.data.push(datum)
    callback(null)
  }

  _flush (callback) {
    const interval = guessInterval(this.data)
    console.log(interval)

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
