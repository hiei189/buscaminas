import { useActor } from '@xstate/react'
import React from 'react'
import { createMachine, assign, sendParent } from 'xstate'

export const createLetterMachine = (coords, length, initialState) =>
  createMachine(
    {
      id: `letter-${coords.join('-')}`,
      initial: initialState,
      context: {
        value: '',
        coords,
        wordLength: length
      },
      states: {
        active: {
          on: {
            CHANGE: [
              {
                actions: ['updateValue', 'goNext'],
                cond: 'wontBeEmpty'
              },
              {
                actions: ['updateValue']
              }
            ],
            BACK: {
              actions: ['goBack'],
              cond: 'isEmpty'
            },
            FOCUS: {
              actions: ['focus']
            },
            ROW_SUBMIT: {
              actions: ['rowSubmit']
            },
            SHOW_CORRECT: {
              target: 'inactive.correct'
            },
            SHOW_ALMOST_CORRECT: {
              target: 'inactive.almostCorrect'
            },
            SHOW_WRONG: {
              target: 'inactive.regular'
            }
          }
        },
        inactive: {
          initial: 'notYet',
          states: {
            correct: {},
            almostCorrect: {},
            regular: {},
            notYet: {
              on: {
                ACTIVATE: `#letter-${coords.join('-')}.active`
              }
            }
          }
        }
      }
    },
    {
      actions: {
        updateValue: assign((_, event) => ({
          value: event.value[event.value.length - 1] || ''
        })),
        focus: () => {
          document.getElementById(`letter-${coords.join('-')}`).focus()
        },
        goNext: sendParent(({ coords, wordLength }) => ({
          type: 'GO_NEXT_LETTER',
          coords
        })),
        goBack: sendParent(({ coords, wordLength }) => ({
          type: 'GO_BACK_LETTER',
          coords
        })),
        deleteValue: assign((_, event) => ({
          value: ''
        })),
        rowSubmit: sendParent(({ coords }) => ({
          type: 'ROW_SUBMIT',
          coords
        }))
      },
      guards: {
        isEmpty: context => context.value === '',
        isNotEmpty: context => context.value !== '',
        wontBeEmpty: (_, event) => event.value !== ''
      }
    }
  )

const LetterInput = React.memo(({ service }) => {
  const [current, send] = useActor(service)
  let classNames = ''

  if (current.matches({ inactive: 'correct' })) {
    classNames += ' bg-green-300 border-green-500'
  } else if (current.matches({ inactive: 'almostCorrect' })) {
    classNames += ' bg-yellow-200 border-yellow-500'
  } else if (current.matches({ inactive: 'regular' })) {
    classNames += ' bg-gray-200 border-gray-500'
  } else if (current.matches({ inactive: 'notYet' })) {
    classNames += ' bg-gray-900'
  }

  return (
    <input
      id={current.machine.id}
      value={current.context.value}
      className={
        'border-2 text-center font-bold text-lg uppercase border-gray-400 w-10 h-10 m-1 block active:rounded-none focus:rounded-none focus:outline-yellow-500 focus:shadow-none ' +
        classNames
      }
      onChange={e => send({ type: 'CHANGE', value: e.target.value })}
      onKeyDown={e => {
        if (e.key === 'Backspace') {
          send('BACK')
        }
        if (e.key === 'Enter' || e.keyCode == 13) {
          send('ROW_SUBMIT')
        }
      }}
    />
  )
})

export default LetterInput
