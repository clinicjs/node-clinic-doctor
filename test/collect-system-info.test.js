'use strict'

const test = require('tap').test
const systemInfo = require('../collect/system-info.js')

test('Collect - system info - check data', function (t) {
  const info = systemInfo()

  t.strictEqual(info.nodeVersions, process.versions)
  t.strictEqual(info.toolVersion, require('../package').version)
  t.ok(Array.isArray(info.clock.hrtime))
  t.ok(Math.abs(Date.now() - info.clock.unixtime) < 1000)
  t.end()
})
