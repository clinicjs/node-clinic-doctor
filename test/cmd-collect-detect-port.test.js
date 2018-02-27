'use strict'

const test = require('tap').test
const http = require('http')
const CollectAndRead = require('./collect-and-read.js')

test('cmd - collect - detect server port', function (t) {
  const cmd = new CollectAndRead({detectPort: true}, '-e', `
    const http = require('http')
    http.createServer(onrequest).listen(0)

    function onrequest (req, res) {
      this.close()
      res.end('from server')
    }
  `)

  cmd.tool.on('port', function (port) {
    t.ok(typeof port === 'number')
    t.ok(port > 0)

    http.get(`http://127.0.0.1:${port}`, function (res) {
      const buf = []
      res.on('data', data => buf.push(data))
      res.on('end', function () {
        t.deepEquals(Buffer.concat(buf), Buffer.from('from server'))
        t.end()
      })
    })
  })
})
