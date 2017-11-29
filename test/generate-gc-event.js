'use strict'

const typeMap = new Map([
  ['SCA', 'SCAVENGE'],
  ['MSC', 'MARK_SWEEP_COMPACT'],
  ['INC', 'INCREMENTAL_MARKING'],
  ['WEAK', 'PROCESS_WEAK_CALLBACKS'],
  ['NONE', null]
])

function generateGCEvent (data) {
  const output = []

  let lastType = null
  let startIndex = -1
  for (let i = 0; i < data.length; i++) {
    const type = typeMap.get(data[i])
    if (type !== lastType) {
      if (type !== null) {
        output.push({
          startTimestamp: startIndex * 10,
          endTimestamp: i * 10,
          type: type
        })
      }

      // prepear next type
      lastType = type
      startIndex = i
    }
  }

  return output
}

module.exports = generateGCEvent
