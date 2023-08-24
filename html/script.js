const { assign, createMachine, interpret, actions } = XState
const { log } = actions

const theGrid = []
const layers = []

let ws = new WebSocket('ws://127.0.0.1:3302/ws')

ws.onopen = (event) => {
  console.log('Connected to websocket')
  console.log(new Date())
}

ws.onmessage = (event) => {
  const payload = JSON.parse(event.data)
  if (payload.key === 'dB') {
    if (payload.value > 0.007) {
      actor.send({ type: 'STARTTALKING' })
    }
  } else if (payload.key === 'key') {
    actor.send({ type: 'STARTTYPING' })
    actor.send({ type: 'STARTLOOKING' })
  } else if (payload.key === 'mousemove') {
  } else if (payload.key === 'bearbgcolor') {
  } else if (payload.key === 'bearcolor') {
  } else if (payload.key === 'screen_position') {
  }
}

// } else if (payload.key === 'mousemove') {
//   mouseXglobal = payload.value[0]
//   mouseYglobal = payload.value[1]
//   actor.send({type: 'MOVEMOUSE'})
// } else if (payload.key === 'bearbgcolor') {
//   document.body.style.backgroundColor =
//     `rgb(${payload.value.red}, ${payload.value.green}, ${payload.value.blue})`
// } else if (payload.key === 'bearcolor') {
//   document.body.style.color =
//     `rgb(${payload.value.red}, ${payload.value.green}, ${payload.value.blue})`
// } else if (payload.key === "screen_position") {
//   console.log(payload)
//   console.log(new Date())
// }

const pickOption = (layerTypes, context) => {
  const returnVisible = [...context.visibleLayers]
  layerTypes.forEach((layerType) => {
    const parts = layerType.split('~')
    const availableItems = []
    context.layers.forEach((l, lIndex) => {
      if (l.layerType.startsWith(parts[0])) {
        returnVisible[lIndex] = false
      }
      if (l.layerType === layerType) {
        availableItems.push(lIndex)
      }
    })
    returnVisible[
      availableItems[Math.floor(Math.random() * availableItems.length)]
    ] = true
  })
  return returnVisible
}

const machine = createMachine({
  predictableActionArguments: true,
  initial: 'loading',
  context: {
    layers: [],
    visibleLayers: [],
  },
  states: {
    loading: {
      entry: log('started!'),
      on: {
        KICKOFF: {
          target: 'baseline',
          actions: (context, event) => {
            context.layers = event.struct.layers
            context.layers.forEach((l) => {
              context.visibleLayers.push(false)
            })
          },
        },
      },
    },

    baseline: {
      initial: 'headForward',
      states: {
        headForward: {
          type: 'parallel',
          states: {
            headUp: {
              entry: assign({
                visibleLayers: (context) => {
                  return pickOption(
                    ['head~forward~base', 'shoulders~forward~base'],
                    context
                  )
                },
              }),
            },

            keyboard: {
              initial: 'notTyping',
              states: {
                notTyping: {
                  on: { STARTTYPING: 'isTyping' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['keyboard~forward~base'], context)
                    },
                  }),
                },
                isTyping: {
                  on: { STARTTYPING: 'isTyping' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['keyboard~forward~typing'], context)
                    },
                  }),
                  after: {
                    581: {
                      target: 'notTyping',
                    },
                  },
                },
              },
            },

            snout: {
              initial: 'snoutUp',
              states: {
                snoutUp: {
                  on: { STARTTYPING: 'snoutDown' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['snout~forward~up'], context)
                    },
                  }),

                  initial: 'mouthClosed',
                  states: {
                    mouthClosed: {
                      on: { STARTTALKING: 'mouthMoving' },
                      entry: assign({
                        visibleLayers: (context) => {
                          return pickOption(['mouth~forward~closed'], context)
                        },
                      }),
                    },
                    mouthMoving: {
                      on: { STARTTALKING: 'mouthMoving' },
                      entry: assign({
                        visibleLayers: (context) => {
                          return pickOption(['mouth~forward~open'], context)
                        },
                      }),
                      after: {
                        81: {
                          target: 'mouthClosed',
                        },
                      },
                    },
                  },
                },
                snoutDown: {
                  on: { STARTTYPING: 'snoutDown' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['snout~forward~down'], context)
                    },
                  }),
                  after: {
                    581: {
                      target: 'snoutUp',
                    },
                  },
                  initial: 'mouthClosed',
                  states: {
                    mouthClosed: {
                      on: { STARTTALKING: 'mouthMoving' },
                      entry: assign({
                        visibleLayers: (context) => {
                          return pickOption(['mouth~down~closed'], context)
                        },
                      }),
                    },
                    mouthMoving: {
                      on: { STARTTALKING: 'mouthMoving' },
                      entry: assign({
                        visibleLayers: (context) => {
                          return pickOption(['mouth~down~open'], context)
                        },
                      }),
                      after: {
                        81: {
                          target: 'mouthClosed',
                        },
                      },
                    },
                  },
                },
              },
            },

            eyes: {
              initial: 'eyesForwardOpen',
              states: {
                eyesForwardOpen: {
                  on: { STARTTYPING: 'eyesDownOpen' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['eyes~forward~open'], context)
                    },
                  }),

                  after: [
                    {
                      delay: (context, event) => {
                        return Math.floor(Math.random() * 4500) + 4000
                      },
                      target: 'eyesForwardBlink',
                    },
                  ],
                },

                eyesForwardBlink: {
                  on: { STARTTYPING: 'eyesDownOpen' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['eyes~forward~blink'], context)
                    },
                  }),
                  after: [
                    {
                      delay: (context, event) => {
                        return Math.floor(Math.random() * 60) + 85
                      },
                      target: 'eyesForwardOpen',
                    },
                  ],
                },

                eyesDownOpen: {
                  on: { STARTTYPING: 'eyesDownOpen' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['eyes~down~open'], context)
                    },
                  }),
                  after: {
                    581: {
                      target: 'eyesForwardOpen',
                    },
                  },
                },
              },
            },
          },
          on: {
            STARTLOOKING: {
              target: 'headLooking',
            },
          },
        },

        headLooking: {
          type: 'parallel',
          states: {
            head: {
              entry: assign({
                visibleLayers: (context) => {
                  return pickOption(
                    ['head~looking~base', 'shoulders~looking~base'],
                    context
                  )
                },
              }),
            },

            keyboard: {
              initial: 'notTyping',
              states: {
                notTyping: {
                  on: { STARTTYPING: 'isTyping' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['keyboard~forward~base'], context)
                    },
                  }),
                },
                isTyping: {
                  on: { STARTTYPING: 'isTyping' },
                  entry: assign({
                    visibleLayers: (context) => {
                      return pickOption(['keyboard~forward~typing'], context)
                    },
                  }),
                  after: {
                    581: {
                      target: 'notTyping',
                    },
                  },
                },
              },
            },

            snout: {
              entry: assign({
                visibleLayers: (context) => {
                  return pickOption(['snout~looking~base'], context)
                },
              }),
            },

            eyes: {
              entry: assign({
                visibleLayers: (context) => {
                  return pickOption(['eyes~looking~open'], context)
                },
              }),
            },
          },
        },
      },
    },
  },
})

const actor = interpret(machine).start()

actor.subscribe((state) => {
  window.requestAnimationFrame(() => {
    if (state.context.layers[0]) {
      state.context.layers[0].rows.forEach((row, rIndex) => {
        row.forEach((pixel, pIndex) => {
          theGrid[rIndex][pIndex].innerText = ' '
        })
      })
      state.context.layers.forEach((layer, lIndex) => {
        if (state.context.visibleLayers[lIndex]) {
          layer.rows.forEach((row, rIndex) => {
            row.forEach((pixel, pIndex) => {
              if (pixel.char !== '') {
                theGrid[rIndex][pIndex].innerText = pixel.char
              }
            })
          })
        }
      })
    }
  })
})

const make_grid = (data) => {
  let rows = 0
  let cols = 0

  for (let l = 0; l < data.layers.length; l++) {
    rows = Math.max(rows, data.layers[l].rows.length)
    for (let r = 0; r < data.layers[l].rows.length; r++) {
      cols = Math.max(cols, data.layers[l].rows[r].length)
    }
  }

  const newT = document.createElement('table')
  newT.id = 'bearTable'
  for (let r = 0; r <= rows; r++) {
    const newTr = document.createElement('tr')
    for (let c = 0; c <= cols; c++) {
      const newTd = document.createElement('td')
      newTd.classList.add('pixel')
      newTd.innerHTML = ''
      newTr.appendChild(newTd)
    }
    newT.appendChild(newTr)
  }
  bear.appendChild(newT)
  const grows = bear.getElementsByTagName('tr')
  for (let grow = 0; grow < grows.length; grow++) {
    const newGrow = []
    gcells = grows[grow].getElementsByTagName('td')
    for (let gcell = 0; gcell < gcells.length; gcell++) {
      newGrow.push(gcells[gcell])
    }
    theGrid.push(newGrow)
  }
}

const init = () => {
  const req = new Request('bears.json')
  fetch(req)
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      make_grid(data)
      actor.send({ type: 'KICKOFF', struct: data })
    })
}

document.addEventListener('DOMContentLoaded', init)
