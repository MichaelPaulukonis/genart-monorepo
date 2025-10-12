# Design Document

## Overview

This design implements a draggable, toggleable info box for the crude-collage-painter application, following the proven pattern from dragline while adapting it to the specific needs of the collage painter. The solution maintains the project's philosophy of lightweight, self-contained applications by using vanilla JavaScript and CSS without additional dependencies.

The implementation consists of three main components:
1. HTML structure for the info box container
2. CSS styling for visual presentation and positioning
3. JavaScript module for drag functionality and keyboard interactions

## Architecture

### Component Structure

```
crude-collage-painter/
├── index.html                 # Info box HTML structure
├── css/
│   ├── style.css             # Existing styles
│   └── infobox.css           # New: Info box specific styles
├── src/
│   ├── sketch.js             # Existing p5.js sketch (modified)
│   └── infobox.js            # New: Info box behavior module
```

### Integration Points

The info box integrates with the existing application at these points:

1. **HTML**: Info box markup added to `index.html`, existing `<ul>` list removed
2. **CSS**: New `infobox.css` stylesheet linked in `index.html`
3. **JavaScript**: New `infobox.js` module loaded as a separate script
4. **Keyboard Handler**: `sketch.js` modified to add info box toggle on '?' or 'h' key

### State Management

The info box maintains minimal state:
- **Visibility**: Boolean (hidden/visible) controlled by CSS class
- **Position**: X/Y offset values stored in JavaScript closure
- **Drag State**: Boolean indicating active drag operation

No global state pollution - all state is encapsulated within the infobox module.

## Components and Interfaces

### HTML Structure

```html
<div id="info-box" class="info-box hidden">
  <h2>Crude Collage Painter</h2>
  <h3>Keyboard Shortcuts</h3>
  
  <div class="shortcut-section">
    <h4>Modes</h4>
    <ul>
      <li><kbd>p</kbd> - Select mode</li>
      <li><kbd>g</kbd> - Gallery mode</li>
      <li><kbd>d</kbd> - Draw mode</li>
    </ul>
  </div>
  
  <div class="shortcut-section">
    <h4>Image Operations</h4>
    <ul>
      <li><kbd>i</kbd> - Rotate image source</li>
      <li><kbd>x</kbd> - Delete selected image (gallery mode)</li>
    </ul>
  </div>
  
  <div class="shortcut-section">
    <h4>Canvas Operations</h4>
    <ul>
      <li><kbd>c</kbd> - Clear canvas</li>
      <li><kbd>s</kbd> - Save image</li>
      <li><kbd>m</kbd> - Paint grid</li>
    </ul>
  </div>
  
  <div class="shortcut-section">
    <h4>Copy Modes</h4>
    <ul>
      <li><kbd>1</kbd> - Relative copy mode</li>
      <li><kbd>2</kbd> - Stamp copy mode</li>
      <li><kbd>3</kbd> - Absolute copy mode</li>
    </ul>
  </div>
  
  <div class="shortcut-section">
    <h4>Info Box</h4>
    <ul>
      <li><kbd>?</kbd> or <kbd>h</kbd> - Toggle this help</li>
      <li><kbd>ESC</kbd> - Close this help</li>
    </ul>
  </div>
  
  <button id="close-info-box" class="close-button">Close</button>
</div>
```

**Design Decisions:**
- Semantic HTML with proper heading hierarchy
- Grouped shortcuts by functional category for easier scanning
- `<kbd>` elements for keyboard keys (semantic and styleable)
- Close button positioned absolutely within the box
- ARIA attributes added via JavaScript (role="dialog", aria-label)

### CSS Styling

**File: `css/infobox.css`**

Key styling features:
- **Positioning**: Absolute positioning with initial centering via transform
- **Draggability**: `cursor: move` on the box, `pointer-events` management for children
- **Visual Design**: Semi-transparent white background (80% opacity), teal border, subtle shadow
- **Typography**: Clear hierarchy with centered headings, left-aligned content
- **Responsive**: Fixed width (500px) but could be adapted for mobile if needed
- **Z-index**: High value (1000) to ensure it appears above canvas

```css
.info-box {
  position: absolute;
  cursor: move;
  user-select: none;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -20%);
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 60px; /* Space for close button */
  background-color: rgba(255, 255, 255, 0.9);
  border: 3px solid #d2691e; /* Chocolate brown to match bisque theme */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.info-box.hidden {
  display: none;
}

/* Prevent child elements from interfering with drag */
.info-box * {
  pointer-events: none;
}

/* Re-enable pointer events for interactive elements */
.info-box a,
.info-box button {
  pointer-events: auto;
  cursor: pointer;
}

.shortcut-section {
  margin-bottom: 15px;
}

.shortcut-section h4 {
  margin: 10px 0 5px 0;
  color: #8b4513; /* Saddle brown */
}

.info-box kbd {
  display: inline-block;
  padding: 2px 6px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.close-button {
  position: absolute;
  bottom: 15px;
  right: 15px;
  padding: 8px 20px;
  background-color: #d2691e;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #a0522d;
}
```

**Design Decisions:**
- Color scheme matches existing bisque/brown theme
- `max-height` and `overflow-y` for long content
- Keyboard key styling with `<kbd>` elements
- Smooth hover transitions on interactive elements
- Padding-bottom ensures content doesn't hide behind close button

### JavaScript Module

**File: `src/infobox.js`**

```javascript
// Info box drag functionality
const infoBox = document.getElementById('info-box');
const closeButton = document.getElementById('close-info-box');

let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Set up accessibility attributes
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-label', 'Keyboard shortcuts help');
infoBox.setAttribute('aria-modal', 'false');

// Drag event listeners
infoBox.addEventListener('mousedown', startDragging);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDragging);

// Close button listener
closeButton.addEventListener('click', hideInfoBox);

function startDragging(e) {
  // Only drag if clicking on the box itself, not children
  if (e.target === infoBox || e.target.tagName === 'H2' || e.target.tagName === 'H3') {
    e.stopPropagation();
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
  }
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    e.stopPropagation();
    
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    xOffset = currentX;
    yOffset = currentY;
    
    setTranslate(currentX, currentY, infoBox);
  }
}

function stopDragging(e) {
  isDragging = false;
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

function hideInfoBox() {
  infoBox.classList.add('hidden');
}

function showInfoBox() {
  infoBox.classList.remove('hidden');
}

function toggleInfoBox() {
  infoBox.classList.toggle('hidden');
}

// Export functions for use in sketch.js
window.infoBoxControls = {
  toggle: toggleInfoBox,
  show: showInfoBox,
  hide: hideInfoBox
};

// ESC key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !infoBox.classList.contains('hidden')) {
    hideInfoBox();
  }
});
```

**Design Decisions:**
- Event delegation for drag start (only on box or headings)
- Event propagation stopped to prevent p5.js interference
- Position state maintained in closure
- Functions exported to `window` for sketch.js integration
- ESC key handler in this module (single responsibility)

### Integration with sketch.js

Minimal modification to existing code:

```javascript
// Add to keyPressed function in sketch.js
sketch.keyPressed = () => {
  // Info box toggle (mode-independent)
  if (key === '?' || key === 'h') {
    window.infoBoxControls.toggle();
    return false; // Prevent default
  }
  
  // ... existing key handlers ...
}
```

**Design Decisions:**
- Use '?' or 'h' for help (common conventions)
- Check for info box keys first (mode-independent)
- Return false to prevent default browser behavior
- Minimal changes to existing code structure

## Data Models

No complex data models required. Simple state:

```javascript
// Info box state (encapsulated in infobox.js)
{
  isDragging: boolean,
  position: {
    xOffset: number,
    yOffset: number
  },
  isVisible: boolean // Represented by CSS class
}
```

## Error Handling

### Missing DOM Elements

```javascript
// Add at start of infobox.js
if (!infoBox) {
  console.error('Info box element not found');
  return;
}
if (!closeButton) {
  console.error('Close button not found');
  return;
}
```

### Event Listener Failures

- Use try-catch for event listener attachment
- Graceful degradation if drag functionality fails
- Info box still closeable via keyboard

### Browser Compatibility

- Modern browser features used (ES6+)
- No polyfills needed for target browsers
- Fallback: Info box still functional without drag if events fail

## Testing Strategy

### Manual Testing Checklist

1. **Visibility Toggle**
   - [ ] Press '?' to show info box
   - [ ] Press '?' again to hide info box
   - [ ] Press 'h' to show info box
   - [ ] Press 'h' again to hide info box
   - [ ] Press ESC to hide info box when visible
   - [ ] Click close button to hide info box

2. **Drag Functionality**
   - [ ] Click and drag on info box background - box moves
   - [ ] Click and drag on heading - box moves
   - [ ] Click on list items - box doesn't move
   - [ ] Click on close button - box doesn't move, closes instead
   - [ ] Release mouse - box stays in new position
   - [ ] Hide and show box - position is remembered

3. **Integration with p5.js**
   - [ ] Info box hidden by default on load
   - [ ] Canvas interactions work when box is hidden
   - [ ] Canvas interactions work when box is visible (except where overlapped)
   - [ ] Dragging info box doesn't trigger canvas events
   - [ ] All existing keyboard shortcuts still work

4. **Visual Design**
   - [ ] Info box is semi-transparent
   - [ ] Border and shadow are visible
   - [ ] Text is readable
   - [ ] Keyboard keys are styled distinctly
   - [ ] Close button is visible and accessible
   - [ ] Cursor changes to 'move' over draggable areas

5. **Responsive Behavior**
   - [ ] Info box doesn't overflow viewport
   - [ ] Scrollable if content is too tall
   - [ ] Readable on different screen sizes

### Browser Testing

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari

### Accessibility Testing

- [ ] Screen reader announces dialog role
- [ ] Keyboard navigation works (Tab, ESC)
- [ ] Focus management is appropriate
- [ ] Color contrast meets WCAG AA standards

## Implementation Notes

### File Modifications Summary

**New Files:**
- `apps/crude-collage-painter/css/infobox.css`
- `apps/crude-collage-painter/src/infobox.js`

**Modified Files:**
- `apps/crude-collage-painter/index.html`
  - Remove existing `<ul>` keyboard shortcut list
  - Add info box HTML structure
  - Link infobox.css stylesheet
  - Load infobox.js module

- `apps/crude-collage-painter/src/sketch.js`
  - Add info box toggle to `keyPressed` function (2-3 lines)

### Migration Path

1. Create new CSS and JS files
2. Update HTML with new structure
3. Test info box in isolation
4. Integrate with sketch.js
5. Remove old keyboard shortcut list
6. Final testing

### Future Enhancements

Potential improvements (not in current scope):
- Remember position in localStorage
- Keyboard shortcut customization
- Collapsible sections for long content
- Mobile-friendly touch dragging
- Resize handle for adjustable width
- Theme customization (light/dark mode)

## Design Rationale

### Why This Approach?

1. **Proven Pattern**: Based on working dragline implementation
2. **Minimal Dependencies**: No new npm packages required
3. **Separation of Concerns**: CSS, HTML, JS in separate files
4. **Maintainability**: Clear, documented code
5. **Reusability**: Pattern can be adapted for other monorepo apps
6. **Performance**: Lightweight, no framework overhead
7. **Accessibility**: Semantic HTML, ARIA attributes, keyboard support

### Alternative Approaches Considered

1. **Modal Library (e.g., micromodal.js)**
   - Pros: Feature-rich, accessible
   - Cons: Additional dependency, overkill for simple use case
   - Decision: Rejected due to bloat concerns

2. **CSS-Only Solution**
   - Pros: No JavaScript needed
   - Cons: Can't implement drag functionality
   - Decision: Rejected, drag is a key requirement

3. **Inline JavaScript in HTML**
   - Pros: Everything in one file
   - Cons: Poor separation of concerns, harder to maintain
   - Decision: Rejected, not following best practices

4. **React/Vue Component**
   - Pros: Modern, reactive
   - Cons: Massive dependency, framework overhead
   - Decision: Rejected, completely against project philosophy

### Color Scheme Rationale

The info box uses chocolate brown (#d2691e) and saddle brown (#8b4513) to complement the existing bisque background, creating a cohesive warm color palette that feels organic and artistic, matching the collage painter aesthetic.
