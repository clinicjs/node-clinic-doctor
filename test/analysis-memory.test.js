'use strict'

const test = require('tap').test
const analyseMemory = require('../analysis/analyse-memory.js')
const generateGCEvent = require('./generate-gc-event.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse memory - delay correlation', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodMemoryStat = generateProcessStat({
      delay: [1, 1, 3, 1, 1, 3, 1, 1, 3],
      memory: {
        heapTotal: [35, 40, 30, 35, 40, 30, 35, 40, 30]
      }
    }, noise)
    const goodMemoryGc = generateGCEvent([
      'NONE', 'SCA', 'NONE', 'SCA', 'NONE', 'MSC', 'NONE', 'SCA', 'NONE'
    ])

    t.strictDeepEquals(analyseMemory(goodMemoryStat, goodMemoryGc), {
      external: false,
      heapTotal: false,
      heapUsed: false,
      rss: false
    })

    const badMemoryStat = generateProcessStat({
      delay: [1, 1, 20, 1, 1, 20, 1, 1, 20, 1, 1],
      memory: {
        heapTotal: [50, 70, 30, 50, 70, 30, 50, 70, 30, 50, 30]
      }
    }, noise)
    const badMemoryGc = generateGCEvent([
      'NONE', 'SCA', 'INC', 'MSC',
      'SCA', 'INC', 'MSC',
      'SCA', 'INC', 'MSC', 'NONE'
    ])
    t.strictDeepEquals(analyseMemory(badMemoryStat, badMemoryGc), {
      external: false,
      heapTotal: true,
      heapUsed: false,
      rss: false
    })
  }

  t.end()
})

test('analyse memory - old space too large', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodMemory = generateProcessStat({
      memory: {
        heapUsed: [30, 100, 200, 300, 300, 300, 300, 300, 300, 300, 300, 300]
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
        heapUsed: [30, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(badMemory, []), {
      external: false,
      heapTotal: false,
      heapUsed: true,
      rss: false
    })
  }

  t.end()
})
