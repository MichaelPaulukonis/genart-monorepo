# Dragline: Burst Frame Capture

**Date:** 2026-06-19
**App:** dragline
**Status:** Design approved, pending implementation plan

## Problem Statement

Dragline's auto-movement ("burst") animates all text blocks from an impulse
until they settle. Currently only single still-frame saves exist (Shift+S).
There is no way to capture the full animation as a sequence of frames, which
would let the user assemble the motion into an animated artifact (GIF/video) in
external tooling.

Goal: save every painted frame of a burst, start to finish of the movement, as
individual PNGs.

## Requirements

- Capture each rendered frame of a burst, from impulse to settle, as a numbered
  PNG sequence.
- **Toggle record mode** trigger: a key (`R`) toggles record mode on/off. While
  on, *every* subsequent burst records all its frames; record mode persists
  across bursts until toggled off with `R` again. Normal bursts (record mode off)
  stay unsaved. (MVP: manual on/off only — no auto-disable on other keypresses.)
- Frames render **clean** (white background, no gradient, no selection
  highlight) — identical look to the existing Shift+S `saveComposition` output.
- Frames persist via the shared **local-save-server** (`localhost:7654`). When
  the server is unreachable, **fall back to browser downloads** (mirrors ATW),
  accepting that a burst yields 30-90 download files.
- **Visible REC indicator** on screen: armed state and a live frame counter
  while recording.
- Saving every frame correctly is the hard requirement. Running at full speed is
  a strong preference, not a gate — slowdown during recording is acceptable if it
  serves complete, correct capture. The chosen approach (async drain queue) aims
  for full speed; if it ever conflicts with capturing every frame, correctness wins.

### Non-Goals (YAGNI)

- No server-side subfolder grouping (server flattens paths via `path.basename`).
  Grouping is by filename prefix only.
- No migration of ATW / monochromifier to the shared helper now (separate
  future task).
- No in-app GIF/video assembly. External tooling consumes the PNG sequence.
- No throttling/frame-skip controls. Every burst frame is captured.

## Technical Approach

### Frame timing

Burst lifecycle: `motionSystem.impulse()` seeds kinematic state; `p.draw` calls
`motionSystem.update()` each frame, which returns `active` and redraws via
`requestDisplay`. When `active` flips false the blocks have settled. That window
— first `update()` after impulse through the frame `active` becomes false — is
the capture window.

### Recording engine: capture-during-draw with async drain queue

Each draw frame while recording: render the clean composition, grab a dataURL
synchronously (`canvas.toDataURL('image/png')`), enqueue `{ dataURL, filename }`,
and drain the queue asynchronously with bounded concurrency. Animation continues
full speed; the only synchronous cost is `toDataURL` (~ms/frame). Frame ordering
is guaranteed by a zero-padded sequence number baked into each filename, so async
save races are harmless. Memory stays bounded because the queue drains as it fills
(rejected alternative: buffering all 30-90 fullscreen 2x dataURLs holds
~50-150MB at once).

### Filename scheme

```
dragline.burst-<datestring>.frame-<NNNN>.png
```

- `<datestring>`: `datestring()` from `@genart/p5-utils` (`YYYYMMDDHHMMSS`),
  captured once at burst start = the burst id.
- `<NNNN>`: 4-digit zero-padded frame index, starting `0001`.

Grouping is by the `burst-<id>` prefix because the server writes all files flat
into one output dir.

## Components

### 1. Shared save-local helper — `libs/p5-utils/src/save-local.js`

Extracted from ATW's copy, re-exported from `libs/p5-utils/src/index.js`.

- `checkServer()` — ping `localhost:7654/ping`, cache availability.
- `isServerAvailable()`
- `saveWithFallback(p, graphics, filename)` — existing signature (graphics-based).
- **`saveDataURLWithFallback(dataURL, filename, { download })`** — new. The recorder
  already holds a dataURL string; this path POSTs it to the server, or on failure
  builds an anchor browser download from the dataURL. `download` is injectable for
  testing.

ATW and monochromifier keep their local copies untouched.

### 2. Burst recorder — `apps/dragline/src/burst-recorder.js`

Factory mirroring `motion.js` style, DOM-agnostic (testable):

```js
createBurstRecorder({ p, renderCleanFrame, datestring })
```

State: `armed`, `recording`, `burstId`, `frameIndex`, `queue`, `inFlight`.

API:

- `toggleArm()` — flips `armed` (persistent record-mode flag); returns the new
  state. Caller kicks `checkServer()` when turning on.
- `isArmed()`, `isRecording()`, `frameCount()` — getters for the indicator.
- `onBurstStart()` — only if `armed`: set `recording = true`, `burstId =
  datestring()`, `frameIndex = 0`. Does **not** clear `armed` — record mode stays
  on so subsequent bursts keep recording until toggled off. Guard: caller invokes
  this only when `motionSystem.isActive()` is true right after impulse, so a
  zero-block impulse never leaves recording stuck on.
- `captureFrame()` — no-op unless recording. `renderCleanFrame()` → dataURL;
  build filename; enqueue; `drain()`. Increments `frameIndex`.
- `onBurstEnd()` — `recording = false`; final `drain()`.
- `drain()` — internal. Pull from queue, `saveDataURLWithFallback`, cap
  concurrency (max ~4 in flight).

### 3. dragline.js wiring

- **`renderCleanFrameDataURL()`** — extract saveComposition's clean-render block
  (null gradient, clear `selectedIndex`, `push / background(255) /
  renderCharGrid / pop`, then `toDataURL`, restore). `saveComposition` refactored
  to reuse it (no behavior change).
- **Setup** — build recorder after `motionSystem`:
  `burstRecorder = createBurstRecorder({ p, renderCleanFrame: renderCleanFrameDataURL, datestring })`.
- **`p.keyPressed`** (in the `!dragging` motion branch, not in selection mode):
  - `R` / Shift+R → `burstRecorder.toggleArm()`; if now on, `checkServer()`;
    `updateRecIndicator()`. (`r` lowercase already = reset; `R` is free.)
  - existing `m` → `motionSystem.impulse()`; if `motionSystem.isActive()` then
    `burstRecorder.onBurstStart()`; `updateRecIndicator()`.
- **`p.draw`** burst branch:
  ```js
  if (motionSystem && motionSystem.isActive()) {
    const stillActive = motionSystem.update()
    burstRecorder.captureFrame()
    updateRecIndicator()
    if (!stillActive) { burstRecorder.onBurstEnd(); updateRecIndicator() }
    return
  }
  ```

### 4. REC indicator — DOM

- New `#rec-indicator` div in `apps/dragline/index.html`, fixed corner (sibling
  of `#version-display`), hidden by default. CSS in the app's stylesheet.
- States via `updateRecIndicator()` in dragline.js (reads recorder getters):
  - armed → amber `● REC armed`
  - recording → red `● REC NNNN` (live frame count)
  - idle → hidden
- Recorder stays DOM-free; dragline owns the DOM update.

## Data Flow

```
key R ─→ recorder.arm() ─→ checkServer()        indicator: "REC armed"
key m ─→ motion.impulse() ─→ recorder.onBurstStart()   indicator: "REC 0000"
p.draw (each frame, while active):
    motion.update() ──→ renders motion step
    recorder.captureFrame()
        renderCleanFrameDataURL() ─→ dataURL
        enqueue {dataURL, filename}
        drain() ─→ saveDataURLWithFallback ─→ server POST  (or browser download)
    updateRecIndicator()                         indicator: "REC NNNN"
    settle (active=false) ─→ recorder.onBurstEnd() ─→ final drain  indicator: hidden
```

## Error Handling

- **Server down at arm:** `checkServer()` resolves unavailable; recording still
  proceeds, every frame falls back to a browser download. (User accepted the
  30-90 file flood.)
- **Server fails mid-burst:** `saveDataURLWithFallback` catches the failed POST,
  flips availability false, and downloads that frame in the browser; subsequent
  frames go straight to download. Mirrors ATW's `saveWithFallback`.
- **Zero-block impulse:** `onBurstStart` guarded by `motionSystem.isActive()`, so
  recording never latches on with no frames; `armed` (record mode) stays on for
  the next real burst.
- **Strategy cycled mid-record:** out of scope; record window is one burst.

## Testing Strategy

- **Unit (Vitest), `burst-recorder.test.js`:** arm/disarm transitions; filename
  sequence formatting and zero-pad; `onBurstStart` guard on inactive motion;
  `captureFrame` no-op when not recording; queue drain ordering / concurrency
  cap. Inject fake `renderCleanFrame` + fake save fn.
- **Unit, save-local:** `saveDataURLWithFallback` POSTs when server available,
  downloads on failure (mock `fetch`).
- **Manual:** run local-save-server, arm, burst, confirm N PNGs land in output
  dir named `dragline.burst-*.frame-NNNN.png` and reassemble in order. Repeat
  with server stopped → browser downloads.
- Follow existing `motion.test.js` patterns. Run via `pnpm nx test dragline`.

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| `toDataURL` per frame janks animation | Sync cost is ~ms; acceptable. Slowdown tolerated if needed — full speed is a preference, complete capture is the gate. |
| Server-down floods Downloads with 30-90 files | User accepted. Indicator shows recording is live so it's not a surprise. |
| Async save races reorder frames | Sequence number in filename, not arrival order. Order is intrinsic. |
| Memory from queued dataURLs | Bounded-concurrency drain keeps queue short; not buffered whole-burst. |
| Shared-lib extraction breaks p5-utils consumers | Only adds exports; existing functions unchanged. ATW/monochromifier copies untouched. |

## Dependencies

- `tools/local-save-server` (existing, shared).
- `@genart/p5-utils` (`datestring`, new `save-local` module).
- Dragline's existing `motion.js` (`createMotionSystem` — `impulse`, `update`,
  `isActive`).

## Implementation Order (high level)

1. Add `save-local.js` to `libs/p5-utils`, export `saveDataURLWithFallback`,
   re-export from index. Unit test.
2. `burst-recorder.js` + unit tests.
3. Extract `renderCleanFrameDataURL` in dragline.js; refactor `saveComposition`.
4. Wire recorder into setup / keyPressed / draw.
5. REC indicator markup + CSS + `updateRecIndicator`.
6. Manual verification (server up and down).
