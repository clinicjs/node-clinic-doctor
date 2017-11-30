'use strict'

const summary = require('summary')

const MB = 1024 * 1024

function analyseMemory (processStatSubset, gcEventSubset) {
  const heapUsed = processStatSubset.map((d) => d.memory.heapUsed)

  // Seperate delay data into delay followed by msc and all other delays
  const mscEvent = gcEventSubset.filter((d) => d.type === 'MARK_SWEEP_COMPACT')
  const statFromMsc = []
  const statFromNoMsc = []
  {
    const mscIter = mscEvent[Symbol.iterator]()
    let mscCurrentValue = mscIter.next()
    for (const stat of processStatSubset) {
      if (mscCurrentValue.done) {
        statFromNoMsc.push(stat)
        continue
      }

      if (stat.timestamp < mscCurrentValue.value.startTimestamp) {
        statFromNoMsc.push(stat)
        continue
      }

      statFromMsc.push(stat)
      mscCurrentValue = mscIter.next()
    }
  }

  // The max "old space" size is 1400 MB, if the memory usage is close to
  // that it can cause an "stop-the-world-gc" issue.
  const heapUsedStat = summary(heapUsed)
  const oldSpaceTooLargeIssue = heapUsedStat.max() > 1000 * MB

  // If delay caused by MSC shows an issue, but the remanin
  let correlatedDelayIssue = false
  if (statFromMsc.length > 0) {
    const delayFromMsc = statFromMsc.map((d) => d.delay)
    const delayFromNoMsc = statFromNoMsc.map((d) => d.delay)
    correlatedDelayIssue = summary(delayFromMsc).max() > 50 &&
                           summary(delayFromNoMsc).median() < 10
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
