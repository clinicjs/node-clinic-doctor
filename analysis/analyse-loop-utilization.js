'use strict'

const summary = require('summary')

function performanceIssue (issue) {
  return issue ? 'performance' : 'none'
}

function analyseLoopUtilisation (systemInfo, processStatSubset, traceEventSubset) {
  // each data point will be NaN if we could not calculate ELU and so
  // calculation of performace issue will be false below
  const stats = summary(processStatSubset.map((d) => d.loopUtilization))
  return performanceIssue(stats.median() >= 95)
}

module.exports = analyseLoopUtilisation
