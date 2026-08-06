# Dragline Burst Frame Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save every painted frame of a dragline auto-movement burst as a numbered PNG sequence, triggered by arming record mode before a burst.

**Architecture:** A DOM-agnostic `burst-recorder` factory captures each draw frame as a clean dataURL and drains an async, bounded-concurrency queue to a shared `save-local` helper (local-save-server with browser-download fallback). dragline.js wires the recorder into setup / keyPressed / draw and owns a DOM REC indicator.

**Tech Stack:** JavaScript (StandardJS), p5.js via p5js-wrapper, Vitest (node env), Nx, shared `@genart/p5-utils` lib.

---

## Spec

`docs/superpowers/specs/2026-06-19-dragline-burst-frame-capture-design.md`

## File Structure

- **Create** `libs/p5-utils/src/save-local.js` — shared save helper: `checkServer`, `isServerAvailable`, `saveWithFallback`, new `saveDataURLWithFallback`. Re-exported from `libs/p5-utils/src/index.js`.
- **Create** `libs/p5-utils/src/save-local.test.js` — unit tests (node, mocked fetch).
- **Create** `apps/dragline/src/burst-recorder.js` — `createBurstRecorder` factory. DOM-free.
- **Create** `apps/dragline/src/burst-recorder.test.js` — unit tests.
- **Modify** `libs/p5-utils/src/index.js` — re-export save-local.
- **Modify** `apps/dragline/src/dragline.js` — extract `renderCleanFrameDataURL`, refactor `saveComposition`, wire recorder, `updateRecIndicator`.
- **Modify** `apps/dragline/index.html` — `#rec-indicator` markup.
- **Modify** `apps/dragline/css/style.css` — indicator styling.

## Conventions

- StandardJS: no semicolons, 2-space indent, single quotes.
- Run tests: `pnpm nx test p5-utils` and `pnpm nx test dragline`.
- Commit after each task.

---

### Task 1: Shared save-local helper with dataURL fallback

**Files:**
- Create: `libs/p5-utils/src/save-local.js`
- Create: `libs/p5-utils/src/save-local.test.js`
- Modify: `libs/p5-utils/src/index.js` (append re-export)

- [ ] **Step 1: Write the failing test**

Create `libs/p5-utils/src/save-local.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveDataURLWithFallback, checkServer, isServerAvailable, __resetServerState } from './save-local.js'

const DATA_URL = 'data:image/png;base64,AAAA'

describe('save-local saveDataURLWithFallback', () => {
  beforeEach(() => {
    __resetServerState()
    vi.restoreAllMocks()
  })

  it('POSTs to server when server is available', async () => {
    const fetchMock = vi.fn()
      // checkServer ping
      .mockResolvedValueOnce({ ok: true })
      // save POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    const download = vi.fn()
    await checkServer()
    await saveDataURLWithFallback(DATA_URL, 'frame-0001.png', { download })

    expect(isServerAvailable()).toBe(true)
    expect(download).not.toHaveBeenCalled()
    const saveCall = fetchMock.mock.calls.find(c => String(c[0]).endsWith('/save'))
    expect(saveCall).toBeTruthy()
    expect(JSON.parse(saveCall[1].body)).toMatchObject({ dataURL: DATA_URL, filename: 'frame-0001.png' })
  })

  it('falls back to download when server is unavailable', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('refused'))
    vi.stubGlobal('fetch', fetchMock)

    const download = vi.fn()
    await checkServer()
    await saveDataURLWithFallback(DATA_URL, 'frame-0001.png', { download })

    expect(isServerAvailable()).toBe(false)
    expect(download).toHaveBeenCalledWith(DATA_URL, 'frame-0001.png')
  })

  it('falls back to download when POST fails mid-session', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })            // ping ok
      .mockRejectedValueOnce(new Error('boom'))       // save fails
    vi.stubGlobal('fetch', fetchMock)

    const download = vi.fn()
    await checkServer()
    await saveDataURLWithFallback(DATA_URL, 'frame-0001.png', { download })

    expect(download).toHaveBeenCalledWith(DATA_URL, 'frame-0001.png')
    expect(isServerAvailable()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test p5-utils`
Expected: FAIL — cannot resolve `./save-local.js`.

- [ ] **Step 3: Write the implementation**

Create `libs/p5-utils/src/save-local.js`:

```js
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
```

- [ ] **Step 4: Re-export from index**

Append to `libs/p5-utils/src/index.js` (after the existing `export { showErrorMessage } from './feedback.js'` line):

```js
export {
  checkServer,
  isServerAvailable,
  saveWithFallback,
  saveDataURLWithFallback
} from './save-local.js'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test p5-utils`
Expected: PASS (3 new tests green).

- [ ] **Step 6: Commit**

```bash
git add libs/p5-utils/src/save-local.js libs/p5-utils/src/save-local.test.js libs/p5-utils/src/index.js
git commit -m "feat(libs/p5-utils): add shared save-local helper with dataURL fallback"
```

---

### Task 2: Burst recorder factory

**Files:**
- Create: `apps/dragline/src/burst-recorder.js`
- Create: `apps/dragline/src/burst-recorder.test.js`

- [ ] **Step 1: Write the failing test**

Create `apps/dragline/src/burst-recorder.test.js`:

```js
import { describe, it, expect, vi } from 'vitest'
import { createBurstRecorder } from './burst-recorder.js'

function setup (overrides = {}) {
  const saved = []
  const recorder = createBurstRecorder({
    renderCleanFrame: () => 'data:image/png;base64,FRAME',
    datestring: () => '20260619120000',
    save: async (dataURL, filename) => { saved.push(filename) },
    ...overrides
  })
  return { recorder, saved }
}

describe('burst-recorder state', () => {
  it('starts idle: not armed, not recording', () => {
    const { recorder } = setup()
    expect(recorder.isArmed()).toBe(false)
    expect(recorder.isRecording()).toBe(false)
  })

  it('arm() sets armed', () => {
    const { recorder } = setup()
    recorder.arm()
    expect(recorder.isArmed()).toBe(true)
  })

  it('onBurstStart() records only when armed, and clears armed', () => {
    const { recorder } = setup()
    recorder.onBurstStart()                 // not armed -> no-op
    expect(recorder.isRecording()).toBe(false)

    recorder.arm()
    recorder.onBurstStart()
    expect(recorder.isRecording()).toBe(true)
    expect(recorder.isArmed()).toBe(false)
  })

  it('captureFrame() is a no-op when not recording', async () => {
    const { recorder, saved } = setup()
    await recorder.captureFrame()
    expect(saved).toEqual([])
  })

  it('captureFrame() saves padded, sequenced filenames while recording', async () => {
    const { recorder, saved } = setup()
    recorder.arm()
    recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.captureFrame()
    await recorder.onBurstEnd()
    expect(saved).toEqual([
      'dragline.burst-20260619120000.frame-0001.png',
      'dragline.burst-20260619120000.frame-0002.png'
    ])
  })

  it('frameCount() reflects captured frames', async () => {
    const { recorder } = setup()
    recorder.arm()
    recorder.onBurstStart()
    expect(recorder.frameCount()).toBe(0)
    await recorder.captureFrame()
    expect(recorder.frameCount()).toBe(1)
  })

  it('onBurstEnd() stops recording', async () => {
    const { recorder } = setup()
    recorder.arm()
    recorder.onBurstStart()
    await recorder.onBurstEnd()
    expect(recorder.isRecording()).toBe(false)
  })

  it('a fresh burst restarts the frame counter', async () => {
    const { recorder, saved } = setup()
    recorder.arm(); recorder.onBurstStart()
    await recorder.captureFrame()
    await recorder.onBurstEnd()
    recorder.arm(); recorder.onBurstStart()
    await recorder.captureFrame()
    expect(saved[saved.length - 1]).toBe('dragline.burst-20260619120000.frame-0001.png')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test dragline`
Expected: FAIL — cannot resolve `./burst-recorder.js`.

- [ ] **Step 3: Write the implementation**

Create `apps/dragline/src/burst-recorder.js`:

```js
// Records every frame of a movement burst as a numbered PNG sequence.
//
// DOM-agnostic and dependency-injected for testability. dragline.js supplies
// renderCleanFrame (returns a PNG dataURL), datestring (burst id), and save
// (persists one frame). The p5 draw loop drives onBurstStart / captureFrame /
// onBurstEnd; key handling drives arm.

const MAX_IN_FLIGHT = 4

export function createBurstRecorder ({ renderCleanFrame, datestring, save }) {
  let armed = false
  let recording = false
  let burstId = ''
  let frameIndex = 0
  const queue = []
  let inFlight = 0

  function pad (n) {
    return String(n).padStart(4, '0')
  }

  function drain () {
    while (inFlight < MAX_IN_FLIGHT && queue.length > 0) {
      const job = queue.shift()
      inFlight += 1
      Promise.resolve(save(job.dataURL, job.filename))
        .catch(e => console.warn('[burst-recorder] frame save failed:', e && e.message))
        .finally(() => {
          inFlight -= 1
          drain()
        })
    }
  }

  return {
    arm () { armed = true },
    isArmed: () => armed,
    isRecording: () => recording,
    frameCount: () => frameIndex,

    onBurstStart () {
      if (!armed) return
      recording = true
      armed = false
      burstId = datestring()
      frameIndex = 0
    },

    captureFrame () {
      if (!recording) return
      frameIndex += 1
      const dataURL = renderCleanFrame()
      const filename = `dragline.burst-${burstId}.frame-${pad(frameIndex)}.png`
      queue.push({ dataURL, filename })
      drain()
    },

    onBurstEnd () {
      recording = false
      drain()
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test dragline`
Expected: PASS (8 new tests green). The `await recorder.captureFrame()` calls resolve synchronously because the injected `save` resolves immediately and `drain` runs synchronously up to the await points.

- [ ] **Step 5: Commit**

```bash
git add apps/dragline/src/burst-recorder.js apps/dragline/src/burst-recorder.test.js
git commit -m "feat(dragline): add burst-recorder for frame-sequence capture"
```

---

### Task 3: Extract clean-frame render in dragline.js

Refactor only — no behavior change to `saveComposition`. This isolates the clean-render path so the recorder can produce identical frames.

**Files:**
- Modify: `apps/dragline/src/dragline.js:452-487` (the `saveComposition` function)

- [ ] **Step 1: Add `renderCleanFrameDataURL` and refactor `saveComposition`**

Replace the existing `saveComposition` function (currently `apps/dragline/src/dragline.js:452-487`) with:

```js
  // Render the clean (white bg, no gradient, no selection highlight) composition
  // onto the main canvas and return it as a PNG dataURL. Restores prior state.
  const renderCleanFrameDataURL = () => {
    refreshCharGrid()

    const originalGradient = gradient
    const originalSelectedIndex = selectedIndex
    gradient = null
    selectedIndex = -1

    p.push()
    p.background(255)
    renderCharGrid(cachedCharGrid, p, grid, fillChar)
    p.pop()

    const dataURL = p.drawingContext.canvas.toDataURL('image/png')

    gradient = originalGradient
    selectedIndex = originalSelectedIndex

    return dataURL
  }

  const saveComposition = bounds => {
    refreshCharGrid()

    const originalGradient = gradient
    const originalSelectedIndex = selectedIndex
    gradient = null
    selectedIndex = -1

    p.push()
    p.background(255)
    renderCharGrid(cachedCharGrid, p, grid, fillChar)
    p.pop()

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .split('.')[0]
      .replace('Z', '')

    const suffix = bounds ? '.selection' : ''
    const filename = `dragline${suffix}.${timestamp}.png`

    if (bounds) {
      const { x, y, width, height } = gridBoundsToPixels(bounds, grid.cellSize)
      // oooh, get is both slow and poorer quality IIRC.....
      // not an issue for now
      const cropped = p.get(x, y, width, height)
      cropped.save(filename, 'png')
    } else {
      p.saveCanvas(filename, 'png')
    }

    gradient = originalGradient
    selectedIndex = originalSelectedIndex
    display()
  }
```

- [ ] **Step 2: Verify build still serves**

Run: `pnpm nx build dragline`
Expected: build succeeds (no syntax errors).

- [ ] **Step 3: Manual sanity check**

Run: `pnpm nx dev dragline`, press **Shift+S**, confirm a clean black-and-white PNG still saves exactly as before. (Pure refactor; no functional change.)

- [ ] **Step 4: Commit**

```bash
git add apps/dragline/src/dragline.js
git commit -m "refactor(dragline): extract renderCleanFrameDataURL from saveComposition"
```

---

### Task 4: Wire recorder + REC indicator into dragline.js

**Files:**
- Modify: `apps/dragline/src/dragline.js` (imports, setup, keyPressed, draw, new `updateRecIndicator`)

- [ ] **Step 1: Add imports**

At the top of `apps/dragline/src/dragline.js`, after the `selection.js` import block (around line 28), add:

```js
import { createBurstRecorder } from './burst-recorder'
import { datestring, saveDataURLWithFallback, checkServer } from '@genart/p5-utils'
```

- [ ] **Step 2: Declare recorder + indicator element**

Inside the p5 instance callback, alongside `let motionSystem = null` (line 73), add:

```js
  let burstRecorder = null
  const recIndicator = document.getElementById('rec-indicator')
```

- [ ] **Step 3: Build the recorder in setup**

In `p.setup`, immediately after the `motionSystem = createMotionSystem({ ... })` block (ends line 128), add:

```js
    burstRecorder = createBurstRecorder({
      renderCleanFrame: renderCleanFrameDataURL,
      datestring,
      save: (dataURL, filename) => saveDataURLWithFallback(dataURL, filename)
    })
```

- [ ] **Step 4: Add `updateRecIndicator`**

Add this function inside the p5 callback (e.g. just above `const saveComposition`):

```js
  // Reflect recorder state in the DOM indicator. Recorder stays DOM-free.
  const updateRecIndicator = () => {
    if (!recIndicator) return
    if (burstRecorder.isRecording()) {
      recIndicator.textContent = `● REC ${String(burstRecorder.frameCount()).padStart(4, '0')}`
      recIndicator.className = 'rec-recording'
    } else if (burstRecorder.isArmed()) {
      recIndicator.textContent = '● REC armed'
      recIndicator.className = 'rec-armed'
    } else {
      recIndicator.textContent = ''
      recIndicator.className = 'rec-hidden'
    }
  }
```

- [ ] **Step 5: Add the arm key + hook the burst trigger in `p.keyPressed`**

In `p.keyPressed`, the motion block currently reads (lines 412-420):

```js
    if (!dragging && (p.key === 'm' || p.key === 'M')) {
      if (p.key === 'M') {
        motionSystem.cycleStrategy()
        console.log('Motion strategy: ' + motionSystem.strategyName())
      } else {
        motionSystem.impulse()
      }
      return
    }
```

Replace it with:

```js
    // 'R' arms recording for the next burst.
    if (!dragging && p.key === 'R') {
      burstRecorder.arm()
      checkServer()
      console.log('Burst recording armed')
      updateRecIndicator()
      return
    }

    if (!dragging && (p.key === 'm' || p.key === 'M')) {
      if (p.key === 'M') {
        motionSystem.cycleStrategy()
        console.log('Motion strategy: ' + motionSystem.strategyName())
      } else {
        motionSystem.impulse()
        // Only latch recording if the impulse actually produced motion,
        // so a zero-block burst can't leave the recorder stuck on.
        if (motionSystem.isActive()) burstRecorder.onBurstStart()
        updateRecIndicator()
      }
      return
    }
```

- [ ] **Step 6: Capture frames in `p.draw`**

The burst branch in `p.draw` currently reads (lines 618-621):

```js
    if (motionSystem && motionSystem.isActive()) {
      motionSystem.update()
      return
    }
```

Replace it with:

```js
    if (motionSystem && motionSystem.isActive()) {
      const stillActive = motionSystem.update()
      burstRecorder.captureFrame()
      updateRecIndicator()
      if (!stillActive) {
        burstRecorder.onBurstEnd()
        updateRecIndicator()
      }
      return
    }
```

- [ ] **Step 7: Run the dragline unit tests (regression)**

Run: `pnpm nx test dragline`
Expected: PASS — existing `motion.test.js` and the new `burst-recorder.test.js` all green (this task changes only `dragline.js`, which is not unit-tested directly).

- [ ] **Step 8: Commit**

```bash
git add apps/dragline/src/dragline.js
git commit -m "feat(dragline): wire burst-recorder into setup, keys, and draw loop"
```

---

### Task 5: REC indicator markup and styling

**Files:**
- Modify: `apps/dragline/index.html`
- Modify: `apps/dragline/css/style.css`

- [ ] **Step 1: Add the indicator element**

In `apps/dragline/index.html`, immediately after the opening `<body>` tag and before the first `<script>`/`<div id="info-box">`, add:

```html
    <div id="rec-indicator" class="rec-hidden" aria-live="polite"></div>
```

- [ ] **Step 2: Add styles**

Append to `apps/dragline/css/style.css`:

```css
#rec-indicator {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 1000;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 1px;
  pointer-events: none;
  user-select: none;
}

.rec-hidden {
  display: none;
}

.rec-armed {
  display: inline-block;
  color: #5a3a00;
  background: rgba(255, 191, 0, 0.85);
}

.rec-recording {
  display: inline-block;
  color: #ffffff;
  background: rgba(220, 0, 0, 0.85);
}
```

- [ ] **Step 3: Manual end-to-end verification (server up)**

In one terminal, start the save server:

```bash
node tools/local-save-server/server.js
```

In another: `pnpm nx dev dragline`. Then:
1. Press **R** → indicator shows amber "● REC armed".
2. Press **m** → indicator turns red "● REC NNNN", counting up while blocks move.
3. On settle → indicator disappears.
4. Confirm `dragline.burst-<id>.frame-0001.png` … `frame-NNNN.png` appear in the server output dir, in order, clean black-and-white.

Expected: a complete numbered sequence; one burst per arm (a second `m` without re-arming does not record).

- [ ] **Step 4: Manual fallback verification (server down)**

Stop the save server. In dragline: press **R**, then **m**. Confirm frames download via the browser instead (expect 30-90 files). Indicator behaves identically.

- [ ] **Step 5: Commit**

```bash
git add apps/dragline/index.html apps/dragline/css/style.css
git commit -m "feat(dragline): add visible REC indicator for burst recording"
```

---

### Task 6: Document the feature in the info box

**Files:**
- Modify: `apps/dragline/index.html` (info-box `<ul>`)

- [ ] **Step 1: Add a help entry**

In `apps/dragline/index.html`, inside the info-box `<ul>`, after the existing `SHIFT + S` save list item, add:

```html
        <li>
          <strong>R then m:</strong> Arm burst recording, then throw the blocks.
          Every frame of the movement saves as
          <code>dragline.burst-&lt;id&gt;.frame-NNNN.png</code> via the local
          save server (falls back to browser downloads if the server is off).
        </li>
```

- [ ] **Step 2: Verify build**

Run: `pnpm nx build dragline`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/dragline/index.html
git commit -m "docs(dragline): document burst recording in info box"
```

---

## Self-Review Notes

- **Spec coverage:** arm-then-burst (Task 4 Step 5) · clean frames (Task 3) · local-save-server + browser fallback (Task 1) · visible REC indicator (Tasks 4-5) · async drain queue for speed (Task 2) · zero-block guard (Task 4 Step 5) · filename scheme (Task 2) · shared lib, ATW/monochromifier untouched (Task 1). All covered.
- **`m` vs `M`:** lowercase `m` triggers + records; uppercase `M` cycles strategy and must NOT record — preserved in Task 4 Step 5.
- **Key collision:** `R` (Shift+R) is free; lowercase `r` remains reset.
- **Method names** consistent across tasks: `arm`, `isArmed`, `isRecording`, `frameCount`, `onBurstStart`, `captureFrame`, `onBurstEnd`.
