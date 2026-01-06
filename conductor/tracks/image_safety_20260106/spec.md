# Track Specification: Revise Image Switching Workflow and Safety

## Overview
This track focuses on refactoring the `swap-duo-chrome-images.js` script to improve safety and usability. The goal is to prevent accidental data loss (specifically deleting original images) by using `commander.js` for argument parsing and implementing explicit directory targets instead of hardcoded swapping logic. We will also update documentation to reflect these changes.

## Goals
- **Refactor Script:** Update `swap-duo-chrome-images.js` to use `commander.js`.
- **Enhance Safety:** Remove the risky "swapping" logic in favor of explicit source-to-destination copy or link operations, or clearly defined swap targets with validation.
- **Prevent Data Loss:** Ensure "original" source directories are never deleted or overwritten by the script.
- **Documentation:** Update `AGENTS.md` and project docs to reflect the new safe workflow.

## Technical Details
- **Library:** `commander` (to be added to devDependencies if not present).
- **File:** `scripts/swap-duo-chrome-images.js`.
- **Logic:**
    - The script currently swaps folder names, which is fragile.
    - New logic should likely copy from a source (e.g., `images_main` or `images_alt`) to the target `public/images` folder, or use symbolic links if appropriate (though copying is safer for build artifacts).
    - Implementing a "dry-run" flag is highly recommended.
- **Safety Checks:**
    - Verify source directory exists.
    - Warn before overwriting/deleting the current `public/images` (or require a `--force` flag).

## Success Criteria
- [ ] `swap-duo-chrome-images.js` accepts named arguments (e.g., `--source`, `--target`).
- [ ] The script no longer destructively renames "original" source folders.
- [ ] CI/CD or local build tasks using this script are updated if necessary.
- [ ] Documentation clearly explains how to switch image sets safely.
