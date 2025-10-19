# Version Display Library

Shared CSS styles for consistent version information display across all GenArt applications.

## Usage

Import the CSS file in your application's main JavaScript file:

```javascript
import '../../../libs/version-display/version-display.css'
```

## CSS Classes

### `.version-info`
Used for version display in help overlays and info boxes. Includes:
- Top border separator
- Centered text alignment
- Monospace font
- Consistent spacing and colors

### `.version-display`
Used for version display in about dialogs. Includes:
- Inline-block display
- Background styling
- Rounded corners
- Padding for better visual separation

### `.about-dialog-version`
Container for version display in about dialogs. Provides:
- Top border separator
- Proper spacing
- Centered alignment

## App-Specific Customizations

Each app can override the base styles to match its visual theme:

- **duo-chrome**: Uses Times New Roman font with small-caps
- **crude-collage-painter**: Uses chocolate brown colors to match bisque theme
- **those-shape-things**: Uses Times New Roman with small-caps styling
- **computational-collage**: Uses Arial font for modern appearance
- **dragline**: Uses teal accent colors to match app theme

## Accessibility Features

- High contrast mode support
- Dark mode support
- Reduced motion support
- WCAG AA color contrast compliance
- Focus styles for keyboard navigation
- Print styles (hides version info in print)

## Responsive Design

- Smaller font sizes on mobile devices
- Adjusted spacing for smaller screens
- Maintains readability across all screen sizes

## Browser Support

Compatible with all modern browsers that support:
- CSS Grid
- CSS Custom Properties
- Media queries
- CSS transforms