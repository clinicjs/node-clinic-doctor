
const d3 = require('./d3.js')
const icons = require('./icons')
const EventEmitter = require('events')

class Menu extends EventEmitter {
  constructor () {
    super()

    this.container = d3.select('#menu')

    this.setupThemeToggle()
    this.setupGridToggle()
  }

  setupGridToggle () {
    const gridButton = this.container.append('div')
      .classed('toggle', true)
      .attr('id', 'toggle-grid')
      .on('click', () => this.emit('toggle-grid'))

    gridButton.append('svg')
      .classed('grid-2x2', true)
      .call(icons.insertIcon('grid-2x2'))
    gridButton.append('svg')
      .classed('grid-1x4', true)
      .call(icons.insertIcon('grid-1x4'))
  }

  setupThemeToggle () {
    const themeButton = this.container.append('div')
      .classed('toggle', true)
      .attr('id', 'light-theme')
      .on('click', () => this.emit('toggle-theme'))

    themeButton.append('svg')
      .classed('theme-dark', true)
      .call(icons.insertIcon('lightmode'))
    themeButton.append('svg')
      .classed('theme-light', true)
      .call(icons.insertIcon('darkmode'))
  }
}

module.exports = new Menu()
