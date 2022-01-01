export const getNRandomCoords = (n: number, rows: number, cols: number) => {
  const coords: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const x = Math.floor(Math.random() * rows)
    const y = Math.floor(Math.random() * cols)
    if (coords.some(([i, j]) => i === x && j === y)) {
      i--
    } else {
      coords.push([x, y])
    }
  }

  return coords
}

export const isInLimits = ([x, y]: [number, number], rows: number, cols: number) =>
  x >= 0 && x < rows && y >= 0 && y < cols

export const getNeighbors = ([x, y]: [number, number], rows: number, cols: number) => {
  const neighbors: [number, number][] = []
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue
      const [nx, ny] = [x + i, y + j]
      if (isInLimits([nx, ny], rows, cols)) {
        neighbors.push([nx, ny])
      }
    }
  }
  return neighbors
}
