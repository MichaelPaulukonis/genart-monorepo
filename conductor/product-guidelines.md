# GenArt Monorepo Product Guidelines

## Documentation & Prose Style
- **Concise & Technical:** Documentation should be brief and implementation-focused, prioritizing "how-to" and technical clarity.
- **Proximity:** Maintain localized documentation within each app's `docs/` folder for immediate context.

## User Interface & Aesthetic
- **Functional Simplicity:** UI elements should be minimalist and unobtrusive, "disappearing" when not active to keep the generative art as the primary focus.
- **Interactive Controls:** Use standardized libraries (like Tweakpane) to build project-specific custom UIs that balance predictable behavior with the unique needs of each algorithm.

## Code Conventions
- **Standardized Structure:** Every application follows a uniform folder layout (`src/`, `public/`, `docs/`) for predictability across the monorepo.
- **Library-First Development:** Reusable logic and patterns should be extracted into shared `@genart/*` libraries in `libs/` rather than being duplicated locally.

## Release & Versioning
- **Semantic Commits:** Use Conventional Commits for all changes to ensure automated and predictable version bumping via Nx.
- **Visible Versioning:** All applications must explicitly display their current version in a help or "about" overlay.
- **Traceable History:** Maintain individual `CHANGELOG.md` files for each app to track their specific evolution.

## Key Interaction Patterns
- **Consistent Shortcuts:** Adhere to a shared set of keyboard shortcuts across all tools:
    - `H` or `?`: Toggle help/information overlay.
    - `S`: Save current visual output.
