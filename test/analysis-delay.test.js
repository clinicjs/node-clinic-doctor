'use strict'

const test = require('tap').test
const analyseDelay = require('../analysis/analyse-delay.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse delay - to high', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodDelay = generateProcessStat({
      delay: [1, 2, 1, 1, 2, 2, 3, 1]
    }, noise)
    t.strictEqual(analyseDelay(goodDelay, []), false)

    const badDelay = generateProcessStat({
      delay: [10, 8, 6, 10, 15, 10, 4]
    }, noise)
    t.strictEqual(analyseDelay(badDelay, []), true)
  }

  t.end()
})

test('analyse delay - spikes', function (t) {
  const goodDelay = generateProcessStat({
    delay: [1, 2, 1, 20, 2, 2, 3, 1]
  }, 1)
  t.strictEqual(analyseDelay(goodDelay, []), false)

  const badDelay = generateProcessStat({
    delay: [1, 2, 1, 110, 2, 2, 3, 1]
  }, 1)
  t.strictEqual(analyseDelay(badDelay, []), true)

  t.end()
})
