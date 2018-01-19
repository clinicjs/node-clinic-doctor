'use strict'

const loaddata = require('./data.js')

const menu = require('./menu.js')
const alert = require('./alert.js')
const graph = require('./graph.js')
const recommendation = require('./recommendation.js')

menu.on('toggle-theme', function () {
  document.documentElement.classList.toggle('light-theme')
})

menu.on('toggle-grid', function () {
  document.documentElement.classList.toggle('grid-layout')
  graph.draw()
})

alert.on('open', () => alert.open())
alert.on('close', () => alert.close())
alert.on('click', function (graphId) {
  document.getElementById(graphId).scrollIntoView({
    block: 'start',
    inline: 'nearest',
    behavior: 'smooth'
  })
})

graph.on('hover-show', () => graph.hoverShow())
graph.on('hover-hide', () => graph.hoverHide())
graph.on('hover-update', (unitX) => graph.hoverUpdate(unitX))

graph.on('alert-click', function () {
  document.documentElement.classList.add('recommendation-open')
  recommendation.open()
  recommendation.draw()
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
  document.querySelector('body').classList.remove('freeze-scroll')
})
recommendation.on('change-page', function (category) {
  recommendation.setPage(category)
  recommendation.draw()
})

recommendation.on('more', function () {
  recommendation.openReadMore()
  recommendation.draw()
  document.querySelector('body').classList.add('freeze-scroll')
})
recommendation.on('less', function () {
  recommendation.closeReadMore()
  recommendation.draw()
  document.querySelector('body').classList.remove('freeze-scroll')
})

loaddata(function maybeDone (err, data) {
  if (err) throw err

  alert.setData(data)
  alert.draw()

  graph.setData(data)
  graph.draw()

  recommendation.setData(data)
  recommendation.draw()

  window.addEventListener('resize', function () {
    alert.draw()
    graph.draw()
  })
})
