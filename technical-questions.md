# 3D Woodworking Design Application — Technical Questions

Questions to resolve before and during implementation.

---

## 3D Engine & Rendering

- Three.js or Babylon.js for the 3D engine? Three.js has a larger ecosystem, Babylon.js has stronger built-in features.
- Which CSG (Constructive Solid Geometry) library for boolean operations? Options include three-bvh-csg, manifold (WASM), or custom implementation.
- How to handle rendering performance for complex assemblies with many parts? Level-of-detail, instanced rendering, or occlusion culling?
- What format to use for wood grain textures? Procedural shaders vs pre-built texture images?

## Parametric Engine & Constraint Solving

- Build a custom parametric engine or integrate something like OpenCascade compiled to WASM?
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

- Which frontend framework? React, Svelte, Vue, or vanilla?
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
- How to handle undo/redo efficiently for large projects — command pattern, state snapshots, or incremental diffs?
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
- What build tool — Vite, webpack, or other?
- How to handle WASM dependencies (if using OpenCascade or manifold)?
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
