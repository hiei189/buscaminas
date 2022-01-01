import { useMachine } from '@xstate/react'
import { ClientOnly } from 'remix-utils'
import { assign, createMachine, send, spawn } from 'xstate'
import { pure } from 'xstate/lib/actions'
import Cell, { createCellMachine } from '~/components/Cell'

const ROWS = 6
const COLS = 6
const CELL_SIZE = 48
const BOMBS = 7

const getNRandomCoords = (n: Number) => {
  const coords: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const x = Math.floor(Math.random() * ROWS)
    const y = Math.floor(Math.random() * COLS)
    if (coords.some(([i, j]) => i === x && j === y)) {
      i--
    } else {
      coords.push([x, y])
    }
  }

  return coords
}

const isInLimits = ([x, y]: [number, number]) => x >= 0 && x < ROWS && y >= 0 && y < COLS

const getNeighbors = ([x, y]: [number, number]) => {
  const neighbors: [number, number][] = []
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue
      const [nx, ny] = [x + i, y + j]
      if (isInLimits([nx, ny])) {
        neighbors.push([nx, ny])
      }
    }
  }
  return neighbors
}

const gameMachine = createMachine(
  {
    initial: 'playing',
    context: {
      cells: [],
      bombsCoords: []
    },
    states: {
      playing: {
        entry: 'fillField',
        on: {
          REVEAL_EMPTIES: {
            actions: 'revealEmpties'
          },
          UNREVEAL: {
            actions: 'checkWin'
          },
          EXPLODE: {
            actions: 'explode',
            target: 'lost'
          },
          REVEAL_NEIGHBORS: {
            actions: 'revealNeighbors'
          }
        }
      },
      won: {},
      lost: {}
    },
    on: {
      WIN: {
        target: 'won'
      },
      RESTART: {
        target: 'playing',
        actions: 'reset'
      }
    }
  },
  {
    actions: {
      fillField: assign(() => {
        console.log('filling')
        let cells = []
        const bombsCoords = getNRandomCoords(BOMBS)

        const isBomb = ([row, col]: [number, number]) => bombsCoords.some(([i, j]) => i === row && j === col)

        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            let value: number | 'X'

            if (isBomb([row, col])) {
              value = 'X'
            } else {
              const neighbors = getNeighbors([row, col])
              let count: number = 0
              neighbors.forEach(([i, j]) => {
                if (isBomb([i, j])) count++
              })
              value = count
            }

            const cell = spawn(createCellMachine([row, col], value), `cell-${row}-${col}`)
            cells.push(cell)
          }
        }

        return {
          cells,
          bombsCoords
        }
      }),
      revealEmpties: (context, event) => {
        const callerCoords = event.value
        getNeighbors(callerCoords).forEach(([row, col]) => {
          const cell = context.cells.find(({ id }) => id === `cell-${row}-${col}`)
          if (cell) {
            cell.send('REVEAL')
          }
        })
      },
      revealNeighbors: (context, event) => {
        console.log('revelkando xd')
        const callerCoords = event.value
        getNeighbors(callerCoords).forEach(([row, col]) => {
          const cell = context.cells.find(({ id }) => id === `cell-${row}-${col}`)
          if (cell) {
            cell.send('REVEAL')
          }
        })
      },
      checkWin: pure((context, event) => {
        const gameFinished = context.cells.filter(cell => cell.getSnapshot().value === 'unrevealed').length === 0
        if (!gameFinished) return
        const flaggeds = context.cells.filter(cell => cell.getSnapshot().value === 'flagged')
        const isWin = context.bombsCoords.every(bomb =>
          flaggeds.some(
            flagged => bomb[0] === flagged.machine.context.coords[0] && bomb[1] === flagged.machine.context.coords[1]
          )
        )
        if (isWin) return send('WIN')
      }),
      explode: (context, event) => {
        context.cells.forEach(cell => {
          cell.send('REVEAL')
        })
      },
      reset: assign((context, event) => ({
        cells: [],
        bombsCoords: []
      }))
    }
  }
)

export default function Index() {
  const [current, send] = useMachine(gameMachine)
  return (
    <div className='p-12 container mx-auto w-full text-center'>
      <h1 className='mb-4 text-2xl font-bold'>Buscaminas</h1>
      <ClientOnly>
        {current.matches('won') ? 'Felicidades, ganaste!' : ''}
        {current.matches('lost') ? 'Perdiste :(' : ''}
        <div className='flex flex-wrap mx-auto' style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE }}>
          {current.context.cells.map(cell => (
            <Cell key={cell.id} service={cell} />
          ))}
        </div>
        <button className='mt-8 bg-blue-700 hover:bg-blue-800 text-white py-2 px-8' onClick={() => send('RESTART')}>
          Reiniciar juego
        </button>
      </ClientOnly>
    </div>
  )
}
