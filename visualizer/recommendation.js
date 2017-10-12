
const d3 = require('d3')
const EventEmitter = require('events')

class Recomendation extends EventEmitter {
  constructor () {
    super()

    this.opened = false
    this.container = d3.select('#recommendation')
      .classed('open', this.opened)

    this.bar = this.container.append('div')
      .classed('bar', true)
    this.bar.append('div')
      .classed('text', true)
    this.bar.append('div')
      .classed('arrow', true)

    this.bar.on('click', () => this.emit(this.opened ? 'close' : 'open'))

    this.content = this.container.append('div')
      .classed('content', true)
      .style('height', '200px')
    this.content.append('div')
      .classed('close', true)
      .on('click', () => this.emit('close'))
  }

  draw (data) {

  }

  close () {
    this.opened = false
    this.container.classed('open', false)
  }

  open () {
    this.opened = true
    this.container.classed('open', true)
  }
}

module.exports = new Recomendation()
