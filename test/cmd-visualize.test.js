'use strict'

const fs = require('fs')
const test = require('tap').test
const async = require('async')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

test('cmd - test visualization - data exists', function (t) {
  const tool = new ClinicDoctor()

  function cleanup (err, dirname) {
    t.ifError(err)

    async.parallel([
      (done) => rimraf(dirname, done),
      (done) => fs.unlink(dirname + '.html', done)
    ], function (err) {
      t.ifError(err)
      t.end()
    })
  }

  tool.collect(
    [process.execPath, '-e', 'setTimeout(() => {}, 200)'],
    function (err, dirname) {
      if (err) return cleanup(err, dirname)

      tool.visualize(dirname, dirname + '.html', function (err) {
        if (err) return cleanup(err, dirname)

        fs.readFile(dirname + '.html', function (err, content) {
          if (err) return cleanup(err, dirname)

          t.ok(content.length > 1024)
          cleanup(null, dirname)
        })
      })
    }
  )
})

test('cmd - test visualization - missing data', function (t) {
  const tool = new ClinicDoctor({ debug: true })

  tool.visualize(
    'missing.clinic-doctor',
    'missing.clinic-doctor.html',
    function (err) {
      t.ok(err.message.includes('ENOENT: no such file or directory'))
      t.end()
    }
  )
})
