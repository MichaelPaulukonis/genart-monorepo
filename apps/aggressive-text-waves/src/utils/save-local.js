const SERVER_URL = 'http://localhost:7654'
let serverAvailable = null
let checkInFlight = null

export function checkServer () {
  if (checkInFlight) return checkInFlight
  checkInFlight = fetch(`${SERVER_URL}/ping`, { signal: AbortSignal.timeout(1000) })
    .then(res => { serverAvailable = res.ok })
    .catch(() => { serverAvailable = false })
    .finally(() => { checkInFlight = null })
  return checkInFlight
}

async function saveToServer (graphics, filename) {
  const dataURL = graphics.canvas.toDataURL('image/png')
  const res = await fetch(`${SERVER_URL}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataURL, filename })
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
}

export function isServerAvailable () {
  return serverAvailable
}

export async function saveWithFallback (p, graphics, filename) {
  if (serverAvailable === null) {
    await checkServer()
  }
  if (serverAvailable) {
    try {
      await saveToServer(graphics, filename)
      return
    } catch (e) {
      console.warn('[save-local] server save failed, falling back to browser download:', e.message)
      serverAvailable = false
    }
  }
  p.saveCanvas(graphics.canvas, filename)
}
