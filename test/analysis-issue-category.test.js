'use strict'

const test = require('tap').test
const issueCategory = require('../analysis/issue-category.js')

test('Analysis - issue category', function (t) {
  const testQueries = [
    'cpu memory delay handles -> unknown',
    'cpu memory delay ....... -> unknown',
    'cpu memory ..... handles -> unknown',
    'cpu memory ..... ....... -> unknown',
    'cpu ...... delay handles -> unknown',
    'cpu ...... delay ....... -> unknown',
    'cpu ...... ..... handles -> io',
    'cpu ...... ..... ....... -> io',
    '... memory delay handles -> unknown',
    '... memory delay ....... -> gc',
    '... memory ..... handles -> unknown',
    '... memory ..... ....... -> gc',
    '... ...... delay handles -> unknown',
    '... ...... delay ....... -> event-loop',
    '... ...... ..... handles -> io',
    '... ...... ..... ....... -> none'
  ]

  const queryParser = new RegExp([
    /^(cpu|\.{3}) (memory|\.{6})/.source,
    / (delay|\.{5}) (handles|\.{7})/.source,
    / -> (gc|event-loop|io|none|unknown)$/.source
  ].join(''))

  for (const testQuery of testQueries) {
    const parsed = testQuery.match(queryParser)
    if (parsed === null) {
      t.fail(`could not parse "${testQuery}"`)
    }

    const issues = {
      cpu: parsed[1] === 'cpu',
      memory: {
        external: false,
        rss: false,
        heapTotal: false,
        heapUsed: parsed[2] === 'memory'
      },
      delay: parsed[3] === 'delay',
      handles: parsed[4] === 'handles'
    }
    const expected = parsed[5]

    t.strictEqual(issueCategory(issues), expected, testQuery)
  }

  t.end()
})

test('Analysis - issue category detect cpu noise', function (t) {
  const issues = {
    cpu: true,
    memory: {external: false, rss: false, heapTotal: false, heapUsed: false},
    delay: true,
    handles: false
  }
  const category = issueCategory(issues, {detectNoise: true})
  t.strictEqual(category, 'event-loop')
  t.strictEqual(issues.cpuNoise, true)
  t.end()
})

test('Analysis - issue category noise unknown issue', function (t) {
  const issues = {
    cpu: true,
    memory: {external: false, rss: false, heapTotal: false, heapUsed: false},
    delay: true,
    handles: true
  }
  const category = issueCategory(issues, {detectNoise: true})
  t.strictEqual(category, 'unknown')
  t.end()
})
