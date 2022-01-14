'use strict'

const { eventLoopUtilization } = require('perf_hooks').performance

function hrtime2ms (time) {
  return time[0] * 1e3 + time[1] * 1e-6
}

class ProcessStat {
  constructor (sampleInterval, collectLoopUtilization = true) {
    if (typeof sampleInterval !== 'number') {
      throw new TypeError('sample interval must be a number')
    }

    if (typeof collectLoopUtilization !== 'boolean') {
      throw new TypeError('collectLoopUtilization must be a boolean')
    }

    this.sampleInterval = sampleInterval
    this.collectLoopUtilization = collectLoopUtilization
    this.refresh()
  }

  _sampleDelay (elapsedTime) {
    // delay can't be negative, so truncate to 0
    return Math.max(0, elapsedTime - this.sampleInterval)
  }

  _sampleCpuUsage (elapsedTime) {
    const elapsedCpuUsage = process.cpuUsage(this._lastSampleCpuUsage)
    // convert to from µs to ms
    const elapsedCpuUsageTotal = (
      elapsedCpuUsage.user + elapsedCpuUsage.system
    ) / 1000

    return elapsedCpuUsageTotal / elapsedTime
  }

  refresh () {
    this._lastSampleTime = process.hrtime()
    this._lastSampleCpuUsage = process.cpuUsage()
  }

  sample () {
    const elapsedTime = hrtime2ms(process.hrtime(this._lastSampleTime))

    const thisSample = {
      timestamp: Date.now(),
      delay: this._sampleDelay(elapsedTime),
      cpu: this._sampleCpuUsage(elapsedTime),
      memory: process.memoryUsage(),
      handles: process._getActiveHandles().length,
      loopUtilization: this.collectLoopUtilization ? eventLoopUtilization().utilization * 100 : NaN
    }

    return thisSample
  }
}

module.exports = ProcessStat
