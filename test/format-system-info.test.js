'use strict'

const test = require('tap').test
const endpoint = require('endpoint')
const SystemInfoDecoder = require('../format/system-info-decoder.js')

test('Format - system info - decoding', function (t) {

  const timeOffset = 33000000
  const systemInfoReader = new SystemInfoDecoder()
  systemInfoReader.end(JSON.stringify({
    clock: {
      hrtime: [0, 400000],
      unixtime: timeOffset
    }
  }))

  systemInfoReader.pipe(endpoint({ objectMode: true }, function (err, data) {
    if (err) return t.ifError(err)

    t.strictDeepEqual(Object.assign({}, data[0]), {
      clock: {
        hrtime: [0, 400000],
        unixtime: timeOffset
      },
      clockOffset: 32999999.6
    })

    t.end()
  }))
})
