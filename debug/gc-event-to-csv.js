'use strict'

const stream = require('stream')

class GCEventToCSV extends stream.Transform {
  constructor (interval) {
    super({
      readableObjectMode: false,
      writableObjectMode: true
    })

    this._interval = interval

    this.push('interval, startTimestamp, endTimestamp, type\n')
  }

  _transform (data, encoding, done) {
    const inInterval = data.startTimestamp >= this._interval[0] &&
                       data.endTimestamp <= this._interval[1]

    this.push(`${inInterval ? 1 : 0}, ` +
              `${data.startTimestamp}, ${data.endTimestamp}, ` +
              `${data.type}\n`)
    done(null)
  }
}

module.exports = GCEventToCSV
