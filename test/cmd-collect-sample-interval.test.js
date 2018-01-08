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

test('cmd - collect - custom sample interval', function (t) {
  const cmd = new CollectAndRead({
    sampleInterval: 1
  }, '-e', 'setTimeout(() => {}, 200)')

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

      // expect time seperation to be 1ms, allow 5ms error
      const sampleTimes = output.processStat.map((stat) => stat.timestamp)
      const timeSeperation = summary(diff(sampleTimes)).mean()
      t.ok(sampleTimes.length > 0, 'data is outputted')
      t.ok(Math.abs(timeSeperation - 1) < 5)

      t.end()
    })
  })
})
