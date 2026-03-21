# PRD: About Screen – Revised Approach

## Problem Statement

The monochromifier needs an About screen for onboarding and app info. The original plan
created a parallel modal system alongside the existing `.info-box` / `infobox.js`
infrastructure. This revision instead refactors the existing modal code into a generic
factory and builds the About screen on top of it — less code, no duplicate patterns,
and portability via copy-and-adapt rather than a shared library.

## Approach

### Task A: Refactor infobox.js into a createModal() factory

The existing `infobox.js` already implements the complete modal pattern: show/hide,
draggable, ESC to close, localStorage persistence for state, event bleed-through
protection. Extract this into a `createModal(config)` factory function within the same
file (no new files needed at this stage). Reinstantiate the existing help screen using
the factory so behavior is unchanged. The factory becomes the portable pattern — other
apps copy `infobox.js` and call `createModal()` with their own config.

Factory config shape:
- `id` — DOM element id
- `storageKey` — optional localStorage key for persisted state
- `centered` — boolean, uses translate(-50%,-50%) centering (like help screen)
- `draggable` — boolean
- `onShow` / `onHide` — optional callbacks
- `conflictsWith` — array of other modal instances to close when this one opens

Modal instances returned by the factory expose: `show()`, `hide()`, `toggle()`,
`isVisible()`.

Conflict resolution is handled via the `conflictsWith` config — each modal closes the
others listed when it opens. No central registry needed.

### Task B: Implement the About screen using the factory

Add `#about-box` to `index.html` reusing `.info-box` CSS (no new modal CSS class).
Content:
- What monochromifier does (1–2 sentences)
- Basic usage: drop/load an image, adjust threshold with arrow keys
- How to access full help: press `?`
- Link to GitHub repo
- Link to author homepage (michaelpaulukonis.github.io)

Wire up:
- First-visit auto-show: check `monochromifier_about_seen` in localStorage on load;
  show About if absent, mark seen immediately
- Keyboard shortcut `a` to toggle (add to `input.js`)
- "About" link added to the existing help screen footer (no floating button)
- Conflict: About closes Help when opened; Help closes About when opened
  (handled via `conflictsWith` in factory config)

## Implementation Steps

1. Refactor `infobox.js`: extract `createModal()` factory; re-wire help screen through it
2. Add `#about-box` HTML to `index.html` (reuse `.info-box` styles)
3. Instantiate About screen via `createModal()` in `infobox.js`
4. Add first-visit localStorage check and `a` key shortcut
5. Add "About" link/button to help screen footer
6. Verify conflict resolution: opening one modal closes the other

## Testing Strategy

- Clear localStorage, reload → About appears automatically
- Dismiss, reload → About does not appear
- Press `a` → About toggles; press `?` → Help opens, About closes (and vice versa)
- ESC closes whichever modal is open
- Verify help screen behavior is unchanged from before the refactor
- Verify links open in new tab with rel="noopener"

## Portability

The portable artifact is `infobox.js` containing the `createModal()` factory.
Other apps adopt the pattern by copying the file and calling `createModal()` with
their own content and config. No shared library, no cross-app dependency.
Document the factory API in a short `docs/guides/modal-factory-pattern.md`.
