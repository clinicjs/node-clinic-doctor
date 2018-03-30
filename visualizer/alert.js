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
    this.opened = false
    this.fullTitleWidth = null

    this.container = d3.select('#alert')

    this.summary = this.container.append('div')
      .classed('summary', true)

    this.alert = this.summary.append('svg')
      .classed('alert', true)
      .call(icons.insertIcon('warning'))

    this.title = this.summary.append('div')
      .classed('title', true)

    this.titleTextNode = document.createTextNode('')
    this.title.node().appendChild(this.titleTextNode)

    this.toggle = this.summary.append('div')
      .classed('toggle', true)
      .on('click', () => this.emit(this.opened ? 'close' : 'open'))
    this.toggle.append('svg')
      .classed('arrow-down', true)
      .call(icons.insertIcon('arrow-down'))
    this.toggle.append('svg')
      .classed('arrow-up', true)
      .call(icons.insertIcon('arrow-up'))

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
    const memory = issues.memory.external || issues.memory.heapTotal ||
                   issues.memory.heapUsage || issues.memory.rss

    const issuesAsData = [
      new Issue('cpu', issues.cpu, 'CPU Usage'),
      new Issue('memory', memory, 'Memory Usage'),
      new Issue('delay', issues.delay, 'Event Loop Delay'),
      new Issue('handles', issues.handles, 'Active Handles')
    ].filter((issue) => issue.detected)

    this.details
      .selectAll('li')
      .data(issuesAsData)
      .enter()
      .append('li')
      .on('click', (d) => this.emit('click', d.graphId))
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

  open () {
    this.opened = true
    this.container.classed('open', true)
  }

  close () {
    this.opened = false
    this.container.classed('open', false)
  }
}

module.exports = new Alert()
