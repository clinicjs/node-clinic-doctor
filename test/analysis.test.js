'use strict'

const test = require('tap').test
const startpoint = require('startpoint')
const Analysis = require('../analysis/index.js')
const generateProcessStat = require('./generate-process-stat.js')
const generateTraceEvent = require('./generate-trace-event.js')

function getAnalysis (processStatData, traceEventData) {
  const processStatReader = startpoint(processStatData, { objectMode: true })
  const traceEventReader = startpoint(traceEventData, { objectMode: true })

  const analysisResult = new Analysis(traceEventReader, processStatReader)

  // read data
  return new Promise(function (resolve, reject) {
    const initRead = analysisResult.read()
    if (initRead !== null) return resolve(initRead)

    analysisResult.once('readable', function () {
      const safeRead = analysisResult.read()
      resolve(safeRead)
    })

    analysisResult.once('error', function (error) {
      reject(error)
    })
  })
}

test('Analysis - pipeline - too little data error', async function (t) {
  try {
    await getAnalysis([], [])
  } catch (e) {
    t.ok(/not enough data/i.test(e.message))
    t.end()
  }
})

test('Analysis - pipeline - error', async function (t) {
  const error = new Error('expected error')
  try {
    await getAnalysis([], error)
  } catch (e) {
    t.strictDeepEqual(e, error)
    t.end()
  }
})

test('Analysis - pipeline - normal interval', async function (t) {
  for (const noise of [0, 0.1, 0.3]) {
    const goodCPU = generateProcessStat({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 100, 100, 120, 90, 110, 100, 80, 110, 90, 110, 1, 1, 1]
    }, noise, 100)
    const goodMemoryGC = generateTraceEvent([
      'NONE', 'SCA', 'NONE', 'SCA', 'NONE', 'SCA', 'NONE', 'SCA', 'NONE',
      'SCA', 'NONE', 'SCA', 'NONE', 'NONE', 'NONE', 'NONE'
    ], 100)
    t.strictDeepEqual(await getAnalysis(goodCPU, goodMemoryGC), {
      interval: [ 300, 1200 ],
      issues: {
        delay: false,
        cpu: false,
        memory: {
          external: false,
          rss: false,
          heapTotal: false,
          heapUsed: false
        },
        handles: false
      },
      issueCategory: 'none'
    })

    const badCPU = generateProcessStat({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 50, 40, 10, 10, 100, 50, 40, 10, 10, 10, 1, 1, 1]
    }, noise, 100)
    t.strictDeepEqual(await getAnalysis(badCPU, []), {
      interval: [ 300, 1200 ],
      issues: {
        delay: false,
        cpu: true,
        memory: {
          external: false,
          rss: false,
          heapTotal: false,
          heapUsed: false
        },
        handles: false
      },
      issueCategory: 'io'
    })
  }

  t.end()
})

test('Analysis - pipeline - full interval', async function (t) {
  const goodCPU = generateProcessStat({
    handles: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    cpu: [100, 100, 120, 90, 110, 100, 80, 110, 90, 110]
  }, 0, 100)
  t.strictDeepEqual(await getAnalysis(goodCPU, []), {
    interval: [ 0, 900 ],
    issues: {
      delay: false,
      cpu: false,
      memory: {
        external: false,
        rss: false,
        heapTotal: false,
        heapUsed: false
      },
      handles: false
    },
    issueCategory: 'none'
  })

  const badCPU = generateProcessStat({
    handles: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    cpu: [50, 40, 10, 10, 100, 50, 40, 10, 10, 10]
  }, 0, 100)

  t.strictDeepEqual(await getAnalysis(badCPU, []), {
    interval: [ 0, 900 ],
    issues: {
      delay: false,
      cpu: true,
      memory: {
        external: false,
        rss: false,
        heapTotal: false,
        heapUsed: false
      },
      handles: false
    },
    issueCategory: 'io'
  })

  t.end()
})
