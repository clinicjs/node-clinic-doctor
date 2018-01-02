'use strict'

function systemInfo () {
  return {
    clock: {
      hrtime: process.hrtime(),
      unixtime: Date.now()
    }
  }
}
module.exports = systemInfo
