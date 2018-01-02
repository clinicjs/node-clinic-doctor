'use strict'

const fs = require('fs')
const async = require('async')
const events = require('events')
const ClinicDoctor = require('../index.js')
const getLoggingPaths = require('../collect/get-logging-paths.js')
const SystemInfoDecoder = require('../format/system-info-decoder.js')
const TraceEventDecoder = require('../format/trace-event-decoder.js')
const ProcessStatDecoder = require('../format/process-stat-decoder.js')

class CollectAndRead extends events.EventEmitter {
  constructor (options, ...args) {
    super()
    const self = this
    const tool = new ClinicDoctor(options)

    tool.collect([process.execPath, ...args], function (err, dirname) {
      if (err) return self.emit('error', err)

      const files = getLoggingPaths({ path: dirname })

      const systemInfo = fs.createReadStream(files['/systeminfo'])
        .pipe(new SystemInfoDecoder())
      const traceEvent = fs.createReadStream(files['/traceevent'])
        .pipe(new TraceEventDecoder(systemInfo))
      const processStat = fs.createReadStream(files['/processstat'])
        .pipe(new ProcessStatDecoder())

      self._setupAutoCleanup(files, systemInfo, traceEvent, processStat)
      self.emit('ready', traceEvent, processStat)
    })
  }

  _setupAutoCleanup (files, systemInfo, traceEvent, processStat) {
    const self = this

    async.parallel({
      systemInfo (done) {
        systemInfo.once('end', function () {
          fs.unlink(files['/systeminfo'], function (err) {
            if (err) return done(err)
            done(null)
          })
        })
      },
      traceEvent (done) {
        traceEvent.once('end', function () {
          fs.unlink(files['/traceevent'], function (err) {
            if (err) return done(err)
            done(null)
          })
        })
      },
      processStat (done) {
        processStat.once('end', function () {
          fs.unlink(files['/processstat'], function (err) {
            if (err) return done(err)
            done(null)
          })
        })
      }
    }, function (err, output) {
      if (err) return self.emit('error', err)

      fs.rmdir(files['/'], function (err) {
        if (err) return self.emit('error', err)
      })
    })
  }
}

module.exports = CollectAndRead
