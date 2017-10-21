
const d3 = require('./d3.js')
const EventEmitter = require('events')

class Recomendation extends EventEmitter {
  constructor () {
    super()

    this.opened = false
    this.showingMore = false

    this.container = d3.select('#recommendation')
      .classed('open', this.opened)

    this.space = this.container.append('div')
      .classed('space', true)

    this.content = this.container.append('div')
      .classed('content', true)

    this.bar = this.content.append('div')
      .classed('bar', true)
    this.bar.append('div')
      .classed('text', true)
    this.bar.append('div')
      .classed('arrow', true)

    this.bar.on('click', () => this.emit(this.opened ? 'close' : 'open'))

    this.details = this.content.append('div')
      .classed('details', true)
    this.details.append('div')
      .classed('close', true)
      .on('click', () => this.emit('close'))

    this.summary = this.details.append('div')
      .classed('summary', true)

    this.readMore = this.details.append('div')
      .classed('more-section', true)

    this.moreBar = this.readMore.append('div')
      .classed('more-bar', true)
    this.moreBar.append('div')
      .classed('text', true)
    this.moreBar.append('div')
      .classed('arrow', true)

    this.moreBar.on('click', () => this.emit(this.showingMore ? 'less' : 'more'))

    this.more = this.readMore.append('div')
      .classed('more', true)
  }

  setData (data) {
    this.summary.html(data.summary)
    this.more.html(data.readMore)
  }

  draw () {

  }

  close () {
    this.opened = false
    this.container.classed('open', false)
    this.space.style('height', '0px')
  }

  open () {
    const html = document.documentElement
    const atBottom = html.scrollHeight - window.scrollY === window.innerHeight
    const atTop = window.scrollY === 0

    this.opened = true
    this.container.classed('open', true)

    // add extra space to the document, such that the details and graphs
    // can be viewed simultaneously.
    const detailsHeight = this.details.node().getBoundingClientRect().height
    this.space.style('height', Math.floor(detailsHeight) + 'px')

    // If the view was at the bottom, automatically scroll the view to
    // the bottom after showing the details.
    // If the user is on a large screen and is also seeing the top, then
    // never scroll.
    if (atBottom && !atTop) {
      window.scrollTo(window.scrollX, html.scrollHeight - window.innerHeight)
    }
  }

  showMore () {
    this.showingMore = true
    this.readMore.classed('open', true)
  }

  showLess () {
    this.showingMore = false
    this.readMore.classed('open', false)
  }
}

module.exports = new Recomendation()
