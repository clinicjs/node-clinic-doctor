'use strict'

const debug = require('debug')('doctor')

function issueCategory (issues, opts) {
  debug('detected issues', issues)
  const memoryIssue = (issues.memory.external || issues.memory.rss ||
                       issues.memory.heapTotal || issues.memory.heapUsed)

  let category = 'unknown'

  if (memoryIssue && !issues.cpu && !issues.handles) {
    category = 'gc'
  } else if (!memoryIssue && issues.delay && !issues.cpu && !issues.handles) {
    category = 'event-loop'
  } else if (!memoryIssue && !issues.delay && (issues.cpu || issues.handles)) {
    category = 'io'
  } else if (!memoryIssue && !issues.delay && !issues.cpu && !issues.handles) {
    category = 'none'
  }

  if (category === 'unknown' && opts && opts.detectNoise && issues.cpu) {
    issues.cpu = false
    category = issueCategory(issues)
    issues.cpu = true
    if (category !== 'unknown') {
      issues.cpuNoise = true
    }
  }

  debug('category', category)

  return category
}
module.exports = issueCategory
