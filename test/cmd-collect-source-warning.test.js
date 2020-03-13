'use strict'

const test = require('tap').test
const { spawn } = require('child_process')
const endpoint = require('endpoint')

test('cmd - collect - source warning', function (t) {
  const proc = spawn(process.execPath, [
    require.resolve(__dirname+'/fixtures/sourcemap.run.js')
  ])
  
  proc.stderr.pipe(endpoint((err, buf) => {
    t.ifError(err)
    t.ok(buf.toString('utf8').includes('Transpiled code is not supported'), 'should warn if transpiled code is used')
    t.end()
  }))
})
