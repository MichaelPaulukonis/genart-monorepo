---
description: Guidelines for documentation location and organization in the GenArt monorepo
globs: docs/**/*.md, libs/**/*.md, apps/**/*.md
alwaysApply: true
---

# Documentation Guidelines

## Documentation Location

- **All project documentation** should be placed in the common `docs/` folder
- **Do not create** README files or documentation within `libs/` or `apps/` directories
- **Use appropriate subfolders** within `docs/` for organization

## Documentation Structure

```
docs/
├── guides/           # How-to guides and tutorials
├── troubleshooting/  # Problem-solving documentation
├── architecture/     # Technical architecture docs
├── deployment/       # Deployment and release docs
└── libs/            # Library-specific documentation
```

## Folder Guidelines

- **`docs/guides/`** - User guides, tutorials, how-to documentation
- **`docs/troubleshooting/`** - Problem-solving guides and FAQs
- **`docs/libs/`** - Library-specific documentation (if needed)
- **`docs/architecture/`** - Technical design and architecture docs

## Naming Conventions

- Use kebab-case for file names: `version-display-library.md`
- Be descriptive: `version-display-customization.md` not `customization.md`
- Include the component/library name in the filename for clarity

## Cross-References

- Use relative paths for internal links: `../troubleshooting/version-display-issues.md`
- Link related documentation together
- Update links when moving files

## Examples

✅ **Good:**
- `docs/guides/version-display-library.md`
- `docs/troubleshooting/version-display-issues.md`
- `docs/libs/p5-utils-api.md`

❌ **Avoid:**
- `libs/version-display/README.md`
- `apps/duo-chrome/USAGE.md`
- `docs/readme.md` (too generic)

## Rationale

- **Centralized discovery** - All documentation in one place
- **Consistent organization** - Predictable structure across the project
- **Better maintenance** - Easier to find and update documentation
- **Avoid duplication** - Single source of truth for project docs