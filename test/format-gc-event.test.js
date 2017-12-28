'use strict'

const test = require('tap').test
const endpoint = require('endpoint')
const ProcessStat = require('../collect/process-stat.js')
const ProcessStatDecoder = require('../format/gc-event-decoder.js')
const ProcessStatEncoder = require('../format/gc-event-encoder.js')

test('Format - gc event - encoder-decoder', function (t) {
  const encoder = new ProcessStatEncoder()
  const decoder = new ProcessStatDecoder()
  encoder.pipe(decoder)

  encoder.write({
    type: 'SCAVENGE',
    phase: 'BEGIN',
    timestamp: 10
  })
  encoder.write({
    type: 'SCAVENGE',
    phase: 'END',
    timestamp: 20
  })
  encoder.write({
    type: 'MARK_SWEEP_COMPACT',
    phase: 'BEGIN',
    timestamp: 30
  })
  encoder.write({
    type: 'MARK_SWEEP_COMPACT',
    phase: 'END',
    timestamp: 40
  })
  encoder.end()

  decoder.pipe(endpoint({ objectMode: true }, function (err, outputSamples) {
    if (err) return t.ifError(err)
    t.strictDeepEqual(outputSamples, [{
      startTimestamp: 10,
      endTimestamp: 20,
      type: 'SCAVENGE'
    }, {
      startTimestamp: 30,
      endTimestamp: 40,
      type: 'MARK_SWEEP_COMPACT'
    }])
    t.end()
  }))
})

test('Format - gc event - end before begin', function (t) {
  const encoder = new ProcessStatEncoder()
  const decoder = new ProcessStatDecoder()
  encoder.pipe(decoder)

  decoder.pipe(endpoint({ objectMode: true }, function (err, outputSamples) {
    t.strictDeepEqual(err, new Error('Unexpected phase: END'))
    t.end()
  }))

  encoder.write({
    type: 'SCAVENGE',
    phase: 'END',
    timestamp: 20
  })
  encoder.end()
})

test('Format - gc event - end before begin', function (t) {
  const encoder = new ProcessStatEncoder()
  const decoder = new ProcessStatDecoder()
  encoder.pipe(decoder)

  decoder.pipe(endpoint({ objectMode: true }, function (err, outputSamples) {
    t.strictDeepEqual(err, new Error('Unexpected phase: BEGIN'))
    t.end()
  }))

  encoder.write({
    type: 'SCAVENGE',
    phase: 'BEGIN',
    timestamp: 10
  })
  encoder.write({
    type: 'SCAVENGE',
    phase: 'BEGIN',
    timestamp: 20
  })
  encoder.end()
})
