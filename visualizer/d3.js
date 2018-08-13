'use strict'

const selection = require('d3-selection')

// Reduce file size by only including the d3 modules that are used
const d3 = Object.assign(
  {},
  // d3.mouse
  // d3.select
  // d3.selectAll
  selection,
  // d3.min
  // d3.max
  // d3.extent
  require('d3-array'),
  // d3.axisBottom
  // d3.axisLeft
  require('d3-axis'),
  // d3.scaleLinear
  // d3.scaleTime
  require('d3-scale'),
  // d3.line
  require('d3-shape'),
  // d3.timeFormat
  require('d3-time-format')
)

// This property changes after importing so we fake a live binding.
Object.defineProperty(d3, 'event', {
  get () { return selection.event }
})

module.exports = d3
