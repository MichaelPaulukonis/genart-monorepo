# Version Display Troubleshooting

Common issues and solutions for version display problems.

## Issue: Version text is too light/hard to read

**Symptoms:** Version text appears gray or washed out

**Causes:**
- System dark mode applying light text on light background
- Old duplicate CSS overriding shared library

**Solutions:**
1. Remove any duplicate `.version-info` CSS from your app
2. Ensure shared library imports after local CSS:
   ```javascript
   import '../css/style.css'
   import '../../../libs/version-display/version-display.css' // After local CSS
   ```
3. For custom colors, use CSS custom properties:
   ```css
   .version-info {
     --version-text-color: #333; /* Dark text */
   }
   ```

## Issue: Styles not applying

**Symptoms:** Version display looks unstyled or uses browser defaults

**Causes:**
- Missing shared library import
- CSS loading order issues
- Typo in CSS class names

**Solutions:**
1. Verify import exists in your main JS file:
   ```javascript
   import '../../../libs/version-display/version-display.css'
   ```
2. Check HTML uses correct classes:
   ```html
   <div class="version-info">v1.0.0</div>  <!-- Correct -->
   <div class="version-display">v1.0.0</div>  <!-- For about dialogs -->
   ```
3. Build and check for CSS errors: `nx build your-app`

## Issue: Custom colors not working

**Symptoms:** CSS custom properties seem ignored

**Causes:**
- CSS specificity issues
- Loading order problems
- Syntax errors

**Solutions:**
1. Ensure your CSS loads before the shared library
2. Use proper CSS custom property syntax:
   ```css
   /* Correct */
   :root {
     --version-text-color: #2c3e50;
   }
   
   /* Also correct - scoped */
   .help-overlay {
     --version-text-color: #2c3e50;
   }
   ```
3. Check browser dev tools to see which styles are active

## Issue: Build errors

**Symptoms:** CSS-related build failures

**Causes:**
- CSS syntax errors
- Missing imports
- File path issues

**Solutions:**
1. Run diagnostics: Check CSS files for syntax errors
2. Verify file paths are correct (count the `../` properly)
3. Check for typos in CSS custom property names

## Issue: Inconsistent appearance across apps

**Symptoms:** Version displays look different between applications

**Causes:**
- Some apps not using shared library
- Different CSS loading orders
- Conflicting local styles

**Solutions:**
1. Audit all apps have the import:
   ```bash
   grep -r "libs/version-display" apps/*/src/
   ```
2. Remove duplicate CSS from local files
3. Use consistent HTML structure across apps

## Quick Debugging Steps

1. **Check the import:** Look for `libs/version-display` import in your JS
2. **Inspect in browser:** Use dev tools to see which CSS rules are active
3. **Build test:** Run `nx build your-app` to catch CSS errors
4. **Compare working app:** Look at duo-chrome as a reference implementation

## Getting Help

- Check the main README: `libs/version-display/README.md`
- Look at working examples in other GenArt apps
- Use browser dev tools to inspect CSS cascade