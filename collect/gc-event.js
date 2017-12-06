'use strict'

const events = require('events')
const gcStats = require('gc-stats')

// From: https://github.com/nodejs/node/blob/
//   554fa24916c5c6d052b51c5cee9556b76489b3f7/deps/v8/include/v8.h#L6137-L6144
const kGCTypeScavenge = 1 << 0
const kGCTypeMarkSweepCompact = 1 << 1
const kGCTypeIncrementalMarking = 1 << 2
const kGCTypeProcessWeakCallbacks = 1 << 3

const typeIntegerToEnum = new Map([
  [kGCTypeScavenge, 'SCAVENGE'],
  [kGCTypeMarkSweepCompact, 'MARK_SWEEP_COMPACT'],
  [kGCTypeIncrementalMarking, 'INCREMENTAL_MARKING'],
  [kGCTypeProcessWeakCallbacks, 'PROCESS_WEAK_CALLBACKS']
])

function hrtime2ms (time) {
  return time[0] * 1e3 + time[1] * 1e-6
}

class GCEvent extends events.EventEmitter {
  constructor () {
    super()
    this._gcEmitter = gcStats()

    // convert between Date.now() and process.hrtime() that gc-stats
    // returns
    this._offset = Date.now() - hrtime2ms(process.hrtime())
  }

  start () {
    // the stats event is split to be forward compatiable with gc-events from
    // trace_events, that we may use in the future.
    this._gcEmitter.on('stats', (stats) => {
      this.emit('event', {
        type: typeIntegerToEnum.get(stats.gctype),
        phase: 'BEGIN',
        timestamp: stats.startTime * 1e-6 + this._offset
      })

      this.emit('event', {
        type: typeIntegerToEnum.get(stats.gctype),
        phase: 'END',
        timestamp: stats.endTime * 1e-6 + this._offset
      })
    })
  }

  stop () {
    this._gcEmitter.removeAllListeners('stats')
  }
}

module.exports = GCEvent
