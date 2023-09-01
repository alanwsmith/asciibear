import {
  assign,
  createMachine,
  interpret,
  log,
} from '/scripts/xstate_4_38_2_dist_web.js'


class Bear {
  constructor() {
    this.actor = null
    this.frameCount = 0
    this.grid = []
    this.layers = []
    this.messageCount = 0
    this.ws = null
    this.gridBgRows = 42
    this.gridBgCols = 130
    this.machine = createMachine(
      {
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
          countdown_speech_bubble: 0,
          isMousing: false,
          isTalking: false,
          isTyping: false,
          lastActiveKeyboard: null,
          lastActiveMouse: null,
          lastWater: null,
          pointing: 'forward',
          visibleLayers: [],
          currentSpeechBubble: null,
        },
        states: {
          loading: {
            entry: log('Starting...'),
            on: {
              KICKOFF: { target: 'alive' },
            },
          },
          alive: {
            type: 'parallel',
            states: {
              saying: {
                on: {
                  SAYHI: {
                    actions: ['sayHiToChat'],
                  },
                },
              },

              mousing: {
                initial: 'mouseNotMoving',
                states: {
                  mouseNotMoving: {
                    on: { STARTMOUSING: { target: ['mouseMoving'] } },
                    entry: [
                      assign({
                        isMousing: false,
                        // isMousingBuffer: 0,
                      }),
                    ],
                  },
                  mouseMoving: {
                    on: { STARTMOUSING: { target: ['mouseMoving'] } },
                    entry: [
                      assign({
                        // isMousingBuffer: (context) => {
                        //   return context.isMousingBuffer + 1
                        // },
                        isMousing: (context) => {
                          // if (context.isMousingBuffer > 10) {
                          return true
                          // } else {
                          //   return false
                          // }
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
                    after: { target: 'speech_bubble_countdown' },
                  },
                  speech_bubble_countdown: {
                    entry: [
                      assign({
                        countdown_speech_bubble: (context) => {
                          if (context.countdown_speech_bubble !== 0) {
                            return context.countdown_speech_bubble - 1
                          } else {
                            return 0
                          }
                        },
                      }),
                    ],
                    after: { target: 'clear_speech_bubble' },
                  },

                  clear_speech_bubble: {
                    entry: [
                      assign({
                        currentSpeechBubble: (context) => {
                          if (context.countdown_speech_bubble === 0) {
                            return null
                          } else {
                            return context.currentSpeechBubble
                          }
                        },
                        visibleLayers: (context) => {
                          const newLayers = [...context.visibleLayers]
                          if (context.countdown_speech_bubble !== 0) {
                            newLayers.push(this.pickLayer('speech-bubble-mat'))
                            newLayers.push(this.pickLayer('speech-bubble'))
                          }
                          return newLayers
                        },
                      }),
                    ],
                    after: { target: 'eyes_countdown' },
                  },

                  eyes_countdown: {
                    entry: [
                      assign({
                        countdown_eyes: (context) => {
                          if (context.countdown_eyes === 0) {
                            return Math.floor(Math.random() * 30) + 18
                          } else {
                            return context.countdown_eyes - 1
                          }
                        },
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
                            return Math.floor(Math.random() * 7) + 7
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
                            return 3
                          } else {
                            return context.countdown_water - 1
                          }
                        },
                      }),
                    ],
                    after: { target: 'speech_bubble_switch' },
                  },

                  speech_bubble_switch: {
                    entry: [assign({})],
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
                    after: { target: 'hottub_switch' },
                  },

                  hottub_switch: {
                    entry: [
                      assign({
                        visibleLayers: (context) => {
                          const newLayers = [...context.visibleLayers]
                          newLayers.push(this.pickLayer('hottub-border-mat'))
                          newLayers.push(this.pickLayer('hottub-border'))
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
                            newLayers.push(this.pickLayer('looking-head-mat'))
                            newLayers.push(this.pickLayer('looking-head-base'))
                          } else {
                            newLayers.push(this.pickLayer('forward-head-mat'))
                            newLayers.push(this.pickLayer('forward-head-base'))
                          }
                          return newLayers
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
                              newLayers.push(
                                this.pickLayer('looking-eyes-blinking')
                              )
                            } else {
                              newLayers.push(
                                this.pickLayer('looking-eyes-open')
                              )
                            }
                          } else {
                            if (context.isTyping) {
                              if (context.countdown_eyes === 0) {
                                newLayers.push(
                                  this.pickLayer('typing-eyes-blinking')
                                )
                              } else {
                                newLayers.push(
                                  this.pickLayer('typing-eyes-open')
                                )
                              }
                            } else {
                              if (context.countdown_eyes === 0) {
                                newLayers.push(
                                  this.pickLayer('forward-eyes-blinking')
                                )
                              } else {
                                newLayers.push(
                                  this.pickLayer('forward-eyes-open')
                                )
                              }
                            }
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
                              return this.pickLayer('mouse-keyboard')
                            } else if (context.countdown_keyboard === 0) {
                              return this.pickLayer('mouse-keyboard')
                            } else {
                              return context.lastActiveKeyboard
                              //return this.pickLayer('mouse-keyboard')
                            }
                          } else {
                            if (context.lastActiveKeyboard === null) {
                              return this.pickLayer('keyboard-active')
                            } else if (context.countdown_keyboard === 0) {
                              return this.pickLayer('keyboard-active')
                            } else {
                              return context.lastActiveKeyboard
                              //return this.pickLayer('keyboard-active')
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
                              return this.pickLayer('hottub-keyboard-active')
                            } else if (context.countdown_keyboard === 0) {
                              return this.pickLayer('hottub-keyboard-active')
                            } else {
                              return context.lastActiveKeyboard
                            }
                          } else {
                            if (context.lastActiveKeyboard === null) {
                              return this.pickLayer('hottub-keyboard-active')
                            } else if (context.countdown_keyboard === 0) {
                              return this.pickLayer('hottub-keyboard-active')
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
                            //newLayers.push(this.pickLayer('keyboard-active'))
                          } else {
                            newLayers.push(
                              this.pickLayer('keyboard-hottub-inactive')
                            )
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
                            return this.pickLayer('mouse-active')
                          } else if (context.countdown_mouse === 0) {
                            return this.pickLayer('mouse-active')
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
                            newLayers.push(this.pickLayer('mouse-active-mat'))
                            newLayers.push(context.lastActiveMouse)
                          } else {
                            newLayers.push(this.pickLayer('mouse-inactive'))
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
                              newLayers.push(
                                this.pickLayer('looking-mouth-talking')
                              )
                            } else {
                              if (context.isTyping) {
                                newLayers.push(
                                  this.pickLayer('typing-mouth-talking')
                                )
                              } else {
                                newLayers.push(
                                  this.pickLayer('forward-mouth-talking')
                                )
                              }
                            }
                          } else {
                            if (context.pointing === 'looking') {
                              newLayers.push(
                                this.pickLayer('looking-mouth-closed')
                              )
                            } else {
                              if (context.isTyping) {
                                newLayers.push(
                                  this.pickLayer('typing-mouth-closed')
                                )
                              } else {
                                newLayers.push(
                                  this.pickLayer('forward-mouth-closed')
                                )
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
                            newLayers.push(
                              this.pickLayer('looking-shoulders-base')
                            )
                          } else {
                            newLayers.push(
                              this.pickLayer('forward-shoulders-base')
                            )
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
                            newLayers.push(this.pickLayer('looking-snout-base'))
                          } else {
                            if (context.isTyping) {
                              newLayers.push(
                                this.pickLayer('forward-snout-down')
                              )
                            } else {
                              newLayers.push(this.pickLayer('forward-snout-up'))
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
                            return this.pickLayer('hottub-water')
                          } else if (context.countdown_water === 0) {
                            let newWater = null
                            for (let i = 0; i < 50; i++) {
                              newWater = this.pickLayer('hottub-water')
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
                          return Math.floor(Math.random() * 33) + 98
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
      },
      {
        actions: {
          sayHiToChat: (context, event) => {
            context.currentSpeechBubble = event.name
            context.countdown_speech_bubble = 42
          },
        },
      }
    )
  }

  make_background_grid_1() {
    const newT = document.createElement('table')
    newT.id = 'canvasBackgroundTable1'
    for (let r = 0; r <= this.gridBgRows; r++) {
      const newTr = document.createElement('tr')
      for (let c = 0; c <= this.gridBgCols; c++) {
        const newTd = document.createElement('td')
        newTd.classList.add('pixel')
        newTd.innerHTML = '.'
        newTr.appendChild(newTd)
      }
      newT.appendChild(newTr)
    }
    canvasBackground1.appendChild(newT)
  }

  make_background_grid_2() {
    const newT = document.createElement('table')
    newT.id = 'canvasBackgroundTable2'
    for (let r = 0; r <= this.gridBgRows; r++) {
      const newTr = document.createElement('tr')
      for (let c = 0; c <= this.gridBgCols; c++) {
        const newTd = document.createElement('td')
        newTd.classList.add('pixel')
        newTd.innerHTML = '.'
        newTr.appendChild(newTd)
      }
      newT.appendChild(newTr)
    }
    canvasBackground2.appendChild(newT)
  }

  make_grid(data) {
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
      const gcells = grows[grow].getElementsByTagName('td')
      for (let gcell = 0; gcell < gcells.length; gcell++) {
        newGrow.push(gcells[gcell])
      }
      this.grid.push(newGrow)
    }
  }

  make_speech_bubble_grid() {
    const speechDiv = document.createElement('div')
    speechDiv.id = 'speechDiv'
    speechBubble.appendChild(speechDiv)
  }

  pickLayer(layerType) {
    const possibleLayers = []
    this.layers.forEach((layer, layerIndex) => {
      if (layer.layerType === layerType) {
        possibleLayers.push(layerIndex)
      }
    })
    const theLayer =
      possibleLayers[Math.floor(Math.random() * possibleLayers.length)]
    return theLayer
  }

  start() {
    console.log('Initializing...')
    this.actor = interpret(this.machine).start()
    this.actor.subscribe((state) => {
      if (state.context.trigger) {
        window.requestAnimationFrame(() => {
          if (this.layers[0] !== undefined) {
            this.layers[0].rows.forEach((row, rIndex) => {
              row.forEach((pixel, pIndex) => {
                this.grid[rIndex][pIndex].innerText = ' '
                this.grid[rIndex][pIndex].classList.remove('activePixel')
              })
            })
            state.context.visibleLayers.forEach((lIndex) => {
              // lIndex might be undefined because of the way
              // this.pickLayer works. So, make sure it exists first
              if (lIndex !== undefined) {
                this.layers[lIndex].rows.forEach((row, rIndex) => {
                  this.layers[lIndex].layerName
                  row.forEach((pixel, pIndex) => {
                    if (pixel.char !== '') {
                      this.grid[rIndex][pIndex].classList = ''
                      this.grid[rIndex][pIndex].classList.add('pixel')
                      this.grid[rIndex][pIndex].classList.add('activePixel')
                      this.grid[rIndex][pIndex].innerText = pixel.char
                      this.grid[rIndex][pIndex].classList.add(
                        this.layers[lIndex].layerType
                      )
                    }
                  })
                })
              }
            })
            if (state.context.currentSayHi !== null) {
              speechDiv.innerHTML = state.context.currentSpeechBubble
            } else {
              speechDiv.innerHTML = ''
            }
          }
        })
      }
    })
    this.ws = new WebSocket('ws://127.0.0.1:3302/ws')
    this.ws.onopen = (event) => {
      console.log('Connected to websocket')
      console.log(new Date())
    }

    this.ws.onmessage = (event) => {
      // console.log(event)
      const payload = JSON.parse(event.data)
      if (payload.key !== 'db' && payload.key !== 'key' && payload.key !== 'mousemove') {
        console.log(payload)
      }

      if (payload.key === 'db') {
        if (payload.value > 0.006) {
          this.actor.send({ type: 'STARTTALKING' })
        }
      } else if (payload.key === 'bearcolorhead') {
        const newStyleSheet = document.createElement('style')
        const newStyleText = document.createTextNode(
          `.forward-head-base, .looking-head-base, .looking-snout-base, .looking-mouth-closed, .looking-mouth-talking, .forward-snout-up, .forward-snout-down, .forward-mouth-closed, .forward-mouth-talking, .typing-mouth-closed, .typing-mouth-talking {
            color: rgb(${payload.value[0]}, ${payload.value[1]}, ${payload.value[2]});
          }`
        )
        newStyleSheet.appendChild(newStyleText)
        document.head.appendChild(newStyleSheet)
      } else if (payload.key === 'key') {
        this.actor.send({ type: 'STARTTYPING' })

      } else if (payload.key === 'mousemove') {
        this.actor.send({ type: 'STARTMOUSING' })
      } else if (payload.key === 'bearcolorbody') {
        // console.log(payload)
        const newStyleSheet = document.createElement('style')
        const newStyleText = document.createTextNode(
          `.forward-shoulders-base, .looking-shoulders-base {
            color: rgb(${payload.value[0]}, ${payload.value[1]}, ${payload.value[2]});
          }`
        )
        newStyleSheet.appendChild(newStyleText)
        document.head.appendChild(newStyleSheet)
      } else if (payload.key === 'bearcoloreyes') {
        const newStyleSheet = document.createElement('style')
        const newStyleText = document.createTextNode(
          `.looking-eyes-open, .looking-eyes-blinking, .forward-eyes-open, .typing-eyes-open, .typing-eyes-blinking, .forward-eyes-blinking {
            color: rgb(${payload.value[0]}, ${payload.value[1]}, ${payload.value[2]});
      }`
        )
        newStyleSheet.appendChild(newStyleText)
        document.head.appendChild(newStyleSheet)
      } else if (payload.key === 'bearcolorkeys') {
        const newStyleSheet = document.createElement('style')
        const newStyleText = document.createTextNode(
          `.keyboard-inactive, .keyboard-active, .mouse-keyboard, .mouse-inactive, .mouse-active {
            color: rgb(${payload.value[0]}, ${payload.value[1]}, ${payload.value[2]});
      }`
        )
        newStyleSheet.appendChild(newStyleText)
        document.head.appendChild(newStyleSheet)
      } else if (payload.key === 'sayhi') {
        // console.log('Got Rust Message To Say Hi')
        this.actor.send({ type: 'SAYHI', name: payload.value })
      } else if (payload.key === 'screen_position') {
      } else if (payload.key === 'test') {
        console.log(payload)
      }
    }

    const req = new Request('/bears.json')
    fetch(req)
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        this.make_background_grid_1(data)
        this.make_background_grid_2(data)
        this.make_grid(data)
        this.make_speech_bubble_grid(data)
        this.layers = data.layers
        this.actor.send({ type: 'KICKOFF' })
      })
  }
}

export { Bear }
