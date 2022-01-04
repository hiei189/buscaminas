import { useMachine } from '@xstate/react'
import { ClientOnly } from 'remix-utils'
import { assign, createMachine, send, spawn } from 'xstate'
import { pure } from 'xstate/lib/actions'
import Cell, { createCellMachine } from '~/components/Cell'
import CustomConfetti from '~/components/CustomConfetti'
import { getNeighbors, getNRandomCoords, isInLimits } from '~/helpers/utils'

const CELL_SIZE = 24

const difficultyHash = {
  easy: {
    rows: 6,
    cols: 6,
    bombs: 10
  },
  medium: {
    rows: 16,
    cols: 16,
    bombs: 40
  },
  hard: {
    rows: 16,
    cols: 30,
    bombs: 99
  }
}

const gameMachine = createMachine(
  {
    initial: 'playing',
    context: {
      cells: [],
      bombsCoords: [],
      ...difficultyHash.easy
    },
    states: {
      playing: {
        entry: 'fillField',
        on: {
          UNREVEAL: {
            actions: 'checkWin'
          },
          EXPLODE: {
            actions: 'explode',
            target: 'lost'
          },
          REVEAL_NEIGHBORS: {
            actions: 'revealNeighbors'
          },
          REVEAL_NEIGHBORS_IF_FLAGGED: {
            actions: 'revealNeighborsIfFlagged'
          },
          PRESS_NEIGHBORS: {
            actions: 'pressNeighbors'
          },
          RELEASE_NEIGHBORS: {
            actions: 'releaseNeighbors'
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
      },
      CHANGE_DIFFICULTY: {
        target: 'playing',
        actions: 'changeDifficulty'
      }
    }
  },
  {
    actions: {
      fillField: assign(context => {
        let cells = []
        const { rows, cols, bombs } = context
        const bombsCoords = getNRandomCoords(bombs, rows, cols)

        const isBomb = ([row, col]: [number, number]) => bombsCoords.some(([i, j]) => i === row && j === col)

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            let value: number | 'X'

            if (isBomb([row, col])) {
              value = 'X'
            } else {
              const neighbors = getNeighbors([row, col], rows, cols)
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
      revealNeighborsIfFlagged: (context, event: any) => {
        const { coords, value } = event.value
        const { rows, cols } = context
        const neighbors = getNeighbors(coords, rows, cols).map(([row, col]) =>
          context.cells.find(({ id }) => id === `cell-${row}-${col}`)
        )
        const flaggedCount = neighbors.filter(cell => cell.getSnapshot().value === 'flagged').length
        if (flaggedCount === value) neighbors.forEach((cell: any) => cell.send('REVEAL'))
      },
      revealNeighbors: (context, event: any) => {
        const { rows, cols } = context
        getNeighbors(event.value, rows, cols).forEach(([row, col]) => {
          const cell = context.cells.find(({ id }) => id === `cell-${row}-${col}`)
          if (cell) {
            cell.send('REVEAL')
          }
        })
      },
      pressNeighbors: (context, event: any) => {
        const { rows, cols } = context
        getNeighbors(event.value, rows, cols).forEach(([row, col]) => {
          const cell = context.cells.find(({ id }) => id === `cell-${row}-${col}`)
          if (cell) {
            cell.send('PRESS')
          }
        })
      },
      releaseNeighbors: context => {
        context.cells.forEach((cell: any) => cell.send('RELEASE'))
      },
      checkWin: pure(context => {
        const gameFinished = context.cells.filter((cell: any) => cell.getSnapshot().value === 'unrevealed').length === 0
        if (!gameFinished) return
        const flaggeds = context.cells.filter(cell => cell.getSnapshot().value === 'flagged')
        const isWin = context.bombsCoords.every(bomb =>
          flaggeds.some(
            flagged => bomb[0] === flagged.machine.context.coords[0] && bomb[1] === flagged.machine.context.coords[1]
          )
        )
        if (isWin) return send('WIN')
      }),
      explode: context => context.cells.forEach(cell => cell.send('REVEAL')),
      reset: assign(() => ({
        cells: [],
        bombsCoords: []
      })),
      changeDifficulty: assign((context, event) => {
        console.log('changing difficulty')
        const difficulty = event.value
        console.log('🚀 ~ file: index.tsx ~ line 162 ~ changeDifficulty:assign ~ difficulty', difficulty)
        return {
          cells: [],
          bombsCoords: [],
          ...difficultyHash[difficulty]
        }
      })
    }
  }
)

export default function Index() {
  const [current, send] = useMachine(gameMachine)
  return (
    <div className='p-6 sm:p-12 container mx-auto w-full text-center' onMouseUp={() => send('RELEASE_NEIGHBORS')}>
      <h1 className='mb-4 text-2xl font-bold'>Buscaminas</h1>
      <ClientOnly>
        {current.matches('won') && <CustomConfetti />}
        <label className='block mb-8'>
          <span className='mr-2 inline-block'>Dificultad: </span>
          <select defaultValue='easy' onChange={e => send({ type: 'CHANGE_DIFFICULTY', value: e.target.value })}>
            <option value='easy'>Fácil</option>
            <option value='medium'>Medio</option>
            <option value='hard'>Dificil</option>
          </select>
        </label>
        <div className='max-w-full overflow-x-auto mx-auto'>
          <div
            className='flex flex-wrap mx-auto'
            style={{ width: current.context.cols * CELL_SIZE, height: current.context.rows * CELL_SIZE }}
          >
            {current.context.cells.map(cell => (
              <Cell key={cell.id} service={cell} parentCurrent={current} />
            ))}
          </div>
        </div>
        <button className='mt-8 bg-blue-700 hover:bg-blue-800 text-white py-2 px-8' onClick={() => send('RESTART')}>
          Reiniciar juego
        </button>
        {current.matches('won') && (
          <h1 className='text-5xl mt-8 mb-2 leading-tight font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-800 to-blue-100'>
            Felicidades, ganaste!
          </h1>
        )}
        {current.matches('lost') && (
          <h1 className='text-5xl mt-8 mb-2 leading-tight font-bold text-transparent bg-clip-text bg-gradient-to-br to-red-100 from-pink-500'>
            Oh no, perdiste! :(
          </h1>
        )}
      </ClientOnly>
    </div>
  )
}
