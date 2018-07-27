'use strict'
const fs = require('fs')
const path = require('path')
/* global Node */

class Icon {
  constructor (name, content) {
    this.name = name

    // parse content though a documentFragment. Note that documentFragments
    // themself doesn't support innerHTML, so use a template element and
    // access its content property, which is a documentFragment itself.
    const template = document.createElement('template')
    template.innerHTML = content
    this.svgTemplateNode = document.adoptNode(template.content)
      .querySelector('svg')

    // Extract svg content into a template for easier insertion
    this.svgTemplateContent = document.createDocumentFragment()
    for (const child of this.svgTemplateNode.childNodes) {
      // svg can not have root text nodes, so skip these.
      if (child.nodeType === Node.TEXT_NODE) continue
      this.svgTemplateContent.appendChild(child)
    }
  }

  insert (svgNode) {
    // DOM node attributes list is not iterable in MS Edge, but can be turned into an array
    const attributes = this.svgTemplateNode.attributes
    const iterableAttributes = typeof attributes[Symbol.iterator] === 'function' ? attributes : Array.from(attributes)
    for (const attr of iterableAttributes) {
      svgNode.setAttribute(attr.name, attr.value)
    }
    svgNode.appendChild(this.svgTemplateContent.cloneNode(true))
  }
}

class Icons {
  constructor () {
    const icons = {
      'arrow-down': fs.readFileSync(
        path.resolve(__dirname, 'icons/arrow-down.svg'),
        'utf8'
      ),
      'arrow-up': fs.readFileSync(
        path.resolve(__dirname, 'icons/arrow-up.svg'),
        'utf8'
      ),
      'close': fs.readFileSync(
        path.resolve(__dirname, 'icons/close.svg'),
        'utf8'
      ),
      'grid-1x4': fs.readFileSync(
        path.resolve(__dirname, 'icons/grid-1x4.svg'),
        'utf8'
      ),
      'grid-2x2': fs.readFileSync(
        path.resolve(__dirname, 'icons/grid-2x2.svg'),
        'utf8'
      ),
      'theme': fs.readFileSync(
        path.resolve(__dirname, 'icons/theme.svg'),
        'utf8'
      ),
      'warning': fs.readFileSync(
        path.resolve(__dirname, 'icons/warning.svg'),
        'utf8'
      )
    }

    this._icons = new Map()
    for (const [key, content] of Object.entries(icons)) {
      this._icons.set(key, new Icon(key, content))
    }
  }

  insertIcon (name) {
    const icon = this._icons.get(name)
    return function (selection) {
      // d3's selection.nodes() is an array, but for ... of breaks MS Edge, can't see the array's [Symbol.iterator]
      selection.nodes().forEach(node => icon.insert(node))
    }
  }
}

module.exports = new Icons()
