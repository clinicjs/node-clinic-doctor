const onlisten = require('on-net-listen')
const fs = require('fs')
const net = require('net')

onlisten(function (addr) {
  this.destroy()
  const port = Buffer.from(addr.port + '')
  fs.writeSync(3, port, 0, port.length)
  signal(3, function () {
    process.emit('beforeExit')
  })
})

function signal (fd, cb) {
  const s = new net.Socket({ fd, readable: true, writable: false })
  s.unref()
  s.on('error', () => {})
  s.on('close', cb)
}
