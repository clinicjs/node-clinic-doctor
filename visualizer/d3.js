'use strict'

const selection = require('d3-selection')

// Reduce file size by only including the d3 modules that are used
const d3 = Object.assign(
  {},
  selection,
  require('d3-array'),
  require('d3-axis'),
  require('d3-scale'),
  require('d3-shape'),
  require('d3-time-format')
)

// This property changes after importing so we fake a live binding.
Object.defineProperty(d3, 'event', {
  get () { return selection.event }
})

module.exports = d3
