import React, { Fragment, useRef, useState } from 'react'
import Confetti from 'react-confetti'

const randRange = (minNum: number, maxNum: number) => {
  return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum
}

const CustomConfetti = () => {
  const [loaded, setLoaded] = useState(false)
  const image = useRef(new Image())

  // image.current.src = '/cristiam.png'
  // image.current.onload = function () {
  //   setLoaded(true)
  // }

  // <Confetti
  //       tweenDuration={20}
  //       numberOfPieces={10}
  //       initialVelocityX={0.1}
  //       initialVelocityY={0.1}
  //       drawShape={ctx => {
  //         ctx.drawImage(image.current, 0, 0, 56, 56)
  //       }}
  //     />
  return (
    <Fragment>
      {[...Array(10).keys()].map(i => {
        const size = randRange(50, 100)
        return (
          <img
            key={i}
            src='/cristiam.png'
            style={{
              position: 'absolute',
              top: randRange(0, 300),
              left: randRange(0, window.innerWidth),
              bottom: '200px',
              width: size,
              height: size,
              animation: 'fall 1.2s linear infinite'
            }}
          />
        )
      })}
    </Fragment>
  )
}

export default CustomConfetti
