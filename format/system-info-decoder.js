'use strict'

const semver = require('semver')
const stream = require('../lib/destroyable-stream')

class SystemInfo {
  constructor (systemInfo) {
    this.nodeVersion = semver.parse(systemInfo.nodeVersions.node)

    this.clock = systemInfo.clock

    const hrtime = this.clock.hrtime
    const unixtime = this.clock.unixtime
    // calcluate clock offset, but converting hrtime to milliseconds
    // and substracting it from the unixtime
    const hrtimeMS = (hrtime[0] * 1e3 + hrtime[1] * 1e-6)
    this.clockOffset = unixtime - hrtimeMS
  }
}

class SystemInfoDecoder extends stream.Transform {
  constructor () {
    super({
      readableObjectMode: true,
      writableObjectMode: false
    })

    this._data = []
  }

  _transform (chunk, encoding, callback) {
    this._data.push(chunk)
    callback(null)
  }

  _flush (callback) {
    this.push(
      new SystemInfo(JSON.parse(Buffer.concat(this._data).toString()))
    )
    callback(null)
  }
}
module.exports = SystemInfoDecoder
