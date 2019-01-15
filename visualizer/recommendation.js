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

  getSummaryTitle () {
    if (this.detected) return `Doctor has found ${this.title}:`

    return `Doctor has not found evidence of ${this.title}.` +
           ' When such issues are present:'
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
    this.panelOpened = false
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
      .classed('open', this.panelOpened)

    this.details = this.container.append('div')
      .classed('details', true)
    this.menu = this.details.append('div')
      .classed('menu', true)
    this.content = this.details.append('div')
      .classed('content', true)
      .on('scroll.scroller', () => this._drawSelectedArticleMenu())
    this.summaryTitle = this.content.append('div')
      .classed('summary-title', true)
    this.summary = this.content.append('div')
      .classed('summary', true)
    this.readMoreButton = this.content.append('div')
      .classed('read-more-button', true)
      .on('click', () => this.emit(this.readMoreOpened ? 'close-read-more' : 'open-read-more'))
    this.readMore = this.content.append('div')
      .classed('read-more', true)

    this.articleMenu = this.readMore.append('nav')
      .classed('article-menu', true)

    this.readMoreArticle = this.readMore.append('article')
      .classed('article', true)

    this.pages = this.menu.append('ul')
    const pagesLiEnter = this.pages
      .selectAll('li')
      .data(this.recommendationsAsArray, (d) => d.category)
      .enter()
      .append('li')
      .classed('recommendation-tab', true)
      .on('click', (d) => this.emit('menu-click', d.category))
    pagesLiEnter.append('span')
      .classed('menu-text', true)
      .attr('data-content', (d) => d.menu)
    pagesLiEnter.append('svg')
      .classed('warning-icon', true)
      .call(icons.insertIcon('warning'))

    // Add button to show-hide tabs described undetected issues
    const button = this.pages.append('li')
      .classed('show-hide', true)
      .on('click', () => this.emit(this.undetectedOpened ? 'close-undetected' : 'open-undetected'))
      .append('span')
      .classed('menu-text', true)

    const buttonText = button
      .append('span')
      .classed('menu-text-inner', true)
    buttonText
      .append('svg')
      .call(icons.insertIcon('arrow-left'))
    buttonText
      .append('span')
      .text('Browse undetected issues')
    button
      .append('span')
      .text('Hide')
      .classed('menu-text-inner menu-text-inner-hide', true)
      .append('svg')
      .call(icons.insertIcon('arrow-right'))

    const readMoreText = this.readMoreButton.append('span')
      .classed('read-more-button-text', true)
      .text('Read more')
    readMoreText
      .append('svg')
      .call(icons.insertIcon('arrow-down'))

    const readLessText = this.readMoreButton.append('span')
      .classed('read-more-button-text read-more-button-text-less', true)
      .text('Read less')
    readLessText
      .append('svg')
      .call(icons.insertIcon('arrow-up'))

    this.menu.append('svg')
      .classed('close', true)
      .on('click', () => this.emit('close-panel'))
      .call(icons.insertIcon('close'))

    this.bar = this.container.append('div')
      .classed('bar', true)
      .on('click', () => this.emit(this.panelOpened ? 'close-panel' : 'open-panel'))
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
      .classed('open', this.panelOpened)
      .classed('read-more-open', this.readMoreOpened)
      .classed('undetected-opened', this.undetectedOpened)
      .classed('has-read-more', recommendation.hasReadMore())

    // set content
    this.summaryTitle.text(recommendation.getSummaryTitle())
    this.summary.html(null)
    if (recommendation.hasSummary()) {
      this.summary.node().appendChild(recommendation.getSummary())
    }

    this.readMoreArticle.html(null)
    this.articleMenu.html(null)
    if (recommendation.hasReadMore()) {
      this.readMoreArticle.node().appendChild(recommendation.getReadMore())

      this.articleMenu.append('h2')
        .text('Jump to section')

      this.articleMenu.append('ul')
        .selectAll('li')
        .data(this.readMoreArticle.selectAll('h2').nodes())
        .enter()
        .append('li')
        .text((headerElement) => headerElement.textContent)
        .on('click', function (headerElement) {
          headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })

      this._drawSelectedArticleMenu()
    }

    // set space height such that the fixed element don't have to hide
    // something in the background.
    this.space.style('height', this.details.node().offsetHeight + 'px')
  }

  _drawSelectedArticleMenu () {
    const contentScrollTop = this.content.node().scrollTop
    const contentClientHeight = this.content.node().clientHeight

    function isAboveScrollBottom (headerElement) {
      const elementBottom = headerElement.offsetTop + headerElement.clientHeight
      const relativeTopPosition = elementBottom - contentScrollTop
      return relativeTopPosition <= contentClientHeight
    }

    const selection = this.articleMenu.select('ul').selectAll('li')
    const mostRecentHeader = selection.data()
      .filter(isAboveScrollBottom)
      .pop()

    selection.classed('selected', function (headerElement) {
      return headerElement === mostRecentHeader
    })
  }

  openPanel () {
    this.panelOpened = true
  }
  closePanel () {
    this.panelOpened = false
  }

  openReadMore () {
    this.readMoreOpened = true
  }
  closeReadMore () {
    this.readMoreOpened = false
  }

  openUndetected () {
    this.undetectedOpened = true
  }
  closeUndetected () {
    this.undetectedOpened = false
  }
}

module.exports = new Recomendation()
