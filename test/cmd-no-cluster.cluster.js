const cluster = require('cluster')
if (cluster.isMaster) {
  cluster.fork()
}
