'use strict'

const test = require('tap').test
const analyseMemory = require('../analysis/analyse-memory.js')
const generateTraceEvent = require('./generate-trace-event.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse memory - delay correlation', function (t) {
  const goodMemoryStat = generateProcessStat({
    delay: [1, 1, 1, 30, 1, 1, 1],
    memory: {
      heapTotal: [30, 40, 40, 50, 30, 40, 40]
    }
  }, 0)
  const goodMemoryGc = generateTraceEvent([
    'NONE', 'SCA', 'NONE', 'MSC', 'MSC', 'MSC', 'NONE', 'SCA', 'NONE'
  ])

  t.strictDeepEquals(analyseMemory(goodMemoryStat, goodMemoryGc), {
    external: false,
    heapTotal: false,
    heapUsed: false,
    rss: false
  })

  const badMemoryStat = generateProcessStat({
    delay: [1, 1, 1, 120, 1, 1, 1],
    memory: {
      heapTotal: [1, 50, 50, 150, 1, 50, 50]
    }
  }, 0)
  const badMemoryGc = generateTraceEvent([
    'NONE', 'SCA', 'NONE',
    'MSC', 'MSC', 'MSC', 'MSC',
    'MSC', 'MSC', 'MSC', 'MSC',
    'MSC', 'MSC', 'MSC',
    'NONE', 'SCA', 'NONE'
  ])
  t.strictDeepEquals(analyseMemory(badMemoryStat, badMemoryGc), {
    external: false,
    heapTotal: false,
    heapUsed: true,
    rss: false
  })

  t.end()
})

test('analyse memory - old space too large', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodMemory = generateProcessStat({
      memory: {
        heapTotal: [30, 100, 200, 300, 300, 300, 300, 300, 300, 300, 300, 300]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(goodMemory, []), {
      external: false,
      heapTotal: false,
      heapUsed: false,
      rss: false
    })

    const badMemory = generateProcessStat({
      memory: {
        heapTotal: [30, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(badMemory, []), {
      external: false,
      heapTotal: true,
      heapUsed: false,
      rss: false
    })
  }

  t.end()
})
