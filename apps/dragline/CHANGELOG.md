# Changelog

All notable changes to dragline are documented here.

## 0.2.0 (2026-06-19)

### 🚀 Features

- **dragline:** auto-movement - press `m` to throw all blocks; they glide and settle. `Shift+M` cycles the motion strategy (logged to console)
- **dragline:** two motion strategies behind a pluggable seam - `velocity-friction` (random velocity, friction decay, bounce off edges) and `ease-tween` (random target, ease-out cubic glide to an exact stop)
- **dragline:** Vitest test setup (`test` target + config) with unit coverage for the motion system
