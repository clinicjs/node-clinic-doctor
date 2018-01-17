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

    const legendTopOffset = this.size.titleHeight + this.size.lineWidth +
                            this.size.marginTop

    const hoverBoxHeight = legendTopOffset + this.size.marginBottom +
                           this.setup.numLines * this.size.legendHeight

    this.height = hoverBoxHeight + this.size.pointHeight
    this.width = 136

    // create main svg element
    this.svg = this.container.append('svg')
      .classed('hover', true)
      .attr('width', this.width)
      .attr('height', this.height)

    this.dataBox = this.svg.append('g')
      .classed('data-box', true)

    // create background
    this.dataBox.append('rect')
      .classed('background', true)
      .attr('rx', 5)
      .attr('width', this.width)
      .attr('height', hoverBoxHeight)
    this.svg.append('path')
      .classed('pointer', true)
      .attr('d', `M${this.width / 2 - this.size.pointHeight} ${hoverBoxHeight} ` +
                 `L${this.width / 2} ${this.height} ` +
                 `L${this.width / 2 + this.size.pointHeight} ${hoverBoxHeight} Z`)
    this.svg.append('path')
      .classed('pointer', true)
      .classed('below-curve', true)
      .attr('d', `M${this.width / 2 - this.size.pointHeight} ${this.size.pointHeight} ` +
                 `L${this.width / 2} 0 ` +
                 `L${this.width / 2 + this.size.pointHeight} ${this.size.pointHeight} Z`)
    this.dataBox.append('rect')
      .classed('line', true)
      .attr('width', this.width)
      .attr('height', this.size.lineWidth)
      .attr('y', this.size.titleHeight)

    // create title text
    this.title = this.dataBox.append('text')
      .classed('title', true)
      .attr('y', 5)
      .attr('x', this.width / 2)
      .attr('dy', '1em')

    // create content text
    this.values = []
    for (let i = 0; i < this.setup.numLines; i++) {
      this.dataBox.append('text')
        .classed('legend', true)
        .attr('y', legendTopOffset + i * this.size.legendHeight)
        .attr('dy', '1em')
        .attr('x', 12)
        .text(this.setup.shortLegend[i])

      const valueText = this.dataBox.append('text')
        .classed('value', true)
        .attr('y', legendTopOffset + i * this.size.legendHeight)
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
      this.dataBox.attr('transform', `translate(0, ${this.size.pointHeight})`)
    } else {
      this.dataBox.attr('transform', 'translate(0, 0)')
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
