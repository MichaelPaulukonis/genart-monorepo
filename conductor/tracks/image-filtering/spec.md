# Specification: Duo-Chrome Image List Filtering

## 1. Overview
Implement a filtering system for the image list in the `duo-chrome` application. This feature allows users to filter images by filename/tags via a text search. The system is the foundational step for a future "Themes" feature, where filtered groups can be saved and assigned to specific display positions.

## 2. Functional Requirements

### 2.1 Filtering Logic
*   **Criteria:** Filter images based on `filename` (and `tags` if available/applicable) using a text string.
*   **Matching:** Case-insensitive partial matching (contains).
*   **Reactive:** Filtering should happen in real-time or be debounced as the user types.

### 2.2 User Interface
*   **Access:** A "Filter" button or icon in the main UI that opens a Modal Dialog.
*   **Modal Content:**
    *   Text input field for the filter query.
    *   "Clear Filter" button to reset the input.
    *   Live preview of the filtered result count (e.g., "Showing 10 of 50 images") is desirable within the modal or immediately visible behind it.
*   **State:** The active filter string should be preserved while the user navigates within the session.

### 2.3 Data Architecture (Forward Compatibility)
*   The filtering logic must be decoupled from the UI to support future "Saved Themes".
*   Ideally, a `FilterDefinition` or `Theme` interface should be created that currently holds the `searchString`.
*   **Persistence:** Save the current filter state to `localStorage` (Low priority, but good for UX).

### 2.4 Constraints
*   **Empty Results:** If the filter matches no images, the UI must prevent the assignment of this filter state to any active "Theme" slot (Architecture only - UI enforcement is part of Task 5, but the logic `isValidFilter()` should exist).

## 3. Non-Functional Requirements
*   **Performance:** Filtering must be efficient for lists up to ~1000 items (standard array `filter` should suffice).
*   **Usability:** Modal should be easily dismissible (Esc key, click outside).

## 4. Out of Scope
*   Complex date, size, or dimension filters (User specified "Filename only").
*   "Theme Assignment" UI (Assigning filter sets to A/B slots).
*   Managing multiple named themes (Saving/Editing named presets).

## 5. Acceptance Criteria
1.  User can open a Filter modal.
2.  Typing in the modal filters the displayed image list by filename.
3.  Closing the modal keeps the filter active.
4.  "Clear" button resets the list to show all images.
5.  Architecture demonstrates a clear separation of "Filter Logic" from "UI Component" to facilitate future Theme features.
