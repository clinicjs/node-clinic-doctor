'use strict'

const summary = require('summary')

function performanceIssue (issue) {
  return issue ? 'performance' : 'none'
}

function analyseLoopUtilisation (systemInfo, processStatSubset, traceEventSubset) {
  const stats = summary(processStatSubset.map((d) => d.loopUtilization))
  return performanceIssue(stats.median() >= 20)
}

module.exports = analyseLoopUtilisation
