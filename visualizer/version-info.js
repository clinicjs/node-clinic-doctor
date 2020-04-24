const d3 = require('./d3.js')
const info = require('./info.json')

class VersionInfo {
  constructor () {
    this.container = d3.select('#version-info')
    this.container.append('span')
      .classed('version-holder', true)
      .attr('id', 'node-version')

    this.container.append('span')
      .classed('version-holder', true)
      .attr('id', 'doctor-version')

    this.nodeVersion = info.nodeVersions.node
    this.doctorVersion = info.toolVersion
  }

  draw () {
    d3.select('#node-version').append('span')
      .text('Node version: ' + this.nodeVersion)
    d3.select('#doctor-version').append('span')
      .text('Doctor version: ' + this.doctorVersion)
  }
}
module.exports = new VersionInfo()
