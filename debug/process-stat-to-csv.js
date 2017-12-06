'use strict'

const stream = require('stream')

class ProcessStatToCSV extends stream.Transform {
  constructor (interval) {
    super({
      readableObjectMode: false,
      writableObjectMode: true
    })

    this._interval = interval

    this.push('timestamp, interval, delay, cpu, memory.rss, ' +
              'memory.heapTotal, memory.heapUsed, memory.external, handles\n')
  }

  _transform (data, encoding, done) {
    const time = data.timestamp
    const inInterval = time >= this._interval[0] && time <= this._interval[1]

    this.push(`${data.timestamp}, ${inInterval ? 1 : 0}, ${data.delay}, ` +
              `${data.cpu}, ${data.memory.rss}, ${data.memory.heapTotal}, ` +
              `${data.memory.heapUsed}, ${data.memory.external}, ` +
              `${data.handles}\n`)
    done(null)
  }
}

module.exports = ProcessStatToCSV
