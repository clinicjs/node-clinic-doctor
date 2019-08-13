'use strict'

const fs = require('fs')
const v8 = require('v8')
const { test } = require('tap')
const async = require('async')
const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

test('cmd - test check - data exists', function (t) {
  const tool = new ClinicDoctor({ dest: './foo' })

  function cleanup (err, dirname) {
    t.ifError(err)

    t.match(dirname, /^foo(\/|\\)[0-9]+\.clinic-doctor$/)

    rimraf(dirname, function (err) {
      t.ifError(err)
      t.end()
    })
  }

  tool.collect(
    [process.execPath, '-e', 'setTimeout(() => {}, 400)'],
    function (err, dirname) {
      if (err) return cleanup(err, dirname)

      tool.check(dirname, function (err, result) {
        if (err) return cleanup(err, dirname)

        t.ok(result)
        t.same(result.issue, 'data')
        t.same(result.recommendation.title, 'data analysis issue')
        cleanup(null, dirname)
      })
    }
  )
})

test('cmd - test check - memory exhausted', function (t) {
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
    t.ifError(err)

    t.match(dirname, /^[0-9]+\.clinic-doctor$/)

    rimraf(dirname, function (err) {
      t.ifError(err)
      t.end()
    })
  }

  tool.on('warning', function (warning) {
    t.equal(warning, 'Truncating input data due to memory constrains')
  })
  tool.on('truncate', function (undef) {
    t.equal(undef, undefined)
  })

  tool.collect(
    [process.execPath, '-e', 'setTimeout(() => {}, 400)'],
    function (err, dirname) {
      if (err) return cleanup(err, dirname)

      tool.check(dirname, function (err, result) {
        if (err) return cleanup(err, dirname)

        t.ok(result)
        t.same(result.issue, 'data')
        t.same(result.recommendation.title, 'data analysis issue')
        cleanup(null, dirname)
      })
    }
  )
})

test('cmd - test check - missing data', function (t) {
  const tool = new ClinicDoctor({ debug: true })

  tool.check(
    'missing.clinic-doctor',
    function (err) {
      t.ok(err.message.includes('ENOENT: no such file or directory'))
      t.end()
    }
  )
})
