# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ww3d is a web-based 3D woodworking design application. It lets users design furniture and woodworking projects in 3D, then reference those designs while building (iPad "shop mode") or buying lumber (phone "lumber yard mode").

The project is in early stages — currently a proof-of-concept with a Three.js scene (cube placement on a grid with orbit controls). The full vision is described in `requirements.md` and open technical decisions are tracked in `technical-questions.md`.

## Setup

Node.js is managed via [mise](https://mise.jdx.dev/). Install dependencies:

```
mise install
npm install
```

## Development

```
npm run dev        # Start Vite dev server (hot reload)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm test           # Run tests in watch mode (Vitest + Playwright browser)
npm test -- --run  # Run tests once and exit
```

## Testing

Tests use **Vitest 4** with **browser mode** (Playwright, headless Chromium). Browser mode is required because the app depends on WebGL APIs only available in a real browser.

Test files live in `tests/` and follow the naming convention `*.browser.test.js`.

## Project Structure

```
index.html          # Entry HTML — loads src/main.js
src/
  main.js           # App entry point (Three.js scene setup)
tests/
  scene.browser.test.js   # Browser-mode tests for Three.js scene
vite.config.js      # Vite + Vitest browser mode configuration
```

## Architecture

**Current state:** Vite-bundled app. `index.html` loads `src/main.js` which sets up the Three.js scene, camera, renderer, OrbitControls, lighting, grid, raycasting for cube placement, and the animation loop.

**Target architecture (from requirements.md):**
- Three.js-based 3D engine with CSG/boolean operations for joinery
- Three responsive UI modes: Desktop (design), iPad (shop reference), Phone (cut list/shopping)
- Parametric modeling engine — parts defined by dimensions with constraint propagation
- Woodworking joinery system (dovetails, mortise & tenon, dados, etc.)
- Cabinet-specific tools (face frames, drawer sizing, 32mm system)
- GitHub OAuth for project storage (projects as JSON files in a repo)
- PWA with offline support
- 2D drawing generation and export (PDF, SVG, DXF, STL)

## Key Design Decisions (from requirements.md)

- Units are inches-only with fractional display (3-1/2", not 3.5")
- Single user, no collaboration features
- Projects stored as JSON files committed to a GitHub repo via API
- No finish/paint tracking, no wood movement calculations, no time tracking
