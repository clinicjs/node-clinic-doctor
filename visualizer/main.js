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

recommendation.on('open', function () {
  document.documentElement.classList.toggle('recommendation-open')
  recommendation.open()
})
recommendation.on('close', function () {
  document.documentElement.classList.toggle('recommendation-open')
  recommendation.close()
})

loaddata(function maybeDone (err, data) {
  if (err) throw err

  graph.setData(data)
  graph.draw()
  recommendation.draw(data)

  window.addEventListener('resize', function () {
    graph.draw()
  })
})
