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

  // .scrollTop must be 0. Called each time read-more becomes visible or its content changes
  computeArticleSplits () {
    let startPos
    this.articleSplits = this.articleHeadings.map((articleHeading, i) => {
      const top = articleHeading.getBoundingClientRect().top
      if (i === 0) {
        startPos = top
      }
      return top - startPos
    })
    this.selectedArticleSection = null
  }

  updateSelectedArticleSection () {
    const scrollPos = document.documentElement.scrollTop

    // - 15 and >= comparison to allow for rounding issues and small browser inconsistencies
    const maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight - 15

    let sectionIndex = scrollPos >= maxScroll ? this.articleSplits.length - 1 : d3.bisect(this.articleSplits, scrollPos) - 1

    sectionIndex = Math.min(this.articleSplits.length - 1, sectionIndex)
    if (this.selectedArticleSection !== sectionIndex) {
      if (this.selectedArticleSection !== null) {
        this.articleMenuItems[this.selectedArticleSection].classList.remove('selected') // TODO: update recommendation.selectedArticleSection on a href click // TODO: end-of-page logic
      }
      this.articleMenuItems[sectionIndex].classList.add('selected')
      this.selectedArticleSection = sectionIndex
    }
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
      .on('click', () => this.emit(this.readMoreOpened ? 'less' : 'more'))
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
        recommendation.computeArticleSplits()
        recommendation.updateSelectedArticleSection()
      }
    }
  }

  draw () {
    this.pages
      .selectAll('li')
      .data(this.recommendationsAsArray, (d) => d.category)
      .classed('detected', (d) => d.detected)
      .classed('selected', (d) => d.selected)

    const recommendation = this.recommendations.get(this.selectedCategory)

    // update state classes
    this.container
      .classed('open', this.opened)
      .classed('read-more-open', this.readMoreOpened)
      .classed('detected', recommendation.detected)

    // set content
    this.summaryTitle
      .text(recommendation.title)

    this.summary.html(null)
    if (recommendation.hasSummary()) {
      this.summary.node().appendChild(recommendation.getSummary())
    }

    // set space height such that the fixed element don't have to hide
    // something in the background.
    this.space.style('height', this.details.node().offsetHeight + 'px')

    const main = d3.select('#main')
    const top = parseFloat(main.style('top'))

    if (this.opened && this.readMoreOpened) {
      d3.select(window)
        .on('scroll.scroller', () => {
          recommendation.updateSelectedArticleSection()
        })

      // Freeze in #main's former scroll position before class makes position become fixed
      // Only do this if it hasn't already been done, else it's reset by switching tabs etc
      if (!top && window.pageYOffset) {
        main.style('top', 0 - window.pageYOffset + 'px')
        document.documentElement.scrollTop = 0
      }
    } else {
      d3.select(window).on('scroll.scroller', null)
      if (top) {
        // Reapply #main's old scroll position if there was one, after class removes position: fixed
        document.documentElement.scrollTop = 0 - top
      }
      main.style('top', 0)
    }
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
