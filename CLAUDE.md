# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ww3d is a web-based 3D woodworking design application. It lets users design furniture and woodworking projects in 3D, then reference those designs while building (iPad "shop mode") or buying lumber (phone "lumber yard mode").

The project has completed Phase 1 and Phase 2. Phase 1 delivered a TypeScript + React + R3F app where users can drag-to-create boards on a grid, select and delete them, view properties in a panel, and save/load projects as JSON files. Phase 2 added drag-to-move, snap-to-grid, adjustable grid, camera pan/presets, editable properties panel (name/dimensions/rotation/position/color), duplicate, parts outliner with hide/show, undo/redo, and several bug fixes. The full vision is described in `requirements.md` and open technical decisions are tracked in `technical-questions.md`.

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

Tests use **Vitest 4** with two modes configured in `vite.config.ts`:

- **Unit** (`*.test.ts`) — runs in Node.js, no browser; for stores, utilities, and pure logic
- **Browser** (`*.browser.test.ts[x]`) — runs in Playwright headless Chromium; for R3F components and anything needing WebGL

Browser-mode tests use `vitest-browser-react` to render R3F components inside a `<Canvas>`.

## Project Structure

```
index.html              # Entry HTML — loads src/main.tsx
src/
  main.tsx              # React entry point (createRoot)
  App.tsx               # Save/Load buttons, Cmd+S/Cmd+Z/Cmd+Shift+Z shortcuts, help pane, grid controls, camera preset buttons, selectedId state, PartPanel, PartOutliner, Canvas
  components/
    Scene.tsx           # Scene setup: background, lights, grid, OrbitControls; drag-to-move parts; Delete/Backspace/Escape/Cmd+D key handlers; camera preset wiring
    Board.tsx           # Single board mesh with edge wireframe; selection highlight via Outlines; drag start handler
    BoardCreator.tsx    # Invisible ground plane for drag-to-create interaction
    PartPanel.tsx       # DOM overlay with editable inputs: name, length/width/thickness, rotation (Rx/Ry/Rz), position (Px/Py/Pz), color picker
    PartOutliner.tsx    # Sidebar listing all parts by name; click to select; visibility toggle button per row
  models/
    Part.ts             # Part interface and createPart factory
    Project.ts          # Project interface, createProject, serializeProject, deserializeProject
  utils/
    constants.ts        # BOARD_THICKNESS, SNAP_INCREMENT, snapToGrid, CAMERA_PRESETS
    units.ts            # Fractional inch display and parsing utilities
  hooks/
    useCameraPreset.ts  # Hook: animates camera to a named preset position
  stores/
    projectStore.ts     # Zustand store: project, history/future stacks; addPart, removePart, duplicatePart, movePart, updatePart, togglePartVisibility, setProjectName, setGridSize, loadProject, undo, redo
tests/
  scene.browser.test.tsx           # Browser-mode R3F scene tests
  partPanel.browser.test.tsx       # Browser-mode DOM tests for PartPanel
  partOutliner.browser.test.tsx    # Browser-mode tests for PartOutliner
  app.browser.test.tsx             # Browser-mode tests for App-level features (save)
  camera-pan.browser.test.tsx      # Browser-mode tests for camera pan configuration
  camera-presets.browser.test.tsx  # Browser-mode tests for camera preset views
  move-part.browser.test.tsx       # Browser-mode tests for drag-to-move
  duplicate-part.browser.test.tsx  # Browser-mode tests for Cmd+D duplicate
  project.test.ts         # Unit tests for Project model and serialization
  part.test.ts            # Unit tests for Part model and createPart
  projectStore.test.ts    # Unit tests for Zustand store
  units.test.ts           # Unit tests for inch display and parsing utilities
  constants.test.ts       # Unit tests for snapToGrid and constants
tsconfig.json             # TypeScript configuration (strict mode)
vite.config.ts            # Vite config + Vitest projects: unit (Node.js) + browser (Playwright)
```

## Architecture

**Current state:** TypeScript + React + react-three-fiber (R3F) app. `index.html` loads `src/main.tsx` which renders the React tree. `App.tsx` owns selection state, Save/Load buttons (Cmd+S shortcut), undo/redo (Cmd+Z/Cmd+Shift+Z), help pane toggle, grid controls pane, camera preset buttons, and renders `<PartPanel>`, `<PartOutliner>`, and the `<Canvas>`. `Scene.tsx` sets up the 3D scene declaratively (background, lights, grid, OrbitControls) and handles keyboard events: Delete/Backspace to remove the selected part, Escape to deselect, Cmd+D to duplicate, and 1/2/3/4 for camera presets. Board creation via drag interaction is handled by `BoardCreator.tsx`; board movement via pointer-drag on the board mesh is handled in `Scene.tsx`. Individual boards are rendered by `Board.tsx` with selection highlighted via `<Outlines>`. `PartPanel.tsx` is a DOM overlay with editable inputs for name, dimensions (L/W/T), rotation (Rx/Ry/Rz), position (Px/Py/Pz), and a color picker. `PartOutliner.tsx` is a sidebar listing all parts by name with click-to-select and a per-row visibility toggle button. Camera preset logic is encapsulated in `hooks/useCameraPreset.ts`.

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
- Two test modes configured via `vite.config.ts` (using Vitest `projects`):
  - **Unit** (`*.test.ts`) — runs in Node.js, no browser; use for stores, utilities, pure logic
  - **Browser** (`*.browser.test.ts[x]`) — runs in Playwright/Chromium; use for R3F components and anything needing WebGL
- R3F/3D tests: `*.browser.test.tsx`, use `vitest-browser-react` with R3F `<Canvas>`
- Test behavior and outcomes, not implementation details

### Documentation
- Update `CLAUDE.md` project structure section when files are added/removed
- Check off roadmap items when done
- Don't create README or other docs unless asked

## Automated Planning & Execution Pipeline

Tasks are planned and executed through a pipeline of directories and two scripts. The human reviews work at each handoff point.

```
plan-feeder.sh → defined/ → approve-plan.sh → ready/ → claude-queue.sh → done/ → accept-plan.sh → accepted/
```

**`pipeline.yaml`** is the machine-readable task graph and source of truth for task status. `roadmap.md` remains a freeform human thinking doc. Scripts update `pipeline.yaml` as tasks progress.

### Directories

```
.claude/plans/
  defined/   # Plans written by plan-feeder.sh or /plan-builder; awaiting human review
  ready/     # Plans approved via approve-plan.sh; ready for claude-queue.sh to execute
  done/      # Plans executed by claude-queue.sh; awaiting human review
  accepted/  # Plans accepted via accept-plan.sh; considered complete
  failed/    # Plans that errored during execution; includes a .log file
```

### Scripts

**`scripts/plan-feeder.sh [--auto-approve]`** — Generates plans for unblocked pending tasks.
- Reads `pipeline.yaml` to find tasks where `status == pending` and all deps are `done` or `accepted`
- Runs the `/plan-builder` skill via `claude -p` and saves the plan to `defined/`, status → `planned`
- With `--auto-approve`: moves plan directly to `ready/` instead, status → `ready` (skips human review)
- Polls every 10 seconds

**`scripts/claude-queue.sh`** — Executes plans for tasks in `ready` status.
- Reads `pipeline.yaml` to find tasks where `status == ready`
- Finds the matching plan file in `ready/`, runs it via `claude -p`
- On success: moves plan to `done/`, updates status to `done`
- On failure: moves plan to `failed/` with a `.log` file, updates status to `failed`
- On rate limit or daily usage limit: waits and retries automatically

**`scripts/pipeline-status.sh`** — Prints a status dashboard grouped by phase and status.

**`scripts/approve-plan.sh [id|name]`** — Moves plan from `defined/` → `ready/`, updates status to `ready`. No args: lists planned tasks.

**`scripts/accept-plan.sh [id|name]`** — Moves plan from `done/` → `accepted/`, updates status to `accepted`. No args: lists done tasks.

**`scripts/retry-plan.sh [id|name]`** — Moves plan from `failed/` → `ready/`, updates status to `ready`. No args: lists failed tasks.

**`scripts/lib/common.sh`** — Shared functions sourced by plan-feeder and claude-queue: logging, YAML read/write, Claude execution with rate-limit retry, task discovery helpers.

### Human Review Points

1. **`defined/` → `ready/`** — Read the generated plan. Run `./scripts/approve-plan.sh` to list planned tasks, then `./scripts/approve-plan.sh <id>` to approve one.
2. **`done/` → `accepted/`** — Review the implementation (code diff, run the app, check tests). Run `./scripts/accept-plan.sh` to list done tasks, then `./scripts/accept-plan.sh <id>` to accept one.
3. **Bug fixes** — If manual testing reveals a problem, add a new task to `pipeline.yaml` with appropriate deps. The original task stays `accepted`.

### Running the Pipeline

```bash
# Check status at any time
./scripts/pipeline-status.sh

# In one terminal — generates plans into defined/ as tasks become unblocked
./scripts/plan-feeder.sh

# Or skip human plan review entirely
./scripts/plan-feeder.sh --auto-approve

# In a second terminal — executes plans as they appear in ready/
./scripts/claude-queue.sh
```

Both scripts run indefinitely. Stop them with Ctrl+C when done.
