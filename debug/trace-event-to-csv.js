'use strict'

const stream = require('stream')

class TraceEventToCSV extends stream.Transform {
  constructor (interval) {
    super({
      readableObjectMode: false,
      writableObjectMode: true
    })

    this._interval = interval

    this.push('interval, startTimestamp, endTimestamp, duration, type\n')
  }

  _transform (data, encoding, done) {
    const inInterval = data.args.startTimestamp >= this._interval[0] &&
                       data.args.endTimestamp <= this._interval[1]

    this.push(`${inInterval ? 1 : 0}, ` +
              `${data.args.startTimestamp}, ${data.args.endTimestamp}, ` +
              `${data.args.endTimestamp - data.args.startTimestamp}, ` +
              `${data.name}\n`)
    done(null)
  }
}

module.exports = TraceEventToCSV
