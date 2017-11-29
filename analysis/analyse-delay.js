'use strict'

const summary = require('summary')

// Note: this function is also used by analyseMemory, for detecting
// correlations between Mark & Sweep & Compact and delays.
function analyseDelay (processStatSubset, gcEventSubset) {
  const stats = summary(processStatSubset.map((d) => d.delay))

  // If there is a 10ms event loop delay, we can't handle connections for 10ms
  // that is actually pretty bad. There are also some cases, where the GC
  // stops the world for a long time. This doesn't happen often, but just
  // once can be an issue. Check for that, by looking at the max value.
  // Note: units are in milliseconds
  return stats.median() >= 10 || stats.max() >= 100
}

module.exports = analyseDelay
