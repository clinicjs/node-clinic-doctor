'use strict'

const test = require('tap').test
const { spawn } = require('child_process')
const endpoint = require('endpoint')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

test('collect command stops when cluster is used', function (t) {
  t.plan(3)

  const doctor = new ClinicDoctor({})
  doctor.collect([process.execPath, '-e', 'require("cluster")'], (err, result) => {
    t.ifError(err, 'should not crash when cluster is required but not used')
    rimraf.sync(result)
  })

  const proc = spawn(process.execPath, [
    require.resolve('./cmd-no-cluster.script.js')
  ], { stdio: 'pipe' })

  proc.stderr.pipe(endpoint((err, buf) => {
    t.ifError(err)
    t.ok(buf.toString('utf8').includes('does not support clustering'), 'should crash once cluster is used')
  }))
})
