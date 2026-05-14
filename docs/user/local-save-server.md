# local-save-server — User Guide

Saves generated images directly to a folder on your machine instead of triggering a browser download dialog. When the server is not running, apps fall back to normal browser downloads automatically.

See also: [Developer Reference](../dev/local-save-server.md)

---

## Setup (one time)

### 1. Configure the output directory

Edit `tools/local-save-server/config.json`:

```json
{
  "port": 7654,
  "outputDir": "~/Pictures/genart-output/"
}
```

Set `outputDir` to wherever you want saved images to land. The `~` shorthand works. The folder is created automatically if it doesn't exist.

### 2. Start the server

```bash
cd tools/local-save-server
node server.js
```

You should see:
```
local-save-server running on http://127.0.0.1:7654
Output dir: /Users/you/Pictures/genart-output/
```

Leave this terminal running while you use the apps.

---

## Using It

Once the server is running, saving from any integrated app writes the file directly to `outputDir`. No browser dialog appears.

If the server is not running, saves fall back to browser downloads — you don't need to do anything differently, it just works the other way.

---

## File Names

Apps pass a filename when saving (e.g. `monochromifier-2026-05-13-143022.png`). If no filename is provided, the server generates one:

```
genart-YYYY-MM-DD-HHMMSS.png
```

---

## Stopping the Server

`Ctrl+C` in the terminal running `node server.js`.

---

## Troubleshooting

**Files aren't appearing in my output folder**
- Confirm the server is running (`node server.js` output visible in terminal).
- Check `config.json` — `outputDir` must be set and the path must be valid.
- Check the server terminal for error messages after a save attempt.

**I see a browser download dialog even though the server is running**
- A previous save may have failed, causing the client to switch to fallback mode for the session. Reload the app page to reset.
- Confirm the server is on port 7654 (or matches the port in `save-local.js`).

**Port conflict on startup**
- Another process is using port 7654. Change `port` in `config.json` and update `SERVER_URL` in the app's `save-local.js` to match.

---

## Apps with Local Save Support

| App | Status |
|---|---|
| monochromifier | integrated |
| aggressive-text-waves | planned |

---

## Related Documentation

- [Developer Reference](../dev/local-save-server.md)
