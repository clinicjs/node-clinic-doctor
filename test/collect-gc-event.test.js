'use strict'

const test = require('tap').test
const async = require('async')
const GCEvent = require('../collect/gc-event.js')

class CauseGC {
  constructor () {
    const dates = []

    this.interval1 = setInterval(function () {
      for (let i = 0; i < 2000; i++) {
        dates.push(new Date())
      }
    }, 20)

    this.interval2 = setInterval(function () {
      for (let i = 0; i < 500; i++) {
        dates.pop()
      }
    })
  }

  clear () {
    clearInterval(this.interval1)
    clearInterval(this.interval2)
  }
}

test('Collect - gc events - any event', function (t) {
  const gcEmitter = new CauseGC()
  const gcEvent = new GCEvent()
  async.series([
    (done) => gcEvent.once('event', (event) => done(null, event)),
    (done) => gcEvent.once('event', (event) => done(null, event))
  ], function (err, result) {
    if (err) return t.ifError(err)
    gcEmitter.clear()

    t.strictEqual(result[0].phase, 'BEGIN')
    t.strictEqual(result[1].phase, 'END')

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

    gcEvent.stop()
    t.end()
  })

  gcEvent.start()
})

test('Collect - gc events - stop', function (t) {
  const gcEmitter = new CauseGC()
  const gcEvent = new GCEvent()

  gcEvent.start()
  gcEvent.stop()

  gcEvent.once('event', () => t.fail('event should not emit'))
  setTimeout(function () {
    gcEmitter.clear()
    t.end()
  }, 200) // give it 200 ms to emit events
})
