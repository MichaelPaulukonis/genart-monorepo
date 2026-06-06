import { describe, it, expect } from 'vitest'
import { Cell } from './cell.js'

describe('Cell.occupiedBy', () => {
  it('defaults to null', () => {
    expect(new Cell(0, 0, 1, null).occupiedBy).toBe(null)
  })

  it('clear() resets occupiedBy to null', () => {
    const c = new Cell(0, 0, 1, null)
    c.occupiedBy = { id: 'w1' }
    c.clear()
    expect(c.occupiedBy).toBe(null)
  })
})
