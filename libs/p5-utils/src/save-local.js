const SERVER_URL = 'http://localhost:7654'
let serverAvailable = null
let checkInFlight = null

export function __resetServerState () {
  serverAvailable = null
  checkInFlight = null
}

export function checkServer () {
  if (checkInFlight) return checkInFlight
  checkInFlight = fetch(`${SERVER_URL}/ping`, { signal: AbortSignal.timeout(1000) })
    .then(res => { serverAvailable = res.ok })
    .catch(() => { serverAvailable = false })
    .finally(() => { checkInFlight = null })
  return checkInFlight
}

export function isServerAvailable () {
  return serverAvailable
}

async function saveToServer (graphics, filename) {
  const dataURL = graphics.canvas.toDataURL('image/png')
  await postDataURL(dataURL, filename)
}

async function postDataURL (dataURL, filename) {
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

function downloadDataURL (dataURL, filename) {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function saveWithFallback (p, graphics, filename) {
  if (serverAvailable === null) await checkServer()
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

export async function saveDataURLWithFallback (dataURL, filename, { download = downloadDataURL } = {}) {
  if (serverAvailable === null) await checkServer()
  if (serverAvailable) {
    try {
      await postDataURL(dataURL, filename)
      return
    } catch (e) {
      console.warn('[save-local] server save failed, falling back to browser download:', e.message)
      serverAvailable = false
    }
  }
  download(dataURL, filename)
}
