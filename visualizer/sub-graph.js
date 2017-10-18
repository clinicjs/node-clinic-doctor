'use strict'

const d3 = require('d3')
const EventEmitter = require('events')
const HoverBox = require('./hover-box')

const margin = {top: 20, right: 20, bottom: 30, left: 50}
const headerHeight = 18

// https://bl.ocks.org/d3noob/402dd382a51a4f6eea487f9a35566de0
class SubGraph extends EventEmitter {
  constructor (container, setup) {
    super()

    this.setup = setup

    // setup graph container
    this.container = container.append('div')
      .classed('graph', true)
      .classed(setup.className, true)

    // add headline
    this.header = this.container.append('div')
      .classed('header', true)

    this.title = this.header.append('div')
      .classed('title', true)

    this.title.append('span')
      .classed('name', true)
      .text(this.setup.name)

    this.title.append('span')
      .classed('unit', true)
      .text(this.setup.unit)

    this.alert = this.title.append('div')
      .classed('alert', true)

    // add legned
    this.legendItems = []
    if (setup.showLegend) {
      const legend = this.header.append('div')
        .classed('legend', true)

      for (let i = 0; i < this.setup.numLines; i++) {
        const legendItem = legend.append('div')
          .classed('legend-item', true)

        legendItem.append('svg')
          .attr('width', 30)
          .attr('height', 18)
          .append('line')
            .attr('stroke-dasharray', this.setup.lineStyle[i])
            .attr('x1', 0)
            .attr('x2', 30)
            .attr('y1', 9)
            .attr('y2', 9)

        legendItem.append('span')
          .classed('long-legend', true)
          .text(this.setup.longLegend[i])
        legendItem.append('span')
          .classed('short-legend', true)
          .text(this.setup.shortLegend[i])

        this.legendItems.push(legendItem)
      }
    }

    // add hover box
    this.hover = new HoverBox(this.container, this.setup)

    // setup graph area
    this.svg = this.container.append('svg')
      .classed('chart', true)
    this.graph = this.svg.append('g')
      .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')')

    // setup hover events
    this.hoverArea = this.container.append('div')
      .classed('hover-area', true)
      .style('left', margin.left + 'px')
      .style('top', (margin.top + headerHeight) + 'px')
      .on('mousemove', () => {
        const positionX = d3.mouse(this.graph.node())[0]
        if (positionX >= 0) {
          const unitX = this.xScale.invert(positionX)
          this.emit('hover-update', unitX)
        }
      })
      .on('mouseleave', () => this.emit('hover-hide'))
      .on('mouseenter', () => this.emit('hover-show'))

    // add background node
    this.background = this.graph.append('rect')
      .classed('background', true)
      .attr('x', 0)
      .attr('y', 0)

    // define scales
    this.xScale = d3.scaleTime()
    this.yScale = d3.scaleLinear()

    // define axis
    this.xAxis = d3.axisBottom(this.xScale).ticks(10)
    this.xAxisElement = this.graph.append('g')

    this.yAxis = d3.axisLeft(this.yScale).ticks(4)
    this.yAxisElement = this.graph.append('g')

    // Define drawer functions and line elements
    this.lineDrawers = []
    this.lineElements = []
    for (let i = 0; i < this.setup.numLines; i++) {
      const lineDrawer = d3.line()
          .x((d) => this.xScale(d.x))
          .y((d) => this.yScale(d.y[i]))
      this.lineDrawers.push(lineDrawer)

      const lineElement = this.graph.append('path')
          .attr('class', 'line')
          .attr('stroke-dasharray', this.setup.lineStyle[i])

      this.lineElements.push(lineElement)
    }
  }

  getGraphSize () {
    const outerSize = this.svg.node().getBoundingClientRect()
    return {
      width: outerSize.width - margin.left - margin.right,
      height: outerSize.height - margin.top - margin.bottom
    }
  }

  setData (data, issues) {
    // Update domain of scales
    this.xScale.domain(d3.extent(data, function (d) { return d.x }))

    // For the y-axis, ymin and ymax is supported, however they will
    // never truncate the data.
    let ymin = d3.min(data, function (d) { return Math.min(...d.y) })
    if (this.setup.hasOwnProperty('ymin')) {
      ymin = Math.min(ymin, this.setup.ymin)
    }
    let ymax = d3.max(data, function (d) { return Math.max(...d.y) })
    if (this.setup.hasOwnProperty('ymax')) {
      ymax = Math.max(ymax, this.setup.ymax)
    }
    this.yScale.domain([ymin, ymax])

    // Attach data
    for (let i = 0; i < this.setup.numLines; i++) {
      this.lineElements[i].data([data])

      // Modify css classes for lines, title icon and legends.
      if (issues[i]) {
        this.lineElements[i].classed('bad', issues[i])
        this.setup.showLegend && this.legendItems[i].classed('bad', issues[i])

        this.alert.classed('alert-visible', true)
      }
    }
  }

  draw () {
    const { width, height } = this.getGraphSize()

    // set hover area size
    this.hoverArea
      .style('width', width + 'px')
      .style('height', height + 'px')

    // set background size
    this.background
      .attr('width', width)
      .attr('height', height)

    // set the ranges
    this.xScale.range([0, width])
    this.yScale.range([height, 0])

    // update axis
    this.xAxisElement
        .attr('transform', 'translate(0,' + height + ')')
        .call(this.xAxis)
    this.yAxisElement
        .call(this.yAxis)

    // update lines
    for (let i = 0; i < this.setup.numLines; i++) {
      this.lineElements[i].attr('d', this.lineDrawers[i])
    }

    // since the xScale was changed, update the hover box
    if (this.hover.showen) {
      this.hoverUpdate(this.hover.point)
    }
  }

  hoverShow () {
    this.hover.show()
  }

  hoverHide () {
    this.hover.hide()
  }

  hoverUpdate (point) {
    if (!this.hover.showen) return

    // get position of curve there is at the top
    const xInGraphPositon = this.xScale(point.x)
    const yInGraphPositon = this.yScale(Math.max(...point.y))

    // calculate graph position relative to `this.container`.
    // The `this.container` has `position:relative`, which is why that is
    // the origin.
    const xPosition = xInGraphPositon + margin.left
    const yPosition = yInGraphPositon + margin.top + headerHeight

    this.hover.setPoint(point)
    this.hover.setPosition(xPosition, yPosition)
    this.hover.setDate(point.x)
    this.hover.setData(point.y.map((v) => this.yScale.tickFormat()(v)))
  }
}

module.exports = SubGraph
