'use strict'

const test = require('tap').test
const getLoggingPaths = require('@clinic/clinic-common').getLoggingPaths('doctor')
const path = require('path')

test('Collect - logging path - identifier', function (t) {
  const paths = getLoggingPaths({ identifier: 1062 })

  t.strictSame(paths, {
    '/': '1062.clinic-doctor',
    '/traceevent': path.join('1062.clinic-doctor', '1062.clinic-doctor-traceevent'),
    '/systeminfo': path.join('1062.clinic-doctor', '1062.clinic-doctor-systeminfo'),
    '/processstat': path.join('1062.clinic-doctor', '1062.clinic-doctor-processstat')
  })
  t.end()
})

test('Collect - logging path - path', function (t) {
  const paths = getLoggingPaths({ path: path.join('root', '1062.clinic-doctor') })

  t.strictSame(paths, {
    '/': path.join('root', '1062.clinic-doctor'),
    '/traceevent': path.join('root', '1062.clinic-doctor', '1062.clinic-doctor-traceevent'),
    '/systeminfo': path.join('root', '1062.clinic-doctor', '1062.clinic-doctor-systeminfo'),
    '/processstat': path.join('root', '1062.clinic-doctor', '1062.clinic-doctor-processstat')
  })
  t.end()
})

test('Collect - logging path - path and identifier', function (t) {
  const paths = getLoggingPaths({ path: './foo', identifier: 1062 })

  t.strictSame(paths, {
    '/': path.join('foo', '1062.clinic-doctor'),
    '/traceevent': path.join('foo', '1062.clinic-doctor', '1062.clinic-doctor-traceevent'),
    '/systeminfo': path.join('foo', '1062.clinic-doctor', '1062.clinic-doctor-systeminfo'),
    '/processstat': path.join('foo', '1062.clinic-doctor', '1062.clinic-doctor-processstat')
  })
  t.end()
})

test('Collect - logging path - null path and identifier', function (t) {
  const paths = getLoggingPaths({ path: null, identifier: 1062 })

  t.strictSame(paths, {
    '/': path.join('', '1062.clinic-doctor'),
    '/traceevent': path.join('', '1062.clinic-doctor', '1062.clinic-doctor-traceevent'),
    '/systeminfo': path.join('', '1062.clinic-doctor', '1062.clinic-doctor-systeminfo'),
    '/processstat': path.join('', '1062.clinic-doctor', '1062.clinic-doctor-processstat')
  })
  t.end()
})

test('Collect - logging testing null values', function (t) {
  t.throws(
    () => getLoggingPaths({ identifier: null }),
    new Error('missing either identifier or path value')
  )
  t.throws(
    () => getLoggingPaths({ path: null }),
    new Error('missing either identifier or path value')
  )
  t.throws(
    () => getLoggingPaths({ path: null, identifier: null }),
    new Error('missing either identifier or path value')
  )
  t.end()
})

test('Collect - logging path - bad type', function (t) {
  t.throws(
    () => getLoggingPaths({}),
    new Error('missing either identifier or path value')
  )
  t.end()
})
