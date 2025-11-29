# Requirements Document

## Introduction

This document specifies the requirements for implementing a history/filmstrip feature in the duo-chrome application. The feature allows users to navigate through previously created compositions, save them, and modify them. Unlike a traditional undo/redo system, this is a browsable history that lets users explore past states as a filmstrip of compositions.

## Glossary

- **Composition**: A complete duo-chrome state including both images (A and B), their colors, scales, blend mode, background mode, and palette selection
- **History Stack**: An ordered collection of composition states stored chronologically
- **Filmstrip**: A visual representation of the history stack showing thumbnail previews of past compositions
- **History Entry**: A single record in the history stack containing all parameters needed to recreate a composition
- **Active Composition**: The currently displayed composition that the user is viewing or editing
- **History Navigation**: The act of moving backward or forward through the history stack to view different compositions

## Requirements

### Requirement 1

**User Story:** As a user, I want to automatically capture my compositions in a history, so that I can browse through them later without manually saving each one.

#### Acceptance Criteria

1. WHEN a user makes any parameter change (image selection, color change, size adjustment, blend mode, background mode), THE system SHALL capture the complete composition state in the history stack
2. WHEN a composition is captured, THE system SHALL store all parameters needed to recreate it: image indices, color names, scales, blend mode index, background mode index, palette index, and active image selection
3. WHEN the history stack exceeds a reasonable limit, THE system SHALL remove the oldest entries to maintain performance
4. WHEN a user loads a composition from a URL, THE system SHALL add it to the history stack
5. WHEN capturing a composition, THE system SHALL include a timestamp for reference

### Requirement 2

**User Story:** As a user, I want to view my composition history as a filmstrip, so that I can visually browse through past creations.

#### Acceptance Criteria

1. WHEN a user activates the history view, THE system SHALL display a filmstrip interface showing thumbnail previews of past compositions
2. WHEN displaying thumbnails, THE system SHALL render each composition at a small scale to create visual previews
3. WHEN a user hovers over a thumbnail, THE system SHALL provide visual feedback indicating it is selectable
4. WHEN displaying the filmstrip, THE system SHALL show the most recent compositions first
5. WHEN the filmstrip contains many entries, THE system SHALL provide scrolling functionality to view all entries

### Requirement 3

**User Story:** As a user, I want to navigate through my history using keyboard shortcuts, so that I can quickly move between compositions.

#### Acceptance Criteria

1. WHEN a user presses the designated "previous" keyboard shortcut, THE system SHALL navigate to the previous composition in the history stack
2. WHEN a user presses the designated "next" keyboard shortcut, THE system SHALL navigate to the next composition in the history stack
3. WHEN a user is at the beginning of the history, THE system SHALL prevent navigation to earlier entries and provide feedback
4. WHEN a user is at the end of the history, THE system SHALL prevent navigation to later entries and provide feedback
5. WHEN navigating through history, THE system SHALL restore all composition parameters without adding new history entries

### Requirement 4

**User Story:** As a user, I want to save any composition from my history, so that I can export interesting discoveries as image files.

#### Acceptance Criteria

1. WHEN viewing any composition in the history, THE system SHALL provide a save/export function
2. WHEN a user saves a composition from history, THE system SHALL generate a PNG file with the current composition rendered at full resolution
3. WHEN saving from history, THE system SHALL use a filename that includes timestamp information for organization
4. WHEN a user saves a composition, THE system SHALL provide visual feedback confirming the save operation
5. WHEN saving from history, THE system SHALL not affect the current history position or stack

### Requirement 5

**User Story:** As a user, I want to modify compositions from my history, so that I can refine interesting discoveries.

#### Acceptance Criteria

1. WHEN viewing a composition from history, THE system SHALL allow all normal editing operations (size adjustment, color changes, image navigation, etc.)
2. WHEN a user modifies a composition from history, THE system SHALL create a new history entry with the modified state
3. WHEN creating a new entry from a historical composition, THE system SHALL truncate any entries that exist after the current position
4. WHEN a user makes changes to a historical composition, THE system SHALL append the new entry at the current position
5. WHEN modifications are made, THE system SHALL provide visual feedback indicating the composition has been modified

**Note:** This implements a linear history model where modifications truncate forward history. A future enhancement could implement tree-based branching to preserve all exploration paths (see future task for branching history).

### Requirement 6

**User Story:** As a user, I want the history system to work seamlessly with random mode, so that I can explore random compositions and easily return to interesting ones.

#### Acceptance Criteria

1. WHEN random mode generates a new composition, THE system SHALL automatically add it to the history stack
2. WHEN a user stops random mode, THE system SHALL allow immediate navigation backward through the generated compositions
3. WHEN navigating backward during or after random mode, THE system SHALL restore each composition exactly as it was generated
4. WHEN a user finds an interesting random composition, THE system SHALL allow them to save it or modify it
5. WHEN resuming random mode after history navigation, THE system SHALL continue generating new compositions and adding them to history

### Requirement 7

**User Story:** As a user, I want the history system to persist across browser sessions, so that I don't lose my composition history when I close the browser.

#### Acceptance Criteria

1. WHEN a user closes the browser, THE system SHALL save the history stack to browser storage
2. WHEN a user reopens the application, THE system SHALL restore the history stack from browser storage
3. WHEN restoring history, THE system SHALL validate that all stored data is complete and usable
4. WHEN browser storage is full or unavailable, THE system SHALL gracefully handle the error and continue operating with in-memory history only
5. WHEN restoring history, THE system SHALL restore the user's last position in the history stack

### Requirement 8

**User Story:** As a user, I want to clear my history, so that I can start fresh or manage storage space.

#### Acceptance Criteria

1. WHEN a user requests to clear history, THE system SHALL provide a confirmation dialog to prevent accidental deletion
2. WHEN history is cleared, THE system SHALL remove all entries from both memory and browser storage
3. WHEN history is cleared, THE system SHALL keep the current composition as the first entry in the new history
4. WHEN clearing history, THE system SHALL provide visual feedback confirming the operation
5. WHEN history is cleared, THE system SHALL reset the history position to the current composition

### Requirement 9

**User Story:** As a user, I want visual indicators showing my position in the history, so that I understand where I am in the timeline.

#### Acceptance Criteria

1. WHEN viewing the filmstrip, THE system SHALL highlight the currently active composition
2. WHEN at the beginning of history, THE system SHALL visually indicate that no earlier entries exist
3. WHEN at the end of history, THE system SHALL visually indicate that no later entries exist
4. WHEN navigating through history, THE system SHALL update position indicators in real-time
5. WHEN the filmstrip is visible, THE system SHALL show a counter indicating the current position and total number of entries
