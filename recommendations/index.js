'use strict'

const Showdown = require('showdown')
const gc = require('./gc')
const ev = require('./ev')
const io = require('./io')
const none = require('./none')
const unknown = require('./unknown')
const stream = require('stream')

// Common markdown converter. Only one recommendation
// per report will get proccessed from markdown to html.
// Options: https://github.com/showdownjs/showdown#valid-options
const md = new Showdown.Converter({
  noHeaderId: true,
  parseImgDimensions: true,
  simplifiedAutoLink: true,
  excludeTrailingPunctuationFromURLs: true,
  literalMidWordUnderscores: true,
  strikethrough: true,
  tables: true,
  ghCodeBlocks: true
})

md.setFlavor('github')

class GenerateRecommendation extends stream.Transform {
  constructor (options) {
    super(Object.assign({
      readableObjectMode: false,
      writableObjectMode: true
    }, options))

    this.data = []
  }

  _generate (issueCategory) {
    if (issueCategory === 'gc') {
      return {
        category: 'gc',
        summary: md.makeHtml(gc.summary),
        readMore: md.makeHtml(gc.readMore)
      }
    }

    if (issueCategory === 'event-loop') {
      return {
        category: 'event-loop',
        summary: md.makeHtml(ev.summary),
        readMore: md.makeHtml(ev.readMore)
      }
    }

    if (issueCategory === 'io') {
      return {
        category: 'io',
        summary: md.makeHtml(io.summary),
        readMore: md.makeHtml(io.readMore)
      }
    }

    if (issueCategory === 'none') {
      return {
        category: 'none',
        summary: md.makeHtml(none.summary),
        readMore: md.makeHtml(none.readMore)
      }
    }

    return {
      category: 'unknown',
      summary: md.makeHtml(unknown.summary),
      readMore: md.makeHtml(unknown.readMore)
    }
  }

  _transform (datum, encoding, callback) {
    this.data = datum
    callback(null)
  }

  _flush (callback) {
    this.push(JSON.stringify(this._generate(this.data.issueCategory)))
    callback(null)
  }
}

module.exports = GenerateRecommendation
