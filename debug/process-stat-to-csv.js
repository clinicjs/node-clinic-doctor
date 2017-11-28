'use strict'

const stream = require('stream')
const guessInterval = require('../analysis/guess-interval.js')

class ProcessStatToCSV extends stream.Transform {
  constructor () {
    super({
      readableObjectMode: false,
      writableObjectMode: true
    })

    this._data = []
  }

  _transform (data, encoding, done) {
    this._data.push(data)
    done(null)
  }

  _flush () {
    const interval = guessInterval(this._data)

    this.push('timestamp, interval, delay, cpu, memory.rss, ' +
              'memory.heapTotal, memory.heapUsed, memory.external, handles\n')

    for (let i = 0; i < this._data.length; i++) {
      const data = this._data[i]
      const inInterval = i >= interval[0] && i < interval[1]

      this.push(`${data.timestamp}, ${inInterval ? 1 : 0}, ${data.delay}, ` +
                `${data.cpu}, ${data.memory.rss}, ${data.memory.heapTotal}, ` +
                `${data.memory.heapUsed}, ${data.memory.external}, ` +
                `${data.handles}\n`)
    }

    this.push(null)
  }
}

module.exports = ProcessStatToCSV
