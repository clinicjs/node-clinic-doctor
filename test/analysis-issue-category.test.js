'use strict'

const test = require('tap').test
const issueCategory = require('../analysis/issue-category.js')

test('Analysis - issue category', function (t) {
  const testQueries = [
    // cpu    memory delay  handles    category
    '  perf   perf   perf   perf    -> unknown',
    '  perf   perf   perf   ....    -> unknown',
    '  perf   perf   ....   perf    -> unknown',
    '  perf   perf   ....   ....    -> unknown',
    '  perf   ....   perf   perf    -> unknown',
    '  perf   ....   perf   ....    -> unknown',
    '  perf   ....   ....   perf    -> io',
    '  perf   ....   ....   ....    -> io',
    // cpu    memory delay  handles    category
    '  ....   perf   perf   perf    -> unknown',
    '  ....   perf   perf   ....    -> gc',
    '  ....   perf   ....   perf    -> unknown',
    '  ....   perf   ....   ....    -> gc',
    '  ....   ....   perf   perf    -> unknown',
    '  ....   ....   perf   ....    -> event-loop',
    '  ....   ....   ....   perf    -> io',
    '  ....   ....   ....   ....    -> none',
    // cpu    memory delay  handles    category
    '  data   ....   ....   ....    -> data',
    '  ....   data   ....   ....    -> data',
    '  ....   ....   data   ....    -> data',
    '  ....   ....   ....   data    -> data'
  ]

  const queryParser = new RegExp([
    /^ {2}/.source,
    /(perf|data|\.{4}) {3}/.source,
    /(perf|data|\.{4}) {3}/.source,
    /(perf|data|\.{4}) {3}/.source,
    /(perf|data|\.{4}) {3}/.source,
    / -> (data|gc|event-loop|io|none|unknown)$/.source
  ].join(''))

  const shortToLong = {
    perf: 'performance',
    data: 'data',
    '....': 'none'
  }

  for (const testQuery of testQueries) {
    const parsed = testQuery.match(queryParser)
    if (parsed === null) {
      t.fail(`could not parse "${testQuery}"`)
    }

    const issues = {
      cpu: shortToLong[parsed[1]],
      memory: {
        external: 'none',
        rss: 'none',
        heapTotal: 'none',
        heapUsed: shortToLong[parsed[2]]
      },
      delay: shortToLong[parsed[3]],
      handles: shortToLong[parsed[4]]
    }
    const expected = parsed[5]

    t.equal(issueCategory(issues), expected, testQuery)
  }

  t.end()
})
