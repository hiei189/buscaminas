import { useMachine } from '@xstate/react'
import React from 'react'
import { createMachine } from 'xstate'

const buttonMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {}
    }
  }
})

const Button = ({
  children,
  onClick,
  onContextMenu,
  className
}: {
  children: React.ElementType
  onClick: React.MouseEventHandler<HTMLButtonElement>
  onContextMenu: React.MouseEventHandler<HTMLButtonElement>
  className?: string
}) => {
  const [current, send] = useMachine(buttonMachine)

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={'font-bold border border-gray-200 h-12 w-12 shadow-inner ' + className}
    >
      {children}
    </button>
  )
}

export default Button
