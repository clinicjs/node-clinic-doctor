'use strict'

const test = require('tap').test
const path = require('path')
const { spawn } = require('child_process')
const endpoint = require('endpoint')

test('cmd - collect - NODE_PATH works', function (t) {
  t.plan(2)

  const child = spawn(
    process.execPath, [
      require.resolve('./cmd-collect-node-path-env.script.js')
    ], {
      env: Object.assign({}, process.env, { NODE_PATH: __dirname })
    }
  )

  child.on('exit', function (code) {
    t.strictEqual(code, 0)
  })

  child.stdout.pipe(endpoint(function (err, output) {
    if (err) return t.ifError(err)

    t.strictEqual(output.toString().trim(), `${path.join(__dirname, '../injects')}${path.delimiter}${__dirname}`)
  }))
})
