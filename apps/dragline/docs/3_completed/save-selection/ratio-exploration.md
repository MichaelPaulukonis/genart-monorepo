# Selection Ratio Exploration

## UI Surfaces to Consider

- **Canvas Overlay Toggles**
  - Render ratio handles or buttons directly inside the overlay.
  - Pros: keeps focus on the artwork; immediate visual feedback.
  - Cons: harder to implement hover affordances and accessibility compared to DOM elements.
- **Floating HUD / Toolbar**
  - Small HTML panel anchored near the canvas edge with radio buttons, segmented control, or dropdown.
  - Pros: leverage native focus states, easier to internationalize; can coexist with future settings.
  - Cons: requires coordination with fullscreen mode and info-box layout; needs to hide or collapse during export.
- **Keyboard Palette**
  - Assign shortcuts (e.g., number keys) to cycle through ratios; display current choice via on-canvas toast.
  - Pros: quick for power users, minimal visual clutter.
  - Cons: discoverability and memory burden; conflicts with existing key bindings must be avoided.
- **Command Palette Modal**
  - Shortcut opens a searchable palette where typing selects a ratio or "freeform" option.
  - Pros: extensible for future commands; good for long lists of presets.
  - Cons: heavy interaction for a small set of ratios; interrupts flow if used frequently.

A hybrid approach (HUD + keyboard accelerators) seems promising: a lightweight HTML toolbar for discoverability, with optional shortcuts for speed.

## Candidate Ratio Presets

| Label | Aspect | Use Cases |
| ----- | ------ | --------- |
| 1:1 | Square | Instagram grid posts, avatars |
| 4:5 | Portrait (tall) | Instagram portrait feed, print |
| 3:4 | Portrait | Standard photo print, editorial |
| 2:3 | Portrait | DSLR photos, posters |
| 16:9 | Landscape | Video thumbnails, widescreen displays |
| 21:9 | Cinematic | Ultra-wide compositions |
| 9:16 | Vertical video | Stories, Reels, Shorts |
| 5:4 | Landscape | Older display ratios, zines |
| Freeform (Arbitrary) | N/A | No ratio lock; manual resizing |

Implementation detail: ratios can be stored as `{ label, width, height }` with `null` signifying the arbitrary option.

## Additional Requirements & Open Questions

- **State Management**
  - Persist the selected ratio alongside bounds, so re-entering selection mode restores both.
  - Decide whether ratio presets lock resizing to guidance only or hard constraints.
- **Visual Feedback**
  - Show the active ratio label near the overlay (e.g., appended to the dimension badge).
  - Indicate when the selection deviates from the preset if we allow temporary overrides (e.g., highlight badge in warning color).
- **Keyboard & Accessibility**
  - Provide focusable controls with ARIA labels if using HTML UI.
  - Optional keyboard accelerators (numbers or bracket keys) should be documented and conflict-free.
- **Responsiveness**
  - Ensure HUD scales on smaller viewports or when the info box is open.
  - Consider hiding less-used ratios behind an expandable menu for compact layouts.
- **Persistence Beyond Session**
  - Potentially store last-used ratio in `localStorage` to streamline repeated exports.
- **Testing Strategy**
  - Unit-test ratio snapping math (ensure selection resizes correctly for both axis drags).
  - Integration tests for UI controls can focus on state transitions within Jest + JSDOM or manual QA checklist.
- **Future Enhancements**
  - Allow custom ratios (user enters width:height) and optionally save favorites.
  - Introduce preview frames showing how the export would appear on social platforms.

## Next Steps Before Implementation

1. Pick initial UI surface(s) from the options above and sketch layout (wireframes or quick prototype).
2. Define the exact preset set and ordering, validating against target platforms.
3. Decide on interaction rules (strict locking vs. soft guidance) for ratios.
4. Update design spec and README once decisions are made, then proceed with implementation tasks.
