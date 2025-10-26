# Interactive Controls System

The Duo-Chrome application features a comprehensive interactive control system that allows users to manipulate individual images (A and B) independently. This system provides precise control over image selection, sizing, navigation, and color management.

## Overview

The interactive controls transform Duo-Chrome from a passive viewing experience into an active creative tool. Users can:

- Select which image (A or B) to control
- Adjust image sizes independently with precise bounds
- Navigate through the image collection for each position
- Cycle through colors in the current palette
- Exchange complete image states
- Monitor current settings with a draggable status display

## Control Architecture

### Active Image Selection

The system operates on the concept of an "active image" - either Image A or Image B. All control operations (size, navigation, color) apply to the currently active image.

**Selection Controls:**
- `A` - Select Image A as active
- `B` - Select Image B as active

**Visual Feedback:**
- Active image is highlighted with a contrasting border
- Corner indicators show which image is selected
- Label displays "IMAGE A" or "IMAGE B"
- Status display highlights the active image

### State Management

The control system maintains a centralized state object that tracks:

```javascript
controlState = {
  activeImageIndex: 0,           // 0 = Image A, 1 = Image B
  manualSizeControl: [false, false], // Manual size adjustment flags
  imageIndices: [0, 1],          // Position in image array
  isManualMode: false,           // Manual vs automatic mode
  showIndicators: false,         // Visual indicator visibility
  statusIsPermanent: false,      // Status display mode
  isDraggingStatus: false        // UI interaction state
}
```

## Control Systems

### 1. Size Control System

Provides precise control over individual image scaling with enforced bounds and visual feedback.

**Controls:**
- `↑` - Increase active image size
- `↓` - Decrease active image size

**Features:**
- **Scale Range:** 0.05x to 5.0x (5% to 500%)
- **Increment:** 0.1x per keypress
- **Bounds Enforcement:** Visual and audio feedback at limits
- **Manual Mode:** Preserves manual adjustments during automatic cycling
- **Real-time Updates:** Immediate visual feedback and status display updates

**Bounds Feedback:**
- **Visual:** Canvas border flashes red (minimum) or blue (maximum)
- **Audio:** Brief tone indicates limit reached
- **Status:** Scale factor displayed in status overlay

### 2. Image Navigation System

Allows cycling through the image collection for each image position independently.

**Controls:**
- `←` - Navigate to previous image for active image
- `→` - Navigate to next image for active image

**Features:**
- **Wraparound Navigation:** Seamless cycling from last to first image
- **Uniqueness Enforcement:** Prevents both images from showing identical content
- **Conflict Resolution:** Automatically skips to next available image
- **State Preservation:** Maintains manual size adjustments when switching images
- **Array Tracking:** Tracks position in image collection for each image

**Navigation Logic:**
1. Calculate next/previous index with wraparound
2. Check for conflicts with other image
3. Skip conflicting images automatically
4. Update image, regenerate layer, preserve scale
5. Update status display and visual indicators

### 3. Color Navigation System

Enables cycling through colors in the current palette for individual images.

**Controls:**
- `Cmd+←` - Navigate to previous color for active image
- `Cmd+→` - Navigate to next color for active image

**Features:**
- **Palette Integration:** Uses current color palette (RISO, PALETTE, PALETTE_TWO)
- **Uniqueness Enforcement:** Prevents color conflicts between images
- **Wraparound Navigation:** Cycles through entire palette
- **Layer Regeneration:** Creates new monochrome layers with selected colors
- **Real-time Preview:** Immediate visual feedback

**Color Selection Process:**
1. Find current color in active palette
2. Calculate next/previous color with wraparound
3. Check for conflicts with other image's color
4. Skip conflicting colors automatically
5. Regenerate image layer with new color
6. Update display and status information

### 4. Image Exchange System

Provides complete state swapping between Image A and Image B.

**Controls:**
- `X` - Exchange all properties between images A and B

**Features:**
- **Complete State Swap:** Exchanges all image properties
- **Properties Exchanged:**
  - Image filename and content
  - Color and rendered layer
  - Scale factor and manual control state
  - Array index position
- **Instant Operation:** Single keypress swaps everything
- **Blend Mode Control:** Useful for experimenting with layer order

**Use Cases:**
- Experiment with different layering arrangements
- Test blend mode effects with swapped positions
- Compare size relationships with roles reversed
- Explore color interactions in different positions

## Visual Feedback Systems

### Active Image Indicators

**Visual Elements:**
- **Border:** High-contrast outline around active image
- **Corners:** L-shaped indicators at image corners
- **Label:** "IMAGE A" or "IMAGE B" text above image
- **Adaptive Colors:** Automatically adjusts for background contrast

**Visibility Features:**
- **Background Adaptation:** Works on both black and white backgrounds
- **Shadow System:** Layered rendering ensures visibility
- **Temporary Display:** Shows for 2 seconds after control actions
- **Manual Toggle:** `V` key toggles persistent visibility

### Status Display System

A draggable overlay showing current image information and settings.

**Information Displayed:**
- **Image Names:** Filename for each image (wrapped to 2 lines)
- **Colors:** Current color name for each image
- **Scale Factors:** Current size multiplier (e.g., "1.25")
- **Active Highlighting:** Visual indication of selected image

**Display Features:**
- **Draggable:** Click and drag header to reposition
- **Session Persistent:** Position saved across browser sessions
- **Auto-hide:** Temporary display (3 seconds) for control actions
- **Manual Toggle:** `I` key for permanent display
- **Fixed Width:** Consistent size prevents layout shifts

**Controls:**
- `I` - Toggle status display visibility
- **Drag Header** - Reposition display
- **Auto-show** - Appears during control actions

## Keyboard Reference

### Primary Controls
| Key | Function | Description |
|-----|----------|-------------|
| `A` | Select Image A | Make Image A active for controls |
| `B` | Select Image B | Make Image B active for controls |
| `↑` | Size Up | Increase active image size |
| `↓` | Size Down | Decrease active image size |
| `←` | Previous Image | Navigate to previous image |
| `→` | Next Image | Navigate to next image |
| `Cmd+←` | Previous Color | Cycle to previous color |
| `Cmd+→` | Next Color | Cycle to next color |
| `X` | Exchange | Swap all properties between A and B |

### Display Controls
| Key | Function | Description |
|-----|----------|-------------|
| `I` | Status Display | Toggle image status overlay |
| `V` | Visual Indicators | Toggle active image highlighting |
| `H` or `?` | Help | Show/hide help overlay |

### Global Controls
| Key | Function | Description |
|-----|----------|-------------|
| `Mouse Click` | New Pair | Generate new random image pair |
| `B` | Background | Toggle background color (black/white) |
| `C` | Color Palette | Cycle through color palettes |
| `M` | Blend Mode | Cycle through blend modes |
| `P` or `Space` | Pause | Pause/resume automatic cycling |
| `S` | Auto-save | Toggle automatic saving |
| `Cmd+S` | Manual Save | Save current composition |

## Integration with Existing Features

### Automatic Cycling Compatibility

The interactive controls seamlessly integrate with the existing automatic cycling system:

- **Manual Mode Detection:** System detects when user takes manual control
- **Preservation:** Manual adjustments preserved during automatic cycling
- **Reset Behavior:** New automatic pairs reset manual adjustments
- **Pause Integration:** Pause system works with manual controls

### Blend Mode Integration

Interactive controls enhance blend mode experimentation:

- **Layer Order Control:** Exchange function changes which image is on top
- **Size Relationships:** Independent sizing affects blend interactions
- **Color Combinations:** Color cycling explores different blend results
- **Background Integration:** Works with both black and white backgrounds

### Save System Integration

All manual adjustments are captured in saved compositions:

- **Manual Saves:** `Cmd+S` captures current manual state
- **Auto-save:** Automatic saves include manual adjustments
- **State Preservation:** All control states included in saved images

## Technical Implementation

### Event Handling

The system uses a centralized event handling approach:

```javascript
p.keyPressed = function () {
  // Modifier key detection for color cycling
  if (p.keyCode === p.LEFT_ARROW) {
    const activeIndex = getActiveImageIndex()
    if (p.keyIsDown(p.CONTROL) || p.keyIsDown(91)) {
      navigateImageColor(activeIndex, 'previous')
    } else {
      navigateImage(activeIndex, 'previous')
    }
  }
  // ... additional key handlers
}
```

### State Synchronization

All control actions trigger coordinated updates:

1. **State Update:** Modify control state object
2. **Visual Update:** Regenerate affected image layers
3. **Display Update:** Refresh status display and indicators
4. **Feedback:** Show temporary visual feedback

### Performance Considerations

- **Layer Caching:** Monochrome layers cached until color changes
- **Selective Updates:** Only affected components regenerated
- **Debounced Feedback:** Visual indicators auto-hide to reduce overhead
- **Efficient Rendering:** Minimal redraws during interactions

## Best Practices

### For Users

1. **Start with Selection:** Always select your target image (A or B) first
2. **Use Visual Feedback:** Enable indicators (`V`) when learning controls
3. **Monitor Status:** Keep status display (`I`) visible during complex adjustments
4. **Experiment with Exchange:** Use `X` to explore different arrangements
5. **Save Frequently:** Use `Cmd+S` to preserve interesting compositions

### For Developers

1. **State Consistency:** Always update control state before visual changes
2. **Error Handling:** Validate indices and parameters in all functions
3. **Visual Feedback:** Provide immediate feedback for all user actions
4. **Performance:** Minimize unnecessary layer regeneration
5. **Documentation:** Keep function documentation current with changes

## Troubleshooting

### Common Issues

**Controls Not Responding:**
- Ensure an image is selected (A or B)
- Check that the application has focus
- Verify keyboard shortcuts aren't conflicting with browser

**Visual Indicators Not Visible:**
- Toggle indicators with `V` key
- Check background color - indicators adapt automatically
- Ensure images are loaded and displayed

**Status Display Issues:**
- Toggle with `I` key to refresh
- Drag header to reposition if off-screen
- Check browser console for JavaScript errors

**Size Control Problems:**
- Verify you're within scale bounds (0.05x to 5.0x)
- Listen for audio feedback at limits
- Check that manual mode is activated

### Performance Tips

- **Pause During Adjustments:** Use `P` to pause automatic cycling while making manual adjustments
- **Limit Rapid Changes:** Allow time between rapid key presses for smooth updates
- **Monitor Memory:** Large scale factors may impact performance on older devices

## Future Enhancements

Potential areas for system expansion:

- **Rotation Controls:** Independent rotation for each image
- **Position Controls:** Manual positioning within canvas
- **Filter Controls:** Individual filter effects per image
- **Preset System:** Save and recall control configurations
- **Animation Controls:** Animate between different states
- **Touch Support:** Enhanced mobile/tablet interaction

---

*This documentation covers the complete interactive controls system as implemented in Duo-Chrome v2.0+. For basic usage instructions, see the in-app help system (`H` or `?` key).*