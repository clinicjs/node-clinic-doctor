'use strict'

const d3 = require('./d3.js')

class HoverBox {
  constructor (container, setup) {
    this.container = container
    this.setup = setup
    this.showen = false
    this.point = null

    const size = {
      titleHeight: 36,
      lineWidth: 1,
      marginTop: 3,
      marginBottom: 3,
      legendHeight: 28,
      pointHeight: 10
    }

    const legendTopOffset = size.titleHeight + size.lineWidth +
                            size.marginTop

    const hoverBoxHeight = legendTopOffset + size.marginBottom +
                           this.setup.numLines * size.legendHeight

    this.height = hoverBoxHeight + size.pointHeight
    this.width = 136

    // create main svg element
    this.svg = this.container.append('svg')
      .classed('hover', true)
      .attr('width', this.width)
      .attr('height', this.height)

    const dataBox = this.svg.append('g')
      .classed('data-box', true)

    // create background
    dataBox.append('rect')
      .classed('background', true)
      .attr('rx', 5)
      .attr('width', this.width)
      .attr('height', hoverBoxHeight)
    this.svg.append('path')
      .classed('pointer', true)
      .attr('d', `M${this.width / 2 - size.pointHeight} ${hoverBoxHeight} ` +
                 `L${this.width / 2} ${this.height} ` +
                 `L${this.width / 2 + size.pointHeight} ${hoverBoxHeight} Z`)
    this.svg.append('path')
      .classed('pointer', true)
      .classed('below-curve', true)
      .attr('d', `M${this.width / 2 - size.pointHeight} 10 ` +
                 `L${this.width / 2} 0 ` +
                 `L${this.width / 2 + size.pointHeight} 10 Z`)
    dataBox.append('rect')
      .classed('line', true)
      .attr('width', this.width)
      .attr('height', size.lineWidth)
      .attr('y', size.titleHeight)

    // create title text
    this.title = dataBox.append('text')
      .classed('title', true)
      .attr('y', 5)
      .attr('x', this.width / 2)
      .attr('dy', '1em')

    // create content text
    this.values = []
    for (let i = 0; i < this.setup.numLines; i++) {
      dataBox.append('text')
        .classed('legend', true)
        .attr('y', legendTopOffset + i * size.legendHeight)
        .attr('dy', '1em')
        .attr('x', 12)
        .text(this.setup.shortLegend[i])

      const valueText = dataBox.append('text')
        .classed('value', true)
        .attr('y', legendTopOffset + i * size.legendHeight)
        .attr('dy', '1em')
        .attr('x', 72)
      this.values.push(valueText)
    }
  }

  setPoint (point) {
    this.point = point
  }

  setPosition (x, y) {
    let belowCurve = false
    // flip down if above half way
    if (y - this.height < 0) {
      belowCurve = true
    }
    this.svg
      .style('top', Math.round(belowCurve ? y : y - this.height) + 'px')
      .style('left', Math.round(x - this.width / 2) + 'px')
      .classed('above-curve', !belowCurve)
      .classed('below-curve', belowCurve)
  }

  setDate (date) {
    this.title.text(d3.timeFormat('%I:%M:%S.%L %p')(date))
  }

  setData (data) {
    for (let i = 0; i < this.setup.numLines; i++) {
      this.values[i].text(data[i] + ' ' + this.setup.unit)
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
