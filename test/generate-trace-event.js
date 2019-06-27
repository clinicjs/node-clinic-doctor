'use strict'

const typeMap = new Map([
  ['SCA', 'V8.GCScavenger'],
  ['MSC', 'V8.GCMarkSweepCompact'],
  ['NONE', null]
])

function generateTraceEvent (data, timeSpaceing) {
  if (timeSpaceing === undefined) {
    timeSpaceing = 10
  }

  const output = []

  let lastType = null
  let startIndex = -1
  for (let i = 0; i < data.length; i++) {
    const type = typeMap.get(data[i])
    if (lastType === null) {
      // prepear next type
      lastType = type
      startIndex = i
    } else if (type !== lastType) {
      const startTimestamp = startIndex * timeSpaceing
      const endTimestamp = i * timeSpaceing

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

      // prepear next type
      lastType = type
      startIndex = i
    }
  }

  return output
}

module.exports = generateTraceEvent
