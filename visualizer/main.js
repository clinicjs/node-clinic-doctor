'use strict'

const loaddata = require('./data.js')

const menu = require('./menu.js')
const graph = require('./graph.js')
const recommendation = require('./recommendation.js')

menu.on('toggle-theme', function () {
  document.documentElement.classList.toggle('light-theme')
})

menu.on('toggle-grid', function () {
  document.documentElement.classList.toggle('grid-layout')
  graph.draw()
})

graph.on('hover-show', () => graph.hoverShow())
graph.on('hover-hide', () => graph.hoverHide())
graph.on('hover-update', (unitX) => graph.hoverUpdate(unitX))

graph.on('alert-click', function () {
  document.documentElement.classList.add('recommendation-open')
  recommendation.open()
})

recommendation.on('open', function () {
  document.documentElement.classList.add('recommendation-open')
  recommendation.open()
  recommendation.draw()
})
recommendation.on('close', function () {
  document.documentElement.classList.remove('recommendation-open')
  recommendation.close()
  recommendation.draw()
})
recommendation.on('change-page', function (category) {
  recommendation.setPage(category)
  recommendation.draw()
})

recommendation.on('more', function () {
  recommendation.openReadMore()
  recommendation.draw()
})
recommendation.on('less', function () {
  recommendation.closeReadMore()
  recommendation.draw()
})

loaddata(function maybeDone (err, data) {
  if (err) throw err

  graph.setData(data)
  graph.draw()

  recommendation.setData(data)
  recommendation.draw()

  window.addEventListener('resize', function () {
    graph.draw()
  })
})
