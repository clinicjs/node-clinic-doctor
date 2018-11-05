#!/usr/bin/env node

var chokidar = require('chokidar')
var v = require('./visualize-mod.js')

const debounce = require('lodash.debounce')

// this is useful when updating multiple files in just one go (i.e. checking-out a branch)
const debVisualize = debounce(v.visualize, 100)

chokidar
  .watch([
    'visualizer/**/*.css',
    'visualizer/**/*.js',
    'index.js'
  ], {
    ignoreInitial: true
  })
  .on('all', (event, path) => {
    console.log(event, path)
    debVisualize()
  })

v.visualize()
