# Capturing Screenshots for Apps

This guide explains how to capture consistent, high-quality screenshots for the GenArt apps.

## Quick Reference

1. Run the app locally: `nx dev [app-name]`
2. Generate an interesting composition
3. Capture screenshot (1200x800 recommended)
4. Save to `apps/[app-name]/docs/screenshots/[app-name]-main.png`
5. Copy to original repo when updating archived README

## Screenshot Storage

Screenshots are stored **per-app** in `apps/[app-name]/docs/screenshots/` to keep documentation assets with their respective apps. This makes apps more portable and self-contained.

## Screenshot Guidelines

### Technical Specs

- **Format:** PNG
- **Recommended Size:** 1200x800 pixels (3:2 aspect ratio)
- **Alternative Sizes:** 1600x900, 1920x1080 (maintain 16:9 or 3:2 ratio)
- **Quality:** Maximum quality, no compression artifacts

### Composition Tips

- Capture a representative example of the app's output
- Include UI elements if they're important to understanding the app
- For apps with random generation, take multiple shots and pick the best
- Ensure good contrast and visual interest
- Avoid capturing during transitions or loading states

## App-Specific Notes

### duo-chrome

- Generate several compositions to find one with good color contrast
- The blend mode should be clearly visible
- Both images should be recognizable in the composition

### crude-collage-painter

- Show the painting interface with some work in progress
- Include the cursor/brush if it adds context
- Demonstrate the collage effect clearly

### those-shape-things

- Capture a full 8x8 grid composition
- Choose a palette with good visual contrast
- Ensure the geometric patterns are clear

### computational-collage

- Pick an interesting composition mode (not the gallery view)
- Show the parameter panel if it helps explain the interface
- Demonstrate the collage effect with multiple images

### dragline

- Show several text blocks arranged in an interesting way
- Include enough blocks to demonstrate the spatial arrangement
- Ensure text is readable at the screenshot resolution

## Capture Methods

### macOS

- **Cmd + Shift + 4:** Select area to capture
- **Cmd + Shift + 4, then Space:** Capture entire window
- Use Preview or browser dev tools to resize if needed

### Browser Dev Tools

1. Open DevTools (F12 or Cmd+Option+I)
2. Toggle device toolbar (Cmd+Shift+M)
3. Set custom dimensions (1200x800)
4. Capture screenshot via DevTools menu

### ImageMagick Resizing

If you need to resize existing screenshots to fit the 1200px max dimension:

```bash
# Resize so max dimension is 1200px (maintains aspect ratio, only shrinks)
magick input.png -resize 1200x1200\> output.png

# Resize to fit within 1200x800 specifically
magick input.png -resize 1200x800\> output.png

# Batch resize all PNGs in current directory
magick mogrify -resize 1200x1200\> *.png
```

The `\>` flag ensures images are only shrunk, never enlarged.

### Automated Capture (Future)

Consider adding a screenshot utility to the monorepo that:

- Launches each app
- Generates compositions
- Captures at consistent dimensions
- Saves to the screenshots directory

## File Naming Convention

Primary screenshots: `[app-name]-main.png`

Additional screenshots (if needed):

- `[app-name]-interface.png` - UI/controls focus
- `[app-name]-example-01.png` - Alternative compositions
- `[app-name]-detail.png` - Close-up or detail view

## Usage

Screenshots are used in:

1. **Monorepo app READMEs** - Relative path: `./docs/screenshots/[app-name]-main.png`
2. **Original repo READMEs** - Copy file as `screenshot.png` to repo root
3. **Main monorepo README** - For project showcase section (if added)
4. **Documentation** - In guides and architecture docs as needed

## Updating Screenshots

When updating a screenshot:

1. Replace the file in `apps/[app-name]/docs/screenshots/`
2. Git commit the change
3. Copy to original repos if they reference it
4. Push to original repo's main branch

## Checklist

Before committing a screenshot:

- [ ] File is PNG format
- [ ] Dimensions are appropriate (1200x800 or similar)
- [ ] File size is reasonable (< 500KB ideally)
- [ ] Image is clear and representative
- [ ] Named according to convention
- [ ] Saved in `apps/[app-name]/docs/screenshots/`
- [ ] Referenced in app README
