# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ww3d is a web-based 3D woodworking design application. It lets users design furniture and woodworking projects in 3D, then reference those designs while building (iPad "shop mode") or buying lumber (phone "lumber yard mode").

The project is in early stages — currently a proof-of-concept with a Three.js scene (cube placement on a grid with orbit controls). The full vision is described in `requirements.md` and open technical decisions are tracked in `technical-questions.md`.

**At the start of each session, read `roadmap.md` to find the current progress and pick up from the first unchecked item.**

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

Test files live in `tests/` and follow the naming convention `*.browser.test.jsx`. Tests use `vitest-browser-react` to render R3F components inside a `<Canvas>`.

## Project Structure

```
index.html              # Entry HTML — loads src/main.jsx
src/
  main.jsx              # React entry point (createRoot)
  App.jsx               # Info overlay + Canvas with camera config
  constants.js          # Shared constants (BOARD_THICKNESS)
  components/
    Scene.jsx           # Scene setup: background, lights, grid, OrbitControls, boards state
    Board.jsx           # Single board mesh with edge wireframe
    BoardCreator.jsx    # Invisible ground plane for drag-to-create interaction
tests/
  scene.browser.test.jsx  # Browser-mode tests for R3F scene
vite.config.js          # Vite + React plugin + Vitest browser mode configuration
```

## Architecture

**Current state:** React + react-three-fiber (R3F) app. `index.html` loads `src/main.jsx` which renders the React tree. `App.jsx` provides the info overlay and `<Canvas>`. `Scene.jsx` sets up the 3D scene declaratively (background, lights, grid, OrbitControls). Board creation via drag interaction is handled by `BoardCreator.jsx`, and individual boards are rendered by `Board.jsx`.

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

## Ground Rules

### Workflow
- Read `roadmap.md` at session start, work from the first unchecked item
- One task at a time — finish, test, commit, then move to the next
- If a task has design decisions with multiple valid approaches, enter plan mode
- If a task is straightforward, just implement it

### Quality Gates
- `npm test -- --run` must pass before marking a task done
- `npm run build` must succeed before marking a task done
- Commit and push after each completed task

### Commits
- Commit directly to main after each completed task
- Push to origin after each commit
- Message format: `<type>: Phase <N> - <roadmap task name>`
- Types: `feat` for new functionality, `fix` for bug fixes, `chore` for config/cleanup, `test` for test-only changes, `refactor` for restructuring
- One commit per task — don't bundle multiple tasks

### Code Conventions
- Plain JS/JSX (no TypeScript)
- Functional components with hooks
- Components live in `src/components/`
- Shared constants in `src/constants.js`
- Keep state as high as needed, no higher
- No external state library unless the roadmap calls for one

### Testing
- Tests in `tests/` as `*.browser.test.jsx`
- Use `vitest-browser-react` with R3F `<Canvas>` for 3D tests
- Test behavior and structure, not implementation details

### Documentation
- Update `CLAUDE.md` project structure section when files are added/removed
- Check off roadmap items when done
- Don't create README or other docs unless asked
