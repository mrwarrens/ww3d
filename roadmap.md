# Roadmap

Work items for building ww3d, ordered by priority. Check off items as they're completed. Each session, start from the first unchecked item.

---

## Phase 1: React/R3F Setup & Core Data Model

- [x] **Set up React + R3F** — Install React, react-three-fiber, and drei. Convert the app entry point to render a React root. Rewrite the existing Three.js scene (grid, lights, camera, OrbitControls) as R3F components. Remove the vanilla Three.js code in `src/main.js`.
- [x] **Add TypeScript** — Install TypeScript and type declarations. Rename all `.js`/`.jsx` files to `.ts`/`.tsx`. Add `tsconfig.json`. Update CLAUDE.md ground rules and project structure.
- [x] **Establish file organization** — Set up `src/models/`, `src/utils/`, `src/hooks/`, `src/stores/` directories. Move existing files into the new structure. Update imports and CLAUDE.md.
- [ ] **Set up Zustand** — Install Zustand. Create a project store that holds the boards/parts list and actions (addBoard, removeBoard). Migrate Scene.jsx state into the store.
- [ ] **Split test configuration** — Configure Vitest to run pure unit tests (`.test.ts`) without browser mode alongside browser tests (`.browser.test.tsx`). Move/add tests accordingly.
- [ ] **Define the Part data model** — Create a Part interface and factory function with properties: id, name, length, width, thickness, position, rotation, color (hex). All dimensions stored in inches internally.
- [ ] **Inch display utilities** — Create a `src/units.js` module that converts decimal inches to fractional display ("3-1/2"") and parses user input ("3 1/2", "3.5", "3-1/2") back to decimal. Configurable precision (1/16", 1/32").
- [ ] **Define the Project data model** — Project state holds a list of parts and project metadata (name, status, created/modified dates). Serializes to/from JSON.
- [ ] **Board component** — Create a `<Board>` R3F component that renders a Part as a box mesh with correct dimensions, position, and edge lines. Color set by the Part's hex value.
- [ ] **Create Part via drag** — Drag-to-create interaction on the grid plane that adds a new Part to project state (default name like "Board 1"). Width/depth from the drag, thickness defaults to 3/4".
- [ ] **Select a Part** — Click a board to select it. Visual indicator (highlight or outline) via R3F/drei. Store selected part ID in React state.
- [ ] **Delete a Part** — Press Delete/Backspace with a part selected to remove it from project state (React handles scene cleanup).
- [ ] **Property display** — React panel component that shows the selected part's properties (name, dimensions in fractional inches). No editing yet, just display.
- [ ] **Save project to local file** — Button/keyboard shortcut that downloads the project state as a `.json` file.
- [ ] **Load project from local file** — Button that opens a file picker, reads a `.json` file, and loads it into project state (R3F re-renders the scene automatically).

## Phase 2: Assembly & Constraints

- [ ] Assembly/group data model — parts can belong to named sub-assemblies
- [ ] Parent/child relationships between parts
- [ ] Basic constraints — "flush", "centered", "offset by X"
- [ ] Constraint propagation — changing one dimension updates connected parts
- [ ] Undo/redo system (command pattern)
- [ ] Tests for Phase 2

## Phase 3: Joinery

- [ ] CSG library integration (evaluate three-bvh-csg vs manifold WASM)
- [ ] Dado joint — parametric channel cut across a board
- [ ] Rabbet joint — parametric channel on an edge
- [ ] Butt joint — face-to-face alignment
- [ ] Half lap joint
- [ ] Mortise & tenon joint
- [ ] Dovetail joint
- [ ] Joint as a first-class object linking two parts
- [ ] Tests for Phase 3

## Phase 4: Desktop UI

- [ ] Toolbar with drawing/selection tools
- [ ] Property editor panel — edit part dimensions, name, color
- [ ] Part list / outliner sidebar
- [ ] Keyboard shortcuts system
- [ ] Right-click context menus
- [ ] Multi-select and group operations
- [ ] Render mode toggle (solid, wireframe, transparent)
- [ ] Tests for Phase 4

## Phase 5: Cut List & 2D Output

- [ ] Auto-generated cut list from project data
- [ ] Board optimization / nesting layout
- [ ] 2D orthographic projection (front, side, top views)
- [ ] Auto-dimensioning on 2D views
- [ ] PDF export
- [ ] SVG export
- [ ] DXF export
- [ ] STL export for jigs
- [ ] Tests for Phase 5

## Phase 6: Responsive Modes (iPad / Phone)

- [ ] iPad shop mode — read-only 3D viewer with touch navigation
- [ ] Tap-to-select with dimension overlay
- [ ] Exploded view toggle
- [ ] Section plane tool
- [ ] Phone mode — cut list / shopping list view
- [ ] Check-off interface for in-store use
- [ ] Cost estimator
- [ ] Tests for Phase 6

## Phase 7: GitHub Storage & PWA

- [ ] GitHub OAuth flow (device flow or auth proxy)
- [ ] Save/load projects to GitHub repo via API
- [ ] Project list with thumbnails
- [ ] Version history via GitHub commits
- [ ] Service worker for offline caching
- [ ] PWA manifest
- [ ] Tests for Phase 7
