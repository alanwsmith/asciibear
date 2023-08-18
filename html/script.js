const { assign, createMachine, interpret, actions } = XState
const { log } = actions;

const theGrid = []
const layers = []

const pickOption = (layerType, layers) => {
  const options = []
  layers.forEach((l, lIndex) => {
    console.log(l)
    if (l.layerType === layerType) {
      options.push(lIndex)
    }
  })
  return options[Math.floor(Math.random() * options.length)]
}

const machine = createMachine({
  predictableActionArguments: true,
  // type: "parallel",
  initial: "starting",
  context: {
    layers: [],
    visibleLayers: [],
  },
  states: {
    starting: {
      entry: log('started!'),
      on: {
        KICKOFF: {
          // target: "testrun",
          actions: (context, event) => {
            context.layers = event.struct.layers
            context.layers.forEach((l) => {
              context.visibleLayers.push(false)
            })

            const items = ["forward_head", "forward_snout", "forward_eyes_open", "forward_mouth_open"]
            items.forEach((item) => {
              context.visibleLayers[pickOption(item, context.layers)] = true
            })
          }
        }
      }
    },
    testrun: {
      entry: [
        log('test running'),
        assign({
          visibleLayers: (context) => {
            const mouthStart = 12
            const mouthEnd = 16
            const updatedLayers = context.visibleLayers
            for (let l = mouthStart; l <= mouthEnd; l++) {
              updatedLayers[l] = false
            }
            const newMouth = Math.floor(Math.random() *  mouthEnd) +  mouthStart
            updatedLayers[newMouth] = true
            return updatedLayers
          },
        })

      ],
      after: {
        83: {
          target: 'testrun',
        },
      },
    }
  }
})

const actor = interpret(machine).start()

actor.subscribe((state) => {
  window.requestAnimationFrame(() => {
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
