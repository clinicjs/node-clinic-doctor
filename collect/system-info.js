'use strict'

function systemInfo () {
  return {
    clock: {
      hrtime: process.hrtime(),
      unixtime: Date.now()
    },
    nodeVersions: process.versions,
    toolVersion: require('../package').version
  }
}
module.exports = systemInfo
