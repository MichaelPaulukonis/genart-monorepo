# Computational Collage - Development Notes

## Overview

This is an experimental collage creation tool that explores different algorithmic approaches to image composition. The project started as an exploration of computational creativity and has evolved into a multi-modal art generation system.

## Architecture

### Core Components

- **Images System**: Handles image loading, cropping, and manipulation
- **Mode System**: 10 different composition algorithms
- **UI System**: Tweakpane controls and gallery interface
- **Export System**: High-resolution output and batch processing

### Image Processing Pipeline

1. **Upload**: Drag & drop or file selection
2. **Processing**: Automatic cropping and analysis
3. **Storage**: In-memory image collection management
4. **Composition**: Algorithm-based placement and manipulation
5. **Export**: High-resolution rendering and download

## Assets

The project includes sample assets in `public/uploads/`:
- **Images**: trees0.jpg through trees5.jpg (sample tree images)
- **Audio**: sound0.mp3 through sound3.mp3, glassy0.mp3 (UI feedback sounds)
- **Other**: mona.dots.small.00.png (additional sample image)

## Development TODOs

### High Priority
- [ ] Implement proper blend modes
- [ ] Add undo/redo functionality
- [ ] Improve memory management for large images
- [ ] Add batch export capabilities

### Medium Priority
- [ ] Pattern system integration (p5.pattern.js)
- [ ] Advanced cropping strategies
- [ ] Color palette extraction from images
- [ ] Animation/time-based compositions

## Known Issues

1. **Memory Usage**: Large images can cause browser slowdown
2. **Mobile Support**: Touch interactions need improvement
3. **Export Quality**: Some modes don't scale well to high resolution
4. **Sound Loading**: Audio files may fail to load on some servers