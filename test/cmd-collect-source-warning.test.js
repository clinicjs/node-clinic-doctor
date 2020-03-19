'use strict'

const test = require('tap').test
const { spawn } = require('child_process')
const endpoint = require('endpoint')
const path = require('path')

test('cmd - collect - source warning', function (t) {
  const proc = spawn(process.execPath, [
    path.join(__dirname, '/fixtures/sourcemap.run.js')
  ])

  proc.on('exit', (code) => {
    t.strictEqual(code, 0)
  })

  proc.stderr.pipe(endpoint((err, buf) => {
    t.ifError(err)
    t.ok(buf.toString('utf8').includes('Transpiled code is not supported'), 'should warn if transpiled code is used')
    t.end()
  }))
})
