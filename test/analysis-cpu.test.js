'use strict'

const test = require('tap').test
const analyseCPU = require('../analysis/analyse-cpu.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse cpu', function (t) {
  for (const noise of [0, 0.1, 0.3]) {
    const goodCPU = generateProcessStat({
      cpu: [100, 100, 120, 90, 110, 100, 80, 110, 90, 110]
    }, noise)
    t.strictEqual(analyseCPU(goodCPU, []), false)

    const badCPU = generateProcessStat({
      cpu: [50, 40, 10, 10, 100, 50, 40, 10, 10, 30, 10]
    }, noise)
    t.strictEqual(analyseCPU(badCPU, []), true)
  }

  t.end()
})
