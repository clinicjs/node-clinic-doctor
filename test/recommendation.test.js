'use strict'

const fs = require('fs')
const test = require('tap').test
const cheerio = require('cheerio')
const endpoint = require('endpoint')
const RenderRecommendations = require('../recommendations/index.js')

test('Recommendation - contains all categories', function (t) {
  new RenderRecommendations().pipe(endpoint(function (err, content) {
    if (err) return t.ifError(err)

    const doc = cheerio.load(content.toString())
    const templates = doc('template').map(function (index, rawElement) {
      const element = doc(rawElement)
      return {
        attr: {
          class: element.attr('class')
        },
        data: {
          issue: element.data('issue'),
          type: element.data('type'),
          category: element.data('category'),
          menu: element.data('menu'),
          title: element.data('title'),
          order: element.data('order')
        }
      }
    }).get()

    const categories = new Set()
    for (const templateElement of templates) {
      categories.add(templateElement.data.category)

      t.strictEqual(templateElement.attr.class, 'recommendation-text')
      t.ok(['yes', 'no'].includes(templateElement.data.issue))
      t.ok(['summary', 'read-more'].includes(templateElement.data.type))
      t.ok(templateElement.data.menu.length > 0)
      t.ok(templateElement.data.title.length > 0)
      t.strictEqual(typeof templateElement.data.order, 'number')
    }

    t.strictDeepEqual(Array.from(categories).sort(), [
      'data', 'event-loop', 'gc', 'io', 'none', 'unknown'
    ])
    t.end()
  }))
})

test('Recommendation - read failure', function (t) {
  const originalReadFile = fs.readFile
  t.beforeEach(function (done) {
    fs.readFile = function (filepath, encoding, callback) {
      callback(new Error('mocked fs error'))
    }
    done()
  })

  t.afterEach(function (done) {
    fs.readFile = originalReadFile
    done()
  })

  t.test('mock test', function (t) {
    new RenderRecommendations().pipe(endpoint(function (err, content) {
      t.strictDeepEqual(err, new Error('mocked fs error'))
      t.end()
    }))
  })

  t.end()
})
