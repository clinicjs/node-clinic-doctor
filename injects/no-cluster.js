const cluster = require('cluster')

cluster.on('fork', () => {
  throw new Error('bubbleprof does not support clustering.')
})
