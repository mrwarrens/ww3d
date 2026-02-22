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

Test files live in `tests/` and follow the naming convention `*.browser.test.tsx`. Tests use `vitest-browser-react` to render R3F components inside a `<Canvas>`.

## Project Structure

```
index.html              # Entry HTML — loads src/main.tsx
src/
  main.tsx              # React entry point (createRoot)
  App.tsx               # Info overlay + Canvas with camera config
  components/
    Scene.tsx           # Scene setup: background, lights, grid, OrbitControls; reads boards from store
    Board.tsx           # Single board mesh with edge wireframe
    BoardCreator.tsx    # Invisible ground plane for drag-to-create interaction
  models/
    Part.ts             # Part interface and createPart factory
  utils/
    constants.ts        # Shared constants (BOARD_THICKNESS)
    units.ts            # Fractional inch display and parsing utilities
  hooks/                # Custom React hooks
  stores/
    projectStore.ts     # Zustand store: parts list, addPart, removePart
tests/
  scene.browser.test.tsx  # Browser-mode R3F scene tests
  part.test.ts            # Unit tests for Part model and createPart
  projectStore.test.ts    # Unit tests for Zustand store
  units.test.ts           # Unit tests for inch display and parsing utilities
tsconfig.json             # TypeScript configuration (strict mode)
vite.config.ts            # Vite config + Vitest projects: unit (Node.js) + browser (Playwright)
```

## Architecture

**Current state:** TypeScript + React + react-three-fiber (R3F) app. `index.html` loads `src/main.tsx` which renders the React tree. `App.tsx` provides the info overlay and `<Canvas>`. `Scene.tsx` sets up the 3D scene declaratively (background, lights, grid, OrbitControls). Board creation via drag interaction is handled by `BoardCreator.tsx`, and individual boards are rendered by `Board.tsx`.

**Target architecture (from requirements.md):**
- Three.js-based 3D engine with CSG/boolean operations for joinery
- Three responsive UI modes: Desktop (design), iPad (shop reference), Phone (cut list/shopping)
- Parametric modeling engine — parts defined by dimensions with constraint propagation
- Woodworking joinery system (dovetails, mortise & tenon, dados, etc.)
- Cabinet-specific tools (face frames, drawer sizing, 32mm system)
- GitHub OAuth for project storage (projects as JSON files in a repo)
- PWA with offline support
- 2D drawing generation and export (PDF, SVG, DXF, STL)

## Dimension Mapping

Three.js axes (right-handed, Y-up):
- **x** — left/right
- **y** — up/down
- **z** — forward/back

Part dimensions are intrinsic to the board and don't change with rotation:

| Part dimension | Local axis (before rotation) |
|---|---|
| Length | x (left/right) |
| Width | z (forward/back) |
| Thickness | y (up/down) |

A board with no rotation sits flat on the grid: length along world-x, width along world-z, thickness along world-y. Rotation changes world orientation but never changes the Part's dimension values. Drag-to-create defines length (x extent) and width (z extent); thickness defaults to 3/4".

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
- TypeScript (`.ts`/`.tsx`) with strict mode
- Functional components with hooks
- Components live in `src/components/`
- Shared constants in `src/utils/constants.ts`
- Plain CSS for styling (no CSS-in-JS, no Tailwind)
- Keep state as high as needed, no higher
- Zustand for global state (once added per roadmap)

### Testing
- Tests ship with each task — don't defer tests to a separate "Tests for Phase N" item
- Two test modes configured via `vitest.workspace.ts`:
  - **Unit** (`*.test.ts`) — runs in Node.js, no browser; use for stores, utilities, pure logic
  - **Browser** (`*.browser.test.ts[x]`) — runs in Playwright/Chromium; use for R3F components and anything needing WebGL
- R3F/3D tests: `*.browser.test.tsx`, use `vitest-browser-react` with R3F `<Canvas>`
- Test behavior and outcomes, not implementation details

### Documentation
- Update `CLAUDE.md` project structure section when files are added/removed
- Check off roadmap items when done
- Don't create README or other docs unless asked
