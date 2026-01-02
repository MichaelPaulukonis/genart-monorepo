# History System Architecture

## Overview

The History System provides comprehensive composition tracking, navigation, and visualization for duo-chrome. It enables users to explore their creative process by capturing, browsing, and restoring previous compositions with full state preservation.

## Core Components

### 1. HistoryManager (`src/history/HistoryManager.js`)

Central coordinator for all history operations.

**Responsibilities:**
- Captures composition state snapshots
- Manages navigation through history stack
- Persists history to localStorage
- Provides state restoration
- Tracks current position in history

**Key Features:**
- **Automatic Capture**: Debounced capture during rapid parameter changes
- **Manual Capture**: Immediate capture for discrete actions (exchange, blend mode)
- **Source Tracking**: Records how each entry was created (`manual`, `random`, `url`, `modified`)
- **Position Management**: Maintains current position with forward/backward navigation
- **Persistence**: Automatic save/load from localStorage with size management

**State Structure:**
```javascript
{
  id: 'unique-timestamp-id',
  timestamp: Date.now(),
  source: 'manual|random|url|modified',
  imageA: {
    filename: 'image.png',
    colorName: 'Fluorescent Pink',
    scale: 1.5
  },
  imageB: { /* same structure */ },
  paletteIndex: 0,
  backgroundModeIndex: 0,
  blendModeIndex: 2
}
```

### 2. ThumbnailGenerator (`src/history/ThumbnailGenerator.js`)

Generates and caches thumbnail previews of compositions.

**Responsibilities:**
- Renders 120x120px thumbnails using p5.js
- Implements LRU cache for performance
- Handles async generation with error recovery
- Provides placeholder thumbnails on failure

**Key Features:**
- **Lazy Generation**: Only generates when needed
- **LRU Cache**: 50 entry limit, 5MB size limit
- **Automatic Cleanup**: Removes old entries after 5 minutes
- **Error Handling**: Graceful degradation with placeholder images
- **Base64 Encoding**: Thumbnails stored as data URLs

**Cache Management:**
```javascript
// Cache statistics
{
  entries: 45,
  sizeBytes: 2847392,
  sizeMB: '2.72',
  hits: 120,
  misses: 45,
  hitRate: '72.7%',
  evictions: 3
}
```

### 3. FilmstripPanel (`src/ui/FilmstripPanel.js`)

Visual interface for browsing history thumbnails.

**Responsibilities:**
- Renders thumbnail grid with metadata
- Handles user interactions (click to navigate)
- Implements virtual scrolling for large histories
- Manages highlight and position tracking

**Key Features:**
- **Virtual Scrolling**: Efficient rendering for 100+ entries
- **Smart Rendering**: Only renders visible thumbnails
- **Position Tracking**: Highlights current composition
- **Smooth Scrolling**: Auto-scroll to current position
- **Click Navigation**: Jump to any composition instantly

**Virtual Scrolling:**
- Threshold: 100 entries
- Render Buffer: 5 items on each side
- Thumbnail Width: 130px (120px + 10px gap)
- Absolute positioning for performance

## Navigation System

### Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `[` | Previous | Move back 1 composition |
| `]` | Next | Move forward 1 composition |
| `←` | Previous | Move back 1 composition (when Filmstrip is open) |
| `→` | Next | Move forward 1 composition (when Filmstrip is open) |
| `Shift+[` | Previous 10 | Move back 10 compositions |
| `Shift+]` | Next 10 | Move forward 10 compositions |
| `Cmd+[` | Jump to Beginning | Go to first entry |
| `Cmd+]` | Jump to End | Go to last entry |
| `F` | Toggle Filmstrip | Show/hide thumbnail panel |
| `Shift+C` | Clear History | Delete all entries (with confirmation) |
| `Shift+T` | Regenerate Thumbnails | Clear cache and rebuild thumbnails |

### Navigation Functions

**Step Navigation:**
```javascript
navigateHistoryBackward(step = 1)
navigateHistoryForward(step = 1)
```
- Moves through history by specified steps
- Provides boundary feedback at limits
- Updates filmstrip highlight and counter
- Shows position feedback message

**Jump Navigation:**
```javascript
navigateHistoryToBeginning()
navigateHistoryToEnd()
```
- Instant navigation to first/last entry
- Contextual feedback messages
- Filmstrip auto-scroll to position

**Direct Navigation:**
```javascript
historyManager.navigateTo(position)
```
- Used by filmstrip click handlers
- Validates position bounds
- Restores complete composition state

## Capture Strategy

### Debounced Capture

Used for rapid parameter changes (size adjustments, color cycling):

```javascript
debouncedCaptureHistory(source = 'manual')
```

**Behavior:**
- 300ms delay after last change
- Prevents excessive history entries
- Cancels pending captures on new changes
- Updates filmstrip after capture

**Use Cases:**
- Image size adjustments (arrow keys)
- Color cycling (Cmd+arrows)
- Image navigation (left/right arrows)

### Immediate Capture

Used for discrete actions:

```javascript
captureHistoryImmediate(source = 'manual')
```

**Behavior:**
- Captures immediately without delay
- Cancels any pending debounced captures
- Updates filmstrip synchronously

**Use Cases:**
- Image exchange (X key)
- Blend mode changes (M key)
- Background toggle (B key)
- Palette cycling (C key)
- Random generation (click)

## State Restoration

When navigating to a history entry:

1. **Load State**: Extract all parameters from entry
2. **Update Images**: Load image files if changed
3. **Apply Colors**: Set color palette and selections
4. **Set Scales**: Restore size adjustments
5. **Configure Modes**: Apply background and blend modes
6. **Regenerate Layers**: Create monochrome layers with new state
7. **Update UI**: Refresh status display and indicators
8. **Render**: Redraw canvas with restored composition

**State Validation:**
- Checks image file existence
- Validates palette indices
- Verifies color availability
- Handles missing resources gracefully

## Performance Optimizations

### Thumbnail Generation

**Optimization Strategies:**
- Off-screen graphics rendering
- Scaled-down image processing (120x120px)
- Async generation with requestIdleCallback
- LRU cache with automatic eviction
- Batch generation for multiple entries

**Memory Management:**
- 5MB cache size limit
- 50 entry count limit
- Automatic cleanup of old entries
- Manual optimization available

### Virtual Scrolling

**Benefits:**
- Constant rendering cost regardless of history size
- Smooth scrolling with large datasets
- Reduced DOM node count
- Lower memory footprint

**Implementation:**
- Calculates visible range from scroll position
- Renders only visible + buffer items
- Removes off-screen thumbnails
- Absolute positioning for layout

### LocalStorage Management

**Storage Strategy:**
- JSON serialization of history array
- Automatic save on capture
- Size monitoring (10MB limit)
- Oldest entry eviction when full

**Data Structure:**
```javascript
{
  history: [...entries],
  currentPosition: 5,
  version: '1.0'
}
```

## User Feedback

### Visual Feedback

**Status Messages:**
- Position display: "History: 5 / 20"
- Boundary alerts: "At beginning of history"
- Jump feedback: "History: 1 / 20 (beginning)"
- Success messages: "Thumbnails regenerated"

**Visual Indicators:**
- Canvas border flash on bounds
- Filmstrip highlight on current entry
- Position counter in filmstrip header
- Thumbnail loading placeholders

### Audio Feedback

**Boundary Sounds:**
- Low tone (300Hz) for beginning
- High tone (500Hz) for end
- Brief beep (100ms) on bounds
- Graceful fallback if unavailable

## Error Handling

### Thumbnail Generation Errors

**Failure Scenarios:**
- Image load timeout (10s)
- Invalid render context
- Missing color in palette
- Invalid scale values
- Graphics creation failure

**Recovery Strategy:**
- Generate placeholder thumbnail
- Log error details for debugging
- Track error count and last error
- Continue with degraded experience

### History Navigation Errors

**Failure Scenarios:**
- Invalid position index
- Missing history entry
- Corrupted state data
- Resource load failure

**Recovery Strategy:**
- Validate bounds before navigation
- Provide user feedback on failure
- Maintain current state on error
- Log warnings for debugging

## Integration Points

### Main Application

**Initialization:**
```javascript
// Create history manager
historyManager = new HistoryManager(p, stateRefs)

// Create thumbnail generator
thumbnailGenerator = new ThumbnailGenerator(p, stateRefs)

// Create filmstrip panel
filmstripPanel = new FilmstripPanel(historyManager, thumbnailGenerator)

// Capture initial state
historyManager.captureCurrentState('random')
```

**State References:**
```javascript
const stateRefs = {
  imageColorPairs,
  colorIndex,
  currentBackgroundModeIndex,
  currentBlendModeIndex,
  imgs,
  ALL_PALETTES,
  COLOR_MAPS,
  backgroundModes
}
```

### Control System

**Capture Triggers:**
- Size adjustments → debounced
- Color changes → debounced
- Image navigation → debounced
- Exchange/modes → immediate
- Random generation → immediate

**Navigation Triggers:**
- Keyboard shortcuts → navigation functions
- Filmstrip clicks → direct navigation
- Boundary detection → feedback

## Future Enhancements

### Potential Features

1. **History Search**: Filter by image, color, or date
2. **History Export**: Save history to file
3. **History Import**: Load history from file
4. **Favorites**: Mark and filter favorite compositions
5. **History Branching**: Create alternate timelines
6. **Undo/Redo**: Stack-based navigation
7. **History Comparison**: Side-by-side view
8. **Thumbnail Customization**: Size and quality options

### Performance Improvements

1. **Web Workers**: Off-thread thumbnail generation
2. **IndexedDB**: Better storage for large histories
3. **Progressive Loading**: Load thumbnails on demand
4. **Image Preloading**: Cache images for faster restoration
5. **Compression**: Reduce storage size

## Testing Considerations

### Unit Tests

- History capture and restoration
- Navigation boundary conditions
- Cache eviction logic
- State validation
- Error handling

### Integration Tests

- Filmstrip interaction
- Keyboard navigation
- LocalStorage persistence
- Thumbnail generation
- State synchronization

### Performance Tests

- Large history rendering (1000+ entries)
- Virtual scrolling performance
- Cache hit rate optimization
- Memory usage monitoring
- Storage size management

## Debugging

### Console Logging

**History Operations:**
```javascript
console.log('Captured history entry:', entry.id)
console.log('Navigated to position:', position)
console.log('History size:', historyManager.getTotalEntries())
```

**Thumbnail Generation:**
```javascript
console.log('Generating thumbnail for', entry.id)
console.log('Using cached thumbnail for', entry.id)
console.log('Cache stats:', thumbnailGenerator.getCacheStats())
```

**Performance Monitoring:**
```javascript
console.log('Virtual scrolling enabled:', entries.length)
console.log('Rendering visible range:', start, '-', end)
console.log('Rendered thumbnails:', renderedCount)
```

### Developer Tools

**Inspect History:**
```javascript
// In browser console
historyManager.history
historyManager.currentPosition
historyManager.getTotalEntries()
```

**Inspect Cache:**
```javascript
thumbnailGenerator.getCacheStats()
thumbnailGenerator.cache.cache // View cache contents
```

**Inspect Filmstrip:**
```javascript
filmstripPanel.renderedThumbnails
filmstripPanel.visibleRange
filmstripPanel.shouldUseVirtualScrolling()
```

## Architecture Decisions

### Why LocalStorage?

**Pros:**
- Simple API
- Synchronous access
- No setup required
- Persistent across sessions

**Cons:**
- 10MB size limit
- Synchronous blocking
- String-only storage

**Decision**: LocalStorage is sufficient for typical usage (100-200 entries). Future versions could migrate to IndexedDB for larger histories.

### Why LRU Cache?

**Pros:**
- Automatic memory management
- Predictable performance
- Simple implementation
- Good hit rates

**Cons:**
- May evict recently used items
- Fixed size limits
- No priority system

**Decision**: LRU provides good balance of simplicity and performance. Most users navigate recent history, which stays cached.

### Why Virtual Scrolling?

**Pros:**
- Constant rendering cost
- Handles large datasets
- Smooth scrolling
- Low memory usage

**Cons:**
- Complex implementation
- Requires absolute positioning
- Scroll position calculations

**Decision**: Virtual scrolling enables smooth experience with 1000+ entries. Threshold of 100 entries provides good balance.

### Why Debounced Capture?

**Pros:**
- Prevents excessive entries
- Reduces storage usage
- Better user experience
- Improves performance

**Cons:**
- Slight delay in capture
- May miss rapid changes
- Complex timing logic

**Decision**: 300ms delay provides good balance. Users can make rapid adjustments without cluttering history.

## Conclusion

The History System provides a robust, performant, and user-friendly way to explore creative compositions in duo-chrome. Its modular architecture, comprehensive error handling, and thoughtful UX design make it a powerful tool for creative exploration.

The system successfully balances:
- **Performance**: Virtual scrolling, caching, debouncing
- **Usability**: Intuitive navigation, visual feedback, keyboard shortcuts
- **Reliability**: Error handling, state validation, graceful degradation
- **Maintainability**: Modular design, clear responsibilities, comprehensive logging
