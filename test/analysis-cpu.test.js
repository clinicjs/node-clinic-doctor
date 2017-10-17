'use strict'

const test = require('tap').test
const xorshift = require('xorshift')
const analyseCPU = require('../analysis/analyse-cpu.js')

function generateProcessStateFromCPU (cpu, noise) {
  const rng = new xorshift.constructor([
    294915, 70470, 145110, 287911 // from random.org :)
  ])

  return cpu.map((d, i) => ({
    timestamp: i * 10,
    delay: 0,
    cpu: d + Math.abs(rng.random()) * noise,
    memory: {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0
    },
    handles: 0
  }))
}

test('analyse cpu - no noise', function (t) {
  const goodCPU = generateProcessStateFromCPU(
    [1.0, 1.0, 1.2, 0.9, 1.1, 1.0, 0.8, 1.1, 0.9, 1.1], 0
  )
  t.strictEqual(analyseCPU(goodCPU), false)

  const badDelay = generateProcessStateFromCPU(
    [0.5, 0.4, 0.1, 0.1, 1, 0.5, 0.4, 0.1, 0.1, 0.3, 0.1], 0
  )
  t.strictEqual(analyseCPU(badDelay), true)

  t.end()
})

test('analyse cpu - low noise', function (t) {
  const goodCPU = generateProcessStateFromCPU(
    [1.0, 1.0, 1.2, 0.9, 1.1, 1.0, 0.8, 1.1, 0.9, 1.1], 0.1
  )
  t.strictEqual(analyseCPU(goodCPU), false)

  const badDelay = generateProcessStateFromCPU(
    [0.5, 0.4, 0.1, 0.1, 1, 0.5, 0.4, 0.1, 0.1, 0.3, 0.1], 0.1
  )
  t.strictEqual(analyseCPU(badDelay), true)

  t.end()
})

test('analyse cpu - high noise', function (t) {
  const goodCPU = generateProcessStateFromCPU(
    [1.0, 1.0, 1.2, 0.9, 1.1, 1.0, 0.8, 1.1, 0.9, 1.1], 0.3
  )
  t.strictEqual(analyseCPU(goodCPU), false)

  const badDelay = generateProcessStateFromCPU(
    [0.5, 0.4, 0.1, 0.1, 1, 0.5, 0.4, 0.1, 0.1, 0.3, 0.1], 0.3
  )
  t.strictEqual(analyseCPU(badDelay), true)

  t.end()
})
