'use strict'

const path = require('path')

function getLoggingPaths (idendifier) {
  const dirname = `${idendifier}.clinic-doctor`
  const gcEventFilename = `${idendifier}.clinic-doctor-gcevents`
  const processsStatFilename = `${idendifier}.clinic-doctor-processstat`

  return {
    '/': dirname,
    '/gcevent': path.join(dirname, gcEventFilename),
    '/processstat': path.join(dirname, processsStatFilename)
  }
}

module.exports = getLoggingPaths
