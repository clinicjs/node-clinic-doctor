'use strict'

// Reduce file size by only including the d3 modules that are used
Object.assign(
  module.exports,
  require('d3-array'),
  require('d3-axis'),
  require('d3-scale'),
  require('d3-selection'),
  require('d3-shape'),
  require('d3-time-format')
)
