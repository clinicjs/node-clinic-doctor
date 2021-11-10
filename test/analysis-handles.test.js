'use strict'

const test = require('tap').test
const analyseHandles = require('../analysis/analyse-handles.js')
const generateProcessStat = require('./generate-process-stat.js')

test('analyse handles - no data', function (t) {
  const goodHandles = generateProcessStat({
    handles: [100]
  }, 0)
  t.equal(analyseHandles({}, goodHandles, []), 'data')

  t.end()
})

test('analyse handles - flat', function (t) {
  const goodHandles = generateProcessStat({
    handles: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
  }, 0)
  t.equal(analyseHandles({}, goodHandles, []), 'none')

  t.end()
})

test('analyse handles - symetric data', function (t) {
  for (const noise of [0, 10, 30]) {
    const goodHandles = generateProcessStat({
      handles: [100, 100, 120, 90, 110, 100, 80, 110, 90, 110]
    }, noise)
    t.equal(analyseHandles({}, goodHandles, []), 'none')
  }
  t.end()
})

test('analyse handles - sawtooth data', function (t) {
  for (const noise of [0, 10, 30]) {
    const badHandles = generateProcessStat({
      handles: [
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100,
        100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 100
      ]
    }, noise)
    t.equal(analyseHandles({}, badHandles, []), 'performance')
  }
  t.end()
})

test('analyse handles - increasing data', function (t) {
  for (const noise of [0, 10, 30]) {
    const badHandles = generateProcessStat({
      handles: [
        100, 120, 140, 160, 180, 200, 200, 200, 200, 200,
        200, 220, 240, 260, 280, 300, 300, 300, 300, 300,
        300, 320, 340, 360, 380, 400, 400, 400, 400, 400,
        400, 420, 440, 460, 480, 500, 500, 500, 500, 500,
        500, 520, 540, 560, 580, 600, 600, 600, 600, 600,
        600, 620, 640, 660, 680, 700, 700, 700, 700, 700,
        700, 720, 740, 760, 780, 800, 800, 800, 800, 800,
        800, 820, 840, 860, 880, 900, 900, 900, 900, 900,
        900, 920, 940, 960, 980, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999,
        999, 999, 999, 999, 999, 999, 999, 999, 999, 999
      ]
    }, noise)
    t.equal(analyseHandles({}, badHandles, []), 'performance')
  }
  t.end()
})

test('analyse handles - almost constant', function (t) {
  const goodHandles = generateProcessStat({
    handles: [
      100, 100, 100, 100, 100, 100, 100, 100, 100,
      101, 101, 101, 101, 101, 101, 101, 101, 101]
  }, 0)
  t.equal(analyseHandles({}, goodHandles, []), 'none')

  t.end()
})
