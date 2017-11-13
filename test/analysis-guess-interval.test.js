'use strict'

const test = require('tap').test
const guessInterval = require('../analysis/guess-interval.js')
const generateProcessState = require('./generate-process-state.js')

test('guess interval - expected data', function (t) {
  for (const noise of [0, 1, 10]) {
    const data = generateProcessState({
      handles: [3, 3, 3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3]
    }, noise)

    const interval = guessInterval(data)
    t.strictDeepEqual(interval, [5, 12])
  }

  t.end()
})

test('guess interval - flat data', function (t) {
  const data = generateProcessState({
    handles: [3, 3, 3, 3, 3, 3, 3, 3]
  }, 0)

  const interval = guessInterval(data)
  t.strictDeepEqual(interval, [0, 8])

  t.end()
})
