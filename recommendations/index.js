'use strict'

const fs = require('fs')
const path = require('path')
const async = require('async')
const stream = require('stream')
const Showdown = require('showdown')

class Recommendation {
  constructor (settings) {
    Object.assign(this, settings)
  }

  // Iterate over the files and annotate them with the type.
  [Symbol.iterator] () {
    const files = []

    files.push({
      type: 'summary',
      filepath: this.summary
    })

    if (this.readMore) {
      files.push({
        type: 'read-more',
        filepath: this.readMore
      })
    }

    return files[Symbol.iterator]()
  }
}

// Create recommendation object for each category
const recommendations = [
  new Recommendation({
    category: 'gc',
    issue: true,
    title: 'a potential Garbage Collection issue',
    menu: 'Garbage Collection',
    order: 1,
    summary: path.resolve(__dirname, 'gc-summary.md'),
    readMore: path.resolve(__dirname, 'gc-readmore.md')
  }),
  new Recommendation({
    category: 'event-loop',
    issue: true,
    title: 'a potential Event Loop issue',
    menu: 'Event Loop',
    order: 2,
    summary: path.resolve(__dirname, 'event-loop-summary.md'),
    readMore: path.resolve(__dirname, 'event-loop-readmore.md')
  }),
  new Recommendation({
    category: 'io',
    issue: true,
    title: 'a potential I/O issue',
    menu: 'I/O',
    order: 3,
    summary: path.resolve(__dirname, 'io-summary.md'),
    readMore: path.resolve(__dirname, 'io-readmore.md')
  }),
  new Recommendation({
    category: 'data',
    issue: true,
    title: 'data analysis issue',
    menu: 'Bad data',
    order: 4,
    summary: path.resolve(__dirname, 'data-summary.md'),
    readMore: null
  }),
  new Recommendation({
    category: 'unknown',
    issue: true,
    title: 'an unknown issue',
    menu: 'Unknown issue',
    order: 5,
    summary: path.resolve(__dirname, 'unknown-summary.md'),
    readMore: path.resolve(__dirname, 'unknown-readmore.md')
  }),
  new Recommendation({
    category: 'none',
    issue: false,
    title: 'no issue',
    menu: 'No issue',
    order: 6,
    summary: path.resolve(__dirname, 'none-summary.md'),
    readMore: null
  })
]

const md = new Showdown.Converter({
  noHeaderId: true,
  simplifiedAutoLink: true,
  excludeTrailingPunctuationFromURLs: true,
  strikethrough: true,
  tables: true,
  ghCodeBlocks: true,
  simpleLineBreaks: false
})

class RenderRecommendations extends stream.Readable {
  constructor (options) {
    super(options)

    // create a reading queue over all the categories
    this._readingQueue = recommendations[Symbol.iterator]()
  }

  _read (size) {
    const self = this
    const read = this._readingQueue.next()
    if (read.done) return this.push(null)

    // read the recommendation files for this category
    const recommendation = read.value
    async.map(
      recommendation,
      function (file, done) {
        fs.readFile(file.filepath, 'utf-8', function (err, content) {
          if (err) return done(err)
          const template =
            '<template class="recommendation-text"' +
            ` data-issue="${recommendation.issue ? 'yes' : 'no'}"` +
            ` data-type="${file.type}"` +
            ` data-category="${recommendation.category}"` +
            ` data-menu="${recommendation.menu}"` +
            ` data-title="${recommendation.title}"` +
            ` data-order="${recommendation.order}"` +
            '>\n' +
            `${md.makeHtml(content)}\n` +
            '</template>'

          done(null, template)
        })
      },
      function (err, result) {
        if (err) return self.emit('error', err)

        // Join summary and read-more text
        const output = result.join('\n') + '\n'

        // Push output and continue reading if required
        self.push(output)
      }
    )
  }
}

module.exports = RenderRecommendations
