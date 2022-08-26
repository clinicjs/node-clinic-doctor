'use strict'

const test = require('tap').test
const async = require('async')
const summary = require('summary')
const endpoint = require('endpoint')
const CollectAndRead = require('./collect-and-read.js')

function diff (data) {
  const output = []
  let last = data[0]
  for (let i = 1; i < data.length; i++) {
    output.push(data[i] - last)
    last = data[i]
  }
  return output
}

test('cmd - collect - gc events', function (t) {
  const cmd = new CollectAndRead({}, '--expose-gc', '-e', `
    const t = [];

    const interval1 = setInterval(function () {
      for (let i = 0; i < 2000; i++) {
        t.push(new Date())
      }
    }, 20)

    const interval2 = setInterval(function () {
      for (let i = 0; i < 500; i++) {
        t.pop()
      }
    })

    setTimeout(function () {
      clearInterval(interval1)
      clearInterval(interval2)
      global.gc()
    }, 200)
  `)

  cmd.on('error', t.error.bind(t))
  cmd.on('ready', function () {
    async.parallel({
      traceEvent (done) {
        cmd.traceEvent.pipe(endpoint({ objectMode: true }, done))
      },

      processStat (done) {
        cmd.processStat.pipe(endpoint({ objectMode: true }, done))
      }
    }, function (err, output) {
      if (err) return t.error(err)

      t.ok(output.traceEvent)
      t.end()
    })
  })
})

test('cmd - collect - data files have content', function (t) {
  const cmd = new CollectAndRead({
    sampleInterval: 100
  }, '-e', 'setTimeout(() => {}, 1000)')
  cmd.on('error', t.error.bind(t))
  cmd.on('ready', function () {
    async.parallel({
      traceEvent (done) {
        cmd.traceEvent.pipe(endpoint({ objectMode: true }, done))
      },

      processStat (done) {
        cmd.processStat.pipe(endpoint({ objectMode: true }, done))
      }
    }, function (err, output) {
      if (err) return t.error(err)

      // expect time seperation to be 10ms, allow 20ms error
      const sampleTimes = output.processStat.map((stat) => stat.timestamp)
      const timeSeperation = summary(diff(sampleTimes)).mean()
      t.ok(sampleTimes.length > 0, 'data is outputted')
      t.ok(Math.abs(timeSeperation - 100) < 100)

      t.end()
    })
  })
})

test('cmd - collect - startup delay is not included', function (t) {
  const cmd = new CollectAndRead({}, '-e', `
    function deltams (now) {
      const delta = process.hrtime(now)
      return delta[0] * 1e3 + delta[1] * 1e-6
    }
    const now = process.hrtime()
    while (deltams(now) < 100) { }
    setTimeout(() => {}, 100)
  `)
  cmd.on('error', t.error.bind(t))
  cmd.on('ready', function () {
    async.parallel({
      traceEvent (done) {
        cmd.traceEvent.pipe(endpoint({ objectMode: true }, done))
      },

      processStat (done) {
        cmd.processStat.pipe(endpoint({ objectMode: true }, done))
      }
    }, function (err, output) {
      if (err) return t.error(err)

      const delay = output.processStat.map((stat) => stat.delay)
      t.ok(delay[0] < 90, `startup delay was ${delay[0]}`)
      t.end()
    })
  })
})
