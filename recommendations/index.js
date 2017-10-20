'use strict'

const fs = require('fs')
const path = require('path')
const async = require('async')
const stream = require('stream')
const Showdown = require('showdown')

// setup filepaths to Markdown files
const recommendations = {
  'gc': {
    summary: path.resolve(__dirname, 'gc-summary.md'),
    readMore: path.resolve(__dirname, 'gc-readmore.md')
  },
  'event-loop': {
    summary: path.resolve(__dirname, 'event-loop-summary.md'),
    readMore: path.resolve(__dirname, 'event-loop-readmore.md')
  },
  'io': {
    summary: path.resolve(__dirname, 'io-summary.md'),
    readMore: path.resolve(__dirname, 'io-readmore.md')
  },
  'none': {
    summary: path.resolve(__dirname, 'none-summary.md'),
    readMore: path.resolve(__dirname, 'none-readmore.md')
  },
  'unknown': {
    summary: path.resolve(__dirname, 'unknown-summary.md'),
    readMore: path.resolve(__dirname, 'unknown-readmore.md')
  }
}

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

    this.analysis = null
  }

  _transform (datum, encoding, callback) {
    this.analysis = datum
    callback(null)
  }

  _generate(category, callback) {
    const files = recommendations[category]

    async.mapValues(
      files,
      function (filepath, key, done) {
        fs.readFile(filepath, 'utf-8', function (err, content) {
          if (err) return done(err)
          done(null, md.makeHtml(content))
        })
      },
      callback
    )
  }

  _flush (callback) {
    this._generate(
      this.analysis.issueCategory,
      (err, recommendation) => {
        if (err) return callback(err)

        this.push(JSON.stringify(recommendation))
        callback(null)
      }
    )
  }
}

module.exports = GenerateRecommendation
