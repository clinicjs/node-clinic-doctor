'use strict'
/* global Node */

const sanitizeIcon = icon =>
  icon
    .replace(/class="(.*?)"/, '')
    .replace(/fill="(.*?)"/g, '')

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
      'arrow-down': sanitizeIcon(require('@clinic/clinic-common/icons/chevron-down')),
      'arrow-up': sanitizeIcon(require('@clinic/clinic-common/icons/chevron-up')),
      'arrow-right': sanitizeIcon(require('@clinic/clinic-common/icons/chevron-right')),
      'arrow-left': sanitizeIcon(require('@clinic/clinic-common/icons/chevron-left')),
      close: sanitizeIcon(require('@clinic/clinic-common/icons/close')),
      copy: sanitizeIcon(require('@clinic/clinic-common/icons/copy')),
      'grid-1x4': sanitizeIcon(require('@clinic/clinic-common/icons/list-view')),
      'grid-2x2': sanitizeIcon(require('@clinic/clinic-common/icons/grid-view')),
      lightmode: sanitizeIcon(require('@clinic/clinic-common/icons/light-mode')),
      darkmode: sanitizeIcon(require('@clinic/clinic-common/icons/dark-mode')),
      warning: sanitizeIcon(require('@clinic/clinic-common/icons/warning-triangle'))
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
