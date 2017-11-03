
const d3 = require('./d3.js')
const EventEmitter = require('events')

class Recomendation extends EventEmitter {
  constructor () {
    super()

    this.opened = false
    this.showingMore = false

    this.space = d3.select('#recommendation-space')

    this.container = d3.select('#recommendation')
      .classed('open', this.opened)

    this.wrapper = this.container.append('div')
      .classed('wrapper', true)

    this.details = this.wrapper.append('div')
      .classed('details', true)
    this.details.append('div')
      .classed('close', true)
      .on('click', () => this.emit('close'))

    this.content = this.details.append('div')
      .classed('content', true)

    this.summary = this.content.append('div')
      .classed('summary', true)

    this.more = this.content.append('div')
      .classed('hidden', true)
      .classed('more', true)

    this.moreBar = this.more.append('div')
      .classed('more-bar', true)
      .on('click', () => this.emit(this.showingMore ? 'less' : 'more'))
    this.moreBar.append('div')
      .classed('text', true)
    this.moreBar.append('div')
      .classed('arrow', true)

    this.moreContent = this.more.append('div')
      .classed('more-content', true)

    this.bar = this.wrapper.append('div')
      .classed('bar', true)
      .on('click', () => this.emit(this.opened ? 'close' : 'open'))
    this.bar.append('div')
      .classed('text', true)
    this.bar.append('div')
      .classed('arrow', true)
  }

  setData (data) {
    this.summary.html(data.summary)

    if (data.readMore) {
      this.more
        .classed('hidden', false)
      this.moreContent
        .html(data.readMore)
    }
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
    this.more.classed('open', true)
  }

  showLess () {
    this.showingMore = false
    this.more.classed('open', false)
  }
}

module.exports = new Recomendation()
