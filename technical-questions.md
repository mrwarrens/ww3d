# 3D Woodworking Design Application — Technical Questions

Questions to resolve before and during implementation.

---

## 3D Engine & Rendering

- ~~Three.js or Babylon.js for the 3D engine?~~ **Decided: Three.js.** Larger ecosystem, already in use.
- Which CSG (Constructive Solid Geometry) library for boolean operations?

  **Research (March 2026):** Evaluated all viable CSG libraries for web-based Three.js/R3F integration. Woodworking joints (mortise, tenon, dado, rabbet, dovetail) map to simple box-subtraction CSG operations on planar geometry. Key requirement is coplanar face robustness since boards frequently meet flush.

  **Tier 1 candidates:**

  | Library | Type | Coplanar Robustness | Bundle | Three.js Integration |
  |---|---|---|---|---|
  | **@react-three/csg** (wraps three-bvh-csg) | Pure JS | Improved, not perfect | Small (~0.6 MB) | Native R3F/JSX declarative API |
  | **manifold-3d** v3.3 | WASM (C++) | Guaranteed manifold output | ~2-3 MB WASM | Conversion layer needed |
  | **three-bvh-csg** v0.0.17 | Pure JS | Improved, not perfect | Small (~0.6 MB) | Native Three.js (Brush extends Mesh) |

  **Tier 2 (viable but tradeoffs):**
  - **Trueform** (@polydera/trueform) — real-time 500K+ poly booleans, Three.js native. Requires commercial license.
  - **opencascade.js / replicad** — full BREP kernel (FreeCAD uses it). Excellent robustness but 2.4-45 MB WASM bundle. Overkill for planar woodworking geometry.
  - **@jscad/modeling** — pure JS, own geometry format. Awkward Three.js integration.

  **Not viable:**
  - **three-csg-ts / csg.js** — BSP-based, poor coplanar robustness, slow. Woodworking flush faces would break constantly.
  - **CGAL.js** — gold-standard math but WASM rounding bug causes boolean ops to hang in browsers.
  - **libigl-wasm** — experimental, inherits CGAL issues.
  - **Cork** — C++ only, no JS/WASM port.
  - **CADmium** — Rust+WASM, interesting but still early prototype.

  **Assessment:** For planar woodworking geometry, mesh-based booleans are sufficient (no need for BREP). The practical choice is between @react-three/csg (easiest R3F integration, small bundle, coplanar issues workable with epsilon offsets) and manifold-3d (guaranteed correctness, used by Blender/OpenSCAD, but needs conversion layer and manual WASM memory management via `.delete()` calls). The three-bvh-csg README itself recommends Manifold for production CAD.
- How to handle rendering performance for complex assemblies with many parts? Level-of-detail, instanced rendering, or occlusion culling?
- What format to use for wood grain textures? Procedural shaders vs pre-built texture images?

## Parametric Engine & Constraint Solving

- Build a custom parametric engine or integrate something like OpenCascade compiled to WASM? *(Note: CSG research above found opencascade.js bundle is 2.4-45 MB — likely too heavy. Manifold-3d or three-bvh-csg are better fits for the geometry complexity needed.)*
- How to represent parametric constraints between parts (e.g., "this shelf fits inside this dado")?
- How to handle constraint propagation when a dimension changes — what updates and in what order?
- Should parts store absolute positions or relative relationships to other parts?

## Data Model & File Format

- What does the project JSON schema look like? How to represent parts, assemblies, joints, annotations, hardware?
- How to keep file sizes reasonable for GitHub storage as projects get complex?
- Should the file format be versioned so older projects can be migrated forward?
- How to store component definitions vs component instances (for instanced parts like 4 identical legs)?
- How to represent joinery — as operations on parts, separate joint objects, or both?

## Joinery System

- How to parametrically define each joint type so dimensions update when connected parts change?
- How to handle the boolean geometry for complex joints like dovetails (multiple pins and tails)?
- Should joints be first-class objects that "know" about both connected parts, or just boolean cuts applied to each part independently?
- How to generate accurate 2D cross-section views of joints for the iPad detail overlays?

## Cabinet Module

- How to implement the face frame builder — fully parametric from carcase dimensions, or manual layout with helpers?
- How to model door overlay and reveal calculations — lookup tables or formula-based?
- How to represent the 32mm system for shelf pin holes — as a pattern applied to a part, or as individual features?
- How to handle drawer slide clearance rules — hardcoded per slide type or user-configurable?

## UI Framework & Responsive Design

- ~~Which frontend framework?~~ **Decided: React with react-three-fiber (R3F).** Declarative scene graph fits the data-driven part model. React manages both 3D viewport and UI panels. drei for common 3D helpers (OrbitControls, selection, etc.).
- How to structure the three UI modes — separate routes/apps, or one adaptive layout?
- How to handle the desktop toolbar/panel layout vs touch-friendly iPad layout?
- Which UI component library, if any? Or custom components for the specialized woodworking UI?
- How to implement keyboard shortcuts — custom system or a library like hotkeys.js?

## Touch Interaction (iPad)

- How to implement touch-friendly 3D navigation (orbit, pan, zoom) that doesn't conflict with part selection?
- How to handle tap-to-select vs drag-to-orbit gesture disambiguation?
- How to present dimensions and part info on tap — floating panel, bottom sheet, sidebar?
- How to implement the exploded view animation — manual drag-apart or automatic with a slider?
- How to implement the section plane — touch-drag to position, or preset positions?

## Phone UI

- How to structure the cut list / shopping list views for small screens?
- How to persist check-off state (items marked "in cart") — local storage, or save back to the project file?
- Should cost estimates and $/board-foot prices be stored per project or globally?

## Offline / PWA

- How to implement service worker caching for offline use?
- How to handle the transition from offline back to online — auto-sync or manual?
- How much of the app needs to work offline — just viewing, or also editing on desktop?
- How to cache the current project for offline access on iPad and phone?
- What is the maximum project size that can be reasonably cached offline?

## GitHub Integration

- How to implement GitHub OAuth in a purely client-side app? Use a lightweight auth proxy, or GitHub's device flow?
- How to handle GitHub API rate limits (60/hr unauthenticated, 5000/hr authenticated)?
- How to structure the repo — flat list of JSON files, or folders with metadata?
- How to generate and store thumbnail images — commit a PNG alongside each project JSON, or generate on the fly?
- How to implement project search — GitHub search API, or download a manifest file?
- How to handle merge conflicts if the same project is somehow edited from two tabs?
- Should version history UI use the GitHub commits API or store version metadata in the project file?

## Cut List & Board Optimization

- Which algorithm for sheet/board optimization — first fit decreasing, guillotine cutting, or a more advanced 2D bin packing algorithm?
- How to account for saw kerf in the optimization layout?
- How to handle grain direction constraints (some parts must be cut in a specific orientation)?
- How to present the optimization results visually — 2D diagram of each sheet/board?

## 2D Drawing Generation

- How to project the 3D model into 2D orthographic views — custom projection or a library?
- How to implement auto-dimensioning — which dimensions to place automatically and how to avoid clutter?
- How to generate section views from the 3D model?
- How to handle PDF generation in the browser — jsPDF, pdf-lib, or server-side?
- How to implement tiled printing for full-size templates — split across pages with alignment marks?

## Export Formats

- How to generate DXF files in the browser for CNC use?
- How to generate STL files for 3D printing jigs?
- What level of DXF support is needed — just 2D profiles, or 3D as well?
- How to handle layer organization in DXF exports?

## Performance & Scalability

- What is the target maximum number of parts in a single project?
- ~~How to handle undo/redo efficiently for large projects — command pattern, state snapshots, or incremental diffs?~~ **Decided: State snapshots** stored in `history`/`future` arrays in the Zustand store. Simple and sufficient for current project sizes.
- How to manage memory for projects with many instanced components?
- Should the parametric engine run in a Web Worker to avoid blocking the UI thread?

## Testing & Quality

- How to test 3D geometry operations — visual regression tests, numerical assertions, or both?
- How to test the parametric constraint solver?
- How to test responsive layouts across desktop, iPad, and phone?
- How to test offline functionality?

## Build & Deployment

- Where to host the static app — GitHub Pages, Vercel, Netlify, Cloudflare Pages?
- How to handle the OAuth proxy if needed — serverless function or a minimal backend?
- ~~What build tool — Vite, webpack, or other?~~ **Decided: Vite.** Fast dev server with HMR, native ESM, Vitest integration.
- How to handle WASM dependencies (if using OpenCascade or manifold)? *(Note: manifold-3d WASM is ~2-3 MB, compresses well with brotli. Requires async init at startup. Objects need manual `.delete()` calls — no JS garbage collection for WASM memory.)*
- What is the target bundle size budget for initial load?

## Accessibility

- How to make the 3D viewport keyboard-navigable?
- How to provide screen reader context for a primarily visual 3D tool?
- What is the minimum viable accessibility target for v1?

## Future Considerations (not in v1 but worth thinking about now)

- Could the data model support CNC toolpath generation later?
- Could the project format support import/export with other tools (SketchUp, Fusion 360)?
- Could the architecture support a plugin system for community-contributed joinery or cabinet templates?
- Could the rendering engine support AR preview (view the furniture in your room via phone camera)?
