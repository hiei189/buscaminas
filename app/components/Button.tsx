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
  onMouseDown,
  onMouseUp,
  className
}: {
  children: React.ElementType
  onClick: React.MouseEventHandler<HTMLButtonElement>
  onContextMenu: React.MouseEventHandler<HTMLButtonElement>
  onMouseDown?: React.MouseEventHandler<HTMLButtonElement>
  onMouseUp?: React.MouseEventHandler<HTMLButtonElement>
  className?: string
}) => {
  const [current, send] = useMachine(buttonMachine)

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={'font-bold border border-gray-200 h-6 w-6 shadow-inner ' + className}
    >
      {children}
    </button>
  )
}

export default Button
