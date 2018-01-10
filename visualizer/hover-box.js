'use strict'

const d3 = require('./d3.js')

class HoverBox {
  constructor (container, setup) {
    this.container = container
    this.setup = setup
    this.showen = false
    this.point = null

    this.size = {
      titleHeight: 36,
      lineWidth: 1,
      marginTop: 3,
      marginBottom: 3,
      legendHeight: 28,
      pointHeight: 10
    }

    this.legendTopOffset = this.size.titleHeight + this.size.lineWidth +
                            this.size.marginTop

    this.hoverBoxHeight = this.legendTopOffset + this.size.marginBottom +
                           this.setup.numLines * this.size.legendHeight

    this.height = this.hoverBoxHeight + this.size.pointHeight
    this.width = 136

    // create main svg element
    this.svg = this.container.append('svg')
      .classed('hover', true)
      .attr('width', this.width)
      .attr('height', this.height)

    // create background
    this.background = this.svg.append('rect')
      .classed('background', true)
      .attr('rx', 5)
      .attr('width', this.width)
      .attr('height', this.hoverBoxHeight)
    this.path = this.svg.append('path')
      .classed('pointer', true)
    this.line = this.svg.append('rect')
      .classed('line', true)
      .attr('width', this.width)
      .attr('height', this.size.lineWidth)

    // create title text
    this.title = this.svg.append('text')
      .classed('title', true)
      .attr('x', this.width / 2)
      .attr('dy', '1em')

    // create content text
    this.values = []
    for (let i = 0; i < this.setup.numLines; i++) {
      const legendText = this.svg.append('text')
        .classed('legend', true)
        .attr('dy', '1em')
        .attr('x', 12)
        .text(this.setup.shortLegend[i])

      const valueText = this.svg.append('text')
        .classed('value', true)
        .attr('dy', '1em')
        .attr('x', 72)
      this.values.push({ legendText, valueText })
    }
  }

  setPoint (point) {
    this.point = point
  }

  setPosition (x, y) {
    let offset = 0
    // flip downward if above half way
    if (y - this.height < 0) {
      offset = 10
    }
    this.svg
      .style('top', Math.round(offset ? y : y - this.height) + 'px')
      .style('left', Math.round(x - this.width / 2) + 'px')
    this.path
      .attr('d', `M${this.width / 2 - this.size.pointHeight} ${offset || this.hoverBoxHeight} ` +
                 `L${this.width / 2} ${offset ? 0 : this.height} ` +
                 `L${this.width / 2 + this.size.pointHeight} ${offset || this.hoverBoxHeight} Z`)
    this.background.attr('y', offset)
    this.title.attr('y', 5 + offset)
    this.line.attr('y', this.size.titleHeight + offset)
    for (let i = 0; i < this.setup.numLines; i++) {
      this.values[i].valueText.attr('y', this.legendTopOffset + i * this.size.legendHeight + offset)
      this.values[i].legendText.attr('y', this.legendTopOffset + i * this.size.legendHeight + offset)
    }
  }

  setDate (date) {
    this.title.text(d3.timeFormat('%I:%M:%S.%L %p')(date))
  }

  setData (data) {
    for (let i = 0; i < this.setup.numLines; i++) {
      this.values[i].valueText.text(data[i] + ' ' + this.setup.unit)
    }
  }

  show () {
    this.showen = true
    this.svg.classed('visible', true)
  }

  hide () {
    this.showen = false
    this.svg.classed('visible', false)
  }
}

module.exports = HoverBox
