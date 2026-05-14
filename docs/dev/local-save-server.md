# local-save-server — Developer Reference

Saves canvas output directly to disk from any browser-based genart app, bypassing the browser download dialog. Falls back to browser download when server is unavailable.

See also: [User Guide](../user/local-save-server.md)

---

## Architecture

```
browser app
  └── save-local.js (client module)
        ├── GET /ping  →  checks server availability (cached, 1s timeout)
        └── POST /save →  sends PNG dataURL, receives saved filepath

tools/local-save-server/
  └── server.js  (Node.js HTTP, 127.0.0.1 only, port 7654)
        └── writes PNG to outputDir (configured in config.json)
```

---

## Server

**Location:** `tools/local-save-server/`

**Entry point:** `server.js` — plain Node.js HTTP server, no framework.

**Start:**
```bash
cd tools/local-save-server
node server.js
```

### Configuration (`config.json`)

```json
{
  "port": 7654,
  "outputDir": "~/path/to/output/"
}
```

| Field | Required | Default | Notes |
|---|---|---|---|
| `port` | no | `7654` | Port to listen on |
| `outputDir` | **yes** | — | `~` expands to `os.homedir()`. Created if missing. |

### Endpoints

#### `GET /ping`
Health check. Returns `{ ok: true }` with HTTP 200.

#### `POST /save`
Saves a PNG file to `outputDir`.

**Request body:**
```json
{
  "dataURL": "data:image/png;base64,...",
  "filename": "my-sketch-001.png"
}
```

| Field | Required | Notes |
|---|---|---|
| `dataURL` | yes | Must start with `data:image/png;base64,` |
| `filename` | no | Falls back to `genart-YYYY-MM-DD-HHMMSS.png` |

**Response (success):**
```json
{ "ok": true, "filename": "my-sketch-001.png", "path": "/absolute/path/to/file.png" }
```

**Response (error):**
```json
{ "error": "description" }
```
HTTP 400 for bad input, 500 for write errors.

**Security:** Server binds to `127.0.0.1` only. CORS headers allow all origins (localhost dev use — do not expose to a network).

---

## Client Module

**Location:** `libs/` or per-app `src/utils/save-local.js`

The module is currently duplicated per-app. Candidate for extraction to a shared lib.

### API

#### `checkServer() → Promise<void>`
Probes `GET /ping` with a 1-second timeout. Result cached in module-level `serverAvailable`. Deduplicates concurrent calls — safe to call multiple times.

#### `saveWithFallback(p, graphics, filename) → Promise<void>`
Primary save entry point.

| Param | Type | Notes |
|---|---|---|
| `p` | p5 instance | Used for `p.save()` fallback |
| `graphics` | p5.Graphics | Must have `.canvas` (standard p5.Graphics) |
| `filename` | string | Suggested filename including extension |

**Behaviour:**
1. If `serverAvailable` is unknown, calls `checkServer()` first.
2. Attempts `POST /save` with the canvas `dataURL` and filename.
3. On server failure, logs a warning, sets `serverAvailable = false`, falls back to `p.save(graphics, filename)` (browser download).

```js
import { saveWithFallback, checkServer } from './save-local.js'

// Optional: pre-check on startup so first save has no latency
checkServer()

// On save event:
await saveWithFallback(p, myGraphics, 'output-001.png')
```

---

## Integrating into an App

1. Copy `apps/monochromifier/src/utils/save-local.js` into your app's `src/utils/`.
2. Import and call `saveWithFallback` in your save handler.
3. `graphics` must be a p5.Graphics object. If saving the main canvas, wrap it:
   ```js
   // p5 instance mode — main canvas is not a p5.Graphics; create one or use p.save() directly
   // For off-screen buffers created with p.createGraphics(), pass directly.
   ```
4. Start `tools/local-save-server/` before running the app (or skip — fallback handles it).

---

## Fallback Behaviour

| Condition | Result |
|---|---|
| Server running, save succeeds | File written to `outputDir`, no browser dialog |
| Server not running | Browser download dialog (first save has ~1s delay for timeout) |
| Server running, write fails | Warning logged, browser download dialog |
| Server goes down mid-session | `serverAvailable` set to `false`; subsequent saves use browser download |

---

## File Naming

When `filename` is omitted from the POST body, the server generates:
```
genart-YYYY-MM-DD-HHMMSS.png
```

Only the `path.basename` of a provided filename is used — directory traversal is not possible.

---

## Related Documentation

- [User Guide](../user/local-save-server.md)
- Client usage example: `apps/monochromifier/src/utils/save-local.js`
- Server: `tools/local-save-server/server.js`
