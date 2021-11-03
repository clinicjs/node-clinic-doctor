'use strict'

const test = require('tap').test
const os = require('os')
const path = require('path')
const async = require('async')
const { spawn } = require('child_process')
const endpoint = require('endpoint')
const CollectAndRead = require('./collect-and-read.js')

const isWindows = os.platform() === 'win32'
let skip

skip = isWindows ? 'Skip test as we cannot easily send SIGINT on Windows' : false
test('cmd - collect - external SIGINT is relayed', { skip }, function (t) {
  const child = spawn(
    process.execPath, [
      path.resolve(__dirname, 'cmd-collect-exit-sigint.script.js')
    ], {
      cwd: __dirname
    }
  )

  child.stdout.once('data', () => child.kill('SIGINT'))

  async.parallel({
    stdout (done) { child.stdout.pipe(endpoint(done)) },
    stderr (done) { child.stderr.pipe(endpoint(done)) }
  }, function (err, output) {
    if (err) return t.error(err)

    // Expect the WARNING output to be shown
    t.ok(output.stderr.toString().split('\n').length, 1)
    t.equal(output.stdout.toString(),
      'listening for SIGINT\nSIGINT received\n')
    t.end()
  })
})

test('cmd - collect - non-success exit code should not throw', function (t) {
  const cmd = new CollectAndRead({}, '--expose-gc', '-e', 'process.nextTick(() => { process.exit(1) })')
  cmd.on('error', t.error.bind(t))
  cmd.on('ready', function () {
    t.end()
  })
})

// On Windows, process.exit(1) and'process.kill(pid, 'SIGKILL') both give exit code 1
// TODO: test Windows SIGKILL behaviour, if it should error, find reliable detection
skip = isWindows ? 'Skip test as SIGKILL also sends exit code 1 on Windows' : false
test('cmd - collect - SIGKILL causes error', { skip }, function (t) {
  const cmd = new CollectAndRead(
    {},
    '--expose-gc', '-e', 'process.kill(process.pid, "SIGKILL")'
  )

  cmd.once('error', function (err) {
    cmd.cleanup()
    t.strictSame(err, new Error('process exited by signal SIGKILL'))
    t.end()
  })
})
