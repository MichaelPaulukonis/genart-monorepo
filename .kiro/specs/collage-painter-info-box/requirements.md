# Requirements Document

## Introduction

The crude-collage-painter application currently displays keyboard shortcuts as a permanent, static list in the HTML. This feature will implement a draggable, show/hide info box similar to dragline's implementation, improving the user experience by reducing visual clutter while maintaining easy access to help information. The solution should remain lightweight and avoid unnecessary dependencies, keeping with the project's philosophy of small, self-contained applications.

## Requirements

### Requirement 1: Draggable Info Box Component

**User Story:** As a user, I want a draggable info box that displays keyboard shortcuts, so that I can position it where it doesn't interfere with my work while still being accessible.

#### Acceptance Criteria

1. WHEN the application loads THEN the info box SHALL be hidden by default
2. WHEN the user presses a designated keyboard shortcut (e.g., 'i' or '?') THEN the info box SHALL toggle between visible and hidden states
3. WHEN the info box is visible AND the user clicks and drags on the box THEN the box SHALL move with the mouse cursor
4. WHEN the user releases the mouse button THEN the box SHALL remain in its new position
5. IF the user drags the box AND then hides it THEN the box SHALL remember its position when shown again

### Requirement 2: Visual Design and Styling

**User Story:** As a user, I want the info box to be visually distinct and easy to read, so that I can quickly reference keyboard shortcuts without distraction.

#### Acceptance Criteria

1. WHEN the info box is visible THEN it SHALL have a semi-transparent background to allow some visibility of the canvas beneath
2. WHEN the info box is visible THEN it SHALL have a border and shadow to distinguish it from the canvas
3. WHEN the user hovers over the info box THEN the cursor SHALL indicate it is draggable
4. WHEN the info box contains links or buttons THEN they SHALL be clickable and not interfere with dragging
5. WHEN the info box is displayed THEN it SHALL have a close button for dismissing it

### Requirement 3: Content Organization

**User Story:** As a user, I want the keyboard shortcuts organized clearly in the info box, so that I can quickly find the command I need.

#### Acceptance Criteria

1. WHEN the info box is displayed THEN it SHALL show all keyboard shortcuts from the current static list
2. WHEN the info box is displayed THEN shortcuts SHALL be organized in a logical grouping (e.g., by function type)
3. WHEN the info box is displayed THEN it SHALL include a title identifying the application
4. IF there are related shortcuts THEN they SHALL be grouped together visually

### Requirement 4: Code Organization and Reusability

**User Story:** As a developer, I want the info box implementation to be modular and potentially reusable, so that it can be easily maintained and possibly adapted for other projects.

#### Acceptance Criteria

1. WHEN implementing the info box THEN the JavaScript SHALL be in a separate module file
2. WHEN implementing the info box THEN the CSS SHALL be in a separate stylesheet
3. WHEN implementing the info box THEN the HTML structure SHALL be minimal and semantic
4. IF the implementation is successful THEN it SHALL be documented for potential reuse in other monorepo applications
5. WHEN implementing the solution THEN it SHALL NOT require additional npm dependencies beyond what's already in the project

### Requirement 5: Accessibility and Usability

**User Story:** As a user, I want multiple ways to dismiss the info box, so that I can quickly return to my work using my preferred interaction method.

#### Acceptance Criteria

1. WHEN the info box is visible AND the user presses ESC THEN the info box SHALL be hidden
2. WHEN the info box is visible AND the user clicks the close button THEN the info box SHALL be hidden
3. WHEN the info box is visible AND the user presses the toggle keyboard shortcut THEN the info box SHALL be hidden
4. WHEN the info box is draggable THEN it SHALL have appropriate ARIA attributes for accessibility
5. WHEN the info box is hidden THEN it SHALL not interfere with canvas interactions

### Requirement 6: Integration with Existing Application

**User Story:** As a user, I want the info box to work seamlessly with the existing application, so that my current workflow is not disrupted.

#### Acceptance Criteria

1. WHEN the info box is implemented THEN the existing keyboard shortcuts SHALL continue to function as before
2. WHEN the info box is visible THEN p5.js canvas interactions SHALL still work (except where the box overlays)
3. WHEN the info box is being dragged THEN mouse events SHALL not propagate to the p5.js sketch
4. WHEN the application loads THEN the static keyboard shortcut list SHALL be removed from the HTML
5. IF the user is in a specific mode (draw, gallery, etc.) THEN the info box SHALL still be accessible
