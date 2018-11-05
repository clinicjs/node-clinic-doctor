#!/usr/bin/env node

const Tool = require('../')

module.exports = {
  visualize: () => {
    for (const file of process.argv.slice(2).map(trim)) {
      const tool = new Tool({ debug: true })

      tool.visualize(
        file,
        file + '.html',
        function (err) {
          if (err) {
            throw err
          } else {
            console.log('Wrote', file + '.html')
          }
        }
      )
    }
  }
}

function trim (file) {
  return file.replace(/\/\\$/, '')
}
