'use strict'

const path = require('path')

function getLoggingPaths (options) {
  let dirpath, basename
  if (options.hasOwnProperty('identifier')) {
    dirpath = ''
    basename = options.identifier.toString()
  } else if (options.hasOwnProperty('path')) {
    dirpath = path.dirname(options.path)
    basename = path.basename(options.path, '.clinic-doctor')
  } else {
    throw new TypeError('missing either identifier or path value')
  }

  const dirname = `${basename}.clinic-doctor`
  const gcEventFilename = `${basename}.clinic-doctor-gcevents`
  const processsStatFilename = `${basename}.clinic-doctor-processstat`

  return {
    '/': path.join(dirpath, dirname),
    '/gcevent': path.join(dirpath, dirname, gcEventFilename),
    '/processstat': path.join(dirpath, dirname, processsStatFilename)
  }
}

module.exports = getLoggingPaths
