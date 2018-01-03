'use strict'

const path = require('path')
const CollectAndRead = require(path.resolve('collect-and-read.js'))
const cmd = new CollectAndRead({}, '-p', 'Error.stackTraceLimit')
cmd.on('ready', function () {
  cmd.cleanup()
})
