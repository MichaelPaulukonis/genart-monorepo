# Design Document

## Overview

The Version Display UI Components feature will provide a consistent way for users to view version information across all GenArt applications. Each app will display its own independent version number extracted from its individual package.json file through a build-time process that injects version information as environment variables.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Build Process │    │  Version Utility │    │   UI Component  │
│                 │    │                  │    │                 │
│ package.json ──→│───→│ getAppVersion()  │───→│ Display Version │
│ (per app)       │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Interaction Flow

1. **Build Time**: Vite build process reads each app's package.json and generates a version constants file or inlines version into the bundle
2. **Runtime**: Version utility function imports the build-generated version constant
3. **UI Rendering**: Components call the utility to display version information
4. **User Interaction**: Users access version through help overlays, about dialogs, or keyboard shortcuts

## Components and Interfaces

### 1. Version Utility Module

**File**: `src/utils/version.js` (per app)

```javascript
// Import the build-generated version constant
import { APP_VERSION } from './version-constants.js';

/**
 * Gets the current application version
 * @returns {string} The application version or fallback
 */
export function getAppVersion() {
  return APP_VERSION || '1.0.0';
}

/**
 * Formats version for display
 * @param {string} version - Raw version string
 * @returns {string} Formatted version string
 */
export function formatVersion(version) {
  return `v${version}`;
}
```

**File**: `src/utils/version-constants.js` (generated at build time)

```javascript
// This file is auto-generated during build - do not edit manually
export const APP_VERSION = '0.1.0';
export const BUILD_TIME = '2024-01-15T10:30:00Z';
```

### 2. Build Configuration Integration

**File**: `vite.config.js` (per app)

```javascript
import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Plugin to generate version constants file
function generateVersionConstants() {
  return {
    name: 'generate-version-constants',
    buildStart() {
      try {
        const packagePath = resolve(__dirname, 'package.json');
        const packageContent = readFileSync(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        const versionConstantsContent = `// This file is auto-generated during build - do not edit manually
export const APP_VERSION = '${packageJson.version || '1.0.0'}';
export const BUILD_TIME = '${new Date().toISOString()}';
`;
        
        const constantsPath = resolve(__dirname, 'src/utils/version-constants.js');
        writeFileSync(constantsPath, versionConstantsContent);
        
        console.log(`Generated version constants: ${packageJson.version}`);
      } catch (error) {
        console.warn('Could not generate version constants:', error.message);
        // Create fallback file
        const fallbackContent = `// Fallback version constants
export const APP_VERSION = '1.0.0';
export const BUILD_TIME = '${new Date().toISOString()}';
`;
        writeFileSync(resolve(__dirname, 'src/utils/version-constants.js'), fallbackContent);
      }
    }
  };
}

export default defineConfig({
  // ... existing config
  plugins: [
    generateVersionConstants(),
    // ... other plugins
  ]
});
```

### 3. UI Component Implementations

#### A. Help Overlay Integration (duo-chrome)

**File**: `src/duo-chrome.js` (modification)

```javascript
import { getAppVersion, formatVersion } from './utils/version.js';

function showHelp() {
  // ... existing help content
  const helpContent = `
    <div class="help-overlay">
      <div class="help-content">
        <h2>Duo-Chrome Controls</h2>
        <!-- existing controls -->
        <div class="version-info">
          ${formatVersion(getAppVersion())}
        </div>
      </div>
    </div>
  `;
  // ... rest of help display logic
}
```

#### B. About Dialog Component (those-shape-things, computational-collage)

**File**: `src/components/AboutDialog.js` (new)

```javascript
import { getAppVersion, formatVersion } from '../utils/version.js';

export class AboutDialog {
  constructor(p5Instance, appName) {
    this.p5 = p5Instance;
    this.appName = appName;
    this.isVisible = false;
    this.dialogElement = null;
  }

  show() {
    if (this.isVisible) return;
    
    this.dialogElement = this.p5.createDiv();
    this.dialogElement.class('about-dialog');
    this.dialogElement.html(`
      <div class="about-content">
        <h3>About ${this.appName}</h3>
        <p>Interactive generative art application</p>
        <div class="version-display">${formatVersion(getAppVersion())}</div>
        <button class="close-btn">×</button>
      </div>
    `);
    
    // Position dialog
    this.dialogElement.position(
      this.p5.windowWidth / 2 - 150,
      this.p5.windowHeight / 2 - 100
    );
    
    // Add close functionality
    this.dialogElement.child()[0].querySelector('.close-btn')
      .addEventListener('click', () => this.hide());
    
    this.isVisible = true;
  }

  hide() {
    if (this.dialogElement) {
      this.dialogElement.remove();
      this.dialogElement = null;
    }
    this.isVisible = false;
  }

  toggle() {
    this.isVisible ? this.hide() : this.show();
  }
}
```

#### C. Help Screen Integration (crude-collage-painter)

**File**: `src/infobox.js` (modification)

```javascript
import { getAppVersion, formatVersion } from './utils/version.js';

// Modify existing help screen content to include version
function createHelpContent() {
  return `
    <div class="help-content">
      <h2>Crude Collage Painter</h2>
      <!-- existing help content -->
      <div class="controls-section">
        <!-- existing controls info -->
      </div>
      <div class="version-info">
        ${formatVersion(getAppVersion())}
      </div>
    </div>
  `;
}
```

### 4. Keyboard Shortcut Integration

**File**: `src/utils/keyboardShortcuts.js` (per app, as needed)

```javascript
export class KeyboardShortcuts {
  constructor(aboutDialog) {
    this.aboutDialog = aboutDialog;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + I for "Info"
      if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
        event.preventDefault();
        this.aboutDialog.toggle();
      }
    });
  }
}
```

## Data Models

### Version Information Structure

```javascript
// Build-generated constants file structure
const versionConstants = {
  APP_VERSION: "0.1.0",                    // From package.json
  BUILD_TIME: "2024-01-15T10:30:00Z"      // Build timestamp
};

// Runtime version object
const appVersion = {
  raw: "0.1.0",
  formatted: "v0.1.0",
  display: "Version 0.1.0"
};
```

## Error Handling

### Version Extraction Failures

```javascript
export function getAppVersion() {
  try {
    // Import will fail if version-constants.js doesn't exist
    const version = APP_VERSION;
    if (!version || typeof version !== 'string') {
      console.warn('App version not found in constants, using fallback');
      return '1.0.0';
    }
    return version;
  } catch (error) {
    console.error('Error accessing app version:', error);
    return '1.0.0';
  }
}
```

### UI Component Error Handling

```javascript
export class AboutDialog {
  show() {
    try {
      // ... dialog creation logic
    } catch (error) {
      console.error('Failed to show about dialog:', error);
      // Fallback: show simple alert
      alert(`${this.appName} ${formatVersion(getAppVersion())}`);
    }
  }
}
```

### Build Process Error Handling

The build process error handling is integrated into the Vite plugin shown above. If package.json cannot be read or parsed, the plugin will:

1. Log a warning about the failure
2. Generate a fallback version-constants.js file with version '1.0.0'
3. Continue the build process without failing

This ensures that builds never fail due to version extraction issues, and the application always has a valid version to display.

## Testing Strategy

### Unit Testing

```javascript
// tests/version.test.js
import { describe, it, expect, vi } from 'vitest';
import { formatVersion } from '../src/utils/version.js';

// Mock the version constants
vi.mock('../src/utils/version-constants.js', () => ({
  APP_VERSION: '2.1.0'
}));

describe('Version Utilities', () => {
  it('should return version from constants', async () => {
    const { getAppVersion } = await import('../src/utils/version.js');
    expect(getAppVersion()).toBe('2.1.0');
  });

  it('should format version correctly', () => {
    expect(formatVersion('1.2.3')).toBe('v1.2.3');
  });
});

// Test with missing constants file
describe('Version Utilities - Missing Constants', () => {
  it('should return fallback when constants unavailable', async () => {
    vi.doMock('../src/utils/version-constants.js', () => {
      throw new Error('Module not found');
    });
    
    const { getAppVersion } = await import('../src/utils/version.js');
    expect(getAppVersion()).toBe('1.0.0');
  });
});
```

### Integration Testing

```javascript
// tests/integration/version-display.test.js
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { AboutDialog } from '../src/components/AboutDialog.js';

describe('Version Display Integration', () => {
  it('should display version in about dialog', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;

    const mockP5 = {
      createDiv: () => ({ 
        class: () => {}, 
        html: () => {}, 
        position: () => {},
        child: () => [{ querySelector: () => ({ addEventListener: () => {} }) }]
      }),
      windowWidth: 800,
      windowHeight: 600
    };

    const dialog = new AboutDialog(mockP5, 'Test App');
    dialog.show();
    
    expect(dialog.isVisible).toBe(true);
  });
});
```

### End-to-End Testing

```javascript
// tests/e2e/version-display.spec.js
import { test, expect } from '@playwright/test';

test.describe('Version Display', () => {
  test('should show version in duo-chrome help overlay', async ({ page }) => {
    await page.goto('/duo-chrome');
    await page.keyboard.press('h');
    
    const versionElement = page.locator('.version-info');
    await expect(versionElement).toBeVisible();
    await expect(versionElement).toContainText(/v\d+\.\d+\.\d+/);
  });

  test('should show version in about dialog', async ({ page }) => {
    await page.goto('/those-shape-things');
    await page.keyboard.press('Control+i');
    
    const aboutDialog = page.locator('.about-dialog');
    await expect(aboutDialog).toBeVisible();
    
    const versionDisplay = aboutDialog.locator('.version-display');
    await expect(versionDisplay).toContainText(/v\d+\.\d+\.\d+/);
  });
});
```

## Implementation Notes

### Generated File Management

The `src/utils/version-constants.js` file is generated at build time and should be:
- Added to `.gitignore` to prevent committing generated content
- Generated fresh on each build to ensure version accuracy
- Created with fallback values if package.json is unavailable

### Per-App Customization

Each app will implement version display according to its existing UI patterns:

- **duo-chrome**: Integration with existing help overlay
- **crude-collage-painter**: Integration with existing help screen
- **those-shape-things**: New about dialog with Ctrl+I shortcut
- **computational-collage**: About dialog integrated with existing UI controls
- **crude-collage-painter**: Footer display with minimal visual impact

### Styling Consistency

Shared CSS classes will ensure visual consistency while allowing per-app customization:

```css
/* Shared version display styles */
.version-info, .version-display {
  font-family: monospace;
  font-size: 0.8em;
  color: #666;
  opacity: 0.8;
}

.about-dialog {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* App-specific version integration styles */
.help-content .version-info {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  text-align: center;
}
```

### Accessibility Considerations

- Version information will be accessible to screen readers
- Keyboard shortcuts will be documented and consistent
- Color contrast will meet WCAG guidelines
- Focus management for modal dialogs will be implemented properly