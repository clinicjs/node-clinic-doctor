'use strict'

const d3 = require('./d3.js')
const EventEmitter = require('events')
const SubGraph = require('./sub-graph')

class Graph extends EventEmitter {
  constructor ({ collectLoopUtilization = true }) {
    super()

    this.data = null
    this.container = d3.select('#graph')

    this.collectLoopUtilization = collectLoopUtilization

    this.cpu = new SubGraph(this.container, {
      className: 'cpu',
      name: 'CPU Usage',
      unit: '%',
      shortLegend: ['Usage'],
      showLegend: false,
      lineStyle: [''],
      numLines: 1,
      ymin: 0,
      ymax: 100
    })

    this.memory = new SubGraph(this.container, {
      className: 'memory',
      name: 'Memory Usage',
      unit: 'MB',
      longLegend: ['RSS', 'Total Heap Allocated', 'Heap Used'],
      shortLegend: ['RSS', 'THA', 'HU'],
      tooltipLegend: [
        'Total memory allocated for the entire process',
        'Amount of V8 memory assigned to store data',
        'Heap memory used out of the Total Heap'
      ],
      showLegend: true,
      lineStyle: ['1, 2', '5, 3', ''],
      numLines: 3,
      ymin: 0
    })

    this.delay = new SubGraph(this.container, {
      className: 'delay',
      name: 'Event Loop Delay',
      unit: 'ms',
      shortLegend: ['Delay'],
      showLegend: false,
      lineStyle: [''],
      numLines: 1,
      ymin: 0,
      interpolation: 'curveStepBefore'
    })

    this.handles = new SubGraph(this.container, {
      className: 'handles',
      name: 'Active Handles',
      unit: '',
      shortLegend: ['Handles'],
      showLegend: false,
      lineStyle: [''],
      numLines: 1,
      ymin: 0,
      interpolation: 'curveStepBefore'
    })

    if (this.collectLoopUtilization) {
      this.loopUtilization = new SubGraph(this.container, {
        className: 'loopUtilization',
        name: 'Event Loop Utilization',
        unit: '%',
        shortLegend: ['ELU'],
        showLegend: false,
        lineStyle: [''],
        numLines: 1,
        ymin: 0,
        ymax: 100
      })
    }

    const subgraphs = [this.cpu, this.memory, this.delay, this.handles]
    if (this.collectLoopUtilization) {
      subgraphs.push(this.loopUtilization)
    }
    // relay events
    for (const subgraph of subgraphs) {
      subgraph.on('hover-update', (unitX) => this.emit('hover-update', unitX))
      subgraph.on('hover-show', () => this.emit('hover-show'))
      subgraph.on('hover-hide', () => this.emit('hover-hide'))
      subgraph.on('alert-click', () => this.emit('alert-click'))
    }
  }

  hoverUpdate (unitX) {
    if (this.data === null) {
      throw new Error('data not loaded')
    }

    const points = this.data.getPoints(unitX)
    this.cpu.hoverUpdate(points.cpu)
    this.memory.hoverUpdate(points.memory)
    this.delay.hoverUpdate(points.delay)
    this.handles.hoverUpdate(points.handles)

    if (this.collectLoopUtilization) {
      this.loopUtilization.hoverUpdate(points.loopUtilization)
    }
  }

  hoverShow () {
    if (this.data === null) {
      throw new Error('data not loaded')
    }

    this.cpu.hoverShow()
    this.memory.hoverShow()
    this.delay.hoverShow()
    this.handles.hoverShow()

    if (this.collectLoopUtilization) {
      this.loopUtilization.hoverShow()
    }
  }

  hoverHide () {
    if (this.data === null) {
      throw new Error('data not loaded')
    }

    this.cpu.hoverHide()
    this.memory.hoverHide()
    this.delay.hoverHide()
    this.handles.hoverHide()
    if (this.collectLoopUtilization) {
      this.loopUtilization.hoverHide()
    }
  }

  setData (data) {
    this.data = data

    this.cpu.setData(data.cpu, data.analysis.interval, [
      data.analysis.issues.cpu
    ])
    this.delay.setData(data.delay, data.analysis.interval, [
      data.analysis.issues.delay
    ])
    this.handles.setData(data.handles, data.analysis.interval, [
      data.analysis.issues.handles
    ])
    this.memory.setData(data.memory, data.analysis.interval, [
      data.analysis.issues.memory.rss,
      data.analysis.issues.memory.heapTotal,
      data.analysis.issues.memory.heapUsed
    ])

    if (this.collectLoopUtilization) {
      this.loopUtilization.setData(data.loopUtilization, data.analysis.interval, [
        data.analysis.issues.loopUtilization
      ])
    }
  }

  draw () {
    this.cpu.draw()
    this.memory.draw()
    this.delay.draw()
    this.handles.draw()

    if (this.collectLoopUtilization) {
      this.loopUtilization.draw()
    }
  }
}

module.exports = Graph
