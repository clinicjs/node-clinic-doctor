'use strict'

const path = require('path')
const CollectAndRead = require(path.resolve('collect-and-read.js'))
const cmd = new CollectAndRead({}, '-e', `
  setInterval(() => {}, 100)
  process.once('SIGINT', function () {
    console.log('SIGINT received')
    process.kill(process.pid, 'SIGINT')
  })
  console.log('listening for SIGINT')
`)
cmd.on('ready', function () {
  cmd.cleanup()
})
process.on('exit', function () {
  cmd.cleanup()
})
