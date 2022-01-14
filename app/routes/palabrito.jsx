import React, { useRef } from 'react'
import words from 'an-array-of-spanish-words'
import { assign, createMachine, send as sendAction, spawn } from 'xstate'
import { useLoaderData } from 'remix'
import LetterInput, { createLetterMachine } from '../components/palabrito/LetterInput'
import { useMachine } from '@xstate/react'

export const loader = () => {
  const filteredWords = words.filter(word => word.length === 5)
  const randomWord = filteredWords[Math.floor(Math.random() * filteredWords.length)]
  return randomWord
}

const getLetterFromRow = (letters, rowIndex) => {
  return letters
    .filter(letter => letter.getSnapshot().context.coords[0] === rowIndex)
    .map(letter => letter.getSnapshot().context.value)
    .join('')
}

const gameMachine = createMachine(
  {
    initial: 'playing',
    id: 'game',
    context: {
      word: '',
      length: 5,
      maxTries: 6,
      letters: []
    },
    states: {
      playing: {
        entry: 'initialize',
        initial: 'idle',
        states: {
          idle: {},
          lookingForWord: {
            invoke: {
              src: async (context, event) => {
                const {
                  coords: [rowIndex]
                } = event
                const maybeWord = getLetterFromRow(context.letters, rowIndex)
                const res = await fetch(`/search_word?q=${maybeWord}`)
                const data = await res.json()
                return { exists: data.exists, rowIndex, maybeWord }
              },
              onDone: [
                {
                  target: '#game.won',
                  actions: ['showRowResults'],
                  cond: 'sameWord'
                },
                {
                  target: '#game.lost',
                  actions: ['showRowResults'],
                  cond: 'tooManyTries'
                },
                {
                  target: 'idle',
                  actions: ['showRowResults', 'moveToNextRow']
                },
                {
                  target: 'idle'
                }
              ],
              onError: 'idle'
            }
          }
        },
        on: {
          GO_NEXT_LETTER: {
            actions: ['goNextLetter'],
            cond: 'isNotLastLetter'
          },
          GO_BACK_LETTER: {
            actions: ['goBackLetter'],
            cond: 'isNotFirstLetter'
          },
          ROW_SUBMIT: {
            target: '.lookingForWord',
            cond: 'isRowValid'
          },
          WON: {
            target: 'won'
          }
        }
      },
      won: {},
      lost: {}
    },
    on: {
      RESTART: {
        target: 'playing'
      }
    }
  },
  {
    actions: {
      initialize: assign((context, event) => {
        const letters = []
        for (let i = 0; i < context.maxTries; i++) {
          for (let j = 0; j < context.length; j++) {
            const initialState = i === 0 ? 'active' : 'inactive'
            letters.push(spawn(createLetterMachine([i, j], context.length, initialState), `cell-${i}-${j}`))
          }
        }
        letters[0].send('FOCUS')
        return {
          letters
        }
      }),
      goNextLetter: (context, event) => {
        const { coords } = event
        const nextLetterCoords = [coords[0], coords[1] + 1]
        context.letters.find(letter => letter.id === `cell-${nextLetterCoords[0]}-${nextLetterCoords[1]}`).send('FOCUS')
      },
      goBackLetter: (context, event) => {
        const { coords } = event
        const previousLetterCoords = [coords[0], coords[1] - 1]
        context.letters
          .find(letter => letter.id === `cell-${previousLetterCoords[0]}-${previousLetterCoords[1]}`)
          .send('FOCUS')
      },
      showRowResults: (context, event) => {
        const { rowIndex, maybeWord } = event.data
        const targetWord = context.word

        maybeWord.split('').forEach((letter, col) => {
          if (targetWord[col] === letter) {
            context.letters.find(cell => cell.id === `cell-${rowIndex}-${col}`).send('SHOW_CORRECT')
          } else if (targetWord.includes(letter)) {
            context.letters.find(cell => cell.id === `cell-${rowIndex}-${col}`).send('SHOW_ALMOST_CORRECT')
          } else {
            context.letters.find(cell => cell.id === `cell-${rowIndex}-${col}`).send('SHOW_WRONG')
          }
        })
      },
      moveToNextRow: (context, event) => {
        const { rowIndex } = event.data
        context.letters
          .filter(letter => letter.getSnapshot().context.coords[0] === rowIndex + 1)
          .forEach(letter => letter.send('ACTIVATE'))
        context.letters.find(cell => cell.id === `cell-${rowIndex + 1}-0`).send('FOCUS')
      }
    },
    guards: {
      isNotLastLetter: (context, event) => {
        const { coords } = event
        return coords[1] < context.length - 1
      },
      isNotFirstLetter: (context, event) => {
        const { coords } = event
        return coords[1] > 0
      },
      isRowValid: (context, event) => {
        const {
          coords: [rowIndex]
        } = event

        return getLetterFromRow(context.letters, rowIndex).length == context.length
      },
      wordExists: (_, event) => event.data.exists,
      wordDoesntExists: (_, event) => !event.data.exists,
      sameWord: (context, event) => event.data.maybeWord === context.word,
      tooManyTries: (context, event) => event.data.rowIndex == context.maxTries - 1
    }
  }
)

const palabrito = () => {
  const randomWord = useLoaderData()

  const [current, send] = useMachine(gameMachine, {
    context: { word: randomWord, length: 5, maxTries: 6 }
  })

  const chunks = current.context.letters.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / current.context.length)

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [])

  return (
    <div className='p-6 sm:p-12 container mx-auto w-full text-center' onMouseUp={() => send('RELEASE_NEIGHBORS')}>
      <h1 className='mb-4 text-2xl font-bold'>Palabrito</h1>
      <div className='flex flex-col items-center'>
        {chunks.map((chunk, index) => (
          <form className='flex flex-wrap' key={index}>
            {chunk.map(letter => (
              <LetterInput key={letter.id} service={letter} />
            ))}
          </form>
        ))}
      </div>
      <button className='mt-8 bg-blue-700 hover:bg-blue-800 text-white py-2 px-8' onClick={() => send('RESTART')}>
        Reiniciar juego
      </button>
      <div>
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
      </div>
    </div>
  )
}

export default palabrito
