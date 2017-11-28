'use strict'

const test = require('tap').test
const async = require('async')
const GCEvent = require('../collect/gc-event.js')

test('test gc events', function (t) {
  const dates = []

  const interval1 = setInterval(function () {
    for (let i = 0; i < 2000; i++) {
      dates.push(new Date())
    }
  }, 20)

  const interval2 = setInterval(function () {
    for (let i = 0; i < 500; i++) {
      dates.pop()
    }
  })

  const gcEvent = new GCEvent()

  async.series([
    (done) => gcEvent.once('event', (event) => done(null, event)),
    (done) => gcEvent.once('event', (event) => done(null, event))
  ], function (err, result) {
    if (err) return t.ifError(err)

    clearInterval(interval1)
    clearInterval(interval2)

    t.ok(result[0].phase, 'BEGIN')
    t.ok(result[1].phase, 'END')

    const types = [
      'SCAVENGE',
      'MARK_SWEEP_COMPACT',
      'INCREMENTAL_MARKING',
      'PROCESS_WEAK_CALLBACKS'
    ]

    t.ok(types.includes(result[0].type))
    t.ok(result[0].type === result[1].type)

    t.ok(result[0].timestamp <= result[1].timestamp)
    t.ok(Math.abs(result[0].timestamp - Date.now()) < 200)
    t.ok(Math.abs(result[1].timestamp - Date.now()) < 200)

    t.end()
  })

  gcEvent.start()
})
