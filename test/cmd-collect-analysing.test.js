'use strict'

const { test } = require('tap')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')
const semver = require('semver')

test('cmd - test collect - emits "analysing" event', function (t) {
  const tool = new ClinicDoctor()

  function cleanup (err, dirname) {
    t.error(err)
    t.match(dirname, /^[0-9]+\.clinic-doctor/)
    rimraf(dirname, (err) => {
      t.error(err)
      t.end()
    })
  }

  let seenAnalysing = false
  tool.on('analysing', () => {
    seenAnalysing = true
  })

  tool.collect(
    [process.execPath, '-e', 'setTimeout(() => {}, 123)'],
    function (err, dirname) {
      if (err) return cleanup(err, dirname)

      t.ok(seenAnalysing) // should've happened before this callback
      cleanup(null, dirname)
    }
  )
})

test('cmd - test ELU is not calculated with unsupported node versions', function (t) {
  const tool = new ClinicDoctor()

  if (!semver.gt(process.version, 'v14.10.0')) {
    t.notOk(tool.collectLoopUtilization)
  } else {
    t.ok(tool.collectLoopUtilization)
  }

  t.end()
})
