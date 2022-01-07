'use strict'

const test = require('tap').test
const semver = require('semver')
const startpoint = require('startpoint')
const Analysis = require('../analysis/index.js')
const generateProcessStat = require('./generate-process-stat.js')
const generateTraceEvent = require('./generate-trace-event.js')

function getAnalysis (processStatData, traceEventData) {
  const systenInfoReader = startpoint([{
    clock: {
      hrtime: process.hrtime(),
      unixtime: Date.now()
    },
    nodeVersion: semver.parse(process.versions.node)
  }], { objectMode: true })
  const processStatReader = startpoint(processStatData, { objectMode: true })
  const traceEventReader = startpoint(traceEventData, { objectMode: true })

  const analysisResult = new Analysis(systenInfoReader, traceEventReader, processStatReader)

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

test('Analysis - pipeline - no data', async function (t) {
  t.strictSame(await getAnalysis([], []), {
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
})

test('Analysis - pipeline - error', async function (t) {
  const error = new Error('expected error')
  try {
    await getAnalysis([], error)
  } catch (e) {
    t.strictSame(e, error)
    t.end()
  }
})

test('Analysis - pipeline - normal interval', async function (t) {
  for (const noise of [0, 0.1, 0.3]) {
    const goodCPU = generateProcessStat({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 100, 100, 120, 90, 110, 100, 80, 110, 90, 110, 1, 1, 1]
    }, noise, 10)
    const goodMemoryGC = generateTraceEvent(
      '..S..S..........S.........S..S..',
      5)
    t.strictSame(await getAnalysis(goodCPU, goodMemoryGC), {
      interval: [300, 1200],
      issues: {
        delay: 'none',
        cpu: 'none',
        memory: {
          external: 'none',
          rss: 'none',
          heapTotal: 'none',
          heapUsed: 'none'
        },
        handles: 'none',
        loopUtilization: 'none'
      },
      issueCategory: 'none'
    })

    const badCPU = generateProcessStat({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 50, 40, 10, 10, 100, 50, 40, 10, 10, 10, 1, 1, 1]
    }, noise, 10)
    t.strictSame(await getAnalysis(badCPU, goodMemoryGC), {
      interval: [300, 1200],
      issues: {
        delay: 'none',
        cpu: 'performance',
        memory: {
          external: 'none',
          rss: 'none',
          heapTotal: 'none',
          heapUsed: 'none'
        },
        handles: 'none',
        loopUtilization: 'none'
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
  }, 0, 10)
  const goodMemoryGC = generateTraceEvent(
    '.........S.........',
    5)
  t.strictSame(await getAnalysis(goodCPU, goodMemoryGC), {
    interval: [0, 900],
    issues: {
      delay: 'none',
      cpu: 'none',
      memory: {
        external: 'none',
        rss: 'none',
        heapTotal: 'none',
        heapUsed: 'none'
      },
      handles: 'none',
      loopUtilization: 'none'
    },
    issueCategory: 'none'
  })

  const badCPU = generateProcessStat({
    handles: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    cpu: [50, 40, 10, 10, 100, 50, 40, 10, 10, 10]
  }, 0, 10)

  t.strictSame(await getAnalysis(badCPU, goodMemoryGC), {
    interval: [0, 900],
    issues: {
      delay: 'none',
      cpu: 'performance',
      memory: {
        external: 'none',
        rss: 'none',
        heapTotal: 'none',
        heapUsed: 'none'
      },
      handles: 'none',
      loopUtilization: 'none'
    },
    issueCategory: 'io'
  })

  t.end()
})
