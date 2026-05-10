## [Unreleased]

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
