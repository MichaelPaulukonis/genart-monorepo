# Initial Concept

Monorepo for creative coding and generative art projects.

# GenArt Monorepo Product Guide

## Vision
A personal creative laboratory and portfolio for generative art, designed for the primary developer to explore, maintain, and evolve independent applications. The workspace prioritizes minimalist, functional aesthetics that place the focus squarely on the visual and generative outputs.

## Target Audience
- **Primary User:** The creator/developer.
- **Secondary Audience:** Viewers of the portfolio interested in generative art and creative coding patterns.

## Core Goals
- **Independence & Evolution:** Maintain a collection of generative art applications that can evolve independently while sharing a common infrastructure.
- **Functional Synergy:** Enable integrated workflows where specific apps act as data preparation tools for others (e.g., using Monochromifier to prepare images for Duo-Chrome).
- **Consolidated Documentation:** Maintain project-wide guides in `docs/` alongside specific, localized documentation within each app's local `docs/` folder.

## Key Features & Behaviors
- **Consistent UX Patterns:** Standardized keyboard shortcuts (e.g., 'H' or '?' for help, 'S' for saving output) ensure a predictable experience across all tools.
- **Minimalist Interface:** UI elements are functional and unobtrusive, ensuring the artwork remains the center of attention.
- **Robust Tooling:** Leverages Nx and Vite for a high-performance developer experience, with built-in version tracking and independent deployment.