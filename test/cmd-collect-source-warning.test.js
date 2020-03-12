'use strict'

const test = require('tap').test
const path = require('path')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

test('cmd - collect - source warning', function (t) {
  const doctor = new ClinicDoctor({})
  const filename = path.join('test', 'fixtures', 'plain-with-sourcemap.js')
  doctor.collect([process.execPath, filename], (err, result) => {
    t.ifError(err, 'should not crash when attempting source map detection')
    rimraf.sync(result)
    t.end()
  })
})
