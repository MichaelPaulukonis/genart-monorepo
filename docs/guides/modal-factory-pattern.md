# Modal Factory Pattern

A lightweight, copy-and-adapt pattern for draggable modal overlays in vanilla-JS
apps. Implemented in `apps/monochromifier/src/infobox.js` and proven by two modals:
the Help screen and the About screen.

## What it solves

- Consistent show/hide/toggle behaviour across multiple overlays
- Automatic mutual closing ("opening A closes B")
- Drag-to-reposition, centered or free-positioned
- Canvas bleed-through protection (stops pointer events reaching a p5.js canvas)
- ESC key handling in one place

## How to adopt

Copy `makeDraggable`, `setTranslate`, and `createModal` from `infobox.js` into
your app's UI module. No dependencies beyond the DOM.

---

## The factory

```js
function createModal({ id, centered = false, ariaLabel }) {
  const el = document.getElementById(id)
  if (!el) { console.error(`createModal: element #${id} not found`); return null }

  makeDraggable(el, { centered })

  // Prevent clicks inside the modal from reaching a canvas behind it
  el.addEventListener('mousedown', e => e.stopPropagation())
  el.addEventListener('touchstart', e => e.stopPropagation(), { passive: false })
  el.addEventListener('pointerdown', e => e.stopPropagation())

  if (ariaLabel) {
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', ariaLabel)
    el.setAttribute('aria-modal', 'false')
  }

  const instance = {
    conflictsWith: [],   // assign after all modals exist — see below

    show() {
      this.conflictsWith.forEach(m => m && m.hide())
      el.classList.remove('hidden')
    },
    hide()      { el.classList.add('hidden') },
    toggle()    { this.isVisible() ? this.hide() : this.show() },
    isVisible() { return !el.classList.contains('hidden') }
  }

  // Wire any element with class .close-button inside this modal
  const closeBtn = el.querySelector('.close-button')
  if (closeBtn) closeBtn.addEventListener('click', () => instance.hide())

  return instance
}
```

### Config

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | string | — | DOM element `id` of the modal container |
| `centered` | boolean | `false` | If `true`, dragging offsets from `translate(-50%, -50%)` so the modal stays visually centered on first open |
| `ariaLabel` | string | `undefined` | Sets `role="dialog"` and `aria-label` on the element |

### Instance API

| Method | Description |
|---|---|
| `show()` | Hides all modals in `conflictsWith`, then removes `.hidden` |
| `hide()` | Adds `.hidden` |
| `toggle()` | Calls `show()` or `hide()` based on current state |
| `isVisible()` | Returns `true` if `.hidden` is absent |
| `conflictsWith` | Mutable array of other modal instances to close when this one opens |

---

## Conflict resolution

Assign `conflictsWith` **after** creating all modals, so each instance exists before
being referenced:

```js
const helpModal  = createModal({ id: 'info-box',  centered: true, ariaLabel: 'Help' })
const aboutModal = createModal({ id: 'about-box', centered: true, ariaLabel: 'About' })

helpModal.conflictsWith  = [aboutModal]
aboutModal.conflictsWith = [helpModal]
```

Opening either modal now automatically closes the other. Add more instances to the
arrays if you have three or more overlays.

---

## First-visit auto-show

Check localStorage before showing; mark as seen immediately so a reload won't
re-show it:

```js
const SEEN_KEY = 'myapp_about_seen'
try {
  if (!localStorage.getItem(SEEN_KEY)) {
    aboutModal.show()
    localStorage.setItem(SEEN_KEY, '1')
  }
} catch (e) {
  // localStorage unavailable — skip silently
}
```

This is strictly necessary UI state (not tracking), so no consent banner is required
under GDPR.

---

## ESC key

A single listener closes whichever modal is currently visible:

```js
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ;[helpModal, aboutModal].forEach(m => { if (m && m.isVisible()) m.hide() })
  }
})
```

---

## HTML structure

Modals use the `.info-box` CSS class and start hidden:

```html
<div id="about-box" class="info-box hidden">
  <h2>App Name</h2>
  <p>What the app does.</p>

  <footer class="info-footer">
    <div class="footer-content">
      <div class="footer-links">
        <span>© 2025 <a href="YOUR_HOMEPAGE">Author</a></span>
        <span class="separator">•</span>
        <a href="YOUR_GITHUB" target="_blank" rel="noopener">Code on GitHub</a>
      </div>
      <div class="version-container">
        <span class="version-text">v1.0.0</span>
      </div>
    </div>
    <div class="footer-actions">
      <button id="open-help-btn" class="close-button" style="background-color:#444;">Help</button>
      <button class="close-button">Close</button>
    </div>
  </footer>
</div>
```

The factory automatically wires any `.close-button` inside the modal to `hide()`.
Cross-navigation buttons (e.g. "Help", "About") must be wired manually:

```js
document.getElementById('open-help-btn')
  ?.addEventListener('click', () => helpModal.show())
```

---

## Keyboard shortcut wiring

Add the shortcut in your app's key handler. In monochromifier this lives in
`src/input.js` inside `handleKeys()`:

```js
if (p.key === 'a') {
  if (window.aboutControls) window.aboutControls.toggle()
  return false
}
```

Export the modal controls via `window` so the key handler (in a separate module)
can reach them without a circular import:

```js
window.aboutControls = {
  toggle: () => aboutModal && aboutModal.toggle(),
  show:   () => aboutModal && aboutModal.show(),
  hide:   () => aboutModal && aboutModal.hide()
}
```

---

## Adoption checklist

- [ ] Copy `makeDraggable`, `setTranslate`, `createModal` into your UI module
- [ ] Add `.info-box` and `.info-footer` CSS (copy from `apps/monochromifier/css/infobox.css`)
- [ ] Add `#about-box` HTML with class `info-box hidden`
- [ ] Call `createModal({ id: 'about-box', centered: true, ariaLabel: '...' })`
- [ ] Wire `conflictsWith` between your modals after all are created
- [ ] Add first-visit localStorage check with a unique key per app
- [ ] Add ESC handler covering all modal instances
- [ ] Export controls via `window.aboutControls` (or equivalent)
- [ ] Wire keyboard shortcut in your key handler
- [ ] Wire any cross-navigation buttons (Help ↔ About) manually
- [ ] Update `querySelectorAll('.version-text')` in version display if using multiple modals
