const rimraf = require('rimraf')
const path = require('path')
const ClinicDoctor = require('../index.js')

const doctor = new ClinicDoctor()
doctor.collect([
  process.execPath,
  path.join(__dirname, 'cmd-no-cluster.cluster.js')
], (err, result) => {
  rimraf.sync(result)
  if (err) throw err
})
