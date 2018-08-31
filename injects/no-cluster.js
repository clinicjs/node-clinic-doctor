const cluster = require('cluster')

cluster.on('fork', () => {
  throw new Error('clinic doctor does not support clustering.')
})
