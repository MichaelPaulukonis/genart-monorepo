# PRD: Document the createModal() Factory Pattern

## Problem Statement

After the createModal() factory is implemented in infobox.js and proven by the About
screen, other monorepo apps need a clear reference for adopting the pattern. The
documentation should be concise and copy-paste focused — not a design proposal,
but a practical guide written against the actual implementation.

## Task

Create `docs/guides/modal-factory-pattern.md` documenting:

- What createModal() does and what problem it solves
- The config object shape with all properties explained
- The instance API: show(), hide(), toggle(), isVisible()
- How conflictsWith works (mutual closing)
- How first-visit auto-show with localStorage works
- A minimal worked example showing the full setup for a new app
- An adoption checklist for copy-and-adapt (what to change per app):
  - element id in HTML
  - storageKey string
  - content in the HTML
  - keyboard shortcut wiring in input.js
  - conflictsWith wiring if help screen exists

## Constraints

- Write against the actual implementation in infobox.js, not the spec
- No new abstractions — do not propose extracting to a shared library
- Keep it short: a developer should be able to adopt the pattern in under 30 minutes

## Dependencies

- Must be written after task 12 (factory implementation) and task 13 (About screen)
  so it documents real code, not aspirational code
