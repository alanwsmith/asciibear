const { assign, createMachine, interpret, actions, send } = XState
const { log } = actions

const theGrid = []
let layers = []

const pickLayer = (layerType) => {
  const possibleLayers = []
  layers.forEach((layer, layerIndex) => {
    if (layer.layerType === layerType) {
      possibleLayers.push(layerIndex)
    }
  })
  return possibleLayers[Math.floor(Math.random() * possibleLayers.length)]
}

const machine = createMachine({
  predictableActionArguments: true,
  initial: 'loading',
  context: {
    countdown_eyes: 0,
    countdown_keyboard: 0,
    countdown_mouse: 0,
    countdown_mouth: 0,
    countdown_pointing: 0,
    countdown_shoulders: 0,
    countdown_snout: 0,
    countdown_water: 0,
    isMousing: false,
    isMousingBuffer: 0,
    isTalking: false,
    isTyping: false,
    lastActiveKeyboard: null,
    lastActiveMouse: null,
    lastWater: null,
    pointing: 'forward',
    visibleLayers: [],
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
        mousing: {
          initial: 'mouseNotMoving',
          states: {
            mouseNotMoving: {
              on: { STARTMOUSING: { target: ['mouseMoving'] } },
              entry: [
                assign({
                  isMousing: false,
                  isMousingBuffer: 0,
                }),
              ],
            },
            mouseMoving: {
              on: { STARTMOUSING: { target: ['mouseMoving'] } },
              entry: [
                assign({
                  isMousingBuffer: (context) => {
                    return context.isMousingBuffer + 1
                  },
                  isMousing: (context) => {
                    if (context.isMousingBuffer > 10) {
                      return true
                    } else {
                      return false
                    }
                  },
                }),
              ],
              after: [
                {
                  delay: () => {
                    return 450
                  },
                  target: 'mouseNotMoving',
                },
              ],
            },
          },
        },

        talking: {
          initial: 'mouthNotMoving',
          states: {
            mouthNotMoving: {
              on: { STARTTALKING: { target: ['mouthMoving'] } },
              entry: [
                assign({
                  isTalking: () => {
                    return false
                  },
                }),
              ],
            },
            mouthMoving: {
              on: { STARTTALKING: { target: ['mouthMoving'] } },
              entry: [
                assign({
                  isTalking: () => {
                    return true
                  },
                }),
              ],
              after: [
                {
                  delay: () => {
                    return 150
                  },
                  target: 'mouthNotMoving',
                },
              ],
            },
          },
        },

        typing: {
          initial: 'typingOff',
          states: {
            typingOff: {
              on: { STARTTYPING: { target: ['isTyping'] } },
              entry: [
                assign({
                  isTyping: () => {
                    return false
                  },
                }),
              ],
            },
            isTyping: {
              on: { STARTTYPING: { target: ['isTyping'] } },
              entry: [
                assign({
                  isTyping: () => {
                    return true
                  },
                }),
              ],
              after: [
                {
                  delay: () => {
                    return 410
                  },
                  target: 'typingOff',
                },
              ],
            },
          },
        },

        layers: {
          initial: 'start_update',
          states: {
            start_update: {
              entry: [
                assign({
                  trigger: false,
                  visibleLayers: [],
                }),
              ],
              after: { target: 'eyes_countdown' },
            },
            eyes_countdown: {
              entry: [
                // log('STATE: Updating eyes'),
                assign({
                  countdown_eyes: (context) => {
                    if (context.countdown_eyes === 0) {
                      return Math.floor(Math.random() * 30) + 18
                    } else {
                      return context.countdown_eyes - 1
                    }
                  },
                  trigger: false,
                }),
              ],
              after: { target: 'keyboard_countdown' },
            },
            keyboard_countdown: {
              entry: [
                assign({
                  countdown_keyboard: (context) => {
                    if (context.countdown_keyboard === 0) {
                      const randNum = Math.floor(Math.random() * 10)
                      if (randNum > 9) {
                        return 3
                      } else if (randNum > 7) {
                        return 2
                      } else {
                        return 1
                      }
                    } else {
                      return context.countdown_keyboard - 1
                    }
                  },
                }),
              ],
              after: { target: 'mouse_countdown' },
            },
            mouse_countdown: {
              entry: [
                assign({
                  countdown_mouse: (context) => {
                    if (context.countdown_mouse === 0) {
                      const randNum = Math.floor(Math.random() * 10)
                      if (randNum > 9) {
                        return 4
                      } else if (randNum > 7) {
                        return 3
                      } else {
                        return 2
                      }
                    } else {
                      return context.countdown_mouse - 1
                    }
                  },
                }),
              ],
              after: { target: 'mouth_countdown' },
            },
            mouth_countdown: {
              after: { target: 'pointing_countdown' },
            },
            pointing_countdown: {
              entry: [
                assign({
                  countdown_pointing: (context) => {
                    if (context.countdown_pointing === 0) {
                      return 12
                    } else {
                      return context.countdown_pointing - 1
                    }
                  },
                }),
              ],
              after: { target: 'shoulders_countdown' },
            },
            shoulders_countdown: {
              after: { target: 'snout_countdown' },
            },
            snout_countdown: {
              after: { target: 'water_countdown' },
            },
            water_countdown: {
              entry: [
                assign({
                  countdown_water: (context) => {
                    if (context.countdown_water === 0) {
                      const randNum = Math.floor(Math.random() * 10)
                      if (randNum > 9) {
                        return 2
                      } else if (randNum > 7) {
                        return 2
                      } else {
                        return 2
                      }
                    } else {
                      return context.countdown_water - 1
                    }
                  },
                }),
              ],
              after: { target: 'pointing_switch' },
            },
            pointing_switch: {
              entry: [
                assign({
                  pointing: (context) => {
                    if (context.isTyping) {
                      if (context.countdown_pointing === 0) {
                        return ['looking', 'forward'][
                          Math.floor(Math.random() * 2)
                        ]
                      } else {
                        return context.pointing
                      }
                    } else if (context.isMousing) {
                      return 'looking'
                    } else {
                      return 'forward'
                    }
                  },
                }),
              ],
              after: { target: 'eyes_switch' },
            },
            eyes_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    if (context.pointing === 'looking') {
                      if (context.countdown_eyes === 0) {
                        newLayers.push(pickLayer('looking-eyes-blinking'))
                      } else {
                        newLayers.push(pickLayer('looking-eyes-open'))
                      }
                    } else {
                      if (context.isTyping) {
                        if (context.countdown_eyes === 0) {
                          newLayers.push(pickLayer('typing-eyes-blinking'))
                        } else {
                          newLayers.push(pickLayer('typing-eyes-open'))
                        }
                      } else {
                        if (context.countdown_eyes === 0) {
                          newLayers.push(pickLayer('forward-eyes-blinking'))
                        } else {
                          newLayers.push(pickLayer('forward-eyes-open'))
                        }
                      }
                    }
                    return newLayers
                  },
                }),
              ],
              after: { target: 'head_switch' },
            },
            head_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    if (context.pointing === 'looking') {
                      newLayers.push(pickLayer('looking-head-base'))
                    } else {
                      newLayers.push(pickLayer('forward-head-base'))
                    }
                    return newLayers
                  },
                }),
              ],
              after: { target: 'hottub_keyboard_pick' },
            },
            keyboard_pick: {
              entry: [
                assign({
                  lastActiveKeyboard: (context) => {
                    if (context.isMousing) {
                      if (context.lastActiveKeyboard === null) {
                        return pickLayer('mouse-keyboard')
                      } else if (context.countdown_keyboard === 0) {
                        return pickLayer('mouse-keyboard')
                      } else {
                        return context.lastActiveKeyboard
                        //return pickLayer('mouse-keyboard')
                      }
                    } else {
                      if (context.lastActiveKeyboard === null) {
                        return pickLayer('keyboard-active')
                      } else if (context.countdown_keyboard === 0) {
                        return pickLayer('keyboard-active')
                      } else {
                        return context.lastActiveKeyboard
                        //return pickLayer('keyboard-active')
                      }
                    }
                  },
                }),
              ],
              after: { target: 'keyboard_switch' },
            },
            hottub_keyboard_pick: {
              entry: [
                assign({
                  lastActiveKeyboard: (context) => {
                    if (context.isMousing) {
                      if (context.lastActiveKeyboard === null) {
                        return pickLayer('hottub-keyboard-active')
                      } else if (context.countdown_keyboard === 0) {
                        return pickLayer('hottub-keyboard-active')
                      } else {
                        return context.lastActiveKeyboard
                      }
                    } else {
                      if (context.lastActiveKeyboard === null) {
                        return pickLayer('hottub-keyboard-active')
                      } else if (context.countdown_keyboard === 0) {
                        return pickLayer('hottub-keyboard-active')
                      } else {
                        return context.lastActiveKeyboard
                      }
                    }
                  },
                }),
              ],
              after: { target: 'keyboard_switch' },
            },
            keyboard_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    if (context.isTyping) {
                      newLayers.push(context.lastActiveKeyboard)
                      //newLayers.push(pickLayer('keyboard-active'))
                    } else {
                      newLayers.push(pickLayer('keyboard-hottub-inactive'))
                    }
                    return newLayers
                  },
                }),
              ],
              after: { target: 'mouse_pick' },
            },
            mouse_pick: {
              entry: [
                assign({
                  lastActiveMouse: (context) => {
                    if (context.lastActiveMouse === null) {
                      return pickLayer('mouse-active')
                    } else if (context.countdown_mouse === 0) {
                      return pickLayer('mouse-active')
                    } else {
                      return context.lastActiveMouse
                    }
                  },
                }),
              ],
              after: { target: 'mouse_switch' },
            },
            mouse_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    if (context.isMousing && !context.isTyping) {
                      newLayers.push(context.lastActiveMouse)
                    } else {
                      newLayers.push(pickLayer('mouse-inactive'))
                    }
                    return newLayers
                  },
                }),
              ],
              after: { target: 'mouth_switch' },
            },
            mouth_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    if (context.isTalking) {
                      if (context.pointing === 'looking') {
                        newLayers.push(pickLayer('looking-mouth-talking'))
                      } else {
                        if (context.isTyping) {
                          newLayers.push(pickLayer('typing-mouth-talking'))
                        } else {
                          newLayers.push(pickLayer('forward-mouth-talking'))
                        }
                      }
                    } else {
                      if (context.pointing === 'looking') {
                        newLayers.push(pickLayer('looking-mouth-closed'))
                      } else {
                        if (context.isTyping) {
                          newLayers.push(pickLayer('typing-mouth-closed'))
                        } else {
                          newLayers.push(pickLayer('forward-mouth-closed'))
                        }
                      }
                    }
                    return newLayers
                  },
                }),
              ],
              after: { target: 'shoulders_switch' },
            },
            shoulders_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    if (context.pointing === 'looking') {
                      newLayers.push(2)
                    } else {
                      newLayers.push(1)
                    }
                    return newLayers
                  },
                }),
              ],
              after: { target: 'snout_switch' },
            },
            snout_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    if (context.pointing === 'looking') {
                      newLayers.push(6)
                    } else {
                      if (context.isTyping) {
                        newLayers.push(17)
                      } else {
                        newLayers.push(16)
                      }
                    }
                    return newLayers
                  },
                }),
              ],
              after: { target: 'water_pick' },
            },
            water_pick: {
              entry: [
                assign({
                  lastWater: (context) => {
                    if (context.lastWater === null) {
                      return pickLayer('hottub-water')
                    } else if (context.countdown_water === 0) {
                      let newWater = null
                      for (let i=0; i<50; i++) {
                        newWater = pickLayer('hottub-water')
                        if (newWater !== context.lastWater) {
                          break
                        }
                      }
                      return newWater
                    } else {
                      return context.lastWater
                    }
                  },
                }),
              ],
              after: { target: 'water_switch' },
            },
            water_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    newLayers.push(context.lastWater)
                    return newLayers
                  },
                }),
              ],
              after: { target: 'hottub_switch' },
            },
            hottub_switch: {
              entry: [
                assign({
                  visibleLayers: (context) => {
                    const newLayers = [...context.visibleLayers]
                    newLayers.push(pickLayer("hottub-border"))
                    return newLayers
                  },
                }),
              ],
              after: { target: 'delay' },
            },

            delay: {
              entry: [
                // log((context, e) => `VL: ${context.isTyping}`),
                assign({ trigger: true }),
              ],
              after: [
                {
                  delay: () => {
                    return Math.floor(Math.random() * 30) + 80
                  },
                  target: 'start_update',
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

actor.subscribe((state) => {
  if (state.context.trigger) {
    window.requestAnimationFrame(() => {
      // console.log(state.context.countdown_pointing)
      // console.log(state.context.pointing)
      // console.log(state.context.visibleLayers)
      if (layers[0]) {
        layers[0].rows.forEach((row, rIndex) => {
          row.forEach((pixel, pIndex) => {
            theGrid[rIndex][pIndex].innerText = ' '
          })
        })
        layers.forEach((layer, lIndex) => {
          if (state.context.visibleLayers.includes(lIndex)) {
            layer.rows.forEach((row, rIndex) => {
              row.forEach((pixel, pIndex) => {
                if (pixel.char !== '') {
                  theGrid[rIndex][pIndex].classList = ''
                  theGrid[rIndex][pIndex].classList.add('pixel')
                  theGrid[rIndex][pIndex].innerText = pixel.char
                  theGrid[rIndex][pIndex].classList.add(layer.layerType)
                }
              })
            })
          }
        })
      }
    })
  }
})

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
  } else if (payload.key === 'mousemove') {
    actor.send({ type: 'STARTMOUSING' })
  } else if (payload.key === 'bearbody') {
    console.log(payload)
    const newStyleSheet = document.createElement('style')
    const newStyleText = document.createTextNode(
      `.forward-shoulders-base, .looking-shoulders-base {
      color: rgb(${payload.value.red}, ${payload.value.green}, ${payload.value.blue});
    }`
    )
    newStyleSheet.appendChild(newStyleText)
    document.head.appendChild(newStyleSheet)
  } else if (payload.key === 'beareyes') {
    const newStyleSheet = document.createElement('style')
    const newStyleText = document.createTextNode(
      `.looking-eyes-open, .looking-eyes-blinking, .forward-eyes-open, .typing-eyes-open, .typing-eyes-blinking, .forward-eyes-blinking {
        color: rgb(${payload.value.red}, ${payload.value.green}, ${payload.value.blue});
      }`
    )
    newStyleSheet.appendChild(newStyleText)
    document.head.appendChild(newStyleSheet)
  } else if (payload.key === 'bearhead') {
    const newStyleSheet = document.createElement('style')
    const newStyleText = document.createTextNode(
      `.forward-head-base, .looking-head-base, .looking-snout-base, .looking-mouth-closed, .looking-mouth-talking, .forward-snout-up, .forward-snout-down, .forward-mouth-closed, .forward-mouth-talking, .typing-mouth-closed, .typing-mouth-talking {
        color: rgb(${payload.value.red}, ${payload.value.green}, ${payload.value.blue});
      }`
    )
    newStyleSheet.appendChild(newStyleText)
    document.head.appendChild(newStyleSheet)
  } else if (payload.key === 'bearkeys') {
    const newStyleSheet = document.createElement('style')
    const newStyleText = document.createTextNode(
      `.keyboard-inactive, .keyboard-active, .mouse-keyboard, .mouse-inactive, .mouse-active {
        color: rgb(${payload.value.red}, ${payload.value.green}, ${payload.value.blue});
      }`
    )
    newStyleSheet.appendChild(newStyleText)
    document.head.appendChild(newStyleSheet)
  } else if (payload.key === 'screen_position') {
  }
}

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
      layers = data.layers
      actor.send({ type: 'KICKOFF' })
    })
}

document.addEventListener('DOMContentLoaded', init)

// actor.subscribe((state) => {
//   if (state.context.trigger) {
//     window.requestAnimationFrame(() => {
//       console.log(state.context.countdown_pointing)
//       console.log(state.context.pointing)
//       console.log(state.context.visibleLayers)
//       if (state.context.layers[0]) {
//         state.context.layers[0].rows.forEach((row, rIndex) => {
//           row.forEach((pixel, pIndex) => {
//             theGrid[rIndex][pIndex].innerText = ' '
//           })
//         })
//         state.context.layers.forEach((layer, lIndex) => {
//           if (state.context.visibleLayers.includes(lIndex)) {
//             layer.rows.forEach((row, rIndex) => {
//               row.forEach((pixel, pIndex) => {
//                 if (pixel.char !== '') {
//                   theGrid[rIndex][pIndex].innerText = pixel.char
//                 }
//               })
//             })
//           }
//         })
//       }
//     })
//   }
// })

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
