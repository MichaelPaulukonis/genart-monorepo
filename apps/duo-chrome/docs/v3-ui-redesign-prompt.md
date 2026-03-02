# DUO CHROME — V3 UI Redesign Prompt

## Governing Metaphor: Analog Video Synthesizer

Reinvent the duo-chrome UI as an **analog video synthesizer**. The aesthetic should evoke modular synthesis hardware: near-black chassis, phosphor green and amber accents, LED-style numeric readouts, knobs, patch-bay logic. The canvas is the output monitor. Everything else is signal control.

This is not a refinement of the V2 dark-panel system. It is a complete reinvention. V2 gave us a clean dark UI with card panels. V3 asks: what if this were a piece of hardware?

---

## Core Principles

1. **Metaphor first**: analog video synthesizer. Every UI decision should pass through this lens.
2. **Canvas is the output signal** — do not obscure it. Panels live beside or below the canvas, not over it.
3. **Keyboard shortcuts must survive** — they can be reassigned or rethought, but none may be removed. Where possible, make shortcuts feel like hardware controls (patch keys, transport keys).
4. **Loop = video transport unit**. The loop panel should feel like a VTR or DAW transport: scrub wheel for frames, in/out markers, play/pause controls.
5. **Filter = contact sheet**. The filter UI should feel like a light table — a grid of image thumbnails, search by name, individual tile selection.

---

## Layout

### Canvas-First (Flex Row)

```
┌─────────────────────────────────────┬──────────────┐
│                                     │              │
│          p5.js CANVAS               │  SIGNAL      │
│         (output monitor)            │  PANEL       │
│                                     │  (rack)      │
│                                     │              │
├─────────────────────────────────────┴──────────────┤
│             FILMSTRIP (persistent, bottom)          │
└────────────────────────────────────────────────────┘
```

- Canvas fills available space (`flex: 1`)
- Signal Panel is fixed width (~280–320px), full viewport height
- Filmstrip is a persistent strip at bottom — not toggled, always visible (collapsible)
- No floating panels that overlay the canvas during normal operation
- Filter (contact sheet) is a full-screen overlay — the one exception, because you need space for thumbnails

---

## Signal Panel (Right Side)

The Signal Panel is a vertical rack. It contains **rack modules** stacked top-to-bottom. Each module has a label strip like hardware rack units. Modules can collapse to their label strip.

### Module 1: Monitor (Status)

Displays the current state of both image channels. Inspired by a video monitor's sync display.

```
┌─────────────────────────────┐
│ ◈ MONITOR              [–]  │  ← label strip + collapse btn
├─────────────────────────────┤
│  A  ████  BUTTER.00         │  ← color swatch + tail-truncated name
│     Theme: Dairy            │
│     Scale: 1.00×            │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  B  ████  WARHOL.MONA       │
│     Theme: Art              │
│     Scale: 0.80×            │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│  Blend:  SCREEN             │
└─────────────────────────────┘
```

- Filename on hover shows full name as tooltip (`cursor: help`)
- Color swatch is a solid rectangle of the current channel color
- `A` / `B` labels styled like hardware channel indicators (lit/unlit)
- Blend mode styled like a 7-segment LED readout (monospace, amber)

### Module 2: Transport (Loop)

The heart of V3. Feels like a VTR transport section.

```
┌─────────────────────────────┐
│ ◈ TRANSPORT            [–]  │
├─────────────────────────────┤
│  [ENABLE LOOP]              │  ← large toggle, lit green when on
├─────────────────────────────┤
│   ╭─────────────────╮       │
│   │   ◉  JOG WHEEL  │       │  ← visual dial/knob for frame scrub
│   │   FRAME: 004    │       │  ← LED-style numeric readout
│   ╰─────────────────╯       │
│                             │
│   IN [004]       OUT [016]  │  ← in/out point markers
│   ════╪══════════╪══════    │  ← mini timeline with markers
│                             │
├─────────────────────────────┤
│  LENGTH: 24 frames          │
│  FPS:    [8 ][12][24][30]   │  ← segmented FPS selector
├─────────────────────────────┤
│  [|◀] [◀◀] [▶▶] [▶|]       │  ← transport buttons: start/rew/fwd/end
│        [▶▶] PLAY            │  ← play/pause
├─────────────────────────────┤
│  SEQUENCE PREVIEW           │
│  [A0→B0][A1→B1][A2→B0]...  │  ← scrollable pair strip
└─────────────────────────────┘
```

#### Jog Wheel

- An SVG or canvas-rendered circular dial
- Mouse drag (rotary gesture) scrubs through frames
- Click-and-hold + drag left/right also works
- Rotation angle reflects current frame position within the loop
- Frame number displayed inside or below the dial in LED-style numerics

#### In/Out Markers

- Displayed as bracketed numbers `IN [004]` and `OUT [016]`
- Clickable/editable — click to set to current frame
- The mini timeline shows their position as vertical tick marks
- **No graph recalculation required** — in/out markers define a playback sub-range of the already-generated walk. The walk graph is unchanged; only the playback controller tracks `inPoint` and `outPoint` frame indices.
- Playback loops within the in/out range only

#### FPS Selector

- Segmented button group: `[8]` `[12]` `[24]` `[30]`
- Active segment lights up in amber

#### Sequence Preview

- Horizontal scrolling strip of pair thumbnails
- Each tile: `A-image-name / B-image-name` (abbreviated, tooltip for full)
- Active frame is highlighted
- Clicking a tile jumps to that frame

---

## Contact Sheet (Filter)

Replaces the V2 filter panel. Opens as a **full-screen overlay** (the canvas is obscured, intentionally — this is a different mode).

### Layout

```
┌────────────────────────────────────────────────────────┐
│ CONTACT SHEET                          [Search: ____] ×│
├────────────────────────────────────────────────────────┤
│  Showing 23 of 163 images  [Clear]  [Save as Theme]    │
├────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│ │ img  │ │ img  │ │ img  │ │ img  │ │ img  │ │ img  │ │
│ │      │ │      │ │      │ │      │ │      │ │      │ │
│ │ ☑    │ │      │ │ ☑    │ │      │ │      │ │ ☑    │ │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│  butter   warhol   cats     comics    dots     splat    │
│                                                         │
│ ┌──────┐ ┌──────┐ ...                                  │
│ ...                                                     │
└────────────────────────────────────────────────────────┘
```

### Filter Model

The filter model supports **two complementary mechanisms** — both coexist:

```javascript
// Theme/filter data structure
{
  id: 'uuid',
  name: 'Dairy',
  filter: {
    searchString: 'butter',       // text search (kept from V2)
    selectedImages: [             // individual tile selections
      'butter.00.png',
      'butter.milk.00.png'
    ]
  }
}
```

**How selection works:**
- `searchString` produces a base set of matching images
- `selectedImages` can add images that don't match the search (individual additions)
- `selectedImages` can remove images that do match the search (individual subtractions — toggling a checked tile unchecks it)
- An empty `searchString` with non-empty `selectedImages` = fully manual selection
- An empty `selectedImages` array with a `searchString` = pure text filter (V2 behavior)

**UI behavior:**
- Typing in search box updates the visible grid in real time
- Each tile shows a checkbox — checked = included in result
- A tile not matching the search can still be checked (explicit addition)
- A tile matching the search can be unchecked (explicit exclusion)
- Selected tiles that don't match the current search string are shown in a separate "pinned" row at top
- "Clear" resets both `searchString` and `selectedImages`

### Thumbnails

- Images are served by Vite at `/images/filename.png`
- Use `<img src="/images/filename.png">` directly — no thumbnail generation needed
- Grid: auto-fill columns at ~120px minimum, responsive
- Filename displayed below thumbnail (truncated, tooltip for full name)
- Hover state: slight border highlight

---

## Filmstrip (Persistent, Bottom)

- Always visible (not toggled by default)
- Collapsible to a thin bar (double-click header or keyboard shortcut)
- Shows composition history as small thumbnails
- Active composition highlighted
- Click thumbnail to navigate to that history entry

---

## Keyboard Shortcuts

All existing shortcuts must survive. Some may be reassigned. Where possible, shortcuts should feel like hardware controls.

### Retained (same key, same action)
- `A` / `B` — select active channel
- `X` — exchange images
- `←` / `→` — navigate (history OR frame scrub, context-sensitive)
- `↑` / `↓` — adjust active image size
- `C` — cycle color palettes
- `M` — cycle blend modes
- `S` — toggle auto-save
- `Cmd+S` — manual save
- `Shift+S` — share (copy URL)
- `H` / `?` — toggle help
- `F` — toggle filmstrip (collapse/expand)
- `Shift+C` — clear history
- `I` — toggle status display (Monitor module collapse)

### Rethought / Reassigned
- `P` / `Space` — play/pause transport (was pause/resume, same intent)
- `L` — open Contact Sheet (was "Filter Images", same intent)
- `V` — toggle visual indicators
- `[` / `]` — in transport context: set in/out point (was history navigation — reassign history nav to `Shift+←` / `Shift+→`)
- `Cmd+[` / `Cmd+]` — jump to start/end of loop (was history jump — reassign to `Cmd+Shift+←` / `Cmd+Shift+→`)
- `,` / `.` — step one frame (jog wheel increment)
- `<` / `>` — step 5 frames
- `Shift+[` / `Shift+]` — previous/next 10 history entries

### Context Sensitivity
- Arrow keys behave differently when focus is in the Transport module vs. in the main canvas
- `[` / `]` set in/out only when Transport module is expanded and loop is enabled
- When Contact Sheet is open, arrow keys navigate the grid

---

## Aesthetic Details

### Color Palette
```css
--dc-chassis:     #0a0a0a;   /* near-black background */
--dc-panel:       #111318;   /* slightly lighter panel surface */
--dc-rack-border: #1e2129;   /* module separator lines */
--dc-phosphor:    #39ff14;   /* phosphor green (primary accent) */
--dc-amber:       #ffb000;   /* amber (secondary accent, LED numerics) */
--dc-cyan:        #00e5ff;   /* cyan (tertiary) */
--dc-red-warn:    #ff3b30;   /* warning / error */
--dc-text:        #c8ccd4;   /* primary text */
--dc-text-dim:    #666c7a;   /* secondary text / labels */

--dc-font-display: 'Share Tech Mono', 'Courier New', monospace;  /* LED-style */
--dc-font-ui:      system-ui, -apple-system, sans-serif;          /* labels */
```

### Typography
- Module labels: uppercase, letter-spaced, small — like hardware silk-screening
- LED numeric readouts: monospace, amber, slightly glowing (text-shadow)
- Filenames: monospace, phosphor green
- Secondary labels: dim gray, smaller

### Details
- Rack unit modules have a subtle top-border gradient (the "bezel")
- Active state indicators use a small LED dot (circle, lit color vs. dim)
- Buttons feel tactile — slight inset shadow on press, no border-radius or very small
- Knob/dial is an SVG: circle with a tick mark rotating to show position

---

## Implementation Notes

### File Structure (expected changes)
- `index.html` — new layout (flex row, persistent filmstrip)
- `css/style.css` — complete rewrite with V3 design system
- `src/ui/FilterModal.js` → rename to `ContactSheet.js` or keep name, completely rewrite
- `src/ui/LoopAnimationPanel.js` — complete rewrite as Transport module
- `src/ui/SignalPanel.js` — new: wrapper for Monitor + Transport rack
- `src/duo-chrome.js` — update all `updateStatusDisplay`, filter wiring, filmstrip wiring

### Preserved Constraints
- `LoopAnimationPanel` test suite queries `.loop-panel-section` class — preserve
- `getComputedStyle()` tests in jsdom require inline `<style>` block in `getHTML()` — preserve
- `filterModal.input` is accessed publicly by `duo-chrome.js` — maintain the pattern (rename as needed but keep the contract)
- All 383 tests must pass after implementation

### In/Out Markers — Technical Detail
The walk graph (`ClosedWalkGenerator.graphCache`) does not need to be rebuilt when in/out markers change. The walk is already a complete sequence of frame transitions. In/out markers are purely a **playback controller** concern:

```javascript
// In LoopAnimationController (or its wrapper)
this.inPoint = 0               // first frame to play
this.outPoint = walk.length - 1 // last frame to play

// Playback loop
if (this.currentFrame >= this.outPoint) {
  this.currentFrame = this.inPoint  // loop back to in-point
}
```

The graph walk generation algorithm (`closed-walk.js`) is untouched.

### Filter Model Migration
Current theme storage: `{ id, name, filter: { searchString } }`
V3 theme storage: `{ id, name, filter: { searchString, selectedImages: string[] } }`

Migration: existing themes load fine — `selectedImages` defaults to `[]` when absent (pure search-string behavior preserved).

---

## Out of Scope for V3 Initial Implementation

- D3 graph visualization (documented in `docs/plans/04.loop-graph-interaction-features.md`)
- Manual walk construction
- Multi-loop management
- Walk export/import
- Community sharing features

These remain in the backlog.
