'use strict'

const async = require('async')
const stream = require('stream')
const endpoint = require('endpoint')
const guessInterval = require('./guess-interval.js')
const analyseCPU = require('./analyse-cpu.js')
const analyseDelay = require('./analyse-delay.js')
const analyseMemory = require('./analyse-memory.js')
const analyseHandles = require('./analyse-handles.js')
const issueCategory = require('./issue-category.js')

class Analyse extends stream.Readable {
  constructor (options) {
    super(Object.assign({
      objectMode: true
    }, options))
  }

  _read () {
    // will call push when all data is collected
  }
}

function analysis (gcEventReader, processStatReader) {
  const result = new Analyse()

  async.parallel({
    gcEvent (done) {
      gcEventReader.pipe(endpoint({ objectMode: true }, done))
    },
    processStat (done) {
      processStatReader.pipe(endpoint({ objectMode: true }, done))
    }
  }, function (err, data) {
    if (err) return result.emit('error', err)
    const { gcEvent, processStat } = data

    // guess the interval for where the benchmarker ran
    const intervalIndex = guessInterval(processStat)
    const intervalTime = [
      processStat[intervalIndex[0]].timestamp,
      processStat[intervalIndex[1] - 1].timestamp
    ]

    // subset data
    const processStatSubset = processStat.slice(...intervalIndex)
    const gcEventSubset = []
    for (const datum of gcEvent) {
      if (datum.startTimestamp >= intervalTime[0] &&
          datum.endTimestamp <= intervalTime[1]) {
        gcEventSubset.push(datum)
      }
    }

    const issues = {
      'delay': analyseDelay(processStatSubset, gcEventSubset),
      'cpu': analyseCPU(processStatSubset, gcEventSubset),
      'memory': analyseMemory(processStatSubset, gcEventSubset),
      'handles': analyseHandles(processStatSubset, gcEventSubset)
    }
    const category = issueCategory(issues)

    result.push({
      'interval': intervalTime,
      'issues': issues,
      'issueCategory': category
    })
    result.push(null)
  })

  return result
}

module.exports = analysis
