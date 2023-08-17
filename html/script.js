const { assign, createMachine, interpret, actions } = XState
const { log } = actions;

const machine = createMachine({
  predictableActionArguments: true,
  type: "parallel",
  context: {
    layers: [],
    metadata: {},
    activeLayers:
      [false, true, false, true, false, true,
      false, false, false, false, false, false,
      false, false, false, false, false]
  },
  states: {
    start: {
      entry: log('started!'),
      on: {
        KICKOFF: {
          target: "gotoit",
          actions: (context, event) => {
            context.layers = event.struct.layers
            context.metadata = event.struct.metadata
            console.log(context)
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
    layers.forEach((layer, lIndex) => {
      if (state.context.activeLayers[lIndex] === true) {
        // console.log(layer)
        layer.table.forEach((row, rIndex) => {
          // console.log(row)
          row.forEach((cell, cIndex) => {
            // console.log(cell)
            if (cell.char !== " ") {
              theGrid[rIndex][cIndex].innerHTML = cell.char
            }
          })
        })
      }
    })
  })
})



const theGrid = []
const layers = []



const make_grid = () => {
  const newT = document.createElement("table")
  newT.id = "bearTable"
  for (let r = 0; r < 30; r++) {
    const newTr = document.createElement("tr")
    for (let c = 0; c < 130; c++) {
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

// async function loadData() {
//   const response = await fetch("bears.json");
//   const payload = await response.json();
//   console.log(payload );
// }

const init = () => {
  const req = new Request("bears.json")
  fetch(req).then((response) => {
    return response.json()
  }).then((data) => {
    // console.log(data)
     actor.send({type: 'KICKOFF', struct: data})
  })





  // fetch(req).then(
  //   (response) => {
  //     return response.blob()
  //   }
  // ).then((response) => {
  //   return response.text()
  // }).then((response) => {
  //   let frames = response.split("ASCIISHOPLAYER\n")
  //   frames.forEach((frame) => {
  //     const newFrame = {table: []}
  //     const rows = frame.split("\n")
  //     rows.forEach((row) => {
  //       const newRow = []
  //       const chars = row.split("")
  //       chars.forEach((char) => {
  //         const newChar = {
  //           char: char,
  //           color: "#ff0000"
  //         }
  //         newRow.push(newChar)
  //       })
  //       newFrame.table.push(newRow)
  //     })
  //     layers.push(newFrame)
  //   })
  //   make_grid()
  //   console.log(1)
  //   console.log(3)
  //   actor.send({type: 'KICKOFF', value: 1000, data: "asdf"})
  // })

}

document.addEventListener("DOMContentLoaded", init)
