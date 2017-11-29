'use strict'

const summary = require('summary')
const analyseDelay = require('./analyse-delay.js')

const MB = 1024 * 1024

function analyseMemory (processStatSubset, gcEventSubset) {
  const heapUsed = processStatSubset.map((d) => d.memory.heapUsed)

  // Seperate delay data into delay followed by msc and all other delays
  const mscEvent = gcEventSubset.filter((d) => d.type === 'MARK_SWEEP_COMPACT')
  const delayFromMsc = []
  const delayFromNoMsc = []
  {
    const mscIter = mscEvent[Symbol.iterator]()
    let mscCurrentValue = mscIter.next()
    for (const stat of processStatSubset) {
      if (mscCurrentValue.done) {
        delayFromNoMsc.push(stat)
        continue
      }

      if (stat.timestamp < mscCurrentValue.value.startTimestamp) {
        delayFromNoMsc.push(stat)
        continue
      }

      delayFromMsc.push(stat)
      mscCurrentValue = mscIter.next()
    }
  }

  // The max "old space" size is 1400 MB, if the memory usage is close to
  // that it can cause an "stop-the-world-gc" issue.
  const heapUsedStat = summary(heapUsed)
  const oldSpaceTooLargeIssue = heapUsedStat.max() > 1000 * MB

  // If delay caused by MSC shows an issue, but the remanin
  let correlatedDelayIssue = false
  if (delayFromMsc.length > 0) {
    correlatedDelayIssue = analyseDelay(delayFromMsc, mscEvent) &&
                           !analyseDelay(delayFromNoMsc, mscEvent)
  }

  return {
    // We are currently not using the external memory processStatSubset
    'external': false,
    // If the user has a lot of code or a huge stack, the RSS could be huge.
    // This does not necessary indicate an issue, thus RSS is never used
    // as a measurment feature.
    'rss': false,
    // If there correlation between Mark & Sweep & Compact and a delay issue.
    'heapTotal': correlatedDelayIssue,
    // We should never see huge increases in used heap
    'heapUsed': oldSpaceTooLargeIssue
  }
}

module.exports = analyseMemory
