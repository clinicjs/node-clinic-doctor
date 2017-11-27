'use strict'

const test = require('tap').test
const analyseHandles = require('../analysis/analyse-handles.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse handles - flat', function (t) {
  const goodHandles = generateProcessStat({
    handles: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
  }, 0)
  t.strictEqual(analyseHandles(goodHandles), false)

  t.end()
})

test('analyse handles - expected data', function (t) {
  for (const noise of [0, 10, 30]) {
    const goodHandles = generateProcessStat({
      handles: [100, 100, 120, 90, 110, 100, 80, 110, 90, 110]
    }, noise)
    t.strictEqual(analyseHandles(goodHandles), false)

    const badHandles = generateProcessStat({
      handles: [
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100
      ]
    }, noise)
    t.strictEqual(analyseHandles(badHandles), true)
  }

  t.end()
})

test('analyse handles - almost constant', function (t) {
  const goodHandles = generateProcessStat({
    handles: [
      100, 100, 100, 100, 100, 100, 100, 100, 100,
      101, 101, 101, 101, 101, 101, 101, 101, 101]
  }, 0)
  t.strictEqual(analyseHandles(goodHandles), false)

  t.end()
})
