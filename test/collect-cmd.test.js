'use strict'

const fs = require('fs')
const test = require('tap').test
const ClinicDoctor = require('../index.js')
const ProcessStateDecoder = require('../format/decoder.js')

function diff (data) {
  const output = []
  let last = data[0]
  for (let i = 1; i < data.length; i++) {
    output.push(data[i] - last)
    last = data[i]
  }
  return output
}

function mean (data) {
  let mean = data[0]
  for (let i = 1; i < data.length; i++) {
    mean += (data[i] - mean) / (i + 1)
  }
  return mean
}

function collect (tool, callback) {
  tool.collect(
    [process.execPath, '-e', 'setTimeout(() => {}, 200)'],
    function (err, filename) {
      if (err) return callback(err, filename, [])

      // read datafile
      let dataOutputted = []
      fs.createReadStream(filename)
        .pipe(new ProcessStateDecoder())
        .on('data', function (state) {
          dataOutputted.push(state.timestamp)
        })
        .once('end', function () {
          // remove datafile
          fs.unlink(filename, function (err) {
            if (err) return callback(err, filename, [])

            // all ok
            callback(null, filename, dataOutputted)
          })
        })
    }
  )
}

test('default collect command', function (t) {
  const tool = new ClinicDoctor()
  collect(tool, function (err, filename, output) {
    t.ifError(err)
    t.ok(filename.match(/^[0-9]+\.clinic-doctor-sample$/),
         'filename is correct')

    // expect time seperation to be 10ms, allow 10ms error
    const timeSeperation = mean(diff(output))
    t.ok(output.length > 0, 'data is outputted')
    t.ok(Math.abs(timeSeperation - 10) < 10)

    t.end()
  })
})

test('custom sample interval', function (t) {
  const tool = new ClinicDoctor({
    sampleInterval: 1
  })
  collect(tool, function (err, filename, output) {
    t.ifError(err)
    t.ok(filename.match(/^[0-9]+\.clinic-doctor-sample$/),
         'filename is correct')

    // expect time seperation to be 10ms, allow 10ms error
    const timeSeperation = mean(diff(output))
    t.ok(output.length > 0, 'data is outputted')
    t.ok(Math.abs(timeSeperation - 1) < 5)

    t.end()
  })
})
