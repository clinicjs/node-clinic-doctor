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

  cmd.on('error', t.ifError.bind(t))
  cmd.on('ready', function () {
    async.parallel({
      traceEvent (done) {
        cmd.traceEvent.pipe(endpoint({ objectMode: true }, done))
      },

      processStat (done) {
        cmd.processStat.pipe(endpoint({ objectMode: true }, done))
      }
    }, function (err, output) {
      if (err) return t.ifError(err)

      const scavenge = output.traceEvent
        .filter((event) => event.name === 'V8.GCScavenger')
      const compactor = output.traceEvent
        .filter((event) => event.name === 'V8.GCCompactor')

      t.ok(scavenge.length >= 1)
      t.ok(scavenge[0].args.startTimestamp <= scavenge[0].args.endTimestamp)
      t.ok(Math.abs(scavenge[0].args.endTimestamp - Date.now()) < 10000)
      t.ok(Math.abs(scavenge[0].args.startTimestamp - Date.now()) < 10000)

      t.strictEqual(compactor.length, 1)
      t.ok(compactor[0].args.startTimestamp <= compactor[0].args.endTimestamp)
      t.ok(Math.abs(compactor[0].args.startTimestamp - Date.now()) < 10000)
      t.ok(Math.abs(compactor[0].args.endTimestamp - Date.now()) < 10000)

      t.end()
    })
  })
})

test('cmd - collect - data files have content', function (t) {
  const cmd = new CollectAndRead({
    sampleInterval: 100
  }, '-e', 'setTimeout(() => {}, 1000)')
  cmd.on('error', t.ifError.bind(t))
  cmd.on('ready', function () {
    async.parallel({
      traceEvent (done) {
        cmd.traceEvent.pipe(endpoint({ objectMode: true }, done))
      },

      processStat (done) {
        cmd.processStat.pipe(endpoint({ objectMode: true }, done))
      }
    }, function (err, output) {
      if (err) return t.ifError(err)

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
    for (const t = Date.now() + 100; t > Date.now();) {}
    setTimeout(() => {}, 100)
  `)
  cmd.on('error', t.ifError.bind(t))
  cmd.on('ready', function () {
    async.parallel({
      traceEvent (done) {
        cmd.traceEvent.pipe(endpoint({ objectMode: true }, done))
      },

      processStat (done) {
        cmd.processStat.pipe(endpoint({ objectMode: true }, done))
      }
    }, function (err, output) {
      if (err) return t.ifError(err)

      const delay = output.processStat.map((stat) => stat.delay)
      t.ok(delay[0] < 50)
      t.end()
    })
  })
})
