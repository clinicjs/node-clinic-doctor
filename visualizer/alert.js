'use strict'

const d3 = require('./d3.js')
const icons = require('./icons.js')
const categories = require('./categories.js')
const EventEmitter = require('events')

function getTextNodeBoundingRect (textNode) {
  const range = document.createRange()
  range.selectNode(textNode)
  return range.getBoundingClientRect()
}

class Issue {
  constructor (id, detected, title) {
    this.graphId = `graph-${id}`
    this.detected = detected
    this.title = title
  }
}

class Alert extends EventEmitter {
  constructor () {
    super()

    this.analysis = null
    this.fullTitleWidth = null

    this.container = d3.select('#alert')
    this.container.classed('open', true)

    this.summary = this.container.append('div')
      .classed('summary', true)

    this.alert = this.summary.append('svg')
      .classed('alert', true)
      .call(icons.insertIcon('warning'))

    this.title = this.summary.append('div')
      .classed('title', true)

    this.titleTextNode = document.createTextNode('')
    this.title.node().appendChild(this.titleTextNode)

    this.details = this.container.append('ul')
      .classed('details', true)
  }

  _setTitleText (title) {
    this.titleTextNode.textContent = `Detected ${title}`
  }

  setData (data) {
    this.analysis = data.analysis

    // Set issue marker
    const content = categories.getContent(this.analysis.issueCategory)
    this.container.classed('has-issue', content.issue)

    // Set items
    const issues = this.analysis.issues
    const memory = issues.memory.external !== 'none' ||
                   issues.memory.heapTotal !== 'none' ||
                   issues.memory.heapUsed !== 'none' ||
                   issues.memory.rss !== 'none'

    const issuesAsData = [
      new Issue('cpu', issues.cpu !== 'none', 'CPU Usage'),
      new Issue('memory', memory, 'Memory Usage'),
      new Issue('delay', issues.delay !== 'none', 'Event Loop Delay'),
      new Issue('handles', issues.handles !== 'none', 'Active Handles'),
      new Issue('loopUtilization', issues.loopUtilization !== 'none', 'Event Loop Utilization')
    ].filter((issue) => issue.detected)

    this.details
      .selectAll('li')
      .data(issuesAsData)
      .enter()
      .append('li')
      .on('click', (d) => this.emit('click', d.graphId))
      .on('mouseover', (d) => this.emit('hover-in', d.graphId))
      .on('mouseout', (d) => this.emit('hover-out', d.graphId))
      .append('span')
      .text((d) => d.title)

    // Set title text now, such that the width is calculated correctly
    this._setTitleText(content.title)
    this.fullTitleWidth = getTextNodeBoundingRect(this.titleTextNode).width
  }

  draw () {
    const content = categories.getContent(this.analysis.issueCategory)

    // If there is not enough space, shorten the title text
    const titleNode = this.title.node()
    if (parseInt(window.getComputedStyle(titleNode).width) < this.fullTitleWidth) {
      this._setTitleText(content.issue ? 'issue' : 'no issue')
    } else {
      this._setTitleText(content.title)
    }
  }
}

module.exports = new Alert()
