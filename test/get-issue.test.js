'use strict'

const fs = require('fs')
const { test } = require('tap')
const async = require('async')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

test('get issue', function (t) {
  const tool = new ClinicDoctor({ dest: './foo' })

  function cleanup (err, dirname) {
    t.ifError(err)

    t.match(dirname, /^foo(\/|\\)[0-9]+\.clinic-doctor$/)

    async.parallel([
      (done) => rimraf(dirname, done),
      (done) => fs.unlink(dirname + '.html', done)
    ], function (err) {
      t.ifError(err)
      t.end()
    })
  }

  const script =
  'setTimeout(() => {}, 5000)'

  tool.collect(
    [process.execPath, '-e', script],
    function (err, dirname) {
      if (err) return cleanup(err, dirname)

      tool.visualize(dirname, dirname + '.html', function (err) {
        if (err) return cleanup(err, dirname)

        const issue = tool.getIssue()
        t.equal(issue, 'io')
        cleanup(null, dirname)
      })
    }
  )
})
