# Design Document

## Overview

The duo-chrome interactive controls feature extends the existing duo-chrome application with user-controlled image sizing and navigation capabilities. The design maintains the current architecture while adding a control layer that manages individual image properties and user interactions. The implementation leverages the existing `imageColorPairs` array structure and adds new state management for active image selection and manual control modes.

## Architecture

### Current System Analysis

The existing duo-chrome system uses:
- `imageColorPairs` array with two objects containing `img`, `color`, `layer`, and `scale` properties
- Automatic cycling through images via `loadNewImagesAndColors()` and `updateImageColorPair()`
- p5.js event handlers for keyboard input (`keyPressed()`)
- Centralized rendering via `updateScreen()`

### Enhanced Architecture

The enhanced system adds:
- **Active Image State Management**: Track which image (A or B) is currently selected for control
- **Manual Control Mode**: Distinguish between automatic and manual image/size changes
- **Visual Feedback System**: UI elements to show current state and active selection
- **Enhanced Input Handling**: Extended keyboard controls for size and navigation
- **State Persistence**: Maintain manual adjustments until explicitly reset

## Components and Interfaces

### 1. Control State Manager

```javascript
const controlState = {
  activeImageIndex: 0, // 0 for Image A, 1 for Image B
  manualSizeControl: [false, false], // Track if each image has manual size adjustments
  imageIndices: [0, 0], // Current position in imgs array for each image
  isManualMode: false // Whether user has taken manual control
}
```

**Responsibilities:**
- Track which image is currently active for controls
- Maintain image array indices for navigation
- Flag when manual adjustments have been made
- Coordinate between automatic and manual modes

### 2. Size Control System

**Interface:**
```javascript
function adjustImageSize(imageIndex, delta) {
  // Adjust scale with bounds checking
  // Update imageColorPairs[imageIndex].scale
  // Trigger visual update
}

function resetImageSize(imageIndex) {
  // Reset to default scale (1.0 or random range)
  // Clear manual control flag
}
```

**Constraints:**
- Minimum scale: 0.05 (5% of original size)
- Maximum scale: 5.0 (500% of original size)
- Adjustment increment: 0.1 per keypress
- Bounds enforcement with user feedback

### 3. Image Navigation System

**Interface:**
```javascript
function navigateImage(imageIndex, direction) {
  // Move through imgs array with wraparound
  // Ensure uniqueness between image pairs
  // Load new image and update display
}

function setImageByIndex(imageIndex, arrayIndex) {
  // Directly set image to specific array position
  // Handle color regeneration and layer updates
}
```

**Navigation Logic:**
- Circular array traversal with wraparound
- Conflict resolution when both images would be the same
- Automatic color regeneration for new images
- Preservation of manual size adjustments

### 4. Visual Feedback System

**Components:**
- **Active Image Indicator**: Border or highlight around the currently selected image
- **Status Display**: Overlay showing current image names and scale factors
- **Help System Integration**: Updated help overlay with new controls

**Implementation:**
```javascript
function updateVisualFeedback() {
  // Update active image highlight
  // Refresh status display
  // Show current scale and image info
}

function drawActiveImageIndicator(imageIndex) {
  // Draw border or highlight around active image
  // Use contrasting color for visibility
}
```

### 5. Enhanced Input Handler

**Extended Keyboard Controls:**
- `a`: Select Image A as active
- `b`: Select Image B as active  
- `↑`: Increase active image size
- `↓`: Decrease active image size
- `←`: Previous image in array for active image
- `→`: Next image in array for active image

**Input Processing Flow:**
1. Capture keypress event
2. Check if it's a new control command
3. Update control state accordingly
4. Apply changes to active image
5. Refresh visual display
6. Maintain existing functionality for other keys

## Data Models

### Enhanced ImageColorPair Structure

```javascript
const imageColorPair = {
  img: String,           // filename (existing)
  color: Object,         // RISO color object (existing)
  layer: p5.Graphics,    // rendered layer (existing)
  scale: Number,         // display scale factor (existing)
  
  // New properties for enhanced control
  arrayIndex: Number,    // position in imgs array
  isManualSize: Boolean, // whether size was manually adjusted
  isActive: Boolean      // whether this is the currently active image
}
```

### Control State Model

```javascript
const controlState = {
  activeImageIndex: Number,     // 0 or 1
  manualSizeControl: [Boolean], // per-image manual size flags
  imageIndices: [Number],       // current array positions
  isManualMode: Boolean,        // overall manual control flag
  
  // Visual feedback state
  showStatusOverlay: Boolean,
  statusDisplayTimeout: Number
}
```

## Error Handling

### Size Control Bounds

- **Minimum Scale Reached**: Provide visual/audio feedback, prevent further decrease
- **Maximum Scale Reached**: Provide visual/audio feedback, prevent further increase
- **Invalid Scale Values**: Clamp to valid range, log warning

### Image Navigation

- **Empty Image Array**: Graceful degradation, maintain current images
- **Image Load Failures**: Fallback to previous image, error logging
- **Duplicate Image Conflict**: Auto-resolve by finding next available unique image

### State Management

- **Invalid Active Index**: Reset to default (Image A)
- **Array Index Out of Bounds**: Wrap to valid range
- **Corrupted Control State**: Reset to default values with user notification

## Testing Strategy

### Unit Testing

1. **Size Control Functions**
   - Test bounds enforcement (min/max scale)
   - Verify increment/decrement behavior
   - Validate scale clamping logic

2. **Navigation Functions**
   - Test array wraparound behavior
   - Verify uniqueness enforcement
   - Check index boundary handling

3. **State Management**
   - Test active image switching
   - Verify manual mode transitions
   - Check state persistence logic

### Integration Testing

1. **Keyboard Input Integration**
   - Test all new keyboard shortcuts
   - Verify existing shortcuts still work
   - Check input conflict resolution

2. **Visual Feedback Integration**
   - Test active image highlighting
   - Verify status display updates
   - Check help overlay integration

3. **Automatic Mode Integration**
   - Test transition between manual and automatic modes
   - Verify automatic cycling behavior preservation
   - Check manual adjustment persistence

### User Experience Testing

1. **Control Responsiveness**
   - Measure input lag for size adjustments
   - Test navigation smoothness
   - Verify visual feedback timing

2. **Usability Testing**
   - Test control discoverability
   - Verify intuitive behavior
   - Check error recovery flows

3. **Performance Testing**
   - Monitor frame rate impact
   - Test with large image arrays
   - Verify memory usage patterns

## Implementation Notes

### Backward Compatibility

- All existing functionality must remain unchanged
- New features should be additive only
- Existing keyboard shortcuts take precedence
- Automatic mode should remain the default behavior

### Performance Considerations

- Minimize re-rendering during size adjustments
- Cache scaled images when possible
- Optimize visual feedback rendering
- Maintain 60fps target during interactions

### Future Extensibility

- Design allows for additional control modes
- State management supports new image properties
- Visual feedback system can accommodate new indicators
- Input system can handle additional control schemes