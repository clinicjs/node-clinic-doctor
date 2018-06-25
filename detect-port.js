const onlisten = require('on-net-listen')
const fs = require('fs')

onlisten(function (addr) {
  this.destroy()
  const port = Buffer.from(addr.port + '')
  const buf = Buffer.alloc(1)
  fs.writeSync(3, port, 0, port.length)
  fs.read(3, buf, 0, 1, null, function () {
    process.exit(0)
  })
})
