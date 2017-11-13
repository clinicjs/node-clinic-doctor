'use strict'

const test = require('tap').test
const Analyse = require('../analysis/')
const generateProcessState = require('./generate-process-state.js')

function analyse (data) {
  const analyse = new Analyse()

  // write data
  for (const datum of data) analyse.write(datum)
  analyse.end()

  // get analysis
  return analyse.read()
}

test('normal interval - cpu issue', function (t) {
  for (const noise of [0, 0.1, 0.3]) {
    const goodCPU = generateProcessState({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 100, 100, 120, 90, 110, 100, 80, 110, 90, 110, 1, 1, 1]
    }, noise)
    t.strictDeepEqual(analyse(goodCPU), {
      interval: [ 30, 120 ],
      issues: {
        delay: false,
        cpu: false,
        memory: {
          external: false,
          rss: false,
          heapTotal: false,
          heapUsed: false
        },
        handles: false
      },
      issueCategory: 'none'
    })

    const badCPU = generateProcessState({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 50, 40, 10, 10, 100, 50, 40, 10, 10, 10, 1, 1, 1]
    }, noise)
    t.strictDeepEqual(analyse(badCPU), {
      interval: [ 30, 120 ],
      issues: {
        delay: false,
        cpu: true,
        memory: {
          external: false,
          rss: false,
          heapTotal: false,
          heapUsed: false
        },
        handles: false
      },
      issueCategory: 'io'
    })
  }

  t.end()
})

test('full interval - flat data', function (t) {
  const goodCPU = generateProcessState({
    handles: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    cpu: [100, 100, 120, 90, 110, 100, 80, 110, 90, 110]
  }, 0)
  t.strictDeepEqual(analyse(goodCPU), {
    interval: [ 0, 90 ],
    issues: {
      delay: false,
      cpu: false,
      memory: {
        external: false,
        rss: false,
        heapTotal: false,
        heapUsed: false
      },
      handles: false
    },
    issueCategory: 'none'
  })

  const badCPU = generateProcessState({
    handles: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    cpu: [50, 40, 10, 10, 100, 50, 40, 10, 10, 10]
  }, 0)

  t.strictDeepEqual(analyse(badCPU), {
    interval: [ 0, 90 ],
    issues: {
      delay: false,
      cpu: true,
      memory: {
        external: false,
        rss: false,
        heapTotal: false,
        heapUsed: false
      },
      handles: false
    },
    issueCategory: 'io'
  })

  t.end()
})
