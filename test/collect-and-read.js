'use strict'

const fs = require('fs')
const async = require('async')
const events = require('events')
const getLoggingPaths = require('../collect/get-logging-paths.js')
const ClinicDoctor = require('../index.js')
const GCEventDecoder = require('../format/gc-event-decoder.js')
const ProcessStatDecoder = require('../format/process-stat-decoder.js')

class CollectAndRead extends events.EventEmitter {
  constructor (options, ...args) {
    super()
    const self = this
    const tool = new ClinicDoctor(options)

    tool.collect([process.execPath, ...args], function (err, dirname) {
      if (err) return self.emit('error', err)

      const files = getLoggingPaths({ path: dirname })

      const gcevent = fs.createReadStream(files['/gcevent'])
        .pipe(new GCEventDecoder())
      const processstat = fs.createReadStream(files['/processstat'])
        .pipe(new ProcessStatDecoder())

      self._setupAutoCleanup(files, gcevent, processstat)
      self.emit('ready', gcevent, processstat)
    })
  }

  _setupAutoCleanup (files, gcevent, processstat) {
    const self = this

    async.parallel({
      stackTraces (done) {
        gcevent.once('end', function () {
          fs.unlink(files['/gcevent'], function (err) {
            if (err) return done(err)
            done(null)
          })
        })
      },
      traveEvents (done) {
        processstat.once('end', function () {
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
