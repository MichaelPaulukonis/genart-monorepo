# Auto Movement

## Goal

Add automated, animated motion to dragline's text blocks. On a keystroke, every
block is thrown in a random direction at a random speed and glides to a stop,
decelerating at the end. Built with a pluggable strategy seam so additional
motion styles can be added later.

## Key Requirements

- Keystroke trigger (`m`) sends **all** blocks moving — one-shot impulse, not a
  persistent loop. Composition stays still between presses (preserves the
  artist's ability to keep a still composition).
- Two interchangeable strategies behind a common interface:
  - **velocity-friction** — random initial velocity, friction decay, **bounce**
    off canvas edges, settles when velocity ~0.
  - **ease-tween** — random target cell + duration, ease-out glide, exact stop.
- `Shift+M` cycles the active strategy.
- Blocks remain plain integer-grid objects; motion state held externally so save
  / JSON serialization is unaffected.
- No external physics library — p5 plus a few easing/vector lines.

## Target Audience

The artist using dragline interactively in the browser.

## Open Questions

- Frame-rate dependence of frame-based stepping (see Risks). Acceptable for v1?
- Strategy-change discoverability — console log vs. infobox line. Defaulting to a
  brief on-screen / console note.
