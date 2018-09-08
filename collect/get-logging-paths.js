'use strict'

const path = require('path')

function getLoggingPaths (options) {
  let dirpath, basename
  if (options.hasOwnProperty('identifier')) {
    if (options.hasOwnProperty('path')) {
      dirpath = options.path
    } else {
      dirpath = ''
    }
    basename = options.identifier.toString()
  } else if (options.hasOwnProperty('path')) {
    dirpath = path.dirname(options.path)
    basename = path.basename(options.path, '.clinic-doctor')
  } else {
    throw new Error('missing either identifier or path value')
  }

  const dirname = `${basename}.clinic-doctor`
  const traceEventFilename = `${basename}.clinic-doctor-traceevent`
  const systemInfoFilename = `${basename}.clinic-doctor-systeminfo`
  const processsStatFilename = `${basename}.clinic-doctor-processstat`

  return {
    '/': path.join(dirpath, dirname),
    '/systeminfo': path.join(dirpath, dirname, systemInfoFilename),
    '/traceevent': path.join(dirpath, dirname, traceEventFilename),
    '/processstat': path.join(dirpath, dirname, processsStatFilename)
  }
}

module.exports = getLoggingPaths
