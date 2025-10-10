# DUO-CHROME: Repository Analysis & Documentation Snapshot

## 1. Project Overview

- **Project Name and Purpose**: **DUO-CHROME** - A creative coding web application that displays two different monochrome images overlaid in two different colors, creating dynamic visual compositions inspired by duotone printing techniques.

- **Technology Stack**: 
  - **Frontend**: Vanilla JavaScript (ES6+), p5.js (via p5js-wrapper)
  - **Build System**: Vite 2.7.2
  - **Development Tools**: ESLint with p5.js plugin, StandardJS
  - **Styling**: CSS3

- **Project Type**: Interactive web-based creative coding application/generative art tool

- **Target Audience**: 
  - Digital artists and creative coders
  - Graphic designers exploring duotone effects
  - Generative art enthusiasts
  - Anyone interested in experimental visual art

- **Current Status**: **Early Development** (v0.1.0) - Functional prototype with core features implemented, extensive TODO list suggests active development

## 2. Architecture Summary

- **Overall Architecture**: Single-page web application with modular JavaScript structure, built around p5.js for canvas-based rendering

- **Key Components**:
  - **Main Application** (`duo-chrome.js`): Core rendering logic and user interaction
  - **Image Management** (`imagelist.js`): Curated collection of 160+ images
  - **Color Palettes** (`risocolors.js`): RISO printing colors and custom palettes
  - **Asset Management**: Large collection of vintage/pop-art inspired images

- **Data Flow**: 
  1. Application randomly selects two images and two colors
  2. Images are processed into monochrome layers
  3. Colors are applied via blend modes
  4. Composite result is rendered to canvas
  5. User interactions trigger new combinations

- **External Dependencies**: Minimal - only p5js-wrapper for canvas rendering

- **Design Patterns**: 
  - Module pattern for code organization
  - Observer pattern for user input handling
  - Factory pattern for image layer creation

## 3. Repository Structure Analysis

- **Directory Organization**: Clean, logical structure
  ```
  duo-chrome/
  ├── src/                    # Core application code
  ├── public/images/          # Image assets (~160 files)
  ├── css/                    # Styling
  ├── package.json           # Dependencies and scripts
  ├── vite.config.js         # Build configuration
  └── index.html             # Entry point
  ```

- **Key Files and Directories**:
  - `src/duo-chrome.js` (233 lines) - Main application logic
  - `src/imagelist.js` (161 lines) - Asset inventory
  - `src/risocolors.js` (104 lines) - Color palette definitions
  - `public/images/` - Curated image collection

- **Configuration Files**:
  - `vite.config.js` - Build system with multi-entry support
  - `.eslintrc.json` - Code quality enforcement
  - `package.json` - Standard npm configuration

- **Entry Points**: `index.html` → `src/duo-chrome.js`

- **Build and Deploy**: Vite-based with dev/build/preview scripts, production ready

## 4. Feature Analysis

- **Core Features**:
  - **Dual Image Composition**: Overlays two randomly selected images
  - **Color Application**: Applies monochrome color treatments using RISO printing palette
  - **Blend Mode Cycling**: Multiple blend modes (ADD, MULTIPLY, EXCLUSION, etc.)
  - **Background Toggle**: Black/white background with appropriate blend modes
  - **Auto-generation**: Automatic image cycling every 30 frames
  - **Manual Controls**: Click/keyboard shortcuts for manual control
  - **Image Export**: Save compositions as PNG files

- **User Workflows**:
  1. **Passive Viewing**: Watch automatic generation
  2. **Manual Exploration**: Click to generate new combinations
  3. **Fine-tuning**: Use keyboard shortcuts to adjust colors/blend modes
  4. **Saving**: Export favorite compositions

- **Control Scheme**:
  - Mouse click: New image combination
  - `b`: Toggle background color
  - `c`: Cycle color palettes
  - `m`: Cycle blend modes
  - `p`/Space: Pause auto-generation
  - `S`: Toggle auto-save
  - `Cmd+S`: Manual save

- **No API/Database**: Self-contained application

## 5. Development Setup

- **Prerequisites**: Node.js, npm

- **Installation Process**:
  1. `npm install`
  2. `npm run dev`
  3. Open browser to localhost

- **Development Workflow**: 
  - Vite hot reload for development
  - ESLint + StandardJS for code quality
  - No testing framework currently

- **Code Quality**: ESLint configured with StandardJS and p5.js-specific rules

## 6. Documentation Assessment

- **README Quality**: ⚠️ **Adequate but incomplete**
  - Describes basic purpose
  - Extensive TODO list shows development direction
  - Missing installation/usage instructions
  - No technical documentation

- **Code Documentation**: ⚠️ **Minimal**
  - Some inline comments explaining complex logic
  - Function names are descriptive
  - Missing JSDoc or comprehensive commenting

- **Missing Documentation**:
  - API documentation (not applicable)
  - Architecture documentation
  - User documentation/controls guide

## 7. Missing Documentation Suggestions

**Immediate Documentation Needs**:
- **Installation Guide**: Add to README
- **Controls Documentation**: `/docs/controls.md`
- **Image Curation Guide**: `/docs/images/curation-guidelines.md`
- **Color Palette Guide**: `/docs/colors/palette-system.md`

**Suggested Structure**:
```
docs/
├── requirements/
│   └── PRD.md                    # Product Requirements
├── architecture/
│   ├── overview.md              # System architecture
│   └── image-processing.md      # Core algorithms
├── api/
│   └── functions.md             # Function documentation
├── user-guide/
│   ├── controls.md              # Keyboard shortcuts
│   └── workflows.md             # Usage patterns
└── deployment/
    └── build-process.md         # Deployment guide
```

## 8. Technical Debt and Improvements

- **Code Quality Issues**:
  - Magic numbers throughout (30 frames, 0.8-1.2 scale)
  - Hardcoded canvas size (1000x1000)
  - Global state management could be improved

- **Performance Concerns**:
  - Image loading happens on-demand (could preload)
  - No image caching strategy
  - Large image collection (~160 files) loaded individually

- **Security Considerations**: ✅ **Minimal concerns** (client-side only)

- **Scalability Issues**:
  - Image list is hardcoded (should be dynamic)
  - No lazy loading for images
  - Memory management for graphics layers

- **Dependency Management**: ✅ **Good** - minimal, up-to-date dependencies

## 9. Project Health Metrics

- **Code Complexity**: 🟡 **Medium** - Single main file with 233 lines
- **Test Coverage**: 🔴 **None** - No testing framework
- **Documentation Coverage**: 🟡 **Partial** - Basic README, minimal code docs
- **Maintainability Score**: 🟡 **Good** - Clean structure, readable code
- **Technical Debt Level**: 🟡 **Low-Medium** - Some refactoring opportunities

## 10. Recommendations and Next Steps

### Critical Issues
1. **Add Installation Instructions** to README
2. **Implement Error Handling** for image loading failures
3. **Add Controls Documentation** for user onboarding

### Documentation Improvements (High Priority)
1. **Enhanced README** with quick start guide
2. **Controls Reference** (`docs/user-guide/controls.md`)
3. **Development Guide** for contributors
4. **Image Curation Guidelines**

### Code Quality Improvements
1. **Extract Constants** for magic numbers
2. **Add JSDoc Comments** to key functions
3. **Implement Image Preloading** for better performance
4. **Add Unit Tests** for core functions

### Feature Gaps
1. **Image Upload Feature** for custom images
2. **Palette Customization** interface
3. **Composition History** to revisit favorites
4. **Responsive Design** for mobile devices

### Infrastructure
1. **GitHub Actions** for automated builds
2. **Deployment Pipeline** to GitHub Pages
3. **Image Optimization** pipeline
4. **Lighthouse CI** for performance monitoring

## Quick Start Guide

1. **Clone and Install**: `git clone [repo] && cd duo-chrome && npm install`
2. **Start Development**: `npm run dev` (automatically opens browser on available port)

## Key Contact Points

- **Repository**: GitHub (duo-chrome)
- **Issues**: Use GitHub Issues for bug reports
- **Contributions**: Follow StandardJS style guide

## Related Resources

- **p5.js Documentation**: https://p5js.org/reference/
- **RISO Printing**: https://en.wikipedia.org/wiki/Risograph
- **Inspiration**: https://leedoughty.com/

## Project Roadmap

Based on TODO comments in README:
- **Short-term**: UI improvements, color switching, save functionality
- **Medium-term**: Image filtering, mask features, palette expansion
- **Long-term**: Image picker interface, configuration persistence

## Documentation Templates

### Suggested README Structure
```markdown
# DUO-CHROME

> Generative duotone art using vintage imagery and RISO colors

## Installation
[3-step installation guide]

## Controls
[Keyboard shortcuts reference]

## Development
[Contributor guide]

## Architecture
[Link to /docs/architecture/]
```

---

*Analysis generated on October 9, 2025*

This analysis reveals a well-structured creative coding project with solid foundations but requiring documentation improvements and some technical debt cleanup. The project shows clear artistic vision and technical competence, making it an excellent candidate for further development and community engagement.