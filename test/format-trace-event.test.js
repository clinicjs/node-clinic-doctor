'use strict'

const test = require('tap').test
const endpoint = require('endpoint')
const startpoint = require('startpoint')
const SystemInfoDecoder = require('../format/system-info-decoder.js')
const TraceEventDecoder = require('../format/trace-event-decoder.js')

function traceEvent (data) {
  // we put args: {}, at the end as the fast parser expects that
  return Object.assign({ pid: 10, tid: 1, ph: 'X', cat: 'v8' }, data, { args: {} })
}

test('Format - trace event - combine', function (t) {
  const data = [
    traceEvent({ name: 'V8.GCScavenger', ts: 1400, dur: 500 }),
    traceEvent({ name: 'V8.GCIncrementalMarkingStart', ts: 2400, dur: 50 }),
    traceEvent({ name: 'V8.GCIncrementalMarking', ts: 3400, dur: 1000 }),
    traceEvent({ name: 'V8.GCIncrementalMarking', ts: 4400, dur: 1000 }),
    traceEvent({ name: 'V8.GCIncrementalMarkingFinalize', ts: 5400, dur: 50 }),
    traceEvent({ name: 'V8.Execute', ts: 5400, dur: 500 }),
    traceEvent({ name: 'V8.Execute', ts: 6400, dur: 500 }),
    traceEvent({ name: 'V8.GCFinalizeMC', ts: 7400, dur: 1000 }),
    traceEvent({ name: 'V8.GCScavenger', ts: 8400, dur: 500 })
  ]

  const timeOffset = 33000000
  const systemInfoReader = new SystemInfoDecoder()
  systemInfoReader.end(JSON.stringify({
    clock: {
      hrtime: [0, 400000],
      unixtime: timeOffset
    },
    nodeVersions: process.versions,
    toolVersion: require('../package').version
  }))
  const decoder = new TraceEventDecoder(systemInfoReader)

  decoder.pipe(endpoint({ objectMode: true }, function (err, data) {
    if (err) return t.error(err)

    t.strictSame(data, [
      {
        pid: 10,
        tid: 1,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCScavenger',
        ts: 1400,
        dur: 500,
        args: {
          startTimestamp: 1 + timeOffset,
          endTimestamp: 1.5 + timeOffset
        }
      },
      {
        pid: 10,
        tid: 1,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCIncrementalMarkingStart',
        ts: 2400,
        dur: 50,
        args: {
          startTimestamp: 2 + timeOffset,
          endTimestamp: 2.05 + timeOffset
        }
      },
      {
        pid: 10,
        tid: 1,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCIncrementalMarking',
        ts: 3400,
        dur: 1000,
        args: {
          startTimestamp: 3 + timeOffset,
          endTimestamp: 4 + timeOffset
        }
      },
      {
        pid: 10,
        tid: 1,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCIncrementalMarking',
        ts: 4400,
        dur: 1000,
        args: {
          startTimestamp: 4 + timeOffset,
          endTimestamp: 5 + timeOffset
        }
      },
      {
        pid: 10,
        tid: 1,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCIncrementalMarkingFinalize',
        ts: 5400,
        dur: 50,
        args: {
          startTimestamp: 5 + timeOffset,
          endTimestamp: 5.05 + timeOffset
        }
      },
      {
        pid: 10,
        tid: 1,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCFinalizeMC',
        ts: 7400,
        dur: 1000,
        args: {
          startTimestamp: 7 + timeOffset,
          endTimestamp: 8 + timeOffset
        }
      },
      {
        pid: 10,
        tid: 1,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCScavenger',
        ts: 8400,
        dur: 500,
        args: {
          startTimestamp: 8 + timeOffset,
          endTimestamp: 8.5 + timeOffset
        }
      }
    ])
    t.end()
  }))

  decoder.end(JSON.stringify({
    traceEvents: data
  }))
})

test('Format - trace event - error', function (t) {
  const systemInfoReader = startpoint(
    new Error('expected error'),
    { objectMode: true }
  )
  const decoder = new TraceEventDecoder(systemInfoReader)

  decoder.pipe(endpoint({ objectMode: true }, function (err, data) {
    t.strictSame(err, new Error('expected error'))
    t.end()
  }))

  decoder.end(JSON.stringify({
    traceEvents: []
  }))
})
