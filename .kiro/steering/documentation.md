---
description: Maintain comprehensive documentation for all project features and systems
globs: apps/*/src/**/*.*, apps/*/docs/**/*.md
alwaysApply: true
---

# Documentation Standards

- **Reference Documentation Required:**
  - Every significant feature MUST have documentation in `apps/<project-name>/docs/reference/`
  - Create markdown files for new features, systems, or major functionality
  - Update existing documentation when features change or expand

- **Documentation Structure:**
  ```
  apps/<project-name>/docs/
  ├── reference/           # Technical reference documentation
  │   ├── overview.md     # Project overview and architecture
  │   ├── feature-name.md # Individual feature documentation
  │   └── api.md          # API documentation if applicable
  └── guides/             # User guides and tutorials (optional)
  ```

- **Required Documentation Sections:**
  - **Overview:** What the feature does and why it exists
  - **Architecture:** How the system is structured and organized
  - **Usage:** How to use the feature (keyboard shortcuts, interactions)
  - **Technical Details:** Implementation notes for developers
  - **Integration:** How it works with other systems
  - **Troubleshooting:** Common issues and solutions

- **Documentation Triggers:**
  - ✅ **Always document when:**
    - Adding new interactive features or controls
    - Implementing new user-facing functionality
    - Creating new keyboard shortcuts or UI elements
    - Adding new configuration options or settings
    - Implementing new APIs or interfaces
    - Adding complex algorithms or systems

- **Documentation Updates:**
  - ✅ **Update documentation when:**
    - Modifying existing keyboard shortcuts
    - Changing user interface behavior
    - Adding or removing features
    - Changing configuration options
    - Fixing bugs that affect documented behavior

- **Documentation Quality:**
  - **User-Focused:** Write for both end users and developers
  - **Complete:** Cover all aspects of the feature
  - **Current:** Keep synchronized with code changes
  - **Examples:** Include code examples and usage patterns
  - **Cross-References:** Link to related documentation and code

- **File Naming Conventions:**
  - Use kebab-case for filenames: `interactive-controls.md`
  - Use descriptive names that match feature names
  - Group related features in single files when appropriate

- **Content Guidelines:**
  - **Headers:** Use clear, descriptive section headers
  - **Tables:** Use tables for keyboard shortcuts and reference information
  - **Code Blocks:** Include relevant code examples with syntax highlighting
  - **Links:** Reference related files and external resources
  - **Maintenance:** Include version information and update dates

- **Examples of Good Documentation:**
  - [Interactive Controls](mdc:apps/duo-chrome/docs/reference/interactive-controls.md) - Comprehensive feature documentation
  - Include keyboard reference tables
  - Provide troubleshooting sections
  - Document integration with existing features
  - Include technical implementation details

- **Documentation Workflow:**
  1. **During Development:** Create documentation alongside feature implementation
  2. **Before Completion:** Ensure documentation covers all aspects of the feature
  3. **After Changes:** Update documentation to reflect any modifications
  4. **Regular Review:** Periodically review and update documentation for accuracy

- **Integration with Development:**
  - Documentation is part of feature completion
  - No feature is complete without proper documentation
  - Documentation should be reviewed alongside code changes
  - Keep documentation in version control with code

- **Maintenance Responsibilities:**
  - Update documentation when modifying features
  - Add new sections for new functionality
  - Remove or update obsolete information
  - Ensure examples remain current and functional