'use strict'

const test = require('tap').test
const xorshift = require('xorshift')
const analyseDelay = require('../analysis/analyse-delay.js')

function generateProcessStateFromDelay (delay, noise) {
  const rng = new xorshift.constructor([
    294915, 70470, 145110, 287911 // from random.org :)
  ])

  return delay.map((d, i) => ({
    timestamp: i * 10,
    delay: d + Math.abs(rng.random()) * noise,
    cpu: 0,
    memory: {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0
    },
    handles: 0
  }))
}

test('analyse delay - to high', function (t) {
  for (const noise of [0, 1, 10]) {
    const goodDelay = generateProcessStateFromDelay(
      [1, 2, 1, 1, 2, 2, 3, 1], noise)
    t.strictEqual(analyseDelay(goodDelay), false)

    const badDelay = generateProcessStateFromDelay(
      [10, 8, 6, 10, 15, 10, 4], noise)
    t.strictEqual(analyseDelay(badDelay), true)
  }

  t.end()
})

test('analyse delay - spikes', function (t) {
  const goodDelay = generateProcessStateFromDelay([1, 2, 1, 20, 2, 2, 3, 1], 1)
  t.strictEqual(analyseDelay(goodDelay), false)

  const badDelay = generateProcessStateFromDelay([1, 2, 1, 110, 2, 2, 3, 1], 1)
  t.strictEqual(analyseDelay(badDelay), true)

  t.end()
})
