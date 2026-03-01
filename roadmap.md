# Roadmap

Work items for building ww3d, ordered by priority. Check off items as they're completed. Each session, start from the first unchecked item.

---

## Phase 1: React/R3F Setup & Core Data Model

- [x] **Set up React + R3F** — Install React, react-three-fiber, and drei. Convert the app entry point to render a React root. Rewrite the existing Three.js scene (grid, lights, camera, OrbitControls) as R3F components. Remove the vanilla Three.js code in `src/main.js`.
- [x] **Add TypeScript** — Install TypeScript and type declarations. Rename all `.js`/`.jsx` files to `.ts`/`.tsx`. Add `tsconfig.json`. Update CLAUDE.md ground rules and project structure.
- [x] **Establish file organization** — Set up `src/models/`, `src/utils/`, `src/hooks/`, `src/stores/` directories. Move existing files into the new structure. Update imports and CLAUDE.md.
- [x] **Set up Zustand** — Install Zustand. Create a project store that holds the boards/parts list and actions (addBoard, removeBoard). Migrate Scene.jsx state into the store.
- [x] **Split test configuration** — Configure Vitest to run pure unit tests (`.test.ts`) without browser mode alongside browser tests (`.browser.test.tsx`). Move/add tests accordingly.
- [x] **Define the Part data model** — Create a Part interface and factory function with properties: id, name, length, width, thickness, position, rotation, color (hex). All dimensions stored in inches internally.
- [x] **Inch display utilities** — `src/utils/units.ts` converts decimal inches to fractional display ("3-1/2"") and parses user input ("3 1/2", "3.5", "3-1/2") back to decimal. Configurable precision (1/16", 1/32").
- [x] **Define the Project data model** — Project state holds a list of parts and project metadata (id, name). Serializes to/from JSON via `serializeProject`/`deserializeProject`.
- [x] **Board component** — Create a `<Board>` R3F component that renders a Part as a box mesh with correct dimensions, position, and edge lines. Color set by the Part's hex value.
- [x] **Create Part via drag** — Drag-to-create interaction on the grid plane that adds a new Part to project state (default name like "Board 1"). Width/depth from the drag, thickness defaults to 3/4".
- [x] **Select a Part** — Click a board to select it. Visual indicator (highlight or outline) via R3F/drei. Store selected part ID in React state.
- [x] **Delete a Part** — Press Delete/Backspace with a part selected to remove it from project state (React handles scene cleanup).
- [x] **Property display** — React panel component that shows the selected part's properties (name, dimensions in fractional inches). No editing yet, just display.
- [x] **Save project to local file** — Button/keyboard shortcut that downloads the project state as a `.json` file.
- [x] **Load project from local file** — Button that opens a file picker, reads a `.json` file, and loads it into project state (R3F re-renders the scene automatically).
- [x] **Audit** Audit the current state of the codebase against all documentation in /docs/, /plans/, and CLAUDE.md. For each document: 1) Read the doc and the relevant source files, 2) Identify any discrepancies—completed items not checked off, outdated architecture descriptions, missing new modules, stale technology references. 3) Update each document in place with accurate information. 4) At the end, give me a changelog of every doc change you made and flag any architectural decisions that may need human review.

## Phase 2: UI Drawing Experience

- [x] **1. Move parts by dragging** — Drag a selected board to reposition it on the grid plane. Update the Part's position in the store on pointer-up.
- [x] **2. Snap-to-grid** — When dragging or creating boards, snap position to a configurable grid increment (default 1/8"). Toggle with a keyboard shortcut (e.g., G).
- [x] **3. Adjustable floor/grid size** — Control in the UI (or panel) to increase/decrease the grid from its current 10×10 default. Store the grid size in project state so it saves/loads with the project.
- [x] **4. Camera pan** — Middle-mouse-button drag or Shift+drag to pan the camera, complementing the existing orbit and zoom.
- [x] **5. Camera preset views** — Buttons or keyboard shortcuts (Numpad-style: 1 front, 3 right, 7 top, 0 isometric) to jump the camera to standard angles.
- [x] **6. Editable properties panel** — All fields in the Part panel (name, length, width, thickness) become editable inputs. Parse fractional-inch input via the existing `parseInches` utility; commit on blur or Enter. Include the part name as an editable field. _Blocks: #7, #8._
- [x] **7. Board rotation on all 3 axes** — Add rotation inputs (X, Y, Z in degrees) to the properties panel. Update the Part's rotation in the store; the Board mesh rotates accordingly. _Depends on: #6._
- [x] **8. Color picker** — Color swatch in the properties panel opens a native color input. Updates the Part's hex color in the store; Board re-renders immediately. _Depends on: #6._
- [x] **9. Duplicate a part** — Cmd+D copies the selected part with a slight position offset and adds it to the store. New part becomes the selection.
- [x] **10. Part list/outliner** — Sidebar listing all parts by name; click to select, selected part highlighted. Updates reactively as parts are added/removed/renamed. _Blocks: #11._
- [x] **11. Hide/show parts** — Visibility toggle per part in the outliner. Hidden parts are excluded from the scene but remain in project state and the cut list. _Depends on: #10._
- [x] **12. Undo/redo** — Cmd+Z / Cmd+Shift+Z to step through history. Implement a command stack in the project store that captures snapshots before each mutating action (add, delete, move, resize, rotate, recolor, duplicate). _Depends on: #6, #7, #8, #9. Implement after all mutating actions are in place._
- [x] **13. Fix editable properties panel** — Typing in name/dimension inputs and pressing Enter or tabbing away returns the value to its previous state instead of committing. Inputs must persist user-entered values correctly. _Depends on: #6._
- [x] **14. Fix Delete key in text inputs** — Pressing Delete/Backspace while the cursor is inside a properties panel input deletes the selected part instead of the character in the input. The Delete key handler in Scene.tsx must not fire when a text input has focus. _Depends on: #6._
- [x] **15. Float parts list on left side** — Move the parts list/outliner from its current position to float on the left side of the screen, styled consistently with the rest of the overlay UI. _Depends on: #10._
- [x] **16. Help pane** — Add a Help button in the upper-left corner that toggles an overlay pane. Move the existing control-hint text ("Left-drag: draw board · Right-drag: orbit · Middle-drag or Shift+drag: pan · Scroll: zoom") into this pane, removing it from its current always-visible location.
- [x] **17. Grid controls pane** — Convert the "Grid: 10" label into a toggle button that opens/closes a pane containing the Grid − and Grid + controls, decluttering the main UI. _Depends on: #3._
- [x] **18. Bug: decimal input in properties panel** — Typing a leading-decimal value (e.g. `.5`) into a dimension field in the Part panel fails silently or reverts instead of being parsed as `0.5`. Values like `1.5` and `1/2` work correctly. Fix `parseInches` or the input commit logic so leading-decimal strings are accepted. _Depends on: #6, #13._
- [x] **19. Bug: color picker shows black on first selection** — Immediately after drawing and selecting a new part, the color swatch/picker in the properties panel shows black instead of the part's actual color. Deselecting and re-selecting the part corrects it. Ensure the color input is initialized from the selected part's color on first render. _Depends on: #8._
- [x] **20. Bug: help panel z-index behind parts list** — When the Help pane opens it renders behind the parts list panel. Fix the Help pane so it has a higher z-index than the parts list and renders with a fully-opaque (non-transparent) background. _Depends on: #15, #16._
- [x] **21. Position inputs in properties panel** — Add X, Y, Z position inputs to the properties panel. Display the selected part's current position in each axis; parse input on blur or Enter and update the Part's position in the store. Follows the same pattern as the rotation inputs added in #7. _Depends on: #6._
- [x] **22. Audit** — Audit the current state of the codebase against all documentation in /docs/, /plans/, and CLAUDE.md. For each document: 1) Read the doc and the relevant source files, 2) Identify any discrepancies—completed items not checked off, outdated architecture descriptions, missing new modules, stale technology references. 3) Update each document in place with accurate information. 4) At the end, give me a changelog of every doc change you made and flag any architectural decisions that may need human review. _Depends on: all other Phase 2 tasks (#1–#21)._

## Phase 3: Assembly & Constraints

- [ ] Assembly data model and grouping — named group with a Three.js Group node; parts belong to it; moving the assembly moves all parts
- [x] Multi-select in outliner — Shift+click and Cmd+click on part rows
- [ ] Assembly UI — New Assembly button, drag parts onto assembly row, Cmd+G to group selection, remove from assembly
- [ ] Assembly selection and movement — click assembly row selects group; double-click part in viewport selects its assembly; panel shows assembly position
- [ ] Update help panel — one rule per line for all keyboard shortcuts and click behaviors
- [ ] Basic constraints — "flush", "centered", "offset by X"
- [ ] Constraint propagation — changing one dimension updates connected parts

## Phase 4: Joinery

- [ ] CSG library integration (evaluate three-bvh-csg vs manifold WASM)
- [ ] Dado joint — parametric channel cut across a board
- [ ] Rabbet joint — parametric channel on an edge
- [ ] Butt joint — face-to-face alignment
- [ ] Half lap joint
- [ ] Mortise & tenon joint
- [ ] Dovetail joint
- [ ] Joint as a first-class object linking two parts

## Phase 5: Desktop UI Polish

- [ ] Toolbar with drawing/selection tools
- [ ] Keyboard shortcuts system
- [ ] Right-click context menus
- [ ] Multi-select and group operations
- [ ] Render mode toggle (solid, wireframe, transparent)

## Phase 6: Cut List & 2D Output

- [ ] Auto-generated cut list from project data
- [ ] Board optimization / nesting layout
- [ ] 2D orthographic projection (front, side, top views)
- [ ] Auto-dimensioning on 2D views
- [ ] PDF export
- [ ] SVG export
- [ ] DXF export
- [ ] STL export for jigs

## Phase 7: Responsive Modes (iPad / Phone)

- [ ] iPad shop mode — read-only 3D viewer with touch navigation
- [ ] Tap-to-select with dimension overlay
- [ ] Exploded view toggle
- [ ] Section plane tool
- [ ] Phone mode — cut list / shopping list view
- [ ] Check-off interface for in-store use
- [ ] Cost estimator

## Phase 8: GitHub Storage & PWA

- [ ] GitHub OAuth flow (device flow or auth proxy)
- [ ] Save/load projects to GitHub repo via API
- [ ] Project list with thumbnails
- [ ] Version history via GitHub commits
- [ ] Service worker for offline caching
- [ ] PWA manifest
