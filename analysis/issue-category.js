'use strict'

const debug = require('debug')('doctor')

function issueCategory (issues) {
  const memoryIssue = (issues.memory.external || issues.memory.rss ||
                       issues.memory.heapTotal || issues.memory.heapUsed)

  let category = 'unknown'

  debug('issues detected', Object.assign({}, issues, { memory: memoryIssue }))

  if (memoryIssue && !issues.cpu && !issues.handles) {
    category = 'gc'
  } else if (!memoryIssue && issues.delay && !issues.cpu && !issues.handles) {
    category = 'event-loop'
  } else if (!memoryIssue && !issues.delay && (issues.cpu || issues.handles)) {
    category = 'io'
  } else if (!memoryIssue && !issues.delay && !issues.cpu && !issues.handles) {
    category = 'none'
  }

  // TODO mcollina: check which combinations we are not categorizing
  // and see if a categorization is possible.
  debug('category issued', category)

  return category
}
module.exports = issueCategory
