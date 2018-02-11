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

    this.articleHeadings = null
    this.articleSplits = []
    this.articleMenuItems = []

    this.selectedArticleSection = null
  }

  get order () {
    // always make the detected issue appear first
    return this.detected ? 0 : this.content.order
  }

  // should be done only when scrollingContainer's scrollTop === 0
  computeArticleSplits () {
    let startPos
    this.articleSplits = this.articleHeadings.map((articleHeading, i) => {
      const top = articleHeading.getBoundingClientRect().top
      if (i === 0) {
        startPos = top
      }
      return top - startPos
    })

    // Clear selection else nothing is selected when user returns to previously opened tab
    this.selectedArticleSection = null
  }

  updateSelectedArticleSection (scrollingContainer) {
    const scrollPos = scrollingContainer.node().scrollTop
    const maxScroll = scrollingContainer.node().scrollHeight - scrollingContainer.node().clientHeight
    let sectionIndex = scrollPos === maxScroll ? this.articleSplits.length - 1 : d3.bisect(this.articleSplits, scrollPos) - 1
    sectionIndex = Math.min(this.articleSplits.length - 1, sectionIndex)
    if (this.selectedArticleSection !== sectionIndex) {
      if (this.selectedArticleSection !== null) {
        this.articleMenuItems[this.selectedArticleSection].classList.remove('selected')
      }
      this.articleMenuItems[sectionIndex].classList.add('selected')
      this.selectedArticleSection = sectionIndex
    }
  }

  getSummaryTitle () {
    if (this.detected) return `Doctor has found ${this.title}:`

    return `Doctor has not found evidence of ${this.title}.` +
           ' When such issues are present:'
  }

  getSummary () { return this.content.getSummary() }

  hasSummary () { return this.content.hasSummary() }

  getReadMore () {
    const readMore = this.content.getReadMore()

    this.articleHeadings = Array.from(readMore.querySelectorAll('h2'))
    this.articleHeadings.forEach((articleHeading, i) => {
      articleHeading.id = `article-section-${i}`
    })

    this.articleMenuItems = this.articleHeadings.map((articleHeading) => {
      const link = document.createElement('a')
      link.href = '#' + articleHeading.id
      link.textContent = articleHeading.textContent
      d3.select(link).on('click', () => {
        window.event.preventDefault()
        d3.select('#' + articleHeading.id).node().scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return link
    })

    return readMore
  }

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
        .on('click', () => this.emit(this.undetectedOpened ? 'close-undetected' : 'open-undetected'))

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

    const recommendation = this.recommendations.get(this.selectedCategory)
    this.container.classed('has-read-more', recommendation.hasReadMore())
    this.readMoreArticle.html(null)
    this.articleMenu.html(null)
    if (recommendation.hasReadMore()) {
      this.readMoreArticle.node().appendChild(recommendation.getReadMore())

      this.articleMenu.append('h2')
        .classed('plain', true)
        .text('Jump to section')
      for (const menuItem of recommendation.articleMenuItems) {
        this.articleMenu.node().appendChild(menuItem)
      }

      if (this.readMoreOpened) {
        const content = this.content
        content.node().scrollTo(0, 0)
        recommendation.computeArticleSplits()
        recommendation.updateSelectedArticleSection(content)
        content
          .on('scroll.scroller', () => {
            recommendation.updateSelectedArticleSection(content)
          })
      }
    }
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
      .classed('detected', recommendation.detected)

    // set content
    this.summaryTitle.text(recommendation.getSummaryTitle())
    this.summary.html(null)
    if (recommendation.hasSummary()) {
      this.summary.node().appendChild(recommendation.getSummary())
    }

    // set space height such that the fixed element don't have to hide
    // something in the background.
    this.space.style('height', this.details.node().offsetHeight + 'px')
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

    // If user hides undetected tabs while one is selected, switch to default tab
    if (!this.recommendations.get(this.selectedCategory).detected) {
      this.emit('change-page', this.defaultCategory)
    }
  }
}

module.exports = new Recomendation()
