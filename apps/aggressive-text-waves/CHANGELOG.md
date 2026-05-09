## [Unreleased]

### Added
- **aggressive-text-waves:** add `.eslintrc.json` with StandardJS + p5js plugin; `new-cap` exception for `p5` constructor; lint and build now pass from monorepo root
- **aggressive-text-waves:** About screen with app description, controls reference, and links to GitHub and author homepage
- **aggressive-text-waves:** first-visit auto-show for About screen (localStorage, no consent required)
- **aggressive-text-waves:** `?` key toggles About screen
- **aggressive-text-waves:** ESC key closes About screen
- **aggressive-text-waves:** multiple gravity sources via `sourceCount` slider (0-5); each source moves independently via Perlin noise
- **aggressive-text-waves:** negative gravity values for repulsion (`gravityStrength` range extended to -1..1)
