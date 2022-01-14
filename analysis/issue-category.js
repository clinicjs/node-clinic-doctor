'use strict'

const debug = require('debug')('doctor')

function hasPerformanceIssue (issue) {
  return issue === 'performance'
}

function hasDataIssue (issue) {
  return issue === 'data'
}

function aggregateMemoryIssue (memory) {
  const memoryDataIssue = (
    hasDataIssue(memory.external) ||
    hasDataIssue(memory.rss) ||
    hasDataIssue(memory.heapTotal) ||
    hasDataIssue(memory.heapUsed)
  )
  const memoryPerformanceIssue = (
    hasPerformanceIssue(memory.external) ||
    hasPerformanceIssue(memory.rss) ||
    hasPerformanceIssue(memory.heapTotal) ||
    hasPerformanceIssue(memory.heapUsed)
  )

  if (memoryDataIssue) {
    return 'data'
  }
  return memoryPerformanceIssue ? 'performance' : 'none'
}

function issueCategory (issues) {
  debug('detected issues', issues)
  const memoryIssue = aggregateMemoryIssue(issues.memory)

  let category = 'unknown'
  if (hasDataIssue(memoryIssue) || hasDataIssue(issues.cpu) ||
      hasDataIssue(issues.handles) || hasDataIssue(issues.delay)) {
    category = 'data'
  } else if (hasPerformanceIssue(memoryIssue) &&
             !hasPerformanceIssue(issues.cpu) &&
             !hasPerformanceIssue(issues.handles)) {
    category = 'gc'
  } else if (!hasPerformanceIssue(memoryIssue) &&
             (hasPerformanceIssue(issues.delay) || hasPerformanceIssue(issues.loopUtilization)) &&
             !hasPerformanceIssue(issues.cpu) &&
             !hasPerformanceIssue(issues.handles)) {
    category = 'event-loop'
  } else if (!hasPerformanceIssue(memoryIssue) &&
             !hasPerformanceIssue(issues.delay) &&
             (hasPerformanceIssue(issues.cpu) || hasPerformanceIssue(issues.handles))) {
    category = 'io'
  } else if (!hasPerformanceIssue(memoryIssue) &&
             !hasPerformanceIssue(issues.delay) &&
             !hasPerformanceIssue(issues.cpu) &&
             !hasPerformanceIssue(issues.handles)) {
    category = 'none'
  }

  debug('category', category)

  return category
}
module.exports = issueCategory
