'use strict'

const test = require('tap').test
const analyseDelay = require('../analysis/analyse-delay.js')
const generateProcessState = require('./generate-process-state.js')

test('analyse delay - to high', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodDelay = generateProcessState({
      delay: [1, 2, 1, 1, 2, 2, 3, 1]
    }, noise)
    t.strictEqual(analyseDelay(goodDelay), false)

    const badDelay = generateProcessState({
      delay: [10, 8, 6, 10, 15, 10, 4]
    }, noise)
    t.strictEqual(analyseDelay(badDelay), true)
  }

  t.end()
})

test('analyse delay - spikes', function (t) {
  const goodDelay = generateProcessState({
    delay: [1, 2, 1, 20, 2, 2, 3, 1]
  }, 1)
  t.strictEqual(analyseDelay(goodDelay), false)

  const badDelay = generateProcessState({
    delay: [1, 2, 1, 110, 2, 2, 3, 1]
  }, 1)
  t.strictEqual(analyseDelay(badDelay), true)

  t.end()
})
