'use strict'

const xorshift = require('xorshift')
const MB = Math.pow(1024, 2)

function generateProcessStat (data, noiseLevel, timeStretching) {
  const rng = new xorshift.constructor([
    294915, 70470, 145110, 287911 // from random.org :)
  ])

  noiseLevel = noiseLevel || 0
  timeStretching = timeStretching || 1

  function noise () {
    return rng.random() * noiseLevel
  }

  // flatten data structure
  const flat = {
    delay: data.delay,
    cpu: data.cpu,
    rss: data.memory && data.memory.rss,
    heapTotal: data.memory && data.memory.heapTotal,
    heapUsed: data.memory && data.memory.heapUsed,
    external: data.memory && data.memory.external,
    handles: data.handles && data.handles,
    loopUtilization: data.loopUtilization && data.loopUtilization
  }

  // check lengths are equal
  let minLength = Infinity
  let maxLength = -Infinity
  for (const array of Object.values(flat)) {
    if (array === undefined) continue
    maxLength = Math.max(maxLength, array.length)
    minLength = Math.min(minLength, array.length)
  }

  if (maxLength !== minLength) {
    throw new Error('provided arrays are not equally long')
  }

  // create a process stat array of length `maxLength === minLength`
  const output = []
  for (let i = 0; i < maxLength; i++) {
    output.push({
      timestamp: i * 10 * timeStretching,
      delay: !flat.delay ? 0 : flat.delay[i] + noise(),
      cpu: !flat.cpu ? 0 : (flat.cpu[i] + noise()) * 0.01,
      memory: {
        rss: !flat.rss ? 0 : (flat.rss[i] + noise()) * MB,
        heapTotal: !flat.heapTotal ? 0 : (flat.heapTotal[i] + noise()) * MB,
        heapUsed: !flat.heapUsed ? 0 : (flat.heapUsed[i] + noise()) * MB,
        external: !flat.external ? 0 : (flat.external[i] + noise()) * MB
      },
      handles: !flat.handles ? 0 : (flat.handles[i] + noise()),
      loopUtilization: !flat.loopUtilization ? NaN : flat.loopUtilization[i] + noise()
    })
  }

  return output
}

module.exports = generateProcessStat
