'use strict'

const test = require('tap').test
const ProcessStat = require('../collect/process-stat.js')

test('Collect - process stat - input validation', function (t) {
  t.throws(
    () => new ProcessStat(),
    new TypeError('sample interval must be a number')
  )
  t.end()
})

test('Collect - process stat - timestamp', function (t) {
  const stat = new ProcessStat(1)
  const sample = stat.sample()
  t.ok(sample.timestamp > Date.now() - 100 && sample.timestamp <= Date.now())
  t.end()
})

test('Collect - process stat - number of handles', function (t) {
  const stat = new ProcessStat(1)
  const sample = stat.sample()
  t.strictEqual(sample.handles, process._getActiveHandles().length)
  t.end()
})

test('Collect - process stat - memory usage', function (t) {
  const stat = new ProcessStat(1)
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
  const stat = new ProcessStat(10)
  stat.refresh()
  sleep(20)
  const sample = stat.sample()
  t.ok(sample.delay > 8 && sample.delay < 15)

  t.end()
})

test('Collect - process stat - cpu usage', function (t) {
  const stat = new ProcessStat(10)
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
