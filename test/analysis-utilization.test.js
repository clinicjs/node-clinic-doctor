'use strict'

const test = require('tap').test
const analyseLoopUtilisation = require('../analysis/analyse-loop-utilization.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse event loop utilization - low and high', function (t) {
  for (const noise of [0, 1, 10]) {
    const good = generateProcessStat({
      loopUtilization: [1, 2, 1, 1, 2, 2, 3, 19]
    }, noise)
    t.equal(analyseLoopUtilisation({}, good, []), 'none')

    const bad = generateProcessStat({
      loopUtilization: [40, 60, 64, 15, 80, 90, 85]
    }, noise)
    t.equal(analyseLoopUtilisation({}, bad, []), 'performance')
  }

  t.end()
})

test('analyse event loop utilization - spikes', function (t) {
  const good = generateProcessStat({
    loopUtilization: [1, 2, 1, 20, 2, 2, 3, 1]
  }, 1)
  t.equal(analyseLoopUtilisation({}, good, []), 'none')

  const bad = generateProcessStat({
    loopUtilization: [10, 20, 10, 90, 20, 20, 30, 10]
  }, 1)
  t.equal(analyseLoopUtilisation({}, bad, []), 'performance')

  t.end()
})
