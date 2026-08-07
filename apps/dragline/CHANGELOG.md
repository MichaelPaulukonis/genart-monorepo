# Changelog

All notable changes to dragline are documented here.

## Unreleased

### 🐛 Fixes

- **dragline:** fix info-box jumping on first click-and-drag (baseline offset assumed `translate(0,0)` instead of reading the CSS-centered starting position)
- **dragline:** fix `R` (burst-recording) not stopping capture immediately when disarmed mid-burst (recording flag was left on until the burst naturally settled)

### 🎨 UI

- **dragline:** widen and shorten the help/info box, and trim the verbose `R` burst-recording entry (naming scheme and frame-count details moved to README)

## 0.2.0 (2026-06-19)

### 🚀 Features

- **dragline:** auto-movement - press `m` to throw all blocks; they glide and settle. `Shift+M` cycles the motion strategy (logged to console)
- **dragline:** two motion strategies behind a pluggable seam - `velocity-friction` (random velocity, friction decay, bounce off edges) and `ease-tween` (random target, ease-out cubic glide to an exact stop)
- **dragline:** Vitest test setup (`test` target + config) with unit coverage for the motion system
