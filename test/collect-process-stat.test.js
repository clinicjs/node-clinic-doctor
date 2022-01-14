'use strict'

const test = require('tap').test
const ProcessStat = require('../collect/process-stat.js')
const semver = require('semver')

// ProcessStat will crash if collectLoopUtilization not specified on these node versions
// class is only used internally so backwards compatability not maintained
const collectLoopUtilization = semver.gt(process.version, 'v14.10.0')

test('Collect - process stat - input validation - sampleInterval', function (t) {
  t.throws(
    () => new ProcessStat(),
    new TypeError('sample interval must be a number')
  )
  t.end()
})

test('Collect - process stat - input validation - collectLoopUtilization', function (t) {
  t.throws(
    () => new ProcessStat(1, 'hello world'),
    new TypeError('collectLoopUtilization must be a boolean')
  )
  t.end()
})

test('Collect - process stat - timestamp', function (t) {
  const stat = new ProcessStat(1, collectLoopUtilization)
  const sample = stat.sample()
  t.ok(sample.timestamp > Date.now() - 100 && sample.timestamp <= Date.now())
  t.end()
})

test('Collect - process stat - number of handles', function (t) {
  const stat = new ProcessStat(1, collectLoopUtilization)
  const sample = stat.sample()
  t.equal(sample.handles, process._getActiveHandles().length)
  t.end()
})

test('Collect - process stat - memory usage', function (t) {
  const stat = new ProcessStat(1, collectLoopUtilization)
  const sample = stat.sample()
  t.ok(sample.memory.rss > 0)
  t.ok(sample.memory.heapTotal > 0)
  t.ok(sample.memory.heapUsed > 0)
  t.ok(sample.memory.external > 0)

  t.end()
})

function ms (now) {
  const delta = process.hrtime(now)
  return delta[0] * 1e3 + delta[1] * 1e-6
}

function sleep (time) {
  const now = process.hrtime()
  while (ms(now) < time);
}

test('Collect - process stat - delay usage', function (t) {
  const stat = new ProcessStat(10, collectLoopUtilization)
  stat.refresh()
  sleep(20)
  const sample = stat.sample()
  t.ok(sample.delay > 8 && sample.delay < 15, `delay was ${sample.delay}`)

  t.end()
})

test('Collect - process stat - cpu usage', function (t) {
  const stat = new ProcessStat(10, collectLoopUtilization)
  stat.refresh()
  sleep(200)
  const sample = stat.sample()
  t.ok(sample.cpu >= 0 && sample.cpu <= 2,
    'sleep has high usage, usage was: ' + sample.cpu)

  stat.refresh()
  setTimeout(function () {
    const sample = stat.sample()
    t.ok(sample.cpu >= 0 && sample.cpu <= 1,
      'timeout has low usage, usage was: ' + sample.cpu)
    t.end()
  }, 200)
})
