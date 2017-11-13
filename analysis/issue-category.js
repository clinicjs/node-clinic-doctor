'use strict'

function issueCategory (issues) {
  const memoryIssue = (issues.memory.external || issues.memory.rss ||
                       issues.memory.heapTotal || issues.memory.heapUsed)
  if (memoryIssue && !issues.cpu && !issues.handles) {
    return 'gc'
  }

  if (!memoryIssue && issues.delay && !issues.cpu && !issues.handles) {
    return 'event-loop'
  }

  if (!memoryIssue && !issues.delay && (issues.cpu || issues.handles)) {
    return 'io'
  }

  if (!memoryIssue && !issues.delay && !issues.cpu && !issues.handles) {
    return 'none'
  }

  return 'unknown'
}
module.exports = issueCategory
