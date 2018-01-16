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
    this.title = this.content.title

    this.selected = false
    this.detected = false
  }

  get order () {
    // always make the detected issue appear first
    return this.detected ? 0 : this.content.order
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
    this.summaryTitle = this.content.append('div')
      .classed('summary-title', true)
    this.summary = this.content.append('div')
      .classed('summary', true)
    this.readMoreButton = this.content.append('div')
      .classed('read-more-button', true)
      .on('click', () => this.emit(this.readMoreOpened ? 'close' : 'open', 'readMore'))
    this.readMore = this.content.append('div')
      .classed('read-more', true)
    this.readMoreColumns = this.readMore.append('div')
      .classed('columns', true)

    this.pages = this.menu.append('ul')
    const pagesLiEnter = this.pages
      .selectAll('li')
      .data(this.recommendationsAsArray, (d) => d.category)
      .enter()
        .append('li')
          .classed('recommendation-tab', true)
          .on('click', (d) => this.emit('change-page', d.category))
    pagesLiEnter.append('span')
      .classed('menu-text', true)
      .attr('data-content', (d) => d.menu)
    pagesLiEnter.append('svg')
      .classed('warning-icon', true)
      .call(icons.insertIcon('warning'))

    // Add button to show-hide tabs described undetected issues
    this.pages.append('li')
      .classed('show-hide', true)
      .append('a')
        .classed('show-hide-button', true)
        .classed('menu-text', true)
        .on('click', () => this.emit(this.undetectedOpened ? 'close' : 'open', 'undetectedTabs'))

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
    this.defaultCategory = data.analysis.issueCategory
    this.recommendations.get(this.defaultCategory).detected = true

    // reorder pages, such that the detected page selector comes first
    this.pages
      .selectAll('li.recommendation-tab')
      .sort((a, b) => a.order - b.order)

    // set the default page
    this.setPage(this.defaultCategory)
  }

  setPage (newCategory) {
    const oldCategory = this.selectedCategory
    this.selectedCategory = newCategory
    this.recommendations.get(oldCategory).selected = false
    this.recommendations.get(newCategory).selected = true
  }

  draw () {
    this.pages
      .selectAll('li.recommendation-tab')
      .data(this.recommendationsAsArray, (d) => d.category)
      .classed('detected', (d) => d.detected)
      .classed('selected', (d) => d.selected)
      .classed('has-read-more', (d) => d.hasReadMore())

    const recommendation = this.recommendations.get(this.selectedCategory)

    // update state classes
    this.container
      .classed('open', this.opened)
      .classed('read-more-open', this.readMoreOpened)
      .classed('undetected-opened', this.undetectedOpened)
      .classed('detected', recommendation.detected)

    // set content
    this.summaryTitle
      .text(recommendation.title)

    this.summary.html(null)
    if (recommendation.hasSummary()) {
      this.summary.node().appendChild(recommendation.getSummary())
    }

    this.readMoreColumns.html(null)
    this.container.classed('has-read-more', recommendation.hasReadMore())
    if (recommendation.hasReadMore()) {
      this.readMoreColumns.node().appendChild(recommendation.getReadMore())
    }

    // set space height such that the fixed element don't have to hide
    // something in the background.
    this.space.style('height', this.details.node().offsetHeight + 'px')
  }

  openClose (action, target = 'panel') {
    const openCloseTargets = {
      panel: (isOpening) => {
        document.documentElement.classList[isOpening ? 'add' : 'remove']('recommendation-open')
        this.opened = isOpening
      },
      readMore: (isOpening) => {
        this.readMoreOpened = isOpening
      },
      undetectedTabs: (isOpening) => {
        this.undetectedOpened = isOpening

        // If user closes undetected tabs while one is selected, switch to default tab
        if (!isOpening && !this.recommendations.get(this.selectedCategory).detected) {
          this.emit('change-page', this.defaultCategory)
        }
      }
    }
    openCloseTargets[ target ](action === 'open')
    this.draw()
  }
}

module.exports = new Recomendation()
