const { assign, createMachine, interpret, actions } = XState
const { log } = actions;

const theGrid = []
const layers = []


// const pickOption = (layerType, layers) => {
//   const options = []
//   layers.forEach((l, lIndex) => {
//     // console.log(l)
//     if (l.layerType === layerType) {
//       options.push(lIndex)
//     }
//   })
//   const randNum = Math.floor(Math.random() * options.length)
//   return options[randNum]
// }

const pickOption = (layerType, context) => {
  const availableItems = []
   context.layers.forEach((l, lIndex) => {
     if (l.layerType === layerType) {
       availableItems.push(lIndex)
     }
   })
  const returnVisible = [...context.visibleLayers]
  // const randNum = Math.floor(Math.random() * availableItems.length)

  returnVisible[
    availableItems[Math.floor(Math.random() * availableItems.length)]
  ] = true
  // returnVisible[3] = true
  // debugger
  return returnVisible 
}

const machine = createMachine({
  predictableActionArguments: true,
  initial: "loading",
  context: {
    layers: [],
    visibleLayers: [],
  },
  states: {
    loading: {
      entry: log('started!'),
      on: {
        KICKOFF: {
          target: "baseline",
          actions: (context, event) => {
            context.layers = event.struct.layers
            context.layers.forEach((l) => {
              context.visibleLayers.push(false)
            })
          }
        }
      },
    },

    baseline: {
      initial: 'headForward',
      states: {
        headForward: {
          type: 'parallel',
          states: {
            headUp: {
              entry: assign(
                {
                  visibleLayers: (context) => {
                    const newArray = [...context.visibleLayers]
                    newArray[0] = true
                    return newArray
                  }
                }
              )
            },
            eyes: {
              initial: 'forwardEyesOpen',
              states: {
                forwardEyesOpen: {
                  entry: assign(
                    {
                      visibleLayers: (context) => {
                        return pickOption("eyes~forward~open", context)
                      }
                    }
                  ),

                  // after: [
                  //   {
                  //     delay: (context, event) => {
                  //       return Math.floor(Math.random() * 4500) + 4000
                  //     },
                  //     target: 'forwardEyesBlink',
                  //   },
                  // ],

                },

                // forwardEyesBlink: {
                //   entry: assign(
                //     {
                //       visibleLayers: (context) => {
                //         const newArray = [...context.visibleLayers]
                //         newArray[3] = false
                //         newArray[5] = true
                //         return newArray
                //       }
                //     }
                //   ),
                //   after: [
                //     {
                //       delay: (context, event) => {
                //         return Math.floor(Math.random() * 60) + 85
                //       },
                //       target: 'forwardEyesOpen',
                //     },
                //   ],
                // }

              }
            },
          }
        }
      }

      // entry: ["loadIt"],
      // after: {
      //   83: {
      //     target: 'baseline',
      //   },
      // },

    }

  }
},


  // {
  //   actions: {
  //     loadIt: (context, event) => {
  //       // console.log("asdf")
  //       const items = ["forward_head", "down_snout", "down_eyes_open", "down_mouth_open", "keyboard_typing"]
  //       context.visibleLayers.forEach((l, lIndex) => {
  //         context.visibleLayers[lIndex] = false
  //       })
  //       items.forEach((item) => {
  //         context.visibleLayers[pickOption(item, context.layers)] = true
  //       })
  //     }
  //   }
  // }

)

const actor = interpret(machine).start()

actor.subscribe((state) => {
  window.requestAnimationFrame(() => {
    state.context.layers.forEach((layer, lIndex) => {
      layer.rows.forEach((row, rIndex) => {
        row.forEach((pixel, pIndex) => {
          theGrid[rIndex][pIndex].innerText = " "
        })
      })
    })


    state.context.layers.forEach((layer, lIndex) => {
      if (state.context.visibleLayers[lIndex]) {
        layer.rows.forEach((row, rIndex) => {
          row.forEach((pixel, pIndex) => {
            if (pixel.char !== "") {
              theGrid[rIndex][pIndex].innerText = pixel.char
            }
          })
        })
      }
    })
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

  const newT = document.createElement("table")
  newT.id = "bearTable"
  for (let r = 0; r <= rows; r++) {
    const newTr = document.createElement("tr")
    for (let c = 0; c <= cols; c++) {
      const newTd = document.createElement("td")
      newTd.classList.add("pixel")
      newTd.innerHTML = ""
      newTr.appendChild(newTd)
    }
    newT.appendChild(newTr)
  }
  bear.appendChild(newT)
  const grows = bear.getElementsByTagName("tr")
  for (let grow = 0; grow < grows.length; grow++) {
    const newGrow = []
    gcells = grows[grow].getElementsByTagName("td")
    for (let gcell = 0; gcell < gcells.length; gcell++) {
      newGrow.push(gcells[gcell])
    }
    theGrid.push(newGrow)
  }
}

const init = () => {
  const req = new Request("bears.json")
  fetch(req).then((response) => {
    return response.json()
  }).then((data) => {
    make_grid(data)
    actor.send({ type: 'KICKOFF', struct: data })
  })
}

document.addEventListener("DOMContentLoaded", init)
