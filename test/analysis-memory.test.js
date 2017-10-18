'use strict'

const test = require('tap').test
const analyseMemory = require('../analysis/analyse-memory.js')
const generateProcessState = require('./generate-process-state.js')

test('analyse memory - sawtooth total heap', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodMemory = generateProcessState({
      delay: [1, 1, 3, 1, 1, 3, 1, 1, 3],
      memory: {
        heapTotal: [35, 40, 30, 35, 40, 30, 35, 40, 30]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(goodMemory), {
      external: false,
      heapTotal: false,
      heapUsed: false,
      rss: false
    })

    const okayMemory = generateProcessState({
      delay: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      memory: {
        heapTotal: [50, 70, 30, 50, 70, 30, 50, 70, 30]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(okayMemory), {
      external: false,
      heapTotal: false,
      heapUsed: false,
      rss: false
    })

    const badMemory = generateProcessState({
      delay: [1, 1, 10, 1, 1, 10, 1, 1, 10],
      memory: {
        heapTotal: [50, 70, 30, 50, 70, 30, 50, 70, 30]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(badMemory), {
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
    const goodMemory = generateProcessState({
      memory: {
        heapUsed: [30, 100, 200, 300, 300, 300, 300, 300, 300, 300]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(goodMemory), {
      external: false,
      heapTotal: false,
      heapUsed: false,
      rss: false
    })

    const badMemory = generateProcessState({
      memory: {
        heapUsed: [30, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(badMemory), {
      external: false,
      heapTotal: false,
      heapUsed: true,
      rss: false
    })
  }

  t.end()
})

test('analyse memory - huge difference', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodMemory = generateProcessState({
      memory: {
        heapUsed: [200, 250, 300, 350, 400, 500, 600, 200, 250, 300]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(goodMemory), {
      external: false,
      heapTotal: false,
      heapUsed: false,
      rss: false
    })

    const badMemory = generateProcessState({
      memory: {
        heapUsed: [30, 100, 200, 300, 400, 500, 600, 30, 100, 200]
      }
    }, noise)
    t.strictDeepEquals(analyseMemory(badMemory), {
      external: false,
      heapTotal: false,
      heapUsed: true,
      rss: false
    })
  }

  t.end()
})
