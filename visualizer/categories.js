'use strict'
const d3 = require('./d3.js')

class CategoryContent {
  constructor (node) {
    this.category = node.dataset.category
    this.order = parseInt(node.dataset.order, 10)
    this.issue = node.dataset.issue === 'yes'
    this.menu = node.dataset.menu
    this.title = node.dataset.title
    this.summary = null
    this.readMore = null
    this.articleHeadings = null
  }

  addContent (node) {
    switch (node.dataset.type) {
      case 'summary':
        this.summary = document.adoptNode(node.content)
        break
      case 'read-more':
        this.readMore = document.adoptNode(node.content)
        break
      default:
        throw new Error('unknown type: ' + node.dataset.type)
    }
  }

  getSummary () {
    return this.summary.cloneNode(true)
  }

  hasSummary () {
    return this.summary !== null
  }

  getReadMore () {
    return this.readMore.cloneNode(true)
  }

  hasReadMore () {
    return this.readMore !== null
  }
}

class Categories {
  constructor () {
    const categories = new Map()
    for (const node of d3.selectAll('.recommendation-text').nodes()) {
      if (!categories.has(node.dataset.category)) {
        categories.set(node.dataset.category, new CategoryContent(node))
      }
      categories.get(node.dataset.category).addContent(node)
    }

    this.categories = categories
    this.categoriesAsArray = Array.from(
      this.categories.values()
    ).sort((a, b) => a.order - b.order)
  }

  getContent (category) {
    return this.categories.get(category)
  }

  asArray () {
    return this.categoriesAsArray
  }
}

module.exports = new Categories()
