# Implementation Plan

- [x] 1. Set up control state management system

  - Initialize control state object with active image tracking, manual control flags, and image indices
  - Add state management functions for updating active image selection and manual mode flags
  - Integrate control state initialization into the existing setup() function
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 2. Implement image size control functionality

  - [x] 2.1 Create size adjustment functions with bounds checking

    - Write adjustImageSize() function with delta parameter and scale bounds enforcement (0.05 to 5.0)
    - Implement bounds checking logic to prevent scale values outside the valid range
    - Add visual/audio feedback when bounds are reached
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Integrate size controls with keyboard input

    - Add up/down arrow key handlers in keyPressed() function
    - Connect arrow key presses to adjustImageSize() function for the active image
    - Ensure size adjustments trigger immediate visual updates via updateScreen()
    - _Requirements: 1.1, 1.2_

  - [x] 2.3 Add size control unit tests
    - Write tests for bounds enforcement (minimum and maximum scale limits)
    - Test increment/decrement behavior with various delta values
    - Verify scale clamping logic handles edge cases correctly
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 3. Implement image navigation system

  - [x] 3.1 Create image array navigation functions

    - Write navigateImage() function with direction parameter and wraparound logic
    - Implement array index tracking for each image position
    - Add uniqueness enforcement to prevent both images showing the same content
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Integrate navigation with keyboard input

    - Add left/right arrow key handlers in keyPressed() function
    - Connect arrow key presses to navigateImage() function for the active image
    - Ensure navigation triggers image loading and layer regeneration
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Handle image loading and layer updates for navigation

    - Modify updateImageColorPair() to work with specific array indices
    - Ensure new images generate appropriate monochrome layers
    - Preserve manual size adjustments when navigating to new images
    - _Requirements: 2.5, 4.5_

  - [x] 3.4 Add navigation system unit tests
    - Test array wraparound behavior at boundaries
    - Verify uniqueness enforcement between image pairs
    - Check index boundary handling and error recovery
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 4. Implement active image selection system

  - [x] 4.1 Create active image switching functionality

    - Add setActiveImage() function to update control state
    - Implement 'a' and 'b' key handlers in keyPressed() function
    - Ensure active image changes trigger visual feedback updates
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 4.2 Add visual feedback for active image indication

    - Create drawActiveImageIndicator() function to highlight the selected image
    - Integrate active image highlighting into updateScreen() rendering
    - Use contrasting colors or borders to clearly indicate the active image
    - _Requirements: 3.4, 5.3_

  - [x] 4.3 Add active image selection tests
    - Test active image switching between A and B
    - Verify visual feedback updates correctly
    - Check default active image initialization
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 5. Create status display and visual feedback system

  - [x] 5.1 Implement status overlay display

    - Create status display showing current image names and scale factors
    - Add updateStatusDisplay() function to refresh status information
    - Position status overlay to avoid interfering with the main composition
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 5.2 Integrate status updates with control actions

    - Connect status display updates to size adjustment and navigation actions
    - Ensure real-time updates as users interact with controls
    - Add temporary status visibility with auto-hide functionality
    - _Requirements: 5.5_

  - [x] 5.3 Add visual feedback system tests
    - Test status display updates with control actions
    - Verify active image highlighting behavior
    - Check status overlay positioning and visibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Update help system and documentation

  - [x] 6.1 Extend help overlay with new controls

    - Add documentation for new keyboard shortcuts (a/b, arrow keys) to the help overlay
    - Update toggleHelpOverlay() function to include control descriptions
    - Ensure help text clearly explains the active image selection concept
    - _Requirements: 5.4_

  - [x] 6.2 Update code comments and documentation
    - Add comprehensive comments explaining the new control system
    - Document the control state management and interaction patterns
    - Update existing function documentation to reflect new behaviors
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Ensure backward compatibility and integration

  - [x] 7.1 Preserve existing automatic cycling behavior

    - Ensure loadNewImagesAndColors() continues to work in automatic mode
    - Add logic to reset manual adjustments when automatic cycling occurs
    - Maintain existing mouse click and other keyboard shortcut functionality
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 7.2 Test integration with existing features

    - Verify blend mode cycling (m key) works with new controls
    - Test background color toggling (b key) integration with new 'b' key for image selection
    - Ensure save functionality (Ctrl+S) captures manually adjusted compositions
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.3 Add comprehensive integration tests
    - Test interaction between manual and automatic modes
    - Verify existing keyboard shortcuts still function correctly
    - Check that new controls don't interfere with existing functionality
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Performance optimization and final polish

  - [x] 8.1 Optimize rendering performance

    - Minimize unnecessary re-renders during size adjustments
    - Cache scaled images where possible to improve responsiveness
    - Ensure 60fps target is maintained during interactive controls
    - _Requirements: 5.5_

  - [x] 8.2 Add error handling and edge case management

    - Implement graceful handling of empty image arrays
    - Add error recovery for image loading failures
    - Handle corrupted control state with automatic reset functionality
    - _Requirements: 2.5, 4.5_

  - [x] 8.3 Conduct user experience testing
    - Test control responsiveness and input lag
    - Verify intuitive behavior and control discoverability
    - Check error recovery flows and user feedback
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
