'use strict'

const async = require('async')
const stream = require('stream')
const collect = require('stream-collector')
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

function analysis (traceEventReader, processStatReader) {
  const result = new Analyse()

  async.parallel({
    traceEvent (done) {
      collect(traceEventReader, done)
    },
    processStat (done) {
      collect(processStatReader, done)
    }
  }, function (err, data) {
    if (err) return result.emit('error', err)
    const { traceEvent, processStat } = data

    // guess the interval for where the benchmarker ran
    const intervalIndex = guessInterval(processStat)
    const intervalTime = [
      processStat[intervalIndex[0]].timestamp,
      processStat[intervalIndex[1] - 1].timestamp
    ]

    // subset data
    const processStatSubset = processStat.slice(...intervalIndex)
    const traceEventSubset = []
    for (const datum of traceEvent) {
      if (datum.args.startTimestamp >= intervalTime[0] &&
          datum.args.endTimestamp <= intervalTime[1]) {
        traceEventSubset.push(datum)
      }
    }

    const issues = {
      'delay': analyseDelay(processStatSubset, traceEventSubset),
      'cpu': analyseCPU(processStatSubset, traceEventSubset),
      'memory': analyseMemory(processStatSubset, traceEventSubset),
      'handles': analyseHandles(processStatSubset, traceEventSubset)
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
