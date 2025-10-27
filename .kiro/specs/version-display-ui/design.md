# Design Document

## Overview

This design establishes a unified version display system that consolidates styling into a single shared library while providing modular customization capabilities. The solution addresses immediate visibility issues in duo-chrome and creates a scalable architecture for consistent version display across all GenArt applications.

## Architecture

### Current State Analysis

**Problems Identified:**
- Multiple CSS sources: `libs/version-display/version-display.css` and local duplicates (e.g., `apps/duo-chrome/css/style.css`)
- Poor visibility: Light gray (#666) text on whitish backgrounds fails accessibility standards
- Inconsistent styling across applications
- Unclear which CSS file takes precedence
- No systematic approach to customization

**Impact Assessment:**
- duo-chrome: Version text barely visible due to low contrast
- Maintenance overhead: Changes require updates in multiple files
- Accessibility violations: Contrast ratios below WCAG AA standards
- Developer confusion: Unclear which styles are active

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared CSS Library                      │
│              libs/version-display/                         │
├─────────────────────────────────────────────────────────────┤
│  version-display.css (Base Styles)                        │
│  ├── Core layout and typography                           │
│  ├── Accessibility-compliant colors                       │
│  ├── Responsive design breakpoints                        │
│  ├── Dark/light theme support                            │
│  └── High contrast mode support                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   duo-chrome    │ crude-collage   │   other-apps           │
│                 │   -painter      │                        │
│ Custom overrides│ Custom overrides│ Custom overrides       │
│ (if needed)     │ (if needed)     │ (if needed)            │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### CSS Architecture Strategy

**Three-Layer Approach:**

1. **Base Layer (Shared)**: Core functionality, accessibility, responsive design
2. **Theme Layer (Shared)**: Color schemes, dark/light mode support
3. **Customization Layer (App-specific)**: Optional overrides for unique requirements

## Components and Interfaces

### 1. Enhanced Shared CSS Library

**File:** `libs/version-display/version-display.css`

**Core Improvements:**
```css
/* Enhanced base styles with improved visibility */
.version-info,
.version-display {
  font-family: monospace;
  font-size: 0.8em;
  color: #333; /* Improved from #666 for better contrast */
  opacity: 1; /* Improved from 0.8 */
  text-align: center;
  /* Ensure minimum contrast ratio of 4.5:1 */
}

/* Context-specific styling */
.version-info {
  /* Help overlay and info box styling */
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #ddd; /* Improved from #eee */
}

.version-display {
  /* About dialog styling */
  display: inline-block;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.08); /* Improved from 0.05 */
  border-radius: 4px;
  font-size: 0.9em;
  border: 1px solid rgba(0, 0, 0, 0.1); /* Added for definition */
}
```

**Accessibility Features:**
- WCAG AA compliant contrast ratios (minimum 4.5:1)
- High contrast mode support
- Focus indicators for keyboard navigation
- Reduced motion support
- Screen reader friendly markup

### 2. Application Integration System

**Import Strategy:**
```html
<!-- In application HTML files -->
<link rel="stylesheet" href="../../libs/version-display/version-display.css">
```

**Build System Integration:**
```javascript
// In vite.config.js
export default defineConfig({
  // Ensure shared CSS is properly resolved
  resolve: {
    alias: {
      '@genart/version-display': path.resolve(__dirname, '../../libs/version-display')
    }
  }
});
```

### 3. Customization Interface

**Override Pattern:**
```css
/* App-specific customizations (optional) */
/* Load after shared CSS */
.version-display {
  /* App-specific color scheme */
  color: var(--app-text-color, #333);
  background-color: var(--app-version-bg, rgba(0, 0, 0, 0.08));
}

/* Context-specific overrides */
.help-overlay .version-info {
  /* Custom styling for help overlays in this app */
  border-top-color: var(--app-border-color, #ddd);
}
```

### 4. Validation and Linting System

**CSS Duplication Detection:**
```javascript
// Build-time validation
const validateVersionCSS = {
  checkForDuplicates: () => {
    // Scan all app CSS files for version-related selectors
    // Report duplicates and suggest shared library usage
  },
  validateContrast: () => {
    // Check color combinations meet accessibility standards
    // Report violations with specific fix suggestions
  }
};
```

## Data Models

### Version Display Configuration
```typescript
interface VersionDisplayConfig {
  // Base configuration
  baseStyles: {
    fontFamily: string;
    fontSize: string;
    textAlign: 'left' | 'center' | 'right';
  };
  
  // Color scheme
  colors: {
    text: string;
    background: string;
    border: string;
    contrastRatio: number; // Must be >= 4.5
  };
  
  // Responsive breakpoints
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  
  // Accessibility features
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    focusIndicators: boolean;
  };
}
```

### Application Override Schema
```typescript
interface AppVersionOverrides {
  appName: string;
  customStyles?: {
    colors?: Partial<VersionDisplayConfig['colors']>;
    spacing?: {
      margin?: string;
      padding?: string;
    };
    typography?: {
      fontSize?: string;
      fontWeight?: string;
    };
  };
  contexts?: {
    helpOverlay?: CSSProperties;
    aboutDialog?: CSSProperties;
    infoBox?: CSSProperties;
  };
}
```

## Error Handling

### CSS Conflict Resolution
1. **Detection**: Build-time scanning for duplicate selectors
2. **Reporting**: Clear warnings with file locations and suggested fixes
3. **Resolution**: Automated removal of duplicates with backup creation

### Accessibility Validation
1. **Contrast Checking**: Automated validation of color combinations
2. **Error Messages**: Specific guidance for fixing contrast issues
3. **Fallback Colors**: Safe defaults when custom colors fail validation

### Browser Compatibility
1. **Fallback Styles**: CSS custom properties with fallbacks
2. **Progressive Enhancement**: Core functionality works without advanced features
3. **Testing Matrix**: Validation across supported browsers

## Testing Strategy

### Visual Regression Testing
- Screenshot comparison across applications
- Multiple theme testing (light/dark)
- Responsive design validation
- Accessibility tool integration

### Contrast Ratio Testing
```javascript
// Automated accessibility testing
const contrastTests = {
  testVersionDisplay: () => {
    // Calculate actual contrast ratios
    // Validate against WCAG standards
    // Report specific failures with color values
  }
};
```

### Integration Testing
- CSS loading order validation
- Override precedence testing
- Build system integration verification
- Cross-application consistency checks

## Implementation Phases

### Phase 1: Shared Library Enhancement
1. **Improve Base Styles**
   - Update colors for better contrast
   - Add accessibility features
   - Implement responsive design improvements
   - Add comprehensive browser support

2. **Create Documentation**
   - Usage guidelines
   - Customization examples
   - Accessibility requirements
   - Integration instructions

### Phase 2: Application Migration
1. **duo-chrome Priority Fix**
   - Remove local version display CSS
   - Import shared library
   - Test visibility improvements
   - Validate accessibility compliance

2. **Other Applications**
   - Audit existing version display implementations
   - Remove duplicate CSS
   - Implement shared library imports
   - Test for regressions

### Phase 3: Validation System
1. **Build Integration**
   - Add CSS duplication detection
   - Implement contrast ratio validation
   - Create automated testing
   - Set up continuous monitoring

2. **Developer Tools**
   - Create linting rules
   - Add IDE integration
   - Provide debugging utilities
   - Document troubleshooting procedures

### Phase 4: Advanced Features
1. **Theme System Integration**
   - CSS custom properties support
   - Dynamic theme switching
   - User preference detection
   - System theme synchronization

2. **Performance Optimization**
   - CSS minification
   - Critical path optimization
   - Lazy loading for non-critical styles
   - Bundle size monitoring

## Migration Strategy

### Immediate Actions (duo-chrome)
1. Update shared CSS with improved contrast
2. Remove duplicate styles from `apps/duo-chrome/css/style.css`
3. Ensure proper import order in HTML
4. Test visibility improvements

### Gradual Rollout
1. **Week 1**: duo-chrome migration and testing
2. **Week 2**: crude-collage-painter migration
3. **Week 3**: Remaining applications
4. **Week 4**: Validation system implementation

### Rollback Plan
- Git branches for each migration step
- Automated backup of original CSS files
- Quick revert procedures documented
- Monitoring for visual regressions

## Performance Considerations

### CSS Loading Optimization
- Single shared CSS file reduces HTTP requests
- Proper caching headers for shared library
- Critical CSS inlining for above-the-fold content
- Non-blocking CSS loading for enhancements

### Bundle Size Impact
- Shared library reduces overall CSS duplication
- Modular loading prevents unused style inclusion
- Compression and minification in production
- Performance budget monitoring

### Runtime Performance
- CSS custom properties for dynamic theming
- Minimal JavaScript for theme switching
- Hardware acceleration for animations
- Efficient selector specificity