# Implementation Plan

- [x] 1. Create info box CSS stylesheet

  - Create `apps/crude-collage-painter/css/infobox.css` with styling for the draggable info box
  - Include styles for: box positioning, visibility toggle, drag cursor, semi-transparent background, border and shadow, keyboard key styling, close button, and shortcut sections
  - Match the existing bisque/brown color scheme (#d2691e, #8b4513)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Create info box JavaScript module

  - Create `apps/crude-collage-painter/src/infobox.js` with drag functionality
  - Implement drag state management (isDragging, position offsets)
  - Add event listeners for mousedown, mousemove, mouseup
  - Implement startDragging, drag, stopDragging, and setTranslate functions
  - Add event propagation stopping to prevent p5.js interference
  - Implement show, hide, and toggle functions
  - Export functions via window.infoBoxControls for sketch.js integration
  - Add ESC key handler for closing the info box
  - Include ARIA attributes for accessibility (role="dialog", aria-label)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.4, 6.3_

- [x] 3. Update HTML with info box structure

  - Modify `apps/crude-collage-painter/index.html` to add info box HTML
  - Remove existing `<ul>` keyboard shortcut list
  - Add info box `<div>` with proper structure: headings, shortcut sections, close button
  - Organize shortcuts into categories: Modes, Image Operations, Canvas Operations, Copy Modes, Info Box
  - Use `<kbd>` elements for keyboard keys
  - Link the new `infobox.css` stylesheet
  - Load the new `infobox.js` module script
  - Set info box to hidden by default with "hidden" class
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.4_

- [ ] 4. Integrate info box toggle with sketch.js

  - Modify `apps/crude-collage-painter/src/sketch.js` keyPressed function
  - Add info box toggle handler for '?' or 'h' keys at the start of keyPressed
  - Call `window.infoBoxControls.toggle()` when toggle keys are pressed
  - Return false to prevent default browser behavior
  - Ensure toggle works regardless of current activity mode
  - _Requirements: 1.2, 5.2, 5.3, 6.1, 6.2, 6.5_

- [ ] 5. Add close button functionality

  - Implement close button click handler in `infobox.js`
  - Ensure close button has proper pointer-events to be clickable
  - Verify close button doesn't trigger drag behavior
  - _Requirements: 2.5, 5.2_

- [ ] 6. Test and verify implementation
  - Test visibility toggle with '?', 'h', and ESC keys
  - Test drag functionality on different parts of the info box
  - Verify position is maintained when hiding and showing
  - Test that canvas interactions work correctly with box visible/hidden
  - Verify all existing keyboard shortcuts still function
  - Test close button functionality
  - Check visual styling matches design (colors, transparency, layout)
  - Verify accessibility attributes are present
  - Test in multiple browsers (Chrome, Firefox, Safari)
  - _Requirements: All requirements_
