'use strict'

const test = require('tap').test
const guessInterval = require('../analysis/guess-interval.js')
const generateProcessStat = require('./generate-process-stat.js')

test('guess interval - expected data', function (t) {
  for (const noise of [0, 1, 5]) {
    const data = generateProcessStat({
      handles: [3, 3, 3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3]
    }, noise, 10)

    const interval = guessInterval(data)
    t.strictSame(interval, [5, 12])
  }

  t.end()
})

test('guess interval - trims 100 ms from left and right side', function (t) {
  for (const noise of [0, 1, 5]) {
    const data = generateProcessStat({
      handles: [
        3, 3, 3, 3, 3,
        13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
        13, 13, 13, 13, 13, 13, 13,
        13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
        3, 3, 3
      ]
    }, noise)

    const interval = guessInterval(data)
    t.strictSame(interval, [14, 23])
  }

  t.end()
})

test('guess interval - overtrim is not possible', function (t) {
  for (const noise of [0, 1, 5]) {
    const data = generateProcessStat({
      handles: [3, 3, 3, 3, 3, 13, 13, 13, 3, 3, 3]
    }, noise)

    const interval = guessInterval(data)
    t.strictSame(interval, [7, 7])
  }

  t.end()
})

test('guess interval - missing left tail', function (t) {
  for (const noise of [0, 1, 5]) {
    const data = generateProcessStat({
      handles: [3, 3, 3, 3, 3, 13, 13, 13, 13, 13, 13, 13]
    }, noise, 10)

    const interval = guessInterval(data)
    t.strictSame(interval, [5, 12])
  }

  t.end()
})

test('guess interval - missing right tail', function (t) {
  for (const noise of [0, 1, 5]) {
    const data = generateProcessStat({
      handles: [13, 13, 13, 13, 13, 3, 3, 3, 3, 3, 3, 3]
    }, noise, 10)

    const interval = guessInterval(data)
    t.strictSame(interval, [0, 5])
  }

  t.end()
})

test('guess interval - flat data', function (t) {
  const data = generateProcessStat({
    handles: [3, 3, 3, 3, 3, 3, 3, 3]
  }, 0, 10)

  const interval = guessInterval(data)
  t.strictSame(interval, [0, 8])

  t.end()
})
