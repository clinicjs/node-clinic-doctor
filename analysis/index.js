'use strict'

const stream = require('stream')
const guessInterval = require('./guess-interval.js')
const analyseCPU = require('./analyse-cpu.js')
const analyseDelay = require('./analyse-delay.js')
const analyseMemory = require('./analyse-memory.js')
const issueCategory = require('./issue-category.js')

class Analyse extends stream.Transform {
  constructor (options) {
    super(Object.assign({
      readableObjectMode: true,
      writableObjectMode: true
    }, options))

    this.data = []
  }

  _transform (datum, encoding, callback) {
    this.data.push(datum)
    callback(null)
  }

  _flush (callback) {
    // guess the interval for where the benchmarker ran
    const interval = guessInterval(this.data)
    const subset = this.data.slice(interval[0], interval[1])
    const issues = {
      'delay': analyseDelay(subset),
      'cpu': analyseCPU(subset),
      'memory': analyseMemory(subset),
      // Handles don't really indicate that anything is wrong, especially
      // because the values depends on the benchmark settings. The handles data
      // is currently just used to guess the time interval.
      'handles': false
    }
    const category = issueCategory(issues)

    this.push({
      'interval': [
        this.data[interval[0]].timestamp,
        this.data[interval[1] - 1].timestamp
      ],
      'issues': issues,
      'issueCategory': category
    })
    callback(null)
  }
}

module.exports = Analyse
