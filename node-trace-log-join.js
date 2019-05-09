const through = require('through2')
const parser = require('@nearform/trace-events-parser')
const multistream = require('multistream')
const pump = require('pump')
const fs = require('fs')
const path = require('path')

module.exports = nodeTraceJoin

function nodeTraceJoin (pattern, output, cb) {
  if (!cb) cb = noop
  if (Array.isArray(pattern)) return combine(pattern)

  const dir = path.dirname(pattern)
  const filePattern = path.basename(pattern).split('*')
  console.log({ dir, filePattern })

  fs.readdir(dir, function (err, files) {
    if (err) return cb(err)
    files = files.filter(filterPattern).sort(sort).map(file => path.join(dir, file))
    console.log({ files })
    combine(files)
  })

  function combine (files) {
    if (!files.length) return cb(notFound('No files matching the pattern found'))
    if (files.length === 1) return fs.rename(files[0], output, cb)

    pump(
      multistream.obj(files.map(parse)),
      stringify(),
      fs.createWriteStream(output),
      onunlink
    )

    function onunlink (err) {
      if (err) return cb(err)

      var missing = files.length
      var error = null

      for (var i = 0; i < files.length; i++) fs.unlink(files[i], done)

      function done (err) {
        if (err && err.code !== 'ENOENT') error = err
        if (--missing) return
        cb(error)
      }
    }
  }

  function filterPattern (file) {
    var offset = 0
    for (var i = 0; i < filePattern.length; i++) {
      const next = file.indexOf(filePattern[i], offset)
      if (next === -1) return false
      offset = next + filePattern[i].length
    }
    if (filePattern[filePattern.length - 1]) {
      if (offset !== file.length) return false
    }
    return true
  }
}

function notFound (msg) {
  const err = new Error(msg)
  err.code = 'ENOENT'
  err.status = 404
  err.notFound = true
  return err
}

function index (n) {
  const m = n.match(/node_trace\.(\d+)\.log/)
  if (m) return Number(m[1])
  return 0
}

function sort (a, b) {
  const ai = index(a)
  const bi = index(b)
  if (ai && bi) return ai - bi
  if (a === b) return 0
  return a < b ? -1 : 1
}

function stringify () {
  var sep = false

  const s = through({ writableObjectMode: true, readableObjectMode: false }, write, flush)
  s.push('{"traceEvents":[')
  return s

  function write (data, enc, cb) {
    const s = sep ? ',' : ''
    sep = true
    cb(null, s + JSON.stringify(data))
  }

  function flush (cb) {
    this.push(']}')
    cb(null)
  }
}

function parse (filename) {
  return pump(fs.createReadStream(filename), parser())
}

function noop () {}
