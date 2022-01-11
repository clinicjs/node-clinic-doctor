'use strict'

const test = require('tap').test
const analyseLoopUtilisation = require('../analysis/analyse-loop-utilization.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse event loop utilization - low and high', function (t) {
  for (const noise of [0, 1, 10]) {
    const good = generateProcessStat({
      loopUtilization: [70, 70, 70, 70, 70, 75, 79, 80]
    }, noise)
    t.equal(analyseLoopUtilisation({}, good, []), 'none')

    const bad = generateProcessStat({
      loopUtilization: [85, 60, 80, 90, 80, 90, 85]
    }, noise)
    t.equal(analyseLoopUtilisation({}, bad, []), 'performance')
  }

  t.end()
})

test('analyse event loop utilization - spikes', function (t) {
  const good = generateProcessStat({
    loopUtilization: [70, 20, 70, 60, 70, 80, 70, 180]
  }, 1)
  t.equal(analyseLoopUtilisation({}, good, []), 'none')

  const bad = generateProcessStat({
    loopUtilization: [100, 20, 100, 90, 70, 60, 60, 100]
  }, 1)
  t.equal(analyseLoopUtilisation({}, bad, []), 'performance')

  t.end()
})
