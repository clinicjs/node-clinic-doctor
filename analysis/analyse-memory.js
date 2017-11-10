'use strict'

const summary = require('summary')

const MB = 1024 * 1024

function analyseMemory (data) {
  const heapUsed = data.map((d) => d.memory.heapUsed)
  const heapTotal = data.map((d) => d.memory.heapTotal)
  // calculate the heapTotal differences, this will indicate allocations
  const heapTotalAllocation = diff(heapTotal)

  // The `diff` operator reduces the array length by 1. To match length,
  // remove the first delay item.
  const delay = data.map((d) => d.delay).slice(1)
  // Compute statistics
  const heapUsedStat = summary(heapUsed)
  const heapTotalAllocationStat = summary(heapTotalAllocation)
  const delayStat = summary(delay)

  // The "new space" has size 16 MB, if bigest deallocation is greater than
  // 16 MB it indicates that we have an "old space" deallocation. This should
  // not happen during benchmarking.
  // `16` is negative, because we are messureing allocation but testing for
  // deallocation issues.
  const oldSpaceDeallocationIssue = heapTotalAllocationStat.min() < -16 * MB

  // Check if there is correlation between the delay and the deallocations
  // This should definetly use a statistical correlation test, to ensure
  // the results aren't from randomness but I haven't implemented such a
  // test.
  // -0.3 appears to be an okay value. Again, it is negative because an
  // allocation measurement is used to test for deallocation.
  const delayDeallocationCorrelation = correlation(
    heapTotalAllocationStat, delayStat
  )
  const stopTheWorldIssue = delayDeallocationCorrelation < -0.3

  // The max "old space" size is 1400 MB, if the memory usage is close to
  // that it can cause an "stop-the-world-gc" issue.
  const oldSpaceTooLargeIssue = heapUsedStat.max() > 800 * MB

  // In cases where garbage collection is so bad no deallocation happen,
  // but not so bad it causes a stop the world issue. Then we can't spot
  // the issue on deallocation or to much space. In that case just detect
  // if we have seen a huge increase in used memory.
  const heapUsedDiff = heapUsedStat.max() - heapUsed[0]
  const hugeHeapUsedIncreaseIssue = heapUsedDiff > 500 * MB

  return {
    // We are currently not using the external memory data
    'external': false,
    // If the user has a lot of code a huge stack, the RSS could be huge.
    // This does not necessary indicate an issu, thus RSS is never used
    // as a measurment feature.
    'rss': false,
    // medium sized deallocation can be okay, so check that they also caused
    // a delay issue.
    'heapTotal': oldSpaceDeallocationIssue && stopTheWorldIssue,
    // We should never see huge increases in used heap
    'heapUsed': oldSpaceTooLargeIssue || hugeHeapUsedIncreaseIssue
  }
}

module.exports = analyseMemory

function diff (memory) {
  const allocations = []
  let lastUsage = memory[0]
  for (let i = 1; i < memory.length; i++) {
    allocations.push(memory[i] - lastUsage)
    lastUsage = memory[i]
  }
  return allocations
}

function correlation (xStat, yStat) {
  const cov = covariance(xStat, yStat)
  const cor = cov / (xStat.sd() * yStat.sd())
  return cor
}

function covariance (xStat, yStat) {
  const x = xStat.data()
  const y = yStat.data()

  let sse = 0
  for (let i = 0; i < xStat.size(); i++) {
    sse += (x[i] - xStat.mean()) * (y[i] - yStat.mean())
  }
  return sse / (xStat.size() - 1)
}
