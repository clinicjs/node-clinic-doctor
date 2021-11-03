'use strict'

const fs = require('fs')
const v8 = require('v8')
const { test } = require('tap')
const async = require('async')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

test('cmd - test visualization - data exists', function (t) {
  const tool = new ClinicDoctor({ dest: './foo' })

  function cleanup (err, dirname) {
    t.error(err)

    t.match(dirname, /^foo(\/|\\)[0-9]+\.clinic-doctor$/)

    async.parallel([
      (done) => rimraf(dirname, done),
      (done) => fs.unlink(dirname + '.html', done)
    ], function (err) {
      t.error(err)
      t.end()
    })
  }

  tool.collect(
    [process.execPath, '-e', 'setTimeout(() => {}, 400)'],
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

test('cmd - test visualization - memory exhausted', function (t) {
  const tmp = process.memoryUsage
  const HEAP_MAX = v8.getHeapStatistics().heap_size_limit

  // Mock the used function to pretend the memory is exhausted.
  process.memoryUsage = () => {
    return {
      rss: 0,
      heapTotal: HEAP_MAX,
      heapUsed: 0,
      external: 0
    }
  }

  const tool = new ClinicDoctor()

  function cleanup (err, dirname) {
    process.memoryUsage = tmp
    t.error(err)

    t.match(dirname, /^[0-9]+\.clinic-doctor$/)

    async.parallel([
      (done) => rimraf(dirname, done),
      (done) => fs.unlink(dirname + '.html', done)
    ], function (err) {
      t.error(err)
      t.end()
    })
  }

  tool.on('warning', function (warning) {
    t.equal(warning, 'Truncating input data due to memory constraints')
  })
  tool.on('truncate', function (undef) {
    t.equal(undef, undefined)
  })

  tool.collect(
    [process.execPath, '-e', 'setTimeout(() => {}, 400)'],
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
