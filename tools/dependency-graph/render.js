const renderGraph = (data) => {
  const config = {
    container: document.getElementById('cy'),
    elements: [],
    autounselectify: true,

    layout: {
      name: 'dagre',
      ranker: 'tight-tree',
      nodeSep: 10,
      rankSep: 400,
      padding: 10
    },
  
    style: [
      {
        selector: '.hidden',
        style: {
          'display': 'none'
        }
      },
      {
        selector: 'node',
        style: {
          'background-color': '#fff',
          'border-color': '#333',
          'border-width': '1px',
          'height': 'label',
          'label': 'data(label)',
          'padding': '8px',
          'shape': 'round-rectangle',
          'text-halign': 'center',
          'text-valign': 'center',
          'text-wrap': 'wrap',
          'width': 'label'
        }
      },
      {
        selector: 'node.internal',
        style: {
          'background-color': '#7f7'
        }
      },
      {
        selector: 'node.internalbinary',
        style: {
          'background-color': '#fb7'
        }
      },
      {
        selector: 'node.collapsed',
        style: {
          'background-color': '#b7f'
        }
      },
      {
        selector: 'node.search',
        style: {
          'background-color': '#ff7',
          'border-width': '6px',
          'display': 'element'
        }
      },
      {
        selector: 'node.highlight',
        style: {
          'background-color': '#fff',
          'border-width': '6px',
          'display': 'element'
        }
      },
      {
        selector: 'node.highlight.in',
        style: {
          'border-color': '#7bf'
        }
      },
      {
        selector: 'node.highlight.out',
        style: {
          'border-color': '#f77'
        }
      },
      {
        selector: 'node.highlight.source',
        style: {
          'border-color': '#f77'
        }
      },
      {
        selector: 'node.highlight.internal',
        style: {
          'background-color': '#7f7'
        }
      },
      {
        selector: 'node.highlight.internalbinary',
        style: {
          'background-color': '#fb7'
        }
      },
      {
        selector: 'node.highlight.collapsed',
        style: {
          'background-color': '#b7f'
        }
      },
      {
        selector: 'node.highlight.search',
        style: {
          'background-color': '#ff7'
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'label': 'data(label)',
          'line-color': '#333',
          'target-arrow-color': '#333',
          'target-arrow-shape': 'triangle',
          'width': '1.5px'
        }
      },
      {
        selector: 'edge.highlight',
        style: {
          'display': 'element',
          'width': '6px'
        }
      },
      {
        selector: 'edge.highlight.in',
        style: {
          'line-color': '#7bf',
          'target-arrow-color': '#7bf'
        }
      },
      {
        selector: 'edge.highlight.out',
        style: {
          'line-color': '#f77',
          'target-arrow-color': '#f77'
        }
      }
    ]
  }

  // Add the nodes
  for (const pkg of Object.keys(data)) {
    config.elements.push({
      data: {
        id: pkg,
        label: `${data[pkg].name}\n${data[pkg].version}`
      },
      classes: data[pkg].type
    })
  }

  // Add the edges
  for (const pkg of Object.keys(data)) {
    for (const dep of data[pkg].deps) {
      const dest = `${dep.name}:${dep.version}`
      const edge = {
        data: {
          id: `${pkg}:${dest}`,
          source: pkg,
          target: dest,
          label: dep.label || ''
        }
      }
      config.elements.push(edge)
    }
  }

  const cy = cytoscape(config)

  cy.on('mouseover', 'node', event => {
    const element = event.target
    if (element.hasClass('pinned')) { return }

    element.addClass('highlight source')
    element.outgoers().addClass('highlight out')
    element.incomers().addClass('highlight in')
  })

  cy.on('mouseout', 'node', event => {
    const element = event.target
    if (element.hasClass('pinned')) { return }

    element.removeClass('source')
    if (!element.hasClass('in') && !element.hasClass('out')) {
      element.removeClass('highlight')
    }

    element.outgoers().forEach(e => {
      e.removeClass('out')
      if (!e.hasClass('in') && !e.hasClass('source')) {
        e.removeClass('highlight')
      }
    })
    
    element.incomers().forEach(e => {
      e.removeClass('in')
      if (!e.hasClass('out') && !e.hasClass('source')) {
        e.removeClass('highlight')
      }
    })
  })

  cy.on('cxttap', 'node', event => {
    const element = event.target
    if (!element.hasClass('pinned')) {
      element.addClass('pinned')

    } else {
      element.removeClass('pinned')
    }
  })

  document.addEventListener('keydown', event => {
    if (document.activeElement.id === 'search') { return }

    if (event.key === '-') {
      cy.nodes('.internal').forEach(node => {
        if (!node.hasClass('hidden')) {
          triggerCollapse(cy, node, true)
        }
      })
    } else if (event.key === '=') {
      cy.nodes('.internal').forEach(node => {
        triggerCollapse(cy, node, false)
      })
    }
  })

  let searchTerm = ''
  document.getElementById('search').addEventListener('input', event => {
    const newValue = event.target.value
    if (searchTerm !== newValue) {
      searchTerm = newValue
      cy.nodes().removeClass('search')
      if (searchTerm.length > 0) {
        const matches = cy.nodes(`[label *= '${searchTerm}']`)
        matches.addClass('search')
        document.getElementById('matches').innerText = `Matches: ${matches.length}`
      } else {
        document.getElementById('matches').innerText = ''
      }
    }
  })

  cy.on('tap', 'node', event => {
    const element = event.target
    const collapse = !element.hasClass('collapsed')
    triggerCollapse(cy, element, collapse)
    element.emit('mouseout')
    element.emit('mouseover')
  })
}

const triggerCollapse = (cy, element, collapse) => {
  if (element.outgoers().length === 0) { return }

  if (collapse) {
    element.addClass('collapsed')
  } else {
    element.removeClass('collapsed')
  }

  element.outgoers('edge').forEach(edge => {
    toggleElementVisibility(edge, !collapse)
  })

  if (collapse) {
    const orphans = cy.filter(e => {
      return e.isNode() &&
        !e.hasClass('internal') &&
        !e.incomers('edge').some(g => !g.hasClass('hidden'))
    })
    orphans.forEach(o => {
      toggleElementVisibility(o, false)
      toggleChildVisibility(o, false)
    })
  } else {
    toggleChildVisibility(element, true)
    toggleParentVisibility(element, true)
  }
}

const toggleElementVisibility = (e, visible) => {
  if (!visible) {
    e.addClass('hidden')
  } else {
    e.removeClass('hidden collapsed')
  }
}

const toggleChildVisibility = (e, visible) => {
  e.successors().forEach(s => {
    if (!visible && s.isNode()) {
      s.addClass('hidden')
    } else if (visible) {
      s.removeClass('hidden collapsed')
    }
  })
}

const toggleParentVisibility = (e, visible) => {
  e.predecessors().forEach(s => {
    if (!visible && s.isNode()) {
      s.addClass('hidden')
    } else if (visible) {
      s.removeClass('hidden')
    }
  })
}
