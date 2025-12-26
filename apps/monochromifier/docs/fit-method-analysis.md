# Fit Method Analysis (Task #64)

This document analyzes the current behavior of the fit methods in the `monochromifier` application as part of the research phase for Task #64.

## Analyzed Code

The primary function governing the scaling behavior is `calculateScaleRatio` in `apps/monochromifier/src/monochromifier.js`. The application uses an `outputSize` of 2000x2000 pixels for its internal rendering buffer.

```javascript
const calculateScaleRatio = function (img, size = state.outputSize) {
  // canvas size should be a square, normally
  // if not, we can reconsider everything
  switch (state.scaleMethod) {
    case state.scaleMethods.fitToWidth:
      return size / img.width

    case state.scaleMethods.fitToHeight:
      return size / img.height

    case state.scaleMethods.fitToCanvas:
    default:
      return size / Math.max(img.width, img.height)
  }
}
```

The function `calculateOffsetMax` was found to be unused and has been removed.

## Behavior Analysis

The analysis considers three common image aspect ratios and their behavior with each fit method. The `outputSize` is assumed to be 2000x2000.

### 1. `fitToWidth`

- **Logic**: `scale = 2000 / img.width`
- **Behavior**: Scales the image so that its width is exactly 2000 pixels.
- **Analysis**:
  - **Landscape Image (e.g., 1920x1080)**: The image is scaled up to 2000x1125. The height exceeds the 2000px buffer, causing the top and bottom to be **clipped**.
  - **Portrait Image (e.g., 1080x1920)**: The image is scaled up to 2000x3555. The height significantly exceeds the buffer, causing **major clipping**.
  - **Square Image (e.g., 1080x1080)**: The image is scaled up to 2000x2000 and fits perfectly.
- **Conclusion**: This method is only suitable for square images or if the user intends to crop the image vertically. It is surprising for landscape and portrait images.

### 2. `fitToHeight`

- **Logic**: `scale = 2000 / img.height`
- **Behavior**: Scales the image so that its height is exactly 2000 pixels.
- **Analysis**:
  - **Landscape Image (e.g., 1920x1080)**: The image is scaled up to 3555x2000. The width significantly exceeds the buffer, causing **major clipping**.
  - **Portrait Image (e.g., 1080x1920)**: The image is scaled up to 1125x2000. The width exceeds the 2000px buffer, causing the left and right to be **clipped**.
  - **Square Image (e.g., 1080x1080)**: The image is scaled up to 2000x2000 and fits perfectly.
- **Conclusion**: This method is only suitable for square images or if the user intends to crop the image horizontally. It is surprising for landscape and portrait images.

### 3. `fitToCanvas`

- **Logic**: `scale = 2000 / Math.max(img.width, img.height)`
- **Behavior**: Scales the image so that its largest dimension fits within the 2000px buffer.
- **Analysis**:
  - **Landscape Image (e.g., 1920x1080)**: `Math.max` is 1920. The image is scaled to 2000x1125. The entire image is visible, with letterboxing (empty space) at the top and bottom.
  - **Portrait Image (e.g., 1080x1920)**: `Math.max` is 1920. The image is scaled to 1125x2000. The entire image is visible, with pillarboxing (empty space) at the sides.
  - **Square Image (e.g., 1080x1080)**: The image is scaled to 2000x2000 and fits perfectly.
- **Conclusion**: This is the only method that guarantees the entire image is visible without clipping upon initial rendering, regardless of aspect ratio.

## Initial Findings & Surprising Behaviors

1. **Clipping by Default**: Both `fitToWidth` and `fitToHeight` cause immediate, and often significant, clipping for any non-square image. This is likely unexpected by the user, who probably assumes "fit" means the whole image will be visible.
2. **`fitToCanvas` Anomaly**: For landscape images, `fitToCanvas` behaves identically to `fitToWidth`. For portrait images, it behaves identically to `fitToHeight`. This is because `Math.max(width, height)` will be `width` for landscape and `height` for portrait. The logic is correct for fitting *within* the canvas, but the naming might be confusing.
3. **Role of `autoCrop`**: The `cropWhitespace` function (controlled by `autoCrop`) runs *after* the initial scaling and placement. If an image scaled with `fitToCanvas` has letterboxing, `autoCrop` will crop that empty space, effectively changing the final dimensions and aspect ratio of the output buffer before it's displayed. This interaction is complex and likely not obvious to the user.

This concludes the initial documentation of the fit methods. The next step is to analyze the interaction with zoom, drag, and paint.

## Interaction Analysis: Fit, Zoom, Drag, and Auto-Crop

The interaction between these features is complex and non-intuitive. The core rendering logic is in `buildCombinedLayer`.

### Transformation Order

1. **Fit Method Scaling**: `calculateScaleRatio` applies a base scale to the image dimensions.
2. **Camera Transform**: The entire graphics buffer (`combinedLayer`) is translated and scaled based on `camera.zoom` and `camera.x/y`.
3. **Image Drawing**: The pre-scaled image is drawn into the transformed buffer.
4. **Auto-Crop**: `cropWhitespace` runs on the *final state* of the buffer, after all transformations and drawing.

### Key Interaction Issues & Surprising Behaviors

1. **State Collision**: `fitMethod` and `camera` (zoom/drag) are two separate states that both control the final transform. Changing the `fitMethod` after zooming or dragging results in a completely different base scale for the image, but the existing camera values are reapplied, causing the view to jump dramatically and destroying the user's framing. This is the most significant issue.

2. **Confusing `autoCrop` Behavior**:
    - `autoCrop` runs *after* all other transformations.
    - If a user zooms out, the image becomes small in the center of the buffer. `autoCrop` then finds this small content area and the subsequent display scaling makes the image appear large again, effectively fighting or undoing the user's zoom-out action.
    - If a user zooms in enough that the image edges are outside the buffer, `autoCrop` sees content up to the edges and does nothing.
    - This makes the effect of `autoCrop` unpredictable and dependent on the current zoom/drag state.

3. **Mental Model Mismatch**: The user's mental model is likely one of directly manipulating an image (fitting, zooming, and panning it). The implementation, however, is a series of transformations applied to the drawing context before the image is placed. This subtle difference is the root cause of the unintuitive behaviors. The user feels like they are moving the image, but they are actually moving the "viewport" over a static, pre-scaled image, and then the result of that is auto-cropped.

This concludes the research phase of documenting the current behaviors and issues. The next steps will involve proposing a new design to address these problems.

---

## Proposed Design for Predictable Interactions

To resolve the identified issues, this design proposes a unified transformation system.

### 1. Unified View State

The core of the new design is to eliminate the conflicting state variables. The `camera` object and `scaleMethod` mode will be replaced by a single, unified `view` object in the state.

```javascript
state: {
  // ...
  view: {
    x: 0,       // Pan offset X, in image pixels
    y: 0,       // Pan offset Y, in image pixels
    scale: 1.0  // The single source of truth for zoom/scale
  }
  // ...
}
```

- This object represents the user's current view of the image.
- Zooming and panning actions will directly manipulate this object.

### 2. Atomic "Fit" Actions

The concept of a persistent "fit mode" will be removed. Instead, we will have atomic actions that calculate and set the `view` state once.

- **`fitWidth()`**: An action that calculates the `scale` required to make the content width match the canvas width. It will set `state.view.scale` to this value and reset `state.view.x` and `state.view.y` to center the content.
- **`fitHeight()`**: Same as `fitWidth`, but for height.
- **`fitBoth()`**: Calculates the `scale` to make the entire content visible within the canvas and centers it.

Crucially, these actions **overwrite** the current view state. This is predictable: hitting "Fit Width" will always result in the same view, regardless of prior zoom/pan.

### 3. Redefined `autoCrop` Integration

`autoCrop` will no longer be a post-processing step. Instead, it will define what "content" means for the fit actions.

- When a `fit` action is triggered:
    1. Determine the "content bounds".
    2. If `autoCrop` is **ON**, the bounds are the rectangle containing all non-whitespace pixels (from the combined image and paint layer).
    3. If `autoCrop` is **OFF**, the bounds are the full dimensions of the original source image.
    4. The `fit` action then calculates the `view` state needed to fit *these specific bounds* to the canvas.

This makes `autoCrop` a predictable modifier for the fit actions, not a confusing final step.

### 4. Simplified Rendering Logic

The `buildCombinedLayer` function will become much simpler. It will only be responsible for applying the `state.view` transform.

```javascript
// Simplified pseudo-code for new buildCombinedLayer
const buildCombinedLayer = img => {
  // No more calculateScaleRatio() or other complex logic here.

  state.combinedLayer.clear();
  state.combinedLayer.push();

  // 1. Center the transform origin
  state.combinedLayer.translate(state.combinedLayer.width / 2, state.combinedLayer.height / 2);

  // 2. Apply the unified view transform
  state.combinedLayer.scale(state.view.scale);
  state.combinedLayer.translate(-state.view.x, -state.view.y);

  // 3. Draw the image and paint layer at their native resolution
  state.combinedLayer.imageMode(p.CENTER);
  state.combinedLayer.image(getMonochromeImage(img), 0, 0);
  state.combinedLayer.image(state.paintLayer, 0, 0);

  state.combinedLayer.pop();

  // The result is directly displayed. No more cropping at the end of the pipe.
  state.displayLayer.image(state.combinedLayer, ...);
}
```

### 5. Smart Import

On initial image load, a "smart fit" will be applied to ensure the user sees their entire image.

- **Default Behavior**: Always perform a `fitBoth()` action on image load. This is the most predictable behavior and avoids any initial clipping. The user can then choose to zoom or use the other fit actions to frame the image as they desire.
