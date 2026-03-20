# Documentation Generation Command

Create comprehensive documentation files for: $ARGUMENTS

## Process

1. **Determine scope** from the feature name or existing code:
   - **App-specific** (feature lives in one app under `apps/<app>/`):
     - Developer doc: `apps/<app>/docs/dev-{feature-name}.md`
     - User doc: `apps/<app>/docs/user-{feature-name}.md`
     - Screenshots (if any): `apps/<app>/docs/screenshots/`
   - **Monorepo-wide / shared / infrastructure**:
     - Developer doc: `docs/dev/{feature-name}.md`
     - User doc: `docs/user/{feature-name}.md`

2. **Check for existing documentation** at the target path — append or cross-reference rather than duplicate.

3. **Analyze the relevant code files** to gather: state/config shape, public API, key functions, UI controls, keyboard shortcuts.

4. **Generate the developer doc** covering: technical specs, data structures, API details, implementation notes, rendering/data pipeline.

5. **Generate the user doc** (skip if $ARGUMENTS is not user-facing) covering: step-by-step usage, all controls, keyboard shortcuts, tips.
   - Include screenshot placeholders where UI is involved:
     `<!-- screenshot-placeholder: filename.png — description of what to capture -->`

6. **Cross-reference** both files to each other in a "Related Documentation" section.

## Standards

- Follow the format of existing docs (see `docs/dev/nx.md` and `docs/user/nx.md` as reference)
- Markdown only — no extra files
- Filename style: `{dev|user}-{feature-name}.md` (app docs) or `{feature-name}.md` (root docs)
