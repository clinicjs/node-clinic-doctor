'use strict'

const test = require('tap').test
const stream = require('stream')
const analyse = require('../analysis/index.js')
const generateProcessStat = require('./generate-process-stat.js')

async function getAnalyse (data) {
  const gcEventReader = new stream.PassThrough({
    readableObjectMode: true,
    writableObjectMode: true
  })

  const processStatReader = new stream.PassThrough({
    readableObjectMode: true,
    writableObjectMode: true
  })

  const analysisResult = analyse(gcEventReader, processStatReader)

  // write data
  for (const datum of data) processStatReader.write(datum)
  processStatReader.end()
  gcEventReader.end()

  // read data
  return new Promise(function (resolve, reject) {
    const initRead = analysisResult.read()
    if (initRead !== null) return resolve(initRead)

    analysisResult.once('readable', function () {
      const safeRead = analysisResult.read()
      resolve(safeRead)
    })
  })
}

test('normal interval - cpu issue', async function (t) {
  for (const noise of [0, 0.1, 0.3]) {
    const goodCPU = generateProcessStat({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 100, 100, 120, 90, 110, 100, 80, 110, 90, 110, 1, 1, 1]
    }, noise)
    t.strictDeepEqual(await getAnalyse(goodCPU), {
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

    const badCPU = generateProcessStat({
      handles: [3, 3, 3, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 3, 3, 3],
      cpu: [1, 1, 1, 50, 40, 10, 10, 100, 50, 40, 10, 10, 10, 1, 1, 1]
    }, noise)
    t.strictDeepEqual(await getAnalyse(badCPU), {
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

test('full interval - flat data', async function (t) {
  const goodCPU = generateProcessStat({
    handles: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    cpu: [100, 100, 120, 90, 110, 100, 80, 110, 90, 110]
  }, 0)
  t.strictDeepEqual(await getAnalyse(goodCPU), {
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

  const badCPU = generateProcessStat({
    handles: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    cpu: [50, 40, 10, 10, 100, 50, 40, 10, 10, 10]
  }, 0)

  t.strictDeepEqual(await getAnalyse(badCPU), {
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
