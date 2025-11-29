# Design Document

## Overview

The history/filmstrip feature adds a browsable timeline of compositions to duo-chrome, allowing users to navigate through past states, save interesting discoveries, and refine compositions. The system captures lightweight parameter snapshots rather than full image data, enabling efficient storage of hundreds of entries.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Filmstrip   │  │   Keyboard   │  │    Status    │  │
│  │    Panel     │  │  Navigation  │  │  Indicators  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  History Manager Module                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Capture    │  │  Navigation  │  │  Thumbnail   │  │
│  │   System     │  │    Engine    │  │  Generator   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Storage Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   History    │  │  localStorage│  │   Thumbnail  │  │
│  │    Stack     │  │  Persistence │  │    Cache     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Integration Points

The history system integrates with existing duo-chrome systems:

1. **Parameter Change Detection** - Hooks into existing functions: `adjustImageSize()`, `navigateImage()`, `navigateImageColor()`, `exchangeImages()`, `cycleBlendMode()`, `toggleBackgroundColor()`
2. **Composition State** - Reads from existing state objects: `imageColorPairs`, `controlState`, `currentBlendModeIndex`, `currentBackgroundModeIndex`, `colorIndex`
3. **Rendering System** - Uses existing `updateScreen()` and `requestScreenUpdate()` for thumbnail generation and composition restoration
4. **URL Sharing** - Integrates with existing `serializeCompositionState()` and `restoreCompositionFromURL()` functions

## Components and Interfaces

### 1. History Entry Data Structure

```javascript
interface HistoryEntry {
  id: string;              // Unique identifier (timestamp-based)
  timestamp: number;       // Date.now() when captured
  
  // Image state
  imageA: {
    index: number;         // Position in imgs array
    filename: string;      // Image filename
    colorName: string;     // Color name from palette
    scale: number;         // Scale factor (0.05 - 5.0)
  };
  
  imageB: {
    index: number;
    filename: string;
    colorName: string;
    scale: number;
  };
  
  // Visual settings
  paletteIndex: number;           // Current palette selection
  blendModeIndex: number;         // Current blend mode
  backgroundModeIndex: number;    // Current background mode
  activeImageIndex: number;       // Which image is active (0 or 1)
  
  // Metadata
  source: 'manual' | 'random' | 'url' | 'modified';  // How entry was created
  thumbnail?: string;             // Base64 encoded thumbnail (optional, generated on demand)
}
```

### 2. History Manager Module

```javascript
class HistoryManager {
  constructor(p5Instance, stateRefs) {
    this.p = p5Instance;
    this.stateRefs = stateRefs;  // References to imageColorPairs, controlState, etc.
    this.history = [];
    this.currentPosition = -1;
    this.isNavigating = false;   // Prevent capture during navigation
    this.maxEntries = 500;       // Generous limit for lightweight entries
  }
  
  // Core operations
  captureCurrentState(source = 'manual'): void
  navigateTo(position: number): void
  navigateBackward(): boolean
  navigateForward(): boolean
  
  // State management
  getCurrentEntry(): HistoryEntry | null
  canNavigateBackward(): boolean
  canNavigateForward(): boolean
  getTotalEntries(): number
  
  // Persistence
  saveToStorage(): void
  loadFromStorage(): void
  clearHistory(): void
  
  // Thumbnail generation
  generateThumbnail(entry: HistoryEntry): string
  getThumbnailForEntry(position: number): string
}
```

### 3. Filmstrip UI Component

```javascript
class FilmstripPanel {
  constructor(historyManager) {
    this.historyManager = historyManager;
    this.isVisible = false;
    this.scrollPosition = 0;
    this.thumbnailSize = 120;    // px
    this.thumbnailGap = 10;      // px
  }
  
  // UI operations
  show(): void
  hide(): void
  toggle(): void
  render(): void
  
  // Interaction
  handleThumbnailClick(position: number): void
  handleScroll(delta: number): void
  scrollToPosition(position: number): void
  
  // Visual updates
  updateHighlight(): void
  updateScrollPosition(): void
}
```

### 4. Keyboard Navigation Handler

```javascript
class HistoryKeyboardHandler {
  constructor(historyManager, p5Instance) {
    this.historyManager = historyManager;
    this.p = p5Instance;
    this.shortcuts = {
      previous: '[',      // Left bracket
      next: ']',          // Right bracket
      toggleFilmstrip: 'f',
      clearHistory: 'Shift+C'
    };
  }
  
  handleKeyPress(key: string, modifiers: object): boolean
  provideFeedback(action: string, success: boolean): void
}
```

## Data Models

### History Stack Storage

The history stack is stored as a JSON array in localStorage:

```javascript
{
  version: 1,                    // Schema version for future compatibility
  currentPosition: number,       // Current position in history
  entries: HistoryEntry[],       // Array of history entries
  lastModified: number,          // Timestamp of last modification
  maxEntries: number             // Maximum entries to store
}
```

### Thumbnail Cache

Thumbnails are generated on-demand and cached separately to avoid bloating the main history storage:

```javascript
{
  [entryId: string]: {
    thumbnail: string,           // Base64 encoded image
    generated: number,           // Timestamp when generated
    size: number                 // Byte size for cache management
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: History capture completeness

*For any* composition state change, capturing the state should produce a history entry that contains all parameters necessary to recreate that exact composition.

**Validates: Requirements 1.2**

### Property 2: Navigation preserves state

*For any* history entry, navigating to that entry and then capturing the current state should produce an entry with identical parameters (excluding timestamp and source).

**Validates: Requirements 3.5**

### Property 3: History position bounds

*For any* history stack state, the current position should always be >= 0 and < total entries, or -1 if history is empty.

**Validates: Requirements 3.3, 3.4**

### Property 4: Modification truncation

*For any* history position that is not at the end, making a modification should result in a history stack where all entries after the current position are removed.

**Validates: Requirements 5.3**

### Property 5: Storage round-trip consistency

*For any* history stack, saving to storage and then loading should produce an equivalent history stack with the same entries and current position.

**Validates: Requirements 7.2, 7.3**

### Property 6: Thumbnail generation determinism

*For any* history entry, generating a thumbnail multiple times should produce visually identical results (allowing for minor rendering variations).

**Validates: Requirements 2.2**

### Property 7: Navigation does not create entries

*For any* sequence of navigation operations (backward/forward), the total number of history entries should remain unchanged.

**Validates: Requirements 3.5**

### Property 8: Maximum entries enforcement

*For any* history stack, when adding a new entry would exceed the maximum limit, the oldest entry should be removed to maintain the limit.

**Validates: Requirements 1.3**

## Error Handling

### Storage Errors

1. **localStorage Full**
   - Gracefully degrade to in-memory only mode
   - Show user notification about storage limitation
   - Continue operating with current session history

2. **Corrupted Storage Data**
   - Validate schema version on load
   - Attempt to recover partial data
   - Fall back to empty history if unrecoverable
   - Log error details for debugging

3. **Storage Quota Exceeded**
   - Implement automatic cleanup of oldest entries
   - Reduce thumbnail cache size
   - Notify user of storage constraints

### Navigation Errors

1. **Invalid Position**
   - Clamp position to valid range [0, entries.length - 1]
   - Log warning for debugging
   - Provide user feedback

2. **Missing Image Files**
   - Detect when historical image no longer exists
   - Show placeholder or error state
   - Allow user to continue with other entries

3. **Invalid Color References**
   - Validate color exists in current palette
   - Fall back to default color if missing
   - Log warning for debugging

### Thumbnail Generation Errors

1. **Rendering Failures**
   - Catch and log rendering errors
   - Use placeholder thumbnail
   - Don't block history functionality

2. **Memory Constraints**
   - Limit thumbnail cache size
   - Implement LRU eviction policy
   - Generate thumbnails on-demand rather than eagerly

## Testing Strategy

### Unit Tests

1. **History Entry Creation**
   - Test entry creation with all parameter combinations
   - Verify timestamp and ID generation
   - Test source type assignment

2. **History Stack Operations**
   - Test adding entries to empty and non-empty stacks
   - Test maximum entries enforcement
   - Test position tracking during additions

3. **Navigation Logic**
   - Test backward navigation at various positions
   - Test forward navigation at various positions
   - Test boundary conditions (beginning/end of history)
   - Test navigation with empty history

4. **Modification Truncation**
   - Test truncation at various positions
   - Test truncation at end (no-op)
   - Test truncation at beginning

5. **Storage Serialization**
   - Test JSON serialization of history entries
   - Test deserialization and validation
   - Test handling of corrupted data

### Property-Based Tests

1. **Property 1: History capture completeness**
   - Generate random composition states
   - Capture each state
   - Verify all parameters are present in entry
   - **Feature: duo-chrome-history-filmstrip, Property 1: History capture completeness**

2. **Property 2: Navigation preserves state**
   - Generate random history stack
   - Navigate to random position
   - Capture current state
   - Compare with original entry (excluding timestamp/source)
   - **Feature: duo-chrome-history-filmstrip, Property 2: Navigation preserves state**

3. **Property 3: History position bounds**
   - Generate random history operations
   - Verify position always within valid range
   - **Feature: duo-chrome-history-filmstrip, Property 3: History position bounds**

4. **Property 4: Modification truncation**
   - Generate random history stack
   - Navigate to random non-end position
   - Make modification
   - Verify entries after position are removed
   - **Feature: duo-chrome-history-filmstrip, Property 4: Modification truncation**

5. **Property 5: Storage round-trip consistency**
   - Generate random history stack
   - Save to storage
   - Load from storage
   - Compare stacks for equivalence
   - **Feature: duo-chrome-history-filmstrip, Property 5: Storage round-trip consistency**

6. **Property 7: Navigation does not create entries**
   - Generate random history stack
   - Perform random navigation sequence
   - Verify entry count unchanged
   - **Feature: duo-chrome-history-filmstrip, Property 7: Navigation does not create entries**

7. **Property 8: Maximum entries enforcement**
   - Generate history stack at max capacity
   - Add new entry
   - Verify oldest entry removed and count maintained
   - **Feature: duo-chrome-history-filmstrip, Property 8: Maximum entries enforcement**

### Integration Tests

1. **End-to-End History Flow**
   - Create composition
   - Verify history capture
   - Navigate backward
   - Verify composition restored
   - Make modification
   - Verify new entry created

2. **Filmstrip UI Integration**
   - Open filmstrip
   - Verify thumbnails rendered
   - Click thumbnail
   - Verify composition loaded

3. **Keyboard Navigation Integration**
   - Press previous shortcut
   - Verify navigation occurred
   - Verify visual feedback
   - Press next shortcut
   - Verify navigation occurred

4. **Storage Persistence Integration**
   - Create history entries
   - Simulate page reload
   - Verify history restored
   - Verify position restored

5. **Random Mode Integration**
   - Enable random mode
   - Generate multiple compositions
   - Verify all captured in history
   - Navigate backward
   - Verify compositions restored

### User Acceptance Testing

1. **Usability Testing**
   - Users create compositions and navigate history
   - Verify intuitive navigation
   - Gather feedback on filmstrip UI
   - Test keyboard shortcuts discoverability

2. **Performance Testing**
   - Create 500+ history entries
   - Measure navigation responsiveness
   - Measure filmstrip rendering performance
   - Verify no memory leaks

3. **Cross-Browser Testing**
   - Test localStorage persistence across browsers
   - Test thumbnail generation consistency
   - Test keyboard shortcuts compatibility

## Implementation Notes

### Performance Optimizations

1. **Lazy Thumbnail Generation**
   - Generate thumbnails only when filmstrip is opened
   - Cache generated thumbnails
   - Use requestIdleCallback for background generation

2. **Efficient State Capture**
   - Debounce rapid parameter changes (e.g., during size adjustment)
   - Only capture when user completes an action
   - Use shallow comparison to detect actual changes

3. **Storage Optimization**
   - Store only essential parameters (not derived state)
   - Use compact JSON representation
   - Implement compression for large history stacks

4. **Rendering Optimization**
   - Use virtual scrolling for filmstrip with many entries
   - Render only visible thumbnails
   - Reuse thumbnail canvases

### Keyboard Shortcuts

- `[` - Navigate to previous composition
- `]` - Navigate to next composition
- `f` - Toggle filmstrip panel
- `Shift+C` - Clear history (with confirmation)

These shortcuts are chosen to:
- Avoid conflicts with existing shortcuts
- Be memorable (brackets suggest navigation)
- Be accessible on standard keyboards

### UI/UX Considerations

1. **Filmstrip Position**
   - Bottom of screen for easy access
   - Collapsible to maximize canvas space
   - Draggable for user preference

2. **Visual Feedback**
   - Highlight current position in filmstrip
   - Disable navigation buttons at boundaries
   - Show position counter (e.g., "5 / 23")
   - Animate transitions between compositions

3. **Thumbnail Quality**
   - Balance between quality and performance
   - Use 120x120px thumbnails
   - Maintain aspect ratio
   - Show blend mode and colors

4. **Mobile Considerations**
   - Touch-friendly filmstrip scrolling
   - Swipe gestures for navigation
   - Responsive thumbnail sizing
