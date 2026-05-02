# Local Save Server — Design Spec

**Date:** 2026-04-19  
**Scope:** POC in Monochromifier app; server lives in `tools/`  
**Status:** Approved

## Problem Statement

p5.js `p.save()` forces files into the browser Downloads folder with no control over destination. canvas-sketch solves this via a CLI that injects a client API into the page, but requires wrapping sketches in its lifecycle — incompatible with this monorepo's apps. We need a lightweight alternative: a local server that accepts save requests from the browser and writes files to a configurable output directory.

## Requirements

- Save PNG files to `~/projects/images/genart-output/` (configurable)
- Create output directory automatically if absent
- Accept optional filename from client; fall back to server-generated timestamp name
- Graceful fallback to `p.save()` (browser download) when server is absent or unreachable
- No new shared libs for POC — client logic lives inside Monochromifier
- No external npm dependencies in server

## Architecture

### Server — `tools/local-save-server/`

```
tools/local-save-server/
  server.js      ← Node built-in http, no external deps
  config.json    ← port + outputDir
  package.json   ← { "start": "node server.js" }
```

**Endpoints:**

| Method | Path    | Description                                      |
|--------|---------|--------------------------------------------------|
| GET    | /ping   | Health check → 200 OK                            |
| POST   | /save   | Accepts JSON `{ dataURL, filename? }` → writes PNG |

**Config (`config.json`):**
```json
{
  "port": 7654,
  "outputDir": "~/projects/images/genart-output/"
}
```

Server adds CORS headers on all responses (browser→localhost is cross-origin). `filename` is optional — server generates `genart-YYYY-MM-DD-HHmmss.png` if omitted.

### Client — `apps/monochromifier/src/utils/save-local.js`

Module-level state:
- `SERVER_URL` — `'http://localhost:7654'` (matches config port)
- `serverAvailable` — `null | boolean`, cached after first ping

Functions:
- `checkServer()` — `GET /ping`, sets `serverAvailable`; called once at sketch init (async, non-blocking)
- `saveToServer(canvas, filename)` — `canvas.toDataURL('image/png')` → `POST /save`
- `saveWithFallback(p, canvas, filename)` — if `serverAvailable`, attempt server save; on failure reset flag and fall back to `p.save(canvas, filename)`; if `serverAvailable === false`, go straight to `p.save()`

### Monochromifier Integration

**`monochromifier.js`** (`p.setup()`):
- Call `checkServer()` (fire-and-forget) so result is cached before first save attempt
- Pass `saveWithFallback` into `handleKeys` dep object

**`input.js`** (`handleKeys`):
- Add `saveWithFallback` to destructured deps
- Replace `p.save(saveImage, generateFilename())` with `saveWithFallback(p, saveImage, generateFilename())`

## Data Flow

```
User presses Ctrl+S
  → saveWithFallback(p, canvas, filename)
      → serverAvailable === true  → POST /save → server writes file to outputDir
      → serverAvailable === false → p.save() → browser download
      → serverAvailable === null  → checkServer() → then branch above
      → POST fails                → reset serverAvailable=false → p.save()
```

## Error Handling

- Server unreachable on ping → `serverAvailable = false` → silent fallback, no user-visible error
- POST fails after ping succeeded → reset `serverAvailable = false`, fall back to `p.save()`, log to console
- Bad `dataURL` in POST body → server returns 400, client falls back
- Output directory creation fails → server returns 500, client falls back

## Testing Strategy

- Manual: run server, open monochromifier, Ctrl+S → verify file in output dir
- Manual: stop server, Ctrl+S → verify browser download fallback works
- Manual: start server after page load → ping caches correctly on first save
- No automated tests for POC

## Out of Scope (for now)

- Per-app config discovery (config cascade)
- Movie/frame stitching
- Server as Nx task / auto-start with `nx serve`
- Shared `libs/save-local/` extraction (do when second app needs it)
- Config in other apps

## Dependencies

- Node.js (built-in `http`, `fs`, `path`) — no npm install
- Monochromifier app on branch `mono-osd`
