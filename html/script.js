const { assign, createMachine, interpret, actions } = XState
const { log } = actions;

const theGrid = []
const layers = []

const machine = createMachine({
  predictableActionArguments: true,
  type: "parallel",
  context: {
    layers: [],
    visibleLayers:
      [false, true, true, false, true, false,
        false, false, false, false, false, false,
        false, false, false, false, false],
  },
  states: {
    start: {
      entry: log('started!'),
      on: {
        KICKOFF: {
          target: "gotoit",
          actions: (context, event) => {
            context.layers = event.struct.layers
            //console.log(context)
          }
        }
      }
    },
    gotoit: {
      entry: {
        entry: log('gotoit'),
      }
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
             if (pixel.char !== " ") {
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
