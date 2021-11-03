'use strict'

const test = require('tap').test
const semver = require('semver')
const analyseMemory = require('../analysis/analyse-memory.js')
const generateTraceEvent = require('./generate-trace-event.js')

const oldNodeVersion = semver.parse('6.9.9')
const newNodeVersion = semver.parse('10.0.0')

test('analyse memory - genereate trace event', function (t) {
  const gcevents = generateTraceEvent(
    'SSSSS.....--MMMMMFC'
  )
  t.strictSame(gcevents, [
    {
      pid: 0,
      tid: 0,
      ts: 0,
      ph: 'X',
      cat: 'v8',
      name: 'V8.GCScavenger',
      dur: 50000,
      args: { startTimestamp: 0, endTimestamp: 50 }
    },
    {
      pid: 0,
      tid: 0,
      ts: 300000,
      ph: 'X',
      cat: 'v8',
      name: 'V8.GCIncrementalMarking',
      dur: 50000,
      args: { startTimestamp: 300, endTimestamp: 350 }
    },
    {
      pid: 0,
      tid: 0,
      ts: 350000,
      ph: 'X',
      cat: 'v8',
      name: 'V8.GCIncrementalMarkingFinalize',
      dur: 10000,
      args: { startTimestamp: 350, endTimestamp: 360 }
    },
    {
      pid: 0,
      tid: 0,
      ts: 360000,
      ph: 'X',
      cat: 'v8',
      name: 'V8.GCFinalizeMC',
      dur: 10000,
      args: { startTimestamp: 360, endTimestamp: 370 }
    }
  ])
  t.end()
})

test('analyse memory - no issues', function (t) {
  const gcevents = generateTraceEvent(
    '-S....-S....-S....-S....-S....-S....-S....-S....-S....-S....' +
    '-M....-M....-S....-M....-M....-S....-M....-M....-FFF.. CCC..'
  )

  for (const nodeVersion of [oldNodeVersion, newNodeVersion]) {
    t.strictSame(analyseMemory({ nodeVersion }, [], gcevents), {
      external: 'none',
      heapTotal: 'none',
      heapUsed: 'none',
      rss: 'none'
    })
  }
  t.end()
})

test('analyse memory - no data', function (t) {
  const gcevents = generateTraceEvent(
    '.....'
  )

  for (const nodeVersion of [oldNodeVersion, newNodeVersion]) {
    t.strictSame(analyseMemory({ nodeVersion }, [], gcevents), {
      external: 'none',
      heapTotal: 'data',
      heapUsed: 'data',
      rss: 'none'
    })
  }
  t.end()
})

test('analyse memory - only old node version has issue', function (t) {
  const gcevents = generateTraceEvent(
    '-S....-S....-S....-S....-S....-S....-S....-S....-S....-S....' +
    ' MMM..-MMM..-MMM..-MMM..-S....-MMM-.-MMM-.-MMM..-FFFF. CCCCC'
  )

  t.strictSame(analyseMemory({ nodeVersion: newNodeVersion }, [], gcevents), {
    external: 'none',
    heapTotal: 'none',
    heapUsed: 'none',
    rss: 'none'
  })

  t.strictSame(analyseMemory({ nodeVersion: oldNodeVersion }, [], gcevents), {
    external: 'none',
    heapTotal: 'performance',
    heapUsed: 'none',
    rss: 'none'
  })
  t.end()
})

test('analyse memory - issue old space', function (t) {
  const gcevents = generateTraceEvent(
    '-S....-S....-S....-S....-S....-S....-S....-S....-S....-S....' +
    '-M.M.M.-FFF. CCCCCCCCCC.-S....-S....-S....-S....-S....-S....'
  )

  for (const nodeVersion of [oldNodeVersion, newNodeVersion]) {
    t.strictSame(analyseMemory({ nodeVersion }, [], gcevents), {
      external: 'none',
      heapTotal: 'performance',
      heapUsed: 'none',
      rss: 'none'
    })
  }
  t.end()
})

test('analyse memory - issue with new space', function (t) {
  const gcevents = generateTraceEvent(
    ' S.S.. S.S.. S.S.. S.S.. S.S.. S.S.. S.S.. S.S.. S.S.. S.S..' +
    ' S.M.. S.M.. S.S.. S.M.. S.M.. S.S.. S.M.. S.S.. FFF.. CCC..'
  )

  for (const nodeVersion of [oldNodeVersion, newNodeVersion]) {
    t.strictSame(analyseMemory({ nodeVersion }, [], gcevents), {
      external: 'none',
      heapTotal: 'none',
      heapUsed: 'performance',
      rss: 'none'
    })
  }
  t.end()
})
