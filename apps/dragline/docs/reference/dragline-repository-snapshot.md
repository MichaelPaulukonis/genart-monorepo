# Dragline Repository Snapshot

_Last updated: 2025-09-29_

## 1. Project Overview
- **Project name & purpose:** `dragline` renders clusters of monospaced text blocks on an HTML5 canvas, letting users drag, rearrange, recolor, and regenerate poetic snippets sourced from Tumblr or a local fallback dataset.
- **Technology stack:** Vite, vanilla ES modules, p5.js via `p5js-wrapper`, Axios, Jest/Babel for tests, GitHub Pages deployment; supplemental prototypes in `aux/` and `text-grid-project/`.
- **Project type:** Browser-based creative web application (single-page, canvas-centric visualization).
- **Target audience:** Poetic coders and digital artists experimenting with textual landscapes.
- **Current status:** Early-stage prototype; core interaction works, but TODOs, sparse tests, and exploratory tooling point to an experimental phase.

## 2. Architecture Summary
- **Overall architecture:** Client-only SPA served by Vite. `src/dragline.js` bootstraps a p5 instance that orchestrates fetching, block creation, input handling, and rendering.
- **Key components:**
  - `src/dragline.js`: Main orchestrator.
  - `src/text-grid/`: Tokenizes corpus, builds 40×40 grids, splits into 20×20 chunks.
  - `src/blocks.js`: Block instantiation, clustering, z-index sequencing.
  - `src/grid.js`: Character grid maintenance for rendering.
  - `src/tumblr-random.js`: Tumblr fetch with JSON fallback.
  - `src/infobox.js` + `css/*`: Instruction overlay and styling.
- **Data flow:** Tumblr API → DOMParser cleanup → `tokenizer.js` → `gridBuilder.js` → `splitter.js` → block objects (`blocks.js`) → rendering via `grid.js` in `dragline.js`. User interactions mutate in-memory block list and trigger redraws.
- **External dependencies:** Tumblr REST API, p5.js rendering, Axios; Cheerio is listed but currently unused.
- **Design patterns:** Functional modules with shared state; procedural UI control and event-driven redraws, no global state manager.

## 3. Repository Structure
- **Directory organization:**
  - `src/` production modules (`dragline.js`, helper utilities, text-grid pipeline).
  - `css/` styling.
  - `public/` font asset.
  - `tests/` Jest specs (`buildGrid.test.js`).
  - `docs/` stage-gate instructions, reference notes.
  - `aux/` and `text-grid-project/` contain prototypes.
- **Key files:** `src/dragline.js`, `src/text-grid/*`, `src/blocks.js`, `src/tumblr-random.js`, `index.html`, `package.json`, `vite.config.js`.
- **Configuration:** Vite config for GitHub Pages base path, Babel preset-env for Jest, Jest config with `babel-jest` and Node environment.
- **Entry points:** `index.html` loads `src/dragline.js` (primary) and `src/infobox.js`.
- **Build & deploy:** `npm run build` (Vite) → `dist`; `npm run deploy` publishes with `gh-pages` to GitHub Pages. No automated CI pipeline.

## 4. Feature Analysis
- **Core features:** Canvas-based rendering, draggable text blocks, keyboard controls (move, delete, reorder, reset, fetch new corpus, toggle info box, export snapshot), static gradient background.
- **User workflows:** Launch → view generated poem fragments → drag blocks → fetch new Tumblr content (`n`) → export (`Shift+S`).
- **API endpoints:** Tumblr blog posts (`/v2/blog/{blogName}/posts`) consumed directly in-browser.
- **Database schema:** None; block data is transient client-side state.
- **Authentication:** None; public Tumblr API key is embedded.

## 5. Development Setup
- **Prerequisites:** Node.js ≥ 18 (Vite 6 compatibility) and npm.
- **Installation:** `npm install` → `npm run dev` → open Vite dev server (default `http://localhost:5173`).
- **Workflow:** Manual experimentation via Vite HMR and console logging. Stage-gate docs exist but not yet applied. No lint tooling.
- **Testing strategy:** Jest with Babel transform; only `tests/buildGrid.test.js` present.
- **Code quality gates:** No ESLint/Prettier; no CI executing tests automatically.

## 6. Documentation Assessment
- **README quality:** Brief overview and TODO list; lacks setup instructions, architecture notes, and visuals.
- **Code documentation:** Minimal inline comments; no JSDoc.
- **API documentation:** Absent.
- **Architecture documentation:** Limited to `docs/reference/analysis.md` feedback; no dedicated architecture guide.
- **User documentation:** In-app info box is descriptive; repository docs don’t include user guide or screenshots.

## 7. Missing Documentation Suggestions
- **PRD:** Add `/docs/requirements/PRD.md` outlining goals, personas, success metrics, and link it from README.
- **ADRs:** Create `/docs/decisions/` for architecture decision records (e.g., choice of p5.js, Tumblr sourcing, handling randomness).
- **API docs:** Add `/docs/api/` documenting Tumblr usage, rate limits, key management, and any future internal APIs.
- **Deployment guide:** Provide `/docs/deployment/guide.md` with GitHub Pages workflow, secrets handling, and staging guidance.
- **Changelog:** Introduce root `CHANGELOG.md` (Keep-a-Changelog format).

## 8. Technical Debt & Improvement Areas
- **Code quality:** `src/dragline.js` mixes responsibilities (rendering, input, fetch). Random behavior complicates testing. `tumblr-random.js` lacks robust error handling.
- **Performance:** Entire grid resets each redraw; opportunity to update only dirty regions. Randomized loops can spike render cost with larger datasets.
- **Security:** Public Tumblr API key in client bundle; no rate-limit safeguards or proxy.
- **Scalability:** In-memory state with `JSON.parse(JSON.stringify)` cloning; no undo/redo or persistence. Overlaps uncontrolled.
- **Dependencies:** Monitor compatibility for Vite 6 and `p5js-wrapper`.

## 9. Project Health Metrics (qualitative)
- **Code complexity:** Moderate; modular but tightly coupled interactions.
- **Test coverage:** Very low (single unit suite).
- **Documentation coverage:** Sparse; operational knowledge mostly implicit.
- **Maintainability:** Moderate difficulty due to monolithic logic and absence of tooling.
- **Technical debt:** Noticeable yet manageable; expected for exploratory phase.

## 10. Recommendations & Next Steps
- **Critical issues:**
  - Remove or proxy embedded Tumblr API key; adopt environment variable workflow.
  - Add user-visible error handling when data fetch fails.
- **Documentation improvements:**
  - Rewrite README with setup, architecture diagram, shortcuts, deployment steps.
  - Add PRD/ADR/deployment docs per Section 7.
  - Document Tumblr integration and fallback behavior.
- **Code quality:**
  - Split `dragline.js` into modules for input control, rendering, state management.
  - Introduce ESLint + Prettier; enforce in CI.
  - Optimize grid rendering to update only changed cells.
- **Feature gaps:**
  - UI toggles for fill characters, background themes, block counts.
  - Undo/redo, z-index management, overlap detection.
  - Allow local text uploads for corpus diversity.
- **Infrastructure:**
  - Add GitHub Actions CI for `npm test` (and future lint).
  - Consider Netlify/Vercel deployment for easier env handling.
  - Add logging around fetch failures and usage analytics.

## Additional Resources

### Quick Start (3 steps)
1. `npm install`
2. `npm run dev`
3. Open the served URL (default `http://localhost:5173`).

### Key Contact Points
- GitHub issues: <https://github.com/MichaelPaulukonis/dragline/issues>
- Author portfolio: <https://michaelpaulukonis.com>
- Tumblr source: <https://poeticalbot.tumblr.com>

### Related Documentation
- p5.js reference: <https://p5js.org/reference/>
- Vite guide: <https://vitejs.dev/guide/>
- Tumblr API docs: <https://www.tumblr.com/docs/en/api/v2>
- GitHub Pages deployment: <https://docs.github.com/pages>

### Emerging Roadmap (inferred)
- README TODOs: granular block deletion, export enhancements, clustering improvements, alternate data sources, block listings.
- `docs/reference/analysis.md`: performance optimization, dynamic gradients, accessibility, undo/redo, advanced layouts.
- Stage-gate docs: introduce structured planning with per-feature specs/designs.

## Documentation Template Suggestions
- **README:** Intro → Features → Screenshot/Demo → Quick Start → Usage & shortcuts → Architecture overview → Configuration (Tumblr key) → Testing → Deployment → Roadmap → Contributing → License.
- **PRD (`/docs/reference/PRD.md`):** Background, problem statement, goals, personas, user stories, non-goals, success metrics, open questions.
- **Architecture (`/docs/reference/architecture.md`):** Context diagram, module breakdown, data flow, decisions, scalability considerations, future enhancements.
- **API (`/docs/reference/api.md`):** Endpoint summary, request/response schema, rate limits, error handling, authentication, sample payloads.

## Quality Gates
- Build, lint, and tests were not executed for this review (analysis only). Recommend running `npm test` after code changes.

## Requirements Coverage
- All items from the repository-analysis request have been addressed: sections 1–10, specific quick start/help/resources/roadmap details, documentation template guidance, and prioritized recommendations.
