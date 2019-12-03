'use strict'
/* eslint-disable */

const fs = require('fs')
const v8 = require('v8')
const { test } = require('tap')
const pump = require('pump')
const async = require('async')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const semver = require('semver')
const startpoint = require('startpoint')
const ClinicDoctor = require('../index.js')
const getLoggingPaths = require('@nearform/clinic-common').getLoggingPaths('doctor')
const generateProcessStat = require('./generate-process-stat.js')
const generateTraceEvent = require('./generate-trace-event.js')

test('cmd - test analyze - data exists', function (t) {
  const tool = new ClinicDoctor({ dest: './foo' })

  function cleanup (err, dirname) {
    t.ifError(err)

    t.match(dirname, /^foo(\/|\\)[0-9]+\.clinic-doctor$/)

    rimraf(dirname, function (err) {
      t.ifError(err)
      t.end()
    })
  }

  const systemInfo = {
    clock: {
      hrtime: process.hrtime(),
      unixtime: Date.now()
    },
    nodeVersions: process.versions
  }

  const badCPU = generateProcessStat({
    cpu: [
      // duplicate a bunch of times so the interval trimming code
      // doesn't discard everything
      200, 200, 15, 10, 190, 200, 5, 15, 190, 200,
      200, 200, 15, 10, 190, 200, 5, 15, 190, 200,
      200, 200, 15, 10, 190, 200, 5, 15, 190, 200,
      200, 200, 15, 10, 190, 200, 5, 15, 190, 200,
      200, 200, 15, 10, 190, 200, 5, 15, 190, 200,
      200, 200, 15, 10, 190, 200, 5, 15, 190, 200,
      200, 200, 15, 10, 190, 200, 5, 15, 190, 200
    ]
  }, 0)

  const goodMemoryGC = generateTraceEvent(
    '-S....-S....-S....-S....-S....-S....-S....-S....-S....-S....' +
    '-M....-M....-S....-M....-M....-S....-M....-M....-FFF.. CCC..'
  )

  const paths = getLoggingPaths({
    identifier: 1234,
    path: tool.path
  })

  mkdirp(paths['/'], ondir)

  function ondir (err) {
    if (err) return cleanup(err, paths['/'])
    const ProcessStatEncoder = require('../format/process-stat-encoder.js')

    async.parallel({
      systeminfo (callback) {
        fs.writeFile(paths['/systeminfo'], JSON.stringify(systemInfo), callback)
      },
      processstat (callback) {
        pump(
          startpoint(badCPU, { objectMode: true }),
          new ProcessStatEncoder(),
          fs.createWriteStream(paths['/processstat']),
          callback)
      },
      traceevent (callback) {
        fs.writeFile(paths['/traceevent'], JSON.stringify({ traceEvents: goodMemoryGC }), callback)
      }
    }, oncollected)
  }

  function oncollected (err) {
    if (err) return cleanup(err, paths['/'])

    tool.analyze(paths['/']).analysis
      .on('error', function (err) { cleanup(err, paths['/']) })
      .on('data', function (result) {
        t.ok(result)
        t.same(result.issueCategory, 'performance')
        cleanup(null, paths['/'])
      })
  }
})

test('cmd - test analyze - memory exhausted', function (t) {
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

      tool.analyze(dirname).analysis
        .on('error', function (err) { cleanup(err, dirname) })
        .on('data', function (result) {
          t.ok(result)
          t.same(result.issueCategory, 'data')
          cleanup(null, dirname)
        })
    }
  )
})

test('cmd - test analyze - missing data', function (t) {
  const tool = new ClinicDoctor({ debug: true })

  tool.analyze('missing.clinic-doctor').analysis
    .on('error', function (err) {
      t.ok(err.message.includes('ENOENT: no such file or directory'))
      t.end()
    })
    .on('data', function () {
      t.fail('should error')
    })
})
