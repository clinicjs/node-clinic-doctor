'use strict'

const stream = require('../lib/destroyable-stream')
const endpoint = require('endpoint')
const parser = require('@clinic/trace-events-parser')

class TraceEventDecoder extends stream.Transform {
  constructor (systemInfoReader) {
    super({
      readableObjectMode: true,
      writableObjectMode: false
    })

    // Get system clock synchronization info
    this.systemInfoReader = systemInfoReader
    this.clockOffset = null

    // trace-events-parser is synchronous so there is no need to think about
    // backpresure
    this.parser = parser()
    this.parser.on('data', (data) => this._process(data))

    const self = this
    this.systemInfoReader.pipe(endpoint({ objectMode: true }, function (err, data) {
      if (err) return self.destroy(err)

      // Save clock offset
      const systemInfo = data[0]
      self.clockOffset = systemInfo.clockOffset

      self.emit('clockOffset')
    }))
  }

  _process (traceEvent) {
    // Filter out data not related to v8 and the V8.Execute trace_event
    if (traceEvent.cat !== 'v8' || traceEvent.name.slice(0, 5) !== 'V8.GC') {
      return
    }

    // Add unixtime to the traceEvent
    const endtime = traceEvent.ts + traceEvent.dur
    traceEvent.args = {
      startTimestamp: (traceEvent.ts * 1e-3) + this.clockOffset,
      endTimestamp: (endtime * 1e-3) + this.clockOffset
    }
    this.push(traceEvent)
  }

  _transform (chunk, encoding, callback) {
    const self = this
    if (this.clockOffset === null) {
      this.once('clockOffset', function () {
        // Now that the clock offset is known, the data can be processed
        self.parser.write(chunk, encoding)
        callback(null)
      })
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
