
function issueCategory (issues) {
  const memoryIssue = (issues.memory.external || issues.memory.rss ||
                       issues.memory.heapTotal || issues.memory.heapUsed)
  if (memoryIssue && !issues.cpu) {
    return 'gc'
  }

  if (!memoryIssue && issues.delay && !issues.cpu) {
    return 'event-loop'
  }

  if (!memoryIssue && !issues.delay && issues.cpu) {
    return 'io'
  }

  if (!memoryIssue && !issues.delay && !issues.cpu) {
    return 'none'
  }

  return 'unknown'
}
module.exports = issueCategory
