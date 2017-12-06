'use strict'

const summary = require('summary')

function analyseCPU (processStatSubset, gcEventSubset) {
  const stats = summary(processStatSubset.map((d) => d.cpu))

  // If the 90% quartile has less than 90% CPU load then the CPU is not
  // utilized optimally, likely because of some I/O delays. Highlight the
  // CPU curve in that case.
  return stats.quartile(0.9) < 0.9
}

module.exports = analyseCPU
