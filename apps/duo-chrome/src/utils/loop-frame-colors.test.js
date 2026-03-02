import { describe, it, expect } from 'vitest'
import { generateLoopFrameColors } from './loop-frame-colors'

function makeRng (sequence) {
  let i = 0
  return () => {
    const value = sequence[i % sequence.length]
    i += 1
    return value
  }
}

describe('generateLoopFrameColors', () => {
  const palette = [
    { name: 'Red', color: '#ff0000' },
    { name: 'Blue', color: '#0000ff' },
    { name: 'Green', color: '#00ff00' },
    { name: 'Black', color: '#000000' }
  ]

  it('returns empty array for invalid inputs', () => {
    expect(generateLoopFrameColors([], palette)).toEqual([])
    expect(generateLoopFrameColors([{ frame: 0 }], [])).toEqual([])
    expect(generateLoopFrameColors(null, palette)).toEqual([])
  })

  it('generates colors randomly per loop frame and closes on matching loopFrame', () => {
    const walk = [
      { frame: 0, loopFrame: 0, pair: { a: 'a1', b: 'b1' } },
      { frame: 1, loopFrame: 1, pair: { a: 'a2', b: 'b1' } },
      { frame: 2, loopFrame: 2, pair: { a: 'a2', b: 'b2' } },
      { frame: 3, loopFrame: 0, pair: { a: 'a1', b: 'b1' } }
    ]

    const rng = makeRng([0.1, 0.8, 0.6, 0.2, 0.95, 0.4])
    const result = generateLoopFrameColors(walk, palette, rng)

    expect(result).toHaveLength(4)

    // Frame 0 and closing frame share loopFrame=0 => same colors for seamless loop
    expect(result[0]).toEqual(result[3])

    // Non-closing frames should produce valid color assignments
    expect(result[1]).toBeDefined()
    expect(result[2]).toBeDefined()
  })

  it('ensures distinct A/B colors when palette has more than one color', () => {
    const walk = [
      { frame: 0, loopFrame: 0 },
      { frame: 1, loopFrame: 1 },
      { frame: 2, loopFrame: 0 }
    ]

    const rng = makeRng([0.2, 0.2, 0.2, 0.2, 0.6, 0.6])
    const result = generateLoopFrameColors(walk, palette, rng)

    expect(result[0].colorA).not.toEqual(result[0].colorB)
    expect(result[1].colorA).not.toEqual(result[1].colorB)
    expect(result[2].colorA).not.toEqual(result[2].colorB)
  })

  it('excludes background color from both A and B', () => {
    const walk = [
      { frame: 0, loopFrame: 0 },
      { frame: 1, loopFrame: 1 },
      { frame: 2, loopFrame: 0 }
    ]

    const result = generateLoopFrameColors(walk, palette, makeRng([0.9, 0.1, 0.8, 0.2]), {
      excludedColors: ['#000000']
    })

    result.forEach(colors => {
      expect(colors.colorA.color.toLowerCase()).not.toBe('#000000')
      expect(colors.colorB.color.toLowerCase()).not.toBe('#000000')
    })

    expect(result[2]).toEqual(result[0])
  })

  it('falls back to full palette when exclusion removes all colors', () => {
    const walk = [{ frame: 0, loopFrame: 0 }]

    const monochromePalette = [{ name: 'Black', color: '#000000' }]
    const result = generateLoopFrameColors(walk, monochromePalette, makeRng([0.1]), {
      excludedColors: ['#000000']
    })

    expect(result).toHaveLength(1)
    expect(result[0].colorA.color).toBe('#000000')
    expect(result[0].colorB.color).toBe('#000000')
  })

  it('keeps shared image color across adjacent overlap frames', () => {
    const walk = [
      { frame: 0, pair: { a: 'img1', b: 'img4' } }, // AD
      { frame: 1, pair: { a: 'img4', b: 'img2' } }, // DB
      { frame: 2, pair: { a: 'img2', b: 'img3' } }, // BC
      { frame: 3, pair: { a: 'img3', b: 'img1' } } // CA
    ]

    const result = generateLoopFrameColors(walk, palette, makeRng([0.1, 0.4, 0.7, 0.9, 0.2]))

    // Shared image img4 between frame0(b) and frame1(a)
    expect(result[0].colorB).toEqual(result[1].colorA)
    // Shared image img2 between frame1(b) and frame2(a)
    expect(result[1].colorB).toEqual(result[2].colorA)
    // Shared image img3 between frame2(b) and frame3(a)
    expect(result[2].colorB).toEqual(result[3].colorA)
  })

  it('keeps closing overlap color continuity when loopFrame closes to frame 0', () => {
    const walk = [
      { frame: 0, loopFrame: 0, pair: { a: 'img1', b: 'img4' } },
      { frame: 1, loopFrame: 1, pair: { a: 'img4', b: 'img2' } },
      { frame: 2, loopFrame: 2, pair: { a: 'img2', b: 'img3' } },
      { frame: 3, loopFrame: 3, pair: { a: 'img3', b: 'img1' } },
      { frame: 4, loopFrame: 0, pair: { a: 'img1', b: 'img4' } }
    ]

    const result = generateLoopFrameColors(walk, palette, makeRng([0.2, 0.5, 0.8, 0.1, 0.6]))

    expect(result[4]).toEqual(result[0])
    expect(result[3].colorB).toEqual(result[4].colorA) // img1 continuity across closure
  })

  it('enforces last-to-first overlap continuity for circular non-duplicated walks', () => {
    const walk = [
      { frame: 0, pair: { a: 'img1', b: 'img4' } }, // AD
      { frame: 1, pair: { a: 'img4', b: 'img2' } }, // DB
      { frame: 2, pair: { a: 'img2', b: 'img3' } }, // BC
      { frame: 3, pair: { a: 'img3', b: 'img1' } } // CA
    ]

    const result = generateLoopFrameColors(walk, palette, makeRng([0.3, 0.6, 0.9, 0.2]))

    // Closure edge: frame3(b=img1) should match frame0(a=img1)
    expect(result[3].colorB).toEqual(result[0].colorA)
  })
})

describe('normalizeHexColor behavior (via generateLoopFrameColors)', () => {
  const walk = [{ frame: 0, loopFrame: 0 }, { frame: 1, loopFrame: 1 }, { frame: 2, loopFrame: 0 }]

  it('excludes palette entries with RGB array colors matching an excluded hex string', () => {
    const paletteWithArrayColors = [
      { name: 'Black', color: [0, 0, 0] },
      { name: 'Red', color: '#ff0000' },
      { name: 'Blue', color: '#0000ff' }
    ]

    const result = generateLoopFrameColors(walk, paletteWithArrayColors, makeRng([0.1, 0.9, 0.5, 0.2]), {
      excludedColors: ['#000000']
    })

    result.forEach(colors => {
      expect(colors.colorA.name).not.toBe('Black')
      expect(colors.colorB.name).not.toBe('Black')
    })
  })

  it('normalizes RGB array entries passed as excludedColors', () => {
    const simplePalette = [
      { name: 'Black', color: '#000000' },
      { name: 'Red', color: '#ff0000' },
      { name: 'Blue', color: '#0000ff' }
    ]

    const result = generateLoopFrameColors(walk, simplePalette, makeRng([0.1, 0.9, 0.5, 0.2]), {
      excludedColors: [[0, 0, 0]] // array format — should normalize to #000000
    })

    result.forEach(colors => {
      expect(colors.colorA.name).not.toBe('Black')
      expect(colors.colorB.name).not.toBe('Black')
    })
  })

  it('expands 3-character hex shorthand in palette entries for exclusion matching', () => {
    const shorthandPalette = [
      { name: 'Black', color: '#000' },
      { name: 'Red', color: '#f00' },
      { name: 'Blue', color: '#00f' }
    ]

    const result = generateLoopFrameColors(walk, shorthandPalette, makeRng([0.1, 0.9, 0.5, 0.2]), {
      excludedColors: ['#000000']
    })

    result.forEach(colors => {
      expect(colors.colorA.name).not.toBe('Black')
      expect(colors.colorB.name).not.toBe('Black')
    })
  })

  it('correctly normalizes RISOCOLORS BLACK [0,0,0] array so it is excluded when bg is black', () => {
    // Regression: [0,0,0] was previously not normalized, causing false negatives
    const risoPalette = [
      { name: 'Black', color: [0, 0, 0] },
      { name: 'Fluorescent Pink', color: [255, 72, 176] },
      { name: 'Medium Blue', color: [50, 85, 164] }
    ]

    const result = generateLoopFrameColors(walk, risoPalette, makeRng([0.1, 0.9, 0.5, 0.2]), {
      excludedColors: ['#000000']
    })

    result.forEach(colors => {
      expect(colors.colorA.color).not.toEqual([0, 0, 0])
      expect(colors.colorB.color).not.toEqual([0, 0, 0])
    })
  })
})
