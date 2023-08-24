const { assign, createMachine, interpret, actions, send } = XState
const { log } = actions

const theGrid = []
const layers = []

// const pickOption = (layerTypes, context) => {
//   const returnVisible = [...context.visibleLayers]
//   layerTypes.forEach((layerType) => {
//     const parts = layerType.split('~')
//     const availableItems = []
//     context.layers.forEach((l, lIndex) => {
//       if (l.layerType.startsWith(parts[0])) {
//         returnVisible[lIndex] = false
//       }
//       if (l.layerType === layerType) {
//         availableItems.push(lIndex)
//       }
//     })
//     returnVisible[
//       availableItems[Math.floor(Math.random() * availableItems.length)]
//     ] = true
//   })
//   return returnVisible
// }

const machine = createMachine({
  predictableActionArguments: true,
  initial: 'loading',
  context: {
    countdown_eyes: 0,
    countdown_head: 0,
    countdown_keyboard: 0,
    countdown_mouth: 0,
    countdown_shoulders: 0,
    countdown_snout: 0,
  },
  states: {
    loading: {
      entry: log('started!'),
      on: {
        KICKOFF: { target: 'alive' },
      },
    },
    alive: {
      type: 'parallel',
      states: {
        layers: {
          initial: 'eyes',
          states: {
            eyes: {
              entry: [
                // log('STATE: Updating eyes'),
                assign({
                  countdown_eyes: (ctx) => {
                    console.log(ctx.countdown_eyes)
                    if (ctx.countdown_eyes === 0) {
                      return 30
                    } else {
                      return ctx.countdown_eyes - 1
                    }
                  }
                }),
              ],
              after: { target: 'head' },
            },
            head: {
              // entry: log('STATE: Updating head'),
              after: { target: 'keyboard' },
            },
            keyboard: {
              // entry: log('STATE: Updating keyboard'),
              after: { target: 'mouth' },
            },
            mouth: {
              // entry: log('STATE: Updating mouth'),
              after: { target: 'shoulders' },
            },
            shoulders: {
              // entry: log('STATE: Updating shoulders'),
              after: { target: 'snout' },
            },
            snout: {
              // entry: log('STATE: Updating snout'),
              after: { target: 'delay' },
            },
            delay: {
              // entry: log('STATE: delay'),
              after: [
                {
                  delay: () => {
                    return Math.floor(Math.random() * 380) + 360
                  },
                  target: 'eyes',
                },
              ],
            },
          },
        },
      },
    },
  },
})

const actor = interpret(machine).start()

// actor.subscribe((state) => {
//   const layersToRender = ['shoulders~forward~base']
//   if (state.context.isTyping) {
//     layersToRender.push(`keyboard~active~${state.context.typingKeyboard}`)
//   } else {
//     layersToRender.push(`keyboard~inactive`)
//   }
//   window.requestAnimationFrame(() => {
//     if (state.context.layers[0]) {
//       state.context.layers[0].rows.forEach((row, rIndex) => {
//         row.forEach((pixel, pIndex) => {
//           theGrid[rIndex][pIndex].innerText = ' '
//         })
//       })
//       state.context.layers.forEach((layer, lIndex) => {
//         if (layersToRender.includes(layer.layerType)) {
//           layer.rows.forEach((row, rIndex) => {
//             row.forEach((pixel, pIndex) => {
//               if (pixel.char !== '') {
//                 theGrid[rIndex][pIndex].innerText = pixel.char
//               }
//             })
//           })
//         }
//       })
//     }
//   })
// })

// const machine = createMachine({
//   predictableActionArguments: true,
//   initial: 'loading',
//   context: {
//     parts: {
//       eyes: null,
//       head: null,
//       keyboard: null,
//       mouth: null,
//       snout: null,
//     },
//     markers: {
//       isTyping: false,
//       pointing: 'forward',
//     },
//     markers_pointing: 'forward',
//     layers: [],
//     // visibleLayers: [],
//   },
//   states: {
//     loading: {
//       entry: log('started!'),
//       on: {
//         KICKOFF: {
//           target: 'alive',
//           actions: (context, event) => {
//             context.layers = event.struct.layers
//             // context.layers.forEach((l) => {
//             //   context.visibleLayers.push(false)
//             // })
//           },
//         },
//       },
//     },
//     alive: {
//       type: 'parallel',
//       states: {
//         markers: {
//           type: 'parallel',
//           states: {
//             pointing: {
//               entry: [
//                 log('STATE: pointing updated'),
//                 assign({
//                   markers_pointing: (context) => {
//                     console.log(context.markers_pointing)
//                     return 'looking'
//                   },
//                 }),
//               ],
//               after: [
//                 {
//                   delay: (context, event) => {
//                     return Math.floor(Math.random() * 4180) + 1360
//                   },
//                   target: 'pointing',
//                 },
//               ],
//              },
//           },
//         },

//         parts: {
//           type: 'parallel',
//           states: {

//             // head: {
//             //   entry: [
//             //     log('STATE: head updated'),
//             //     assign({
//             //       markers_pointing: (context) => {
//             //         console.log(context.markers_pointing)
//             //         return 'looking'
//             //       },
//             //     }),
//             //   ],
//             //   after: [
//             //     {
//             //       delay: (context, event) => {
//             //         return Math.floor(Math.random() * 4180) + 1360
//             //       },
//             //       target: 'head',
//             //     },
//             //   ],
//             // },

//           },
//         },

//         typing: {
//           initial: 'notTyping',
//           states: {
//             notTyping: {
//               entry: [
//                 log('STATE: notTyping'),
//                 assign({
//                   markers: { isTyping: false },
//                 }),
//               ],
//               on: { STARTTYPING: { target: ['isTyping'] } },
//             },
//             isTyping: {
//               entry: [
//                 log('STATE: isTyping'),
//                 assign({ markers: { isTyping: true } }),
//               ],
//               on: { STARTTYPING: { target: ['isTyping'] } },
//               after: {
//                 581: { target: 'notTyping' },
//                 //2581: [{target: 'notTyping'}, send('STOPTYPING'), log('STATE: asdf')]
//               },
//             },
//           },
//         },
//       },
//     },
//   },
// })

// actions: (context, event) => {
//   context.layers = event.struct.layers
//   // context.layers.forEach((l) => {
//   //   context.visibleLayers.push(false)
//   // })
// },

// const machine = createMachine({
//   predictableActionArguments: true,
//   initial: 'loading',
//   context: {
//     typingKeyboard: 0,
//     isTyping: false,
//     layers: [],
//     // visibleLayers: [],
//   },
//   states: {
//     loading: {
//       entry: log('started!'),
//       on: {
//         KICKOFF: {
//           target: 'alive',
//           actions: (context, event) => {
//             context.layers = event.struct.layers
//             // context.layers.forEach((l) => {
//             //   context.visibleLayers.push(false)
//             // })
//           },
//         },
//       },
//     },
//     alive: {
//       type: 'parallel',
//       states: {
//         currentKeyboard: {
//           initial: 'keyboardRotator',
//           states: {
//             keyboardRotator: {
//               entry: [
//                 // log('STATE: rotationKeyboard'),
//                 assign({
//                   typingKeyboard: (context) => {
//                     //console.log(context)
//                     // TODO: Make this dynamic based off the layers
//                     return Math.floor(Math.random() * 11)
//                   },
//                 }),
//               ],
//               after: [
//                 {
//                   delay: (context, event) => {
//                     //return Math.floor(Math.random() * 180) + 60
//                     return 180
//                   },
//                   target: 'keyboardRotator',
//                 },
//               ],
//             },
//           },
//         },
//         typing: {
//           initial: 'notTyping',
//           states: {
//             notTyping: {
//               entry: [
//                 // log('STATE: notTyping'),
//                 assign({
//                   isTyping: () => {
//                     return false
//                   },
//                 }),
//               ],
//               on: { STARTTYPING: { target: ['isTyping'] } },
//             },
//             isTyping: {
//               entry: [
//                 // log('STATE: isTyping'),
//                 assign({ isTyping: true }),
//               ],
//               on: { STARTTYPING: { target: ['isTyping'] } },
//               after: {
//                 581: { target: 'notTyping' },
//                 //2581: [{target: 'notTyping'}, send('STOPTYPING'), log('STATE: asdf')]
//               },
//             },
//           },
//         },
//         runner: {
//           initial: 'forward',
//           states: {
//             forward: {
//               entry: [send('STOPTYPING'), log('STATE: forward')],
//               on: { STARTTYPING: { target: ['looking'] } },
//             },

//             looking: {
//               on: { STOPTYPING: { target: ['forward'] } },
//               entry: log('STATE: looking'),
//               after: {
//                 1581: {
//                   target: 'down',
//                 },
//               },
//             },
//             down: {
//               on: { STOPTYPING: { target: ['forward'] } },
//               entry: log('STATE: down'),
//               after: {
//                 1581: {
//                   target: 'looking',
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   },
// })

// keeptyping: {
//   entry: [log('STATE: keeptyping')],
//   on: { STARTTYPING: { target: ['keeptyping']} },
//   after: {
//     2581: [send('STOPTYPING'), log('STATE: asdf')]
//   },
// },

// positions: {
//   initial: 'forward',
//   states: {
//     forward: {
//       entry: send('STOPTYPING'),
//       on: { STARTTYPING: 'looking' },
//     },
//     looking: {
//       entry: log('STATE: looking'),
//       on: { STARTTYPING: 'looking' },
//       after: {
//         581: {
//           target: 'forward',
//         },
//       },
//     },
//   },
// },

// const machine = createMachine({
//   predictableActionArguments: true,
//   initial: 'loading',
//   context: {
//     layers: [],
//     visibleLayers: [],
//   },
//   states: {
//     loading: {
//       entry: log('started!'),
//       on: {
//         KICKOFF: {
//           target: 'alive',
//           actions: (context, event) => {
//             context.layers = event.struct.layers
//             context.layers.forEach((l) => {
//               context.visibleLayers.push(false)
//             })
//           },
//         },
//       },
//     },
//     alive: {
//       type: 'parallel',
//       states: {
//         runner: {
//           initial: 'forward',
//           states: {
//             forward: {
//               entry: send('STOPTYPING'),
//               on: { STARTTYPING: 'looking' },

//               // entry: log('STATE: forward'),
//               // entry: {
//               //   actions: (send) => {send('STOPTYPING')}
//               // },
//               // entry: {
//               //   // actions: () => {send('STOPTYPING')}
//               // },

//               // invoke: {
//               //   src: () => async (send) => {
//               //     send('STOPTYPING')
//               //   },
//               //   onError: {
//               //     target: 'looking',
//               //   },
//               // },

//             },
//             looking: {
//               entry: log('STATE: looking'),
//               on: { STARTTYPING: 'looking' },
//               after: {
//                 581: {
//                   target: 'forward',
//                 },
//               },
//             },
//           },
//         },
//         eyes: {
//           initial: 'forward',
//           states: {
//             forward: {
//               on: { STARTTYPING: 'looking' },
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['eyes~forward~open'], context)
//                 },
//               }),
//             },
//             looking: {
//               on: { STOPTYPING: 'forward' },
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['eyes~looking~open'], context)
//                 },
//               }),
//             },
//           },
//         },
//         head: {
//           initial: 'forward',
//           states: {
//             forward: {
//               on: { STARTTYPING: 'looking' },
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['head~forward~base'], context)
//                 },
//               }),
//             },
//             looking: {
//               on: { STOPTYPING: 'forward' },
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['head~looking~base'], context)
//                 },
//               }),
//             },
//           },
//         },
//         snout: {
//           initial: 'forward',
//           states: {
//             forward: {
//               on: { STARTTYPING: 'looking' },
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['snout~forward~up'], context)
//                 },
//               }),
//             },
//             looking: {
//               on: { STOPTYPING: 'forward' },
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['snout~looking~base'], context)
//                 },
//               }),
//             },
//           },
//         },
//       },
//     },
//   },
// })

// const machine = createMachine({
//   predictableActionArguments: true,
//   initial: 'loading',
//   context: {
//     layers: [],
//     visibleLayers: [],
//   },
//   states: {
//     loading: {
//       entry: log('started!'),
//       on: {
//         KICKOFF: {
//           target: 'baseline',
//           actions: (context, event) => {
//             context.layers = event.struct.layers
//             context.layers.forEach((l) => {
//               context.visibleLayers.push(false)
//             })
//           },
//         },
//       },
//     },

//     baseline: {
//       initial: 'headForward',
//       states: {
//         headForward: {
//           type: 'parallel',
//           states: {
//             headUp: {
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(
//                     ['head~forward~base', 'shoulders~forward~base'],
//                     context
//                   )
//                 },
//               }),
//             },

//             keyboard: {
//               initial: 'notTyping',
//               states: {
//                 notTyping: {
//                   on: { STARTTYPING: 'isTyping' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['keyboard~forward~base'], context)
//                     },
//                   }),
//                 },
//                 isTyping: {
//                   on: { STARTTYPING: 'isTyping' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['keyboard~forward~typing'], context)
//                     },
//                   }),
//                   after: {
//                     581: {
//                       target: 'notTyping',
//                     },
//                   },
//                 },
//               },
//             },

//             snout: {
//               initial: 'snoutUp',
//               states: {
//                 snoutUp: {
//                   on: { STARTTYPING: 'snoutDown' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['snout~forward~up'], context)
//                     },
//                   }),

//                   initial: 'mouthClosed',
//                   states: {
//                     mouthClosed: {
//                       on: { STARTTALKING: 'mouthMoving' },
//                       entry: assign({
//                         visibleLayers: (context) => {
//                           return pickOption(['mouth~forward~closed'], context)
//                         },
//                       }),
//                     },
//                     mouthMoving: {
//                       on: { STARTTALKING: 'mouthMoving' },
//                       entry: assign({
//                         visibleLayers: (context) => {
//                           return pickOption(['mouth~forward~open'], context)
//                         },
//                       }),
//                       after: {
//                         81: {
//                           target: 'mouthClosed',
//                         },
//                       },
//                     },
//                   },
//                 },
//                 snoutDown: {
//                   on: { STARTTYPING: 'snoutDown' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['snout~forward~down'], context)
//                     },
//                   }),
//                   after: {
//                     581: {
//                       target: 'snoutUp',
//                     },
//                   },
//                   initial: 'mouthClosed',
//                   states: {
//                     mouthClosed: {
//                       on: { STARTTALKING: 'mouthMoving' },
//                       entry: assign({
//                         visibleLayers: (context) => {
//                           return pickOption(['mouth~down~closed'], context)
//                         },
//                       }),
//                     },
//                     mouthMoving: {
//                       on: { STARTTALKING: 'mouthMoving' },
//                       entry: assign({
//                         visibleLayers: (context) => {
//                           return pickOption(['mouth~down~open'], context)
//                         },
//                       }),
//                       after: {
//                         81: {
//                           target: 'mouthClosed',
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//             },

//             eyes: {
//               initial: 'eyesForwardOpen',
//               states: {
//                 eyesForwardOpen: {
//                   on: { STARTTYPING: 'eyesDownOpen' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['eyes~forward~open'], context)
//                     },
//                   }),

//                   after: [
//                     {
//                       delay: (context, event) => {
//                         return Math.floor(Math.random() * 4500) + 4000
//                       },
//                       target: 'eyesForwardBlink',
//                     },
//                   ],
//                 },

//                 eyesForwardBlink: {
//                   on: { STARTTYPING: 'eyesDownOpen' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['eyes~forward~blink'], context)
//                     },
//                   }),
//                   after: [
//                     {
//                       delay: (context, event) => {
//                         return Math.floor(Math.random() * 60) + 85
//                       },
//                       target: 'eyesForwardOpen',
//                     },
//                   ],
//                 },

//                 eyesDownOpen: {
//                   on: { STARTTYPING: 'eyesDownOpen' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['eyes~down~open'], context)
//                     },
//                   }),
//                   after: {
//                     581: {
//                       target: 'eyesForwardOpen',
//                     },
//                   },
//                 },
//               },
//             },
//           },
//           on: {
//             STARTLOOKING: {
//               target: 'headLooking',
//             },
//           },
//         },

//         headLooking: {
//           type: 'parallel',
//           states: {
//             head: {
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(
//                     ['head~looking~base', 'shoulders~looking~base'],
//                     context
//                   )
//                 },
//               }),
//             },

//             keyboard: {
//               initial: 'notTyping',
//               states: {
//                 notTyping: {
//                   on: { STARTTYPING: 'isTyping' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['keyboard~forward~base'], context)
//                     },
//                   }),
//                 },
//                 isTyping: {
//                   on: { STARTTYPING: 'isTyping' },
//                   entry: assign({
//                     visibleLayers: (context) => {
//                       return pickOption(['keyboard~forward~typing'], context)
//                     },
//                   }),
//                   after: {
//                     581: {
//                       target: 'notTyping',
//                     },
//                   },
//                 },
//               },
//             },

//             snout: {
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['snout~looking~base'], context)
//                 },
//               }),
//             },

//             eyes: {
//               entry: assign({
//                 visibleLayers: (context) => {
//                   return pickOption(['eyes~looking~open'], context)
//                 },
//               }),
//             },
//           },
//         },
//       },
//     },
//   },
// })

// const actor = interpret(machine).start()

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

// actor.subscribe((state) => {
//   console.log(state.context.isTyping)
//   window.requestAnimationFrame(() => {
//     if (state.context.layers[0]) {
//       state.context.layers[0].rows.forEach((row, rIndex) => {
//         row.forEach((pixel, pIndex) => {
//           theGrid[rIndex][pIndex].innerText = ' '
//         })
//       })
//       state.context.layers.forEach((layer, lIndex) => {
//         if (state.context.visibleLayers[lIndex]) {
//           layer.rows.forEach((row, rIndex) => {
//             row.forEach((pixel, pIndex) => {
//               if (pixel.char !== '') {
//                 theGrid[rIndex][pIndex].innerText = pixel.char
//               }
//             })
//           })
//         }
//       })
//     }
//   })
// })

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
