'use strict'

const async = require('async')
const endpoint = require('endpoint')
const stream = require('../lib/destroyable-stream')
const guessInterval = require('./guess-interval.js')
const analyseCPU = require('./analyse-cpu.js')
const analyseDelay = require('./analyse-delay.js')
const analyseMemory = require('./analyse-memory.js')
const analyseHandles = require('./analyse-handles.js')
const analyseLoopUtilization = require('./analyse-loop-utilization.js')
const issueCategory = require('./issue-category.js')

class Analysis extends stream.Readable {
  constructor (systemInfoReader, traceEventReader, processStatReader) {
    super({ objectMode: true })

    async.waterfall([
      collectData.bind(null, systemInfoReader, traceEventReader, processStatReader),
      analyseData
    ], this._done.bind(this))
  }

  _done (err, result) {
    if (err) this.destroy(err)
    this.push(result)
    this.push(null)
  }

  _read () {
    // will call push when all data is collected
  }
}

function collectData (systemInfoReader, traceEventReader, processStatReader, callback) {
  async.parallel({
    systemInfo (done) {
      systemInfoReader.pipe(endpoint({ objectMode: true }, function (err, data) {
        if (err) return done(err)
        done(null, data[0])
      }))
    },
    traceEvent (done) {
      traceEventReader.pipe(endpoint({ objectMode: true }, done))
    },
    processStat (done) {
      processStatReader.pipe(endpoint({ objectMode: true }, done))
    }
  }, callback)
}

function analyseData ({ systemInfo, traceEvent, processStat }, callback) {
  // guess the interval for where the benchmarker ran
  const intervalIndex = guessInterval(processStat)

  if (processStat.length < 2) {
    return callback(null, {
      interval: [-Infinity, Infinity],
      issues: {
        delay: 'data',
        cpu: 'data',
        memory: {
          external: 'data',
          rss: 'data',
          heapTotal: 'data',
          heapUsed: 'data'
        },
        handles: 'data',
        loopUtilization: 'data'
      },
      issueCategory: 'data'
    })
  }

  const intervalTime = [
    processStat[intervalIndex[0]].timestamp,
    processStat[intervalIndex[1] - 1].timestamp
  ]

  const { processStatSubset, traceEventSubset } = subsetData(
    traceEvent, processStat, intervalIndex, intervalTime
  )

  // Check for issues, the CPU analysis is async
  analyseCPU(systemInfo, processStatSubset, traceEventSubset, function (err, cpuIssue) {
    /* istanbul ignore if: it is very rare that HMM doesn't converge */
    if (err) return callback(err)

    const issues = {
      delay: analyseDelay(systemInfo, processStatSubset, traceEventSubset),
      cpu: cpuIssue,
      memory: analyseMemory(systemInfo, processStatSubset, traceEventSubset),
      handles: analyseHandles(systemInfo, processStatSubset, traceEventSubset),
      loopUtilization: analyseLoopUtilization(systemInfo, processStatSubset, traceEventSubset)
    }

    const category = issueCategory(issues)

    callback(null, {
      interval: intervalTime,
      issues: issues,
      issueCategory: category
    })
  })
}

function subsetData (traceEvent, processStat, intervalIndex, intervalTime) {
  const processStatSubset = processStat.slice(...intervalIndex)
  const traceEventSubset = []
  for (const datum of traceEvent) {
    if (datum.args.startTimestamp >= intervalTime[0] &&
        datum.args.endTimestamp <= intervalTime[1]) {
      traceEventSubset.push(datum)
    }
  }

  return { processStatSubset, traceEventSubset }
}

module.exports = Analysis
