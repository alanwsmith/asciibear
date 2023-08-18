const { assign, createMachine, interpret, actions } = XState
const { log } = actions;

const machine = createMachine({
  predictableActionArguments: true,
  type: "parallel",
  context: {
    layers: [],
    visibleLayers:
      [false, true, false, true, false, true,
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
             if (theGrid[rIndex][pIndex].innerText === "") {
              theGrid[rIndex][pIndex].innerText = pixel.char
             }
          })
        })
      }
    })
  })
})


// layers.forEach((layer, lIndex) => {
//   if (state.context.activeLayers[lIndex] === true) {
//     // console.log(layer)
//     layer.table.forEach((row, rIndex) => {
//       // console.log(row)
//       row.forEach((cell, cIndex) => {
//         // console.log(cell)
//         if (cell.char !== " ") {
//           theGrid[rIndex][cIndex].innerHTML = cell.char
//         }
//       })
//     })
//   }
// })


const theGrid = []
const layers = []

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
