function normalizeHexColor (value) {
  if (!value) return ''
  // Handle RGB array format e.g. [255, 0, 0]
  if (Array.isArray(value)) {
    const h = n => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0')
    return `#${h(value[0])}${h(value[1])}${h(value[2])}`
  }
  if (typeof value !== 'string') return ''
  const hex = value.trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  return hex
}

function createDisjointSet () {
  const parent = new Map()

  function find (x) {
    if (!parent.has(x)) {
      parent.set(x, x)
      return x
    }

    const p = parent.get(x)
    if (p === x) return x

    const root = find(p)
    parent.set(x, root)
    return root
  }

  function union (a, b) {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) {
      parent.set(rootB, rootA)
    }
  }

  return { find, union }
}

function getSlotKeysForImage (frame, image) {
  const keys = []
  if (frame?.pair?.a === image) keys.push('a')
  if (frame?.pair?.b === image) keys.push('b')
  return keys
}

export function generateLoopFrameColors (walk, palette, rng = Math.random, options = {}) {
  if (!Array.isArray(walk) || walk.length === 0) return []
  if (!Array.isArray(palette) || palette.length === 0) return []

  const excludedColors = new Set((options.excludedColors || []).map(normalizeHexColor))
  const eligibleIndices = []
  palette.forEach((entry, index) => {
    const colorHex = normalizeHexColor(entry?.color)
    if (!excludedColors.has(colorHex)) {
      eligibleIndices.push(index)
    }
  })

  const sourceIndices = eligibleIndices.length > 0
    ? eligibleIndices
    : palette.map((_, index) => index)

  const isCircular = options.circular !== false

  const ds = createDisjointSet()
  const groups = new Set()
  const frameGroups = []

  walk.forEach((frame, index) => {
    const keyA = `${index}:a`
    const keyB = `${index}:b`
    groups.add(ds.find(keyA))
    groups.add(ds.find(keyB))

    frameGroups[index] = { keyA, keyB }
  })

  // Preserve image+color overlap across adjacent frames when one image is shared
  for (let index = 0; index < walk.length - 1; index++) {
    const current = walk[index]
    const next = walk[index + 1]

    const currentImages = [current?.pair?.a, current?.pair?.b]
    const nextImages = new Set([next?.pair?.a, next?.pair?.b])
    const shared = currentImages.filter(img => nextImages.has(img))

    if (shared.length !== 1) continue

    const sharedImage = shared[0]
    const currentSlots = getSlotKeysForImage(current, sharedImage)
    const nextSlots = getSlotKeysForImage(next, sharedImage)

    if (currentSlots.length === 1 && nextSlots.length === 1) {
      ds.union(`${index}:${currentSlots[0]}`, `${index + 1}:${nextSlots[0]}`)
    }
  }

  if (isCircular && walk.length > 1) {
    const current = walk[walk.length - 1]
    const next = walk[0]

    const currentImages = [current?.pair?.a, current?.pair?.b]
    const nextImages = new Set([next?.pair?.a, next?.pair?.b])
    const shared = currentImages.filter(img => nextImages.has(img))

    if (shared.length === 1) {
      const sharedImage = shared[0]
      const currentSlots = getSlotKeysForImage(current, sharedImage)
      const nextSlots = getSlotKeysForImage(next, sharedImage)

      if (currentSlots.length === 1 && nextSlots.length === 1) {
        ds.union(`${walk.length - 1}:${currentSlots[0]}`, `0:${nextSlots[0]}`)
      }
    }
  }

  // Link repeated loopFrame entries (e.g. explicit closing frame) through slot-by-image matching
  const firstIndexByLoopFrame = new Map()
  walk.forEach((frame, index) => {
    const frameKey = typeof frame.loopFrame === 'number' ? frame.loopFrame : frame.frame
    if (!firstIndexByLoopFrame.has(frameKey)) {
      firstIndexByLoopFrame.set(frameKey, index)
      return
    }

    const firstIndex = firstIndexByLoopFrame.get(frameKey)
    const firstFrame = walk[firstIndex]

    ;['a', 'b'].forEach(slot => {
      const image = frame?.pair?.[slot]
      const currentSlots = getSlotKeysForImage(frame, image)
      const firstSlots = getSlotKeysForImage(firstFrame, image)

      if (currentSlots.length === 1 && firstSlots.length === 1) {
        ds.union(`${firstIndex}:${firstSlots[0]}`, `${index}:${currentSlots[0]}`)
      }
    })
  })

  const groupAdjacency = new Map()

  groups.forEach(group => {
    if (!groupAdjacency.has(group)) {
      groupAdjacency.set(group, new Set())
    }
  })

  walk.forEach((frame, index) => {
    const rootA = ds.find(frameGroups[index].keyA)
    const rootB = ds.find(frameGroups[index].keyB)

    groups.add(rootA)
    groups.add(rootB)

    if (!groupAdjacency.has(rootA)) groupAdjacency.set(rootA, new Set())
    if (!groupAdjacency.has(rootB)) groupAdjacency.set(rootB, new Set())

    if (rootA !== rootB) {
      groupAdjacency.get(rootA).add(rootB)
      groupAdjacency.get(rootB).add(rootA)
    }
  })

  const groupOrder = Array.from(groups)
    .sort((a, b) => groupAdjacency.get(b).size - groupAdjacency.get(a).size)

  const groupColors = new Map()

  groupOrder.forEach(group => {
    const neighborColors = new Set(
      Array.from(groupAdjacency.get(group) || [])
        .map(neighbor => groupColors.get(neighbor))
        .filter(color => typeof color === 'number')
    )

    const available = sourceIndices.filter(index => !neighborColors.has(index))
    const pool = available.length > 0 ? available : sourceIndices
    const chosen = pool[Math.floor(rng() * pool.length)]
    groupColors.set(group, chosen)
  })

  return walk.map((frame, index) => {
    const rootA = ds.find(frameGroups[index].keyA)
    const rootB = ds.find(frameGroups[index].keyB)

    return {
      colorA: palette[groupColors.get(rootA)],
      colorB: palette[groupColors.get(rootB)]
    }
  })
}
