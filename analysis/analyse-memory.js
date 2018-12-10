'use strict'

const summary = require('summary')

const MB = 1024 * 1024

function analyseMemory (processStatSubset, traceEventSubset) {
  const heapTotal = processStatSubset.map((d) => d.memory.heapTotal)
  const heapUsed = processStatSubset.map((d) => d.memory.heapUsed)

  // Extract delay from blocking Mark & Sweep & Compact events
  const mscDelay = traceEventSubset
    .filter((d) => d.name === 'V8.GCMarkSweepCompact')
    .map((d) => d.args.endTimestamp - d.args.startTimestamp)

  // The max "old space" size is 1400 MB, if the memory usage is close to
  // that it can cause an "stop-the-world-gc" issue.
  const heapTotalStat = summary(heapTotal)
  const oldSpaceTooLargeIssue = heapTotalStat.max() > 1000 * MB

  const heapUsedStat = summary(heapUsed)

  // If MSC caused a big delay
  const mscDelayStat = summary(mscDelay)

  // We check if the mean is greater than 100ms.
  // We use the mean because we want to take into account both
  // big and small GC events.
  // mean() could be NaN, and in that case, this check will be false.
  const mscDelayIssue = mscDelayStat.mean() > 100

  return {
    // We are currently not using the external memory processStatSubset
    'external': false,
    // If the user has a lot of code or a huge stack, the RSS could be huge.
    // This does not necessary indicate an issue, thus RSS is never used
    // as a measurement feature.
    'rss': false,
    // We should never see huge increases in used heap
    'heapTotal': oldSpaceTooLargeIssue,
    // If Mark & Sweep & Compact caused a delay issue, and we are using
    // more than 128MB of heap, then we have a problem.
    'heapUsed': heapUsedStat.max() > 128 * MB && mscDelayIssue
  }
}

module.exports = analyseMemory
