'use strict'

const typeMap = new Map([
  ['S', 'V8.GCScavenger'],
  ['M', 'V8.GCIncrementalMarking'],
  ['F', 'V8.GCIncrementalMarkingFinalize'],
  ['C', 'V8.GCFinalizeMC'],
  [' ', 0],
  ['.', 10],
  ['-', 100]
])

function isBreak (type) {
  return typeof type === 'number'
}

function isGCEvent (type) {
  return typeof type === 'string'
}

function generateTraceEvent (chars, timeStretching) {
  timeStretching = timeStretching || 1

  const output = []

  let lastType = 0
  let startTimestamp = 0
  let endTimestamp = 0
  for (let i = 0; i <= chars.length; i++) {
    const type = i === chars.length ? 0 : typeMap.get(chars[i])

    if (lastType !== type && isGCEvent(lastType)) {
      output.push({
        pid: 0,
        tid: 0,
        ts: startTimestamp * 1e3,
        ph: 'X',
        cat: 'v8',
        name: lastType,
        dur: (endTimestamp - startTimestamp) * 1e3,
        args: {
          startTimestamp: startTimestamp,
          endTimestamp: endTimestamp
        }
      })

      startTimestamp = endTimestamp
    } else if (isBreak(lastType)) {
      startTimestamp = endTimestamp
    }

    // update the end timestamp in each iteration
    endTimestamp += (isBreak(type) ? type : 10) * timeStretching
    lastType = type
  }

  return output
}

module.exports = generateTraceEvent
