'use strict'

const fs = require('fs')
const async = require('async')
const rimraf = require('rimraf')
const events = require('events')
const ClinicDoctor = require('../index.js')
const getLoggingPaths = require('@clinic/clinic-common').getLoggingPaths('doctor')
const SystemInfoDecoder = require('../format/system-info-decoder.js')
const TraceEventDecoder = require('../format/trace-event-decoder.js')
const ProcessStatDecoder = require('../format/process-stat-decoder.js')

class CollectAndRead extends events.EventEmitter {
  constructor (options, ...args) {
    super()
    const self = this
    const tool = this.tool = new ClinicDoctor(options)

    tool.collect([process.execPath, ...args], function (err, dirname) {
      self.files = getLoggingPaths({ path: dirname })
      if (err) return self.emit('error', err)

      self.noError = true

      const systemInfo = fs.createReadStream(self.files['/systeminfo'])
        .pipe(new SystemInfoDecoder())
      const traceEvent = fs.createReadStream(self.files['/traceevent'])
        .pipe(new TraceEventDecoder(systemInfo))
      const processStat = fs.createReadStream(self.files['/processstat'])
        .pipe(new ProcessStatDecoder())

      self.systemInfo = systemInfo
      self.traceEvent = traceEvent
      self.processStat = processStat

      self._setupAutoCleanup()
      self.emit('ready')
    })
  }

  cleanup () {
    rimraf.sync(this.files['/'])
  }

  _setupAutoCleanup () {
    const self = this

    async.parallel({
      systemInfo (done) {
        self.systemInfo.once('end', function () {
          fs.unlink(self.files['/systeminfo'], function (err) {
            if (err) return done(err)
            done(null)
          })
        })
      },
      traceEvent (done) {
        self.traceEvent.once('end', function () {
          fs.unlink(self.files['/traceevent'], function (err) {
            if (err) return done(err)
            done(null)
          })
        })
      },
      processStat (done) {
        self.processStat.once('end', function () {
          fs.unlink(self.files['/processstat'], function (err) {
            if (err) return done(err)
            done(null)
          })
        })
      }
    }, function (err, output) {
      if (err) return self.emit('error', err)

      fs.rmdir(self.files['/'], function (err) {
        if (err) return self.emit('error', err)
      })
    })
  }
}

module.exports = CollectAndRead
