'use strict'

const test = require('tap').test
const stream = require('../lib/destroyable-stream')

test('Destroyable streams', function (t) {
  t.plan(4 * 3 + 4 * 2)

  testStream(new stream.Transform(), true)
  testStream(new stream.Readable({ read: () => {} }), true)
  testStream(new stream.Duplex({ read: () => {} }), true)
  testStream(new stream.Writable({ read: () => {} }), true)
  testStream(new stream.Transform(), false)
  testStream(new stream.Readable({ read: () => {} }), false)
  testStream(new stream.Duplex({ read: () => {} }), false)
  testStream(new stream.Writable({ read: () => {} }), false)

  function testStream (s, shouldError) {
    const error = new Error('error')
    let errored = false

    s.once('end', function () {
      t.fail('should not end')
    })

    s.once('finish', function () {
      t.fail('should not finish')
    })

    s.once('error', function (err) {
      errored = true
      t.equal(err, error)
    })

    s.once('close', function () {
      if (shouldError) t.ok(errored, 'should have errored first')
      else t.notOk(errored, 'should not have errored first')
      t.pass('should emit close')
    })

    if (s.resume) s.resume()
    if (shouldError) s.destroy(error)
    else s.destroy()
  }
})
