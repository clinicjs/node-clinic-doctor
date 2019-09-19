'use strict'

const summary = require('summary')

function performanceIssue (issue) {
  return issue ? 'performance' : 'none'
}

function analyseMemory (systemInfo, processStatSubset, traceEventSubset) {
  // Create a set of all GC events that blocks the eventloop
  const blockingEventsNewSpace = new Set(['V8.GCScavenger'])
  const blockingEventsOldSpace = new Set([
    'V8.GCFinalizeMC', 'V8.GCIncrementalMarkingFinalize'
  ])
  // In node.js 8 and higher, V8.GCIncrementalMarking runs cocurrently
  if (systemInfo.nodeVersion.major < 8) {
    blockingEventsOldSpace.add('V8.GCIncrementalMarking')
  }

  // Create an data structure with all blocking gc events
  // * compute a time-window-index, this is used to aggregate many small gc-events.
  //   each window is 1 second long. Note that rooling time windows are not used,
  //   as it is likely unnecessary and computationally costly.
  // * pre-compute the duration
  const gcevents = traceEventSubset
    .filter((d) => blockingEventsNewSpace.has(d.name) || blockingEventsOldSpace.has(d.name))
    .map((d) => ({
      name: d.name,
      timeWindow: Math.round((0.5 / 1000) * (d.args.endTimestamp + d.args.startTimestamp)),
      duration: d.args.endTimestamp - d.args.startTimestamp
    }))

  // Check that there is at least one GC event.
  if (gcevents.length === 0) {
    return {
      external: 'none',
      rss: 'none',
      heapTotal: 'data',
      heapUsed: 'data'
    }
  }

  // Setup a 2d array structure, to hold data for each time window
  const timeWindows = gcevents.map((d) => d.timeWindow)
  const timeWindowMax = Math.max(...timeWindows)
  const timeWindowMin = Math.min(...timeWindows)
  const timeWindowData = []
  for (let i = 0; i <= (timeWindowMax - timeWindowMin); i++) {
    timeWindowData.push([])
  }
  // Move gcevents to timeWindowData
  for (const gcevent of gcevents) {
    timeWindowData[gcevent.timeWindow - timeWindowMin].push(gcevent)
  }

  // Compute the max blocked time
  // The maxBlockedTimeOver1SecNewSpace and maxBlockedTimeOver1SecOldSpace are
  // just for indicating in the graph coloring what the time was mostly spent on
  const maxBlockedTimeOver1Sec = maxBlockedTime(timeWindowData)
  const maxBlockedTimeOver1SecNewSpace = maxBlockedTime(
    timeWindowData.map(
      (data) => data.filter((d) => blockingEventsNewSpace.has(d.name))
    )
  )
  const maxBlockedTimeOver1SecOldSpace = maxBlockedTime(
    timeWindowData.map(
      (data) => data.filter((d) => blockingEventsOldSpace.has(d.name))
    )
  )

  return {
    // We are currently not checking anything related to the external memory
    external: 'none',
    // If the user has a lot of code or a huge stack, the RSS could be huge.
    // This does not necessary indicate an issue, thus RSS is never used
    // as a measurement.
    rss: 'none',
    // Detect an issue if more than 100ms per 1sec, was spent doing
    // blocking garbage collection.
    // Mark the issue in heapTotal, if time was primarily spent cleaning
    // up the old space.
    // Mark the issue in heapUsed: if time was primarily spent cleaning
    // up the new space.
    heapTotal: performanceIssue(
      (maxBlockedTimeOver1Sec >= 100) &&
      (maxBlockedTimeOver1SecOldSpace >= maxBlockedTimeOver1SecNewSpace)
    ),
    heapUsed: performanceIssue(
      (maxBlockedTimeOver1Sec >= 100) &&
      (maxBlockedTimeOver1SecOldSpace < maxBlockedTimeOver1SecNewSpace)
    )
  }
}

module.exports = analyseMemory

function maxBlockedTime (timeWindowData) {
  return summary(
    timeWindowData.map((data) => summary(
      data.map((d) => d.duration)
    ).sum())
  ).max()
}
