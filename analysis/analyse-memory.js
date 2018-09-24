'use strict'

const summary = require('summary')

const MB = 1024 * 1024

function analyseMemory (processStatSubset, traceEventSubset) {
  const heapTotal = processStatSubset.map((d) => d.memory.heapTotal)

  // Extract delay from blocking Mark & Sweep & Compact events
  const mscDelay = traceEventSubset
    .filter((d) => d.name === 'V8.GCMarkSweepCompact')
    .map((d) => d.args.endTimestamp - d.args.startTimestamp)

  // The max "old space" size is 1400 MB, if the memory usage is close to
  // that it can cause an "stop-the-world-gc" issue.
  const heapTotalStat = summary(heapTotal)
  const oldSpaceTooLargeIssue = heapTotalStat.max() > 1000 * MB

  // If MSC caused a big delay
  const mscDelayStat = summary(mscDelay)
  const mscDelayIssue = mscDelayStat.max() > 100

  return {
    // We are currently not using the external memory processStatSubset
    'external': false,
    // If the user has a lot of code or a huge stack, the RSS could be huge.
    // This does not necessary indicate an issue, thus RSS is never used
    // as a measurement feature.
    'rss': false,
    // We should never see huge increases in used heap
    'heapTotal': oldSpaceTooLargeIssue,
    // If Mark & Sweep & Compact caused a delay issue.
    'heapUsed': mscDelayIssue
  }
}

module.exports = analyseMemory
