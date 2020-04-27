const d3 = require('./d3.js')
const info = require('./data.json')

class VersionInfo {
  constructor () {
    this.container = d3.select('#version-info')
    this.container.append('span')
      .classed('version-holder', true)
      .attr('id', 'node-version')

    this.container.append('span')
      .classed('version-holder', true)
      .attr('id', 'doctor-version')

    this.container.append('span')
      .classed('version-holder', true)
      .attr('id', 'cmd-line-args')

    this.cmdLineArgs = ''
  }

  draw () {
    d3.select('#node-version').append('span')
      .text('Node version: ' + this.nodeVersion)
    d3.select('#doctor-version').append('span')
      .text('Doctor version: ' + this.doctorVersion)
    d3.select('#cmd-line-args').append('span')
      .text('Arguments :' + this.cmdLineArgs)
  }

  setData (data) {
    this.nodeVersion = data.system.nodeVersion.version
    this.doctorVersion = data.system.toolVersion.version
  }
}
module.exports = new VersionInfo()
