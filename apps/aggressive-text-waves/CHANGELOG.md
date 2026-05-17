## [Unreleased]

## [0.2.1] - 2026-05-17

### Fixed
- **aggressive-text-waves:** word initial positions now use `p.random()` spread across grid instead of noise-sampled single point — words no longer cluster at canvas center on init
- **aggressive-text-waves:** antipodal repulsion no longer applies wrong-direction force when dx or dy is exactly zero
- **aggressive-text-waves:** boundary wrap triggers at `>= cols/rows` (was `>`), eliminating one-frame-late wrapping
- **aggressive-text-waves:** frame recording only runs when local-save server is confirmed available — prevents browser download spam when server is offline
- **aggressive-text-waves:** background noise z-offset tied to `zOffsetSpeed` param instead of hardcoded `0.01`
- **aggressive-text-waves:** all `Math.random()` calls replaced with seeded `p.random()` / `ctx.random()` — simulation is now reproducible with `randomSeed()`
- **aggressive-text-waves:** horizontal word separation push direction determined by sub-cell `posY` instead of random coin flip — eliminates per-frame flicker
- **aggressive-text-waves:** `noLoop()` called once in `toggleStep()` instead of every frame while step mode is active
- **aggressive-text-waves:** `Pane` instance moved inside p5 callback — prevents module-scope side effects on import
- **aggressive-text-waves:** background noise variable renamed `backgroundZoff` to distinguish from per-word `zoff`
- **aggressive-text-waves:** `pointerdown` event listener options corrected from `undefined` to `{}`

## [0.2.0]

### Added
- **aggressive-text-waves:** off-screen 2000×2000 `p5.Graphics` buffer; display canvas shows scaled-down copy; saves export at full resolution regardless of display size
- **aggressive-text-waves:** split `draw()` into `update()` (simulation) and `render()` (drawing); toggling outline or other display params while paused now redraws without advancing simulation state
- **aggressive-text-waves:** use `createOffscreenCanvas` helper from `@genart/p5-utils`

## [0.1.0]

### Added
- **aggressive-text-waves:** word outlines toggleable via `o` key and Tweakpane checkbox; outline updates immediately when toggled while paused
- **aggressive-text-waves:** `Space` key pauses/resumes; `n` advances one frame while paused; Tweakpane step button syncs with keyboard
- **aggressive-text-waves:** gravity center overlay uses per-source color palettes; color interpolates white (strength=0) → warm (attraction) or cool (repulsion)
- **aggressive-text-waves:** Tweakpane reorganized into "gravity" folder (center speed, source count, per-source strengths) and "physics" folder (force weights, noise offset speeds)
- **aggressive-text-waves:** extract `Word` and `Cell` classes to `src/word.js` and `src/cell.js`
- **aggressive-text-waves:** boids-style velocity/force movement model replacing stateless noise-target lerp; words now have momentum, damping, and incremental gravity forces
- **aggressive-text-waves:** new Tweakpane "physics" folder with `maxSpeed`, `damping`, `wander`, `gravity`, `separation` sliders
- **aggressive-text-waves:** add `.eslintrc.json` with StandardJS + p5js plugin; `new-cap` exception for `p5` constructor; lint and build now pass from monorepo root
- **aggressive-text-waves:** About screen with app description, controls reference, and links to GitHub and author homepage
- **aggressive-text-waves:** first-visit auto-show for About screen (localStorage, no consent required)
- **aggressive-text-waves:** `?` key toggles About screen
- **aggressive-text-waves:** ESC key closes About screen
- **aggressive-text-waves:** multiple gravity sources via `sourceCount` slider (0-5); each source moves independently via Perlin noise
- **aggressive-text-waves:** negative gravity values for repulsion (`gravityStrength` range extended to -1..1)

### Fixed
- **aggressive-text-waves:** changing source count no longer resets existing source strengths to default
