'use strict'

const test = require('tap').test
const { spawn } = require('child_process')
const endpoint = require('endpoint')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

test('cmd - collect - cluster required but not used is ok', function (t) {
  const doctor = new ClinicDoctor({})
  doctor.collect([process.execPath, '-e', 'require("cluster")'], (err, result) => {
    t.error(err, 'should not crash when cluster is required but not used')
    rimraf.sync(result)
    t.end()
  })
})

test('cmd - collect - using cluster causes error', function (t) {
  const proc = spawn(process.execPath, [
    require.resolve('./cmd-no-cluster.script.js')
  ], { stdio: 'pipe' })

  proc.stderr.pipe(endpoint((err, buf) => {
    t.error(err)
    t.ok(buf.toString('utf8').includes('does not support clustering'), 'should crash once cluster is used')
    rimraf('node_trace.1.log', () => t.end())
  }))
})
