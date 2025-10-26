# Requirements Document

## Introduction

This specification defines interactive control features for the duo-chrome application, enabling users to dynamically adjust image sizes and navigate through the image collection for both images (A and B) displayed in the composition. The current duo-chrome application displays two images with RISO color overlays and blend modes, but lacks direct user control over individual image properties.

## Glossary

- **Duo_Chrome_System**: The existing duo-chrome web application that creates duotone compositions
- **Image_A**: The first image in the current image pair being displayed
- **Image_B**: The second image in the current image pair being displayed
- **Image_Array**: The collection of available images loaded from the imgs array
- **Size_Control**: The mechanism for adjusting the scale/size of individual images
- **Navigation_Control**: The mechanism for cycling through available images in the array
- **Active_Image**: The currently selected image (A or B) that will respond to control inputs
- **Scale_Factor**: The multiplier applied to an image's display size (currently stored in pair.scale)
- **Image_Index**: The position of an image within the imgs array for navigation purposes

## Requirements

### Requirement 1

**User Story:** As a user, I want to control the size of individual images so that I can create more varied and interesting compositions.

#### Acceptance Criteria

1. WHEN the user presses the up arrow key, THE Duo_Chrome_System SHALL increase the Scale_Factor of the Active_Image by 0.1
2. WHEN the user presses the down arrow key, THE Duo_Chrome_System SHALL decrease the Scale_Factor of the Active_Image by 0.1
3. THE Duo_Chrome_System SHALL enforce a minimum Scale_Factor of 0.05 for any image
4. THE Duo_Chrome_System SHALL enforce a maximum Scale_Factor of 5.0 for any image
5. WHEN the Scale_Factor reaches the minimum or maximum limit, THE Duo_Chrome_System SHALL prevent further adjustment in that direction

### Requirement 2

**User Story:** As a user, I want to navigate through different images for each position so that I can find the perfect combination for my composition.

#### Acceptance Criteria

1. WHEN the user presses the left arrow key, THE Duo_Chrome_System SHALL display the previous image in the Image_Array for the Active_Image
2. WHEN the user presses the right arrow key, THE Duo_Chrome_System SHALL display the next image in the Image_Array for the Active_Image
3. WHEN navigation reaches the beginning of the Image_Array, THE Duo_Chrome_System SHALL wrap to the last image in the array
4. WHEN navigation reaches the end of the Image_Array, THE Duo_Chrome_System SHALL wrap to the first image in the array
5. THE Duo_Chrome_System SHALL ensure the newly selected image is different from the other image in the pair

### Requirement 3

**User Story:** As a user, I want to select which image (A or B) I'm controlling so that I can adjust each image independently.

#### Acceptance Criteria

1. WHEN the user presses the 'a' key, THE Duo_Chrome_System SHALL set Image_A as the Active_Image
2. WHEN the user presses the 'b' key, THE Duo_Chrome_System SHALL set Image_B as the Active_Image
3. THE Duo_Chrome_System SHALL provide visual feedback indicating which image is currently active
4. WHEN an image becomes the Active_Image, THE Duo_Chrome_System SHALL apply a visual indicator such as a border or highlight
5. THE Duo_Chrome_System SHALL initialize with Image_A as the default Active_Image

### Requirement 4

**User Story:** As a user, I want the system to maintain existing functionality while adding new controls so that my current workflow is not disrupted.

#### Acceptance Criteria

1. THE Duo_Chrome_System SHALL preserve all existing keyboard shortcuts and mouse interactions
2. THE Duo_Chrome_System SHALL continue automatic image cycling when not paused
3. THE Duo_Chrome_System SHALL maintain the existing blend mode and background color functionality
4. THE Duo_Chrome_System SHALL preserve the existing save and auto-save functionality
5. WHEN new images are loaded automatically, THE Duo_Chrome_System SHALL reset any manual size adjustments to default scale values

### Requirement 5

**User Story:** As a user, I want visual feedback about the current state of my controls so that I understand which image I'm affecting and its current properties.

#### Acceptance Criteria

1. THE Duo_Chrome_System SHALL display the current Scale_Factor value for each image
2. THE Duo_Chrome_System SHALL show the filename or identifier of the current image for each position
3. THE Duo_Chrome_System SHALL highlight the Active_Image with a visual indicator
4. WHEN the help overlay is displayed, THE Duo_Chrome_System SHALL include documentation for the new control features
5. THE Duo_Chrome_System SHALL update all visual indicators in real-time as controls are used