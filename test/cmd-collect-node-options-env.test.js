'use strict'

const test = require('tap').test
const path = require('path')
const async = require('async')
const { spawn } = require('child_process')
const endpoint = require('endpoint')

test('cmd - collect - NODE_OPTIONS environment is not ignored', function (t) {
  const child = spawn(
    process.execPath, [
      path.resolve(__dirname, 'cmd-collect-node-options-env.script.js')
    ], {
      env: Object.assign({}, process.env, {
        NODE_OPTIONS: '--no-warnings --stack-trace-limit=4013'
      }),
      cwd: __dirname
    }
  )

  async.parallel({
    stdout (done) { child.stdout.pipe(endpoint(done)) },
    stderr (done) { child.stderr.pipe(endpoint(done)) }
  }, function (err, output) {
    if (err) return t.error(err)

    // Expect the WARNING output to be shown
    t.ok(output.stderr.toString().split('\n').length, 1)
    t.equal(output.stdout.toString().trim(), '4013')
    t.end()
  })
})
