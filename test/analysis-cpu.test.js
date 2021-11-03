'use strict'

const test = require('tap').test
const util = require('util')
const analyseCPU = util.promisify(require('../analysis/analyse-cpu.js'))
const generateProcessStat = require('./generate-process-stat.js')

test('analyse cpu - one mode', async function (t) {
  for (const noise of [0, 0.1, 0.3, 0.5]) {
    const goodCPU = generateProcessStat({
      cpu: [100, 100, 120, 100, 110, 100, 100, 110, 90, 110]
    }, noise)
    t.equal(await analyseCPU({}, goodCPU, []), 'none')

    const badCPU = generateProcessStat({
      cpu: [50, 40, 10, 10, 80, 50, 40, 1, 10, 30, 10]
    }, noise)
    t.equal(await analyseCPU({}, badCPU, []), 'performance')
  }

  t.end()
})

test('analyse cpu - two mode', async function (t) {
  for (const noise of [0, 0.1, 0.3, 0.5]) {
    const goodCPU = generateProcessStat({
      cpu: [200, 200, 100, 90, 190, 200, 80, 110, 190, 200]
    }, noise)
    t.equal(await analyseCPU({}, goodCPU, []), 'none')

    const badCPU = generateProcessStat({
      cpu: [200, 200, 15, 10, 190, 200, 5, 15, 190, 200]
    }, noise)
    t.equal(await analyseCPU({}, badCPU, []), 'performance')
  }

  t.end()
})

test('analyse cpu - two mode - opposite clusters', async function (t) {
  // Test the `summary0.mean() < summary1.mean()` is true case in
  // summaryAplication = summary0.mean() < summary1.mean() ? summary0 : summary1
  for (const noise of [0, 0.1, 0.3, 0.5]) {
    const goodCPU = generateProcessStat({
      cpu: [
        200, 200, 100, 90, 190, 200, 80, 110, 190, 200,
        200, 200, 100, 90, 190, 200, 80, 110, 190, 200
      ]
    }, noise)
    t.equal(await analyseCPU({}, goodCPU, []), 'none')

    const badCPU = generateProcessStat({
      cpu: [
        200, 200, 15, 10, 190, 200, 5, 15, 190, 200,
        200, 200, 15, 10, 190, 200, 5, 15, 190, 200
      ]
    }, noise)
    t.equal(await analyseCPU({}, badCPU, []), 'performance')
  }

  t.end()
})

test('analyse cpu - little data', async function (t) {
  for (const noise of [0, 0.1, 0.3, 0.5]) {
    const goodCPU = generateProcessStat({
      cpu: [100, 100, 120]
    }, noise)
    t.equal(await analyseCPU({}, goodCPU, []), 'data')

    const badCPU = generateProcessStat({
      cpu: [50, 40, 10]
    }, noise)
    t.equal(await analyseCPU({}, badCPU, []), 'data')
  }

  t.end()
})

test('analyse cpu - small cluster data', async function (t) {
  for (const noise of [0, 0.1, 0.3, 0.5]) {
    const goodCPU = generateProcessStat({
      cpu: [200, 200, 100, 90, 190, 200, 80, 110, 190, 0]
    }, noise)
    t.equal(await analyseCPU({}, goodCPU, []), 'none')

    const badCPU = generateProcessStat({
      cpu: [50, 40, 10, 10, 200, 50, 40, 10, 10, 30, 10]
    }, noise)
    t.equal(await analyseCPU({}, badCPU, []), 'performance')
  }

  t.end()
})
