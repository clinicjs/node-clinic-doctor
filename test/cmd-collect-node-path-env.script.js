const CollectAndRead = require('./collect-and-read.js')
const cmd = new CollectAndRead({}, '-e', 'require("cmd-collect-node-path-env.child")')
cmd.on('ready', () => {
  setTimeout(() => {
    // hopefully waited long enough for auto cleanup
    cmd.cleanup()
  }, 100)
})
