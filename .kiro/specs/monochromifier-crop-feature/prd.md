# PRD: Monochromifier Crop Feature

## 1. Executive Summary
This document outlines the requirements for a new crop feature in the Monochromifier application. The feature will allow the user to select a rectangular portion of an image to be used as the new source image. The key value proposition is to dramatically speed up the process of isolating a small part of a larger image, which is currently a time-consuming process of manually painting out unwanted areas.

## 2. Problem Statement
The current method for removing unwanted parts of an image is to paint over them in white. While effective for small touch-ups, this process is inefficient and tedious when needing to isolate a small section from a large image (e.g., a single frame from a comic book scan). This can take 1-2 minutes per image, which is a significant bottleneck when processing hundreds of images.

## 3. Product Vision & Goals
- **Primary Goal (MVP):** To provide a fast and efficient way to perform rectangular cropping, significantly speeding up the user's workflow.
- **Long-Term Vision:** While the immediate focus is on rectangular cropping, the system could be extended in the future to support non-rectangular selections (e.g., lasso tool).

## 4. Target Users & Personas
The primary user is the developer, who uses the tool to process images for generative art projects.

### User Journey (with new feature)
1. Launch monochromifier and drag in an image.
2. Adjust the black/white threshold in **`ADJUST` Mode**.
3. Enter **`EDIT` Mode** (e.g., by pressing 'e'). The view changes to the full, un-scaled image.
4. The **`PAINT` tool** is active by default. The user can press 'c' to switch to the **`CROP` tool**.
5. With the `CROP` tool active, draw a rectangle to select the desired area.
6. Upon releasing the mouse, the crop is confirmed.
7. The application returns to **`ADJUST` Mode**, displaying the newly cropped image (including the cropped paint layer).
8. (Optional) Enter `EDIT` Mode again to perform paint touch-ups.
9. Adjust final positioning and save the image.

## 5. Functional Requirements (MVP)

### 1. High-Level Modes
- **`ADJUST` Mode:** The default mode for positioning, zoom, and threshold.
- **`EDIT` Mode:** A mode for pixel-level changes. A keypress toggles between `ADJUST` and `EDIT` modes.

### 2. Tools within `EDIT` Mode
- **User Story:** As a user entering `EDIT` mode, I want the `PAINT` tool to be active by default so I can immediately start drawing.
- **Acceptance Criteria:**
    - Upon entering `EDIT` mode, the active tool is `PAINT`.
    - The cursor is a circle representing the brush size.

- **User Story:** As a user in `EDIT` mode, I want to switch between `PAINT` and `CROP` tools to perform different actions.
- **Acceptance Criteria:**
    - Pressing 'p' activates the `PAINT` tool (circle cursor).
    - Pressing 'c' activates the `CROP` tool (crosshair cursor).
    - The UI and the on-screen help menu indicate the currently active tool and key commands.

### 3. Crop Functionality
- **User Story:** As a user with the `CROP` tool, I want to select a rectangular area and have it become my new canvas, including any paint strokes I've already made.
- **Acceptance Criteria:**
    - Clicking and dragging draws a selection rectangle.
    - On mouse release, the source image AND the paint layer are cropped to the selection.
    - The application returns to `ADJUST` mode, displaying the newly cropped image and paint layer.

### 4. Undo Functionality
- **User Story:** As a user, if I make a mistake while cropping, I want to undo it and restore my image and all my previous paint strokes.
- **Acceptance Criteria:**
    - Pressing CMD+Z after a crop reverts the main image and the paint layer to their exact state before the crop.

## 6. Technical Requirements
- **Platform:** The feature will be integrated into the existing browser-based p5.js application.
- **State Management:** A single state variable (e.g., `currentMode`) will be used to manage the application's primary mode (`ADJUST`, `EDIT`). A secondary variable will manage the active tool within `EDIT` mode (`PAINT`, `CROP`).
- **Undo Stack:** A new undo system will be implemented that can store and restore the state of both the source image and the `paintLayer` graphics buffer.

## 7. Design & UX Considerations
- **Key UX Goal:** The interaction must feel "precise and deliberate," and responsive ("not slow and clunky").
- **Feedback:** The active mode and tool will be clearly communicated to the user via the cursor style (circle vs. crosshairs) and the on-screen UI text.
- **Future Enhancements:** Dimming the area outside the crop selection during creation is a potential future improvement but is not required for the MVP.

## 8. Timeline & Milestones
- **Phase 1: State Management & UI Foundation:** Implement the new state machine, mode/tool switching, and update the UI and help text.
- **Phase 2: Core Crop & Undo Implementation:** Implement the crop selection, the logic to crop both image and paint layers, and the undo stack.
- **Phase 3: Refinement:** Address bugs and consider "nice-to-have" features.

## 9. Assumptions & Constraints
- The feature will be built directly into the existing application.
- The MVP will only support rectangular cropping.
- The feature is assumed to perform adequately with typical browser-based image sizes.
- A new undo system will be created specifically for this functionality.
