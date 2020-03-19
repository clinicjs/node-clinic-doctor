const rimraf = require('rimraf')
const path = require('path')
const ClinicDoctor = require('../../index.js')

const doctor = new ClinicDoctor()
doctor.on('warning') => {
	console.log('message HERE');
}

doctor.collect([
  process.execPath,
  path.join(__dirname, 'plain-with-sourcemap.js')
], (err, result) => {
  rimraf.sync(result)
  if (err) throw err
})

