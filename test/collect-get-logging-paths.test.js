'use strict'

const test = require('tap').test
const getLoggingPaths = require('../collect/get-logging-paths.js')

test('Collect - logging path - identifier', function (t) {
  const paths = getLoggingPaths({ identifier: 1062 })

  t.strictDeepEqual(paths, {
    '/': '1062.clinic-doctor',
    '/traceevent': '1062.clinic-doctor/1062.clinic-doctor-traceevent',
    '/systeminfo': '1062.clinic-doctor/1062.clinic-doctor-systeminfo',
    '/processstat': '1062.clinic-doctor/1062.clinic-doctor-processstat'
  })
  t.end()
})

test('Collect - logging path - path', function (t) {
  const paths = getLoggingPaths({ path: '/root/1062.clinic-doctor' })

  t.strictDeepEqual(paths, {
    '/': '/root/1062.clinic-doctor',
    '/traceevent': '/root/1062.clinic-doctor/1062.clinic-doctor-traceevent',
    '/systeminfo': '/root/1062.clinic-doctor/1062.clinic-doctor-systeminfo',
    '/processstat': '/root/1062.clinic-doctor/1062.clinic-doctor-processstat'
  })
  t.end()
})

test('Collect - logging path - bad type', function (t) {
  t.throws(
    () => getLoggingPaths({}),
    new Error('missing either identifier or path value')
  )
  t.end()
})
