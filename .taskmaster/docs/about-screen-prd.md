# PRD: About Screen for Monochromifier (with Portability to Other Apps)

## Problem Statement

New visitors to the monochromifier app have no onboarding — the app loads directly into a
blank canvas with no explanation of what it does or how to use it. Users who want to revisit
basic usage information have no dedicated place to find it outside of the keyboard-shortcut
help screen (? key). Additionally, no app in the monorepo has a discoverable "About" entry
point linking to the project's GitHub repo or the author's homepage.

## Requirements

### Functional
- An "About" screen (modal overlay) that shows:
  - A brief description of what the app does
  - Basic usage: load an image, adjust threshold, use keyboard shortcuts
  - How to access the full help screen (press ?)
  - A link to the app's GitHub repository
  - A link to the author's homepage (michaelpaulukonis.github.io)
- Display automatically on first visit; do not show again on subsequent visits
  - Use localStorage key `monochromifier_about_seen` to track first-visit state
  - Provide a way to re-open the About screen (keyboard shortcut `a`, and a UI button)
- GDPR note: storing a "has seen about" flag in localStorage is strictly necessary UI state,
  not tracking or analytics — no consent banner is required

### Non-Functional / Portability
- Implement the About screen as a self-contained, portable pattern:
  - Minimal coupling to app-specific code (content injected via config object or HTML)
  - The show/hide/firstVisit logic should live in a single reusable JS module
  - CSS styling should be generic enough to reuse across apps with minor theming
  - Other monorepo apps (duo-chrome, dragline, etc.) should be able to adopt this pattern
    with only content changes
- Consider whether the pattern warrants extraction into `libs/` as a shared utility, or
  whether a documented copy-and-adapt pattern is sufficient given the apps' independence

## Technical Approach

### Monochromifier implementation
- Add `#about-box` overlay to `index.html` with content sections: description, usage, links
- Add `about.js` module (or extend `infobox.js`) to manage show/hide and localStorage flag
- Wire `a` key in `input.js` to toggle the About screen
- Add a small "About" button or link in the existing UI (e.g., in the help box footer or
  as a persistent corner element)
- Reuse existing modal styles from `.info-box` for visual consistency; extract shared
  modal CSS into a common class if needed

### Portability path
- Document the pattern in `docs/guides/about-screen-pattern.md` so other apps can adopt it
- If 2+ apps implement it, evaluate extracting a `createAboutScreen({ storageKey, content })`
  factory into `libs/p5-utils` or a new `libs/ui-utils`

## Implementation Steps

1. Design the About screen content for monochromifier (text, links)
2. Add `#about-box` HTML and CSS (reuse/extend `.info-box` styles)
3. Implement `about.js` with show/hide/firstVisit logic using localStorage
4. Wire keyboard shortcut `a` and re-open affordance in UI
5. Test first-visit behavior, re-open, and dismiss (ESC + close button)
6. Write `docs/guides/about-screen-pattern.md` documenting the portable pattern
7. Evaluate extraction to shared lib based on complexity

## Testing Strategy

- Manual: clear localStorage, reload — About screen should appear
- Manual: dismiss, reload — About screen should not appear
- Manual: press `a` — About screen should re-open regardless of localStorage
- Verify links open correctly (GitHub repo, author homepage)
- Check that existing `?` help screen still works independently

## Risks & Mitigation

- Risk: About and Help screens conflict visually or in z-index
  Mitigation: ensure only one modal is visible at a time; close About when Help opens
- Risk: over-engineering the portability into a premature abstraction
  Mitigation: implement in monochromifier first; extract only if a second app adopts it

## Dependencies

- Existing `.info-box` CSS and modal pattern in monochromifier
- `infobox.js` draggable/show/hide infrastructure (reference, not a hard dependency)
