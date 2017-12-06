'use strict'

const d3 = require('./d3.js')
const icons = require('./icons.js')
const categories = require('./categories.js')
const EventEmitter = require('events')

class RecomendationWrapper {
  constructor (categoryContent) {
    this.content = categoryContent
    this.category = this.content.category
    this.menu = this.content.menu

    this.selected = false
    this.detected = false
  }

  get order() {
    // always make the detected issue appear first
    return this.detected ? 0 : this.content.order;
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

    this.details = this.container.append('div')
      .classed('details', true)
    this.menu = this.details.append('div')
      .classed('menu', true)
    this.content = this.details.append('div')
      .classed('content', true)
    this.summary = this.content.append('div')
      .classed('summary', true)
    this.readMoreButton = this.content.append('div')
      .classed('read-more-button', true)
      .on('click', () => this.emit(this.readMoreOpened ? 'less' : 'more'))
    this.readMore = this.content.append('div')
      .classed('read-more', true)

    this.pages = this.menu.append('ul')
    const pagesLiEnter = this.pages
      .selectAll('li')
      .data(this.recommendationsAsArray, (d) => d.category)
      .enter()
        .append('li')
          .on('click', (d) => this.emit('change-page', d.category))
    pagesLiEnter.append('span')
      .classed('menu-text', true)
      .attr('data-content', (d) => d.menu)
    pagesLiEnter.append('svg')
      .classed('warning-icon', true)
      .call(icons.insertIcon('warning'))

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

    // reorder pages, such that the detected page selector comes first
    this.pages
      .selectAll('li')
      .sort((a, b) => a.order - b.order)

    // set the default page
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
    this.space.style('height', this.details.node().offsetHeight + 'px')
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
