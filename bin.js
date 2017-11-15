#! /usr/bin/env node

'use strict'

const version = require('./package.json').version
const minimist = require('minimist')
const open = require('open')
const path = require('path')
const fs = require('fs')
const Doctor = require('.')

function run (args) {
  const argv = minimist(args, {
    alias: {
      help: 'h',
      version: 'v',
      issues: 'i'
    },
    boolean: [
      'help',
      'version',
      'issues',
      'collect-only'
    ],
    string: [
      'visualize-only',
      'sample-interval'
    ],
    default: {
      'sample-interval': '10'
    },
    '--': true
  })

  if (argv.version) {
    console.log('v' + version)
  } else if (argv.help) {
    printHelp()
  } else if (argv['visualize-only'] || argv['--'].length > 1) {
    runTool(argv)
  } else {
    printHelp()
    process.exit(1)
  }
}

function printHelp () {
  const filepath = path.resolve(__dirname, 'help.txt')

  const usage = fs.readFileSync(filepath)
    .toString()
    .replace(/<title>/g, '\x1B[37m\x1B[1m\x1B[4m')
    .replace(/<\/title>/g, '\x1B[24m\x1B[22m\x1B[39m')
    .replace(/<h1>/g, '\x1B[36m\x1B[1m')
    .replace(/<\/h1>/g, '\x1B[22m\x1B[39m')
    .replace(/<code>/g, '\x1B[33m')
    .replace(/<\/code>/g, '\x1B[39m')
    .replace('{{version}}', version)

  console.log(usage)
}

function runTool (argv) {
  const tool = new Doctor({
    sampleInterval: parseInt(argv['sample-interval'], 10)
  })

  if (argv['collect-only']) {
    tool.collect(argv['--'], function (err, filename) {
      if (err) throw err
      console.log(`output file is ${filename}`)
    })
  } else if (argv['visualize-only']) {
    tool.visualize(
      argv['visualize-only'],
      argv['visualize-only'] + '.html',
      function (err, analysis) {
        if (err) throw err

        printIssues(argv, analysis)

        console.log(`generated HTML file is ${argv['visualize-only']}.html`)
      }
    )
  } else {
    tool.collect(argv['--'], function (err, filename) {
      if (err) throw err
      console.log('analysing data')

      tool.visualize(filename, filename + '.html', function (err, analysis) {
        if (err) throw err

        printIssues(argv, analysis)

        console.log(`generated HTML file is ${filename}.html`)

        // open HTML file in default browser
        open('file://' + path.resolve(filename + '.html'))
      })
    })
  }
}

function printIssues (argv, analysis) {
  if (argv['issues']) {
    console.log('detected issues', analysis.issues)
    console.log('assigned category', analysis.category)
  }
}

module.exports = {
  run,
  printHelp
}

if (require.main === module) {
  run(process.argv.slice(2))
}
