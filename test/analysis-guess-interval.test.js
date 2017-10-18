'use strict'

const test = require('tap').test
const xorshift = require('xorshift')
const guessInterval = require('../analysis/guess-interval.js')

function generateProcessStateFromHandles (handles, noise) {
  const rng = new xorshift.constructor([
    294915, 70470, 145110, 287911 // from random.org :)
  ])

  return handles.map((d, i) => ({
    timestamp: i * 10,
    delay: 0,
    cpu: 0,
    memory: {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0
    },
    handles: d + Math.abs(rng.random()) * noise
  }))
}

test('guess interval', function (t) {
  for (const noise of [0, 1, 10]) {
    const handlesData = [3, 3, 3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3]
    const data = generateProcessStateFromHandles(handlesData, noise)

    const interval = guessInterval(data)
    t.strictDeepEqual(interval, [5, 12])
  }

  t.end()
})
