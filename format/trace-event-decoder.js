'use strict'

const stream = require('stream')
const endpoint = require('endpoint')
const JSONStream = require('JSONStream')

// This list is from: https://github.com/catapult-project/catapult/blob/master
//   /tracing/tracing/metrics/v8/gc_metric_test.html#L50L57
const gcEventNames = new Set([
  'V8.GCCompactor',
  'V8.GCFinalizeMC',
  'V8.GCFinalizeMCReduceMemory',
  'V8.GCIncrementalMarking',
  'V8.GCIncrementalMarkingFinalize',
  'V8.GCIncrementalMarkingStart',
  'V8.GCPhantomHandleProcessingCallback',
  'V8.GCScavenger'
])

class TraceEventDecoder extends stream.Transform {
  constructor (systemInfoReader) {
    super({
      readableObjectMode: true,
      writableObjectMode: false
    })

    this.incremetalMarkingStart = 0
    this.incremetalMarkingStartFound = false

    // Get system clock synchronization info
    this.systemInfoReader = systemInfoReader
    this.clockOffset = null

    // JSONStream is synchronous so there is no need to think about
    // backpresure
    this.parser = JSONStream.parse('traceEvents.*')
    this.parser.on('data', (data) => this._process(data))
  }

  _process (traceEvent) {
    if (traceEvent.cat !== 'v8' || !gcEventNames.has(traceEvent.name)) {
      return
    }

    // Combine sequences of blocking GCIncrementalMarking and the following
    // GCFinalizeMC into just one event called V8.GCMarkSweepCompact

    // After this, the following events exists:
    // V8.GCCompactor (purpose unknown)
    // V8.GCFinalizeMC
    // V8.GCFinalizeMCReduceMemory (purpose unknown)
    // V8.GCIncrementalMarking
    // V8.GCPhantomHandleProcessingCallback (purpose unknown)
    // V8.GCScavenger
    // V8.GCMarkSweepCompact (aggregated event)

    if (traceEvent.name === 'V8.GCIncrementalMarkingStart') {
      this.incremetalMarkingStart = traceEvent.ts
      this.incremetalMarkingStartFound = true
    } else if (this.incremetalMarkingStartFound &&
             traceEvent.name === 'V8.GCIncrementalMarkingFinalize') {
      // skip
    } else if (this.incremetalMarkingStartFound &&
               traceEvent.name === 'V8.GCIncrementalMarking') {
      // skip
    } else if (this.incremetalMarkingStartFound &&
               traceEvent.name === 'V8.GCFinalizeMC') {
      this.incremetalMarkingStartFound = false

      const starttime = this.incremetalMarkingStart
      const endtime = traceEvent.ts + traceEvent.dur
      this.push({
        pid: traceEvent.pid,
        tid: traceEvent.tid,
        ts: starttime,
        ph: 'X',
        cat: 'v8',
        name: 'V8.GCMarkSweepCompact',
        dur: endtime - starttime,
        args: {
          startTimestamp: (starttime * 1e-3) + this.clockOffset,
          endTimestamp: (endtime * 1e-3) + this.clockOffset
        }
      })
    } else {
      // Add unixtime to the traceEvent
      const endtime = traceEvent.ts + traceEvent.dur
      traceEvent.args = {
        startTimestamp: (traceEvent.ts * 1e-3) + this.clockOffset,
        endTimestamp: (endtime * 1e-3) + this.clockOffset
      }
      this.push(traceEvent)
    }
  }

  _transform (chunk, encoding, callback) {
    const self = this
    if (this.clockOffset === null) {
      this.systemInfoReader
        .pipe(endpoint({ objectMode: true }, function (err, data) {
          if (err) return self.emit('error', err)

          // Save clock offset
          const systemInfo = data[0]
          self.clockOffset = systemInfo.clockOffset

          // Now that the clock offset is known, the data can be processed
          self.parser.write(chunk, encoding)
          callback(null)
        }))
    } else {
      // Clock offset is already known, process directly
      this.parser.write(chunk, encoding)
      callback(null)
    }
  }

  _flush (callback) {
    this.parser.end()
    callback(null)
  }
}
module.exports = TraceEventDecoder
