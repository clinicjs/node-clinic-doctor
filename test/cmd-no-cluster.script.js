const rimraf = require('rimraf')
const ClinicDoctor = require('../index.js')

const doctor = new ClinicDoctor({})
doctor.collect([
  process.execPath,
  '-e', 'var c = require("cluster"); c.isMaster && c.fork()'
], (err, result) => {
  rimraf.sync(result)
  if (err) throw err
})
