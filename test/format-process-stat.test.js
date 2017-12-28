'use strict'

const test = require('tap').test
const endpoint = require('endpoint')
const ProcessStat = require('../collect/process-stat.js')
const ProcessStatDecoder = require('../format/process-stat-decoder.js')
const ProcessStatEncoder = require('../format/process-stat-encoder.js')

test('Format - process stat - encoder-decoder', function (t) {
  const stat = new ProcessStat(1)

  const encoder = new ProcessStatEncoder()
  const decoder = new ProcessStatDecoder()
  encoder.pipe(decoder)

  const inputSamples = []
  for (let i = 0; i < 1; i++) {
    const sample = stat.sample()
    encoder.write(sample)
    inputSamples.push(sample)
  }
  encoder.end()

  decoder.pipe(endpoint({ objectMode: true }, function (err, outputSamples) {
    if (err) t.ifError(err)
    t.strictDeepEqual(inputSamples, outputSamples)
    t.end()
  }))
})

test('Format - process stat - partial decoding', function (t) {
  const stat = new ProcessStat(1)

  const encoder = new ProcessStatEncoder()
  const decoder = new ProcessStatDecoder()

  // encode a sample
  const sample = stat.sample()
  encoder.write(sample)
  const sampleEncoded = encoder.read()

  // No data, chunk is too small
  decoder.write(sampleEncoded.slice(0, 20))
  t.strictEqual(decoder.read(), null)

  // Ended previuse sample, but a partial remains
  decoder.write(Buffer.concat([
    sampleEncoded.slice(20),
    sampleEncoded.slice(0, 30)
  ]))
  t.strictDeepEqual(decoder.read(), sample)
  t.strictEqual(decoder.read(), null)

  // Ended previuse, no partial remains
  decoder.write(Buffer.concat([
    sampleEncoded.slice(30),
    sampleEncoded
  ]))
  t.strictDeepEqual(decoder.read(), sample)
  t.strictDeepEqual(decoder.read(), sample)
  t.strictEqual(decoder.read(), null)

  // No previuse ended
  decoder.write(sampleEncoded)
  t.strictDeepEqual(decoder.read(), sample)

  // No more data
  t.strictEqual(decoder.read(), null)
  t.end()
})
