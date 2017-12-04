'use strict'

const d3 = require('./d3.js')
const icons = require('./icons.js')
const categories = require('./categories.js')
const EventEmitter = require('events')

class RecomendationWrapper {
  constructor(categoryContent) {
    this.content = categoryContent
    this.category = this.content.category
    this.title = this.content.title

    this.selected = false
    this.detected = false
  }

  getSummary () { return this.content.getSummary() }
  hasSummary () { return this.content.hasSummary() }
  getReadMore () { return this.content.getReadMore() }
  hasReadMore () { return this.content.hasReadMore() }
}

class Recomendation extends EventEmitter {
  constructor () {
    super()

    this.readMoreOpened = false
    this.opened = false
    this.selectedCategory = 'unknown'

    // wrap content with selected and detected properties
    this.recommendations = new Map()
    this.recommendationsAsArray = []
    for (const categoryContent of categories.asArray()) {
      const wrapper = new RecomendationWrapper(categoryContent)
      this.recommendations.set(wrapper.category, wrapper)
      this.recommendationsAsArray.push(wrapper)
    }

    // create HTML structure
    this.space = d3.select('#recommendation-space')

    this.container = d3.select('#recommendation')
      .classed('open', this.opened)

    this.content = this.container.append('div')
      .classed('content', true)
    this.menu = this.content.append('div')
      .classed('menu', true)
    this.summary = this.content.append('div')
      .classed('summary', true)
    this.readMoreButton = this.content.append('div')
      .classed('read-more-button', true)
      .on('click', () => this.emit(this.readMoreOpened ? 'less' : 'more'))
    this.readMore = this.content.append('div')
      .classed('read-more', true)

    this.pages = this.menu.append('ul')
    this.pages
      .selectAll('li')
      .data(this.recommendationsAsArray, (d) => d.category)
      .enter()
        .append('li')
        .attr('data-content', (d) => d.title)
        .on('click', (d) => this.emit('change-page', d.category))

    this.menu.append('svg')
      .classed('close', true)
      .on('click', () => this.emit('close'))
      .call(icons.insertIcon('close'))

    this.bar = this.container.append('div')
      .classed('bar', true)
      .on('click', () => this.emit(this.opened ? 'close' : 'open'))
    this.bar.append('div')
      .classed('text', true)
    const arrow = this.bar.append('div')
      .classed('arrow', true)
    arrow.append('svg')
      .classed('arrow-up', true)
      .call(icons.insertIcon('arrow-up'))
    arrow.append('svg')
      .classed('arrow-down', true)
      .call(icons.insertIcon('arrow-down'))
  }

  setData (data) {
    const category = data.analysis.issueCategory
    this.recommendations.get(category).detected = true
    this.setPage(category)
  }

  setPage (newCategory) {
    const oldCategory = this.selectedCategory
    this.selectedCategory = newCategory
    this.recommendations.get(oldCategory).selected = false
    this.recommendations.get(newCategory).selected = true
  }

  draw () {
    this.pages
      .selectAll('li')
      .data(this.recommendationsAsArray, (d) => d.category)
      .classed('detected', (d) => d.detected)
      .classed('selected', (d) => d.selected)

    const recommendation = this.recommendations.get(this.selectedCategory)

    this.summary.html(null)
    if (recommendation.hasSummary()) {
      this.summary.node().appendChild(recommendation.getSummary())
    }

    this.readMore.html(null)
    this.container.classed('has-read-more', recommendation.hasReadMore())
    if (recommendation.hasReadMore()) {
      this.readMore.node().appendChild(recommendation.getReadMore())
    }

    this.container.classed('open', this.opened)
    this.container.classed('read-more-open', this.readMoreOpened)

    // set space height such that the fixed element don't have to hide
    // something in the background.
    this.space.style('height', this.content.node().offsetHeight + 'px')
  }

  open () {
    this.opened = true
  }

  close () {
    this.opened = false
  }

  openReadMore () {
    this.readMoreOpened = true
  }

  closeReadMore () {
    this.readMoreOpened = false
  }
}

module.exports = new Recomendation()
