# Plan: Image List Filtering

## Phase 1: Core Logic & Architecture
- [x] Define `FilterDefinition` interface/types (supports future Themes).
- [x] Implement `FilterService` or logic decoupled from UI.
- [x] Implement `filename` text search filtering logic.
- [x] Add unit tests for filtering logic.

## Phase 2: UI Implementation
- [x] Create `FilterModal` component.
- [x] Add "Filter" button to main UI to trigger modal.
- [x] Connect Modal input to filtering logic.
- [x] Display filtered results in the image list.
- [x] Implement "Clear Filter" functionality.

## Phase 3: Persistence & Polish
- [x] Implement `localStorage` persistence for active filter.
- [x] Handle empty result states (prevent assignment logic placeholder).
- [x] Add visual indicator when a filter is active.

## Phase 4: Verification
- [ ] Verify acceptance criteria (Modal, Typing, Closing, Clearing).
- [ ] Run linting and existing tests.