# 3D Woodworking Design Application — Functional Requirements

## Overview

A web-based 3D drawing application for designing woodworking projects. The application supports three usage modes across desktop, iPad, and phone, with project storage on GitHub.

## Usage Modes

### Desktop — Design Mode (keyboard + mouse)
Full creation and editing experience. All modeling happens here.

- All core 3D drawing, joinery, and parametric tools
- Keyboard shortcuts for power-user speed (copy, mirror, snap toggle, dimension input)
- Right-click context menus for common operations
- Multi-select, group, and component workflows
- Full undo/redo

### iPad — Shop Mode (touch, read-only)
Standing at the workbench, referencing the design while building.

- Touch-friendly 3D viewer — pinch to zoom, drag to orbit, tap to select
- Tap a part to see dimensions — length, width, thickness, material
- Exploded view toggle — pull apart to see how pieces connect
- Assembly steps — swipe through build sequence showing which parts join when
- Joinery detail overlays — tap a joint to see a zoomed cross-section with dimensions
- Checklist mode — mark parts as "cut" or "assembled" to track progress
- Section plane tool — swipe to move the section plane through the assembly
- Print shop drawings — generate and print dimensioned 2D views
- Full-size template printing — tiled across multiple pages for curved parts
- No editing controls — keeps the UI clean and prevents accidental changes
- Offline capable — cache the current project so it works in the shop without wifi

### Phone — Lumber Yard Mode (small screen, quick reference)
Standing at the store, figuring out what to buy.

- Cut list summary — simple scrollable list: part name, species, quantity, dimensions
- Board shopping list — aggregated view: "12 board-feet of 8/4 walnut" or "3 sheets 3/4 plywood"
- Rough lumber calculator — accounts for waste, kerf, and milling allowance
- Check-off as you shop — tap to mark items as "in cart"
- Total cost estimate — running total based on entered $/board-foot
- Hardware BOM — separate list: screws, hinges, slides, knobs
- Compact layout — no 3D viewer, just lists and numbers
- Offline capable — works in a warehouse with bad signal

---

## Functional Requirements

### 1. Core 3D Parametric Modeling

- Parametric parts defined by dimensions (length, width, thickness) that propagate changes
- Primitive shapes — boards, panels, cylinders, arcs
- Boolean operations — union, subtract, intersect for creating joinery and complex shapes
- Snap and alignment — snap to edges, faces, midpoints, and custom reference points
- Measurement tool — click-to-measure distances, angles, and diagonals

### 2. Inch Display & Input

- Fractional inches — display as 3-1/2" not 3.5"
- Configurable precision — nearest 1/16" or 1/32"
- Input flexibility — type "3 1/2" or "3.5" or "3-1/2" and it all works
- Feet and inches for long stock — show "8' 4-3/16" for board lengths

### 3. Woodworking Joinery

Templates for the following joint types:

1. Butt joint — two faces meeting
2. Miter — angled cuts with configurable angle
3. Dado — channel cut across the grain
4. Rabbet — channel on the edge
5. Half lap — overlapping notches
6. Mortise & tenon — parametric (tenon thickness, shoulder width, depth, pinned or not)
7. Dovetail — pin/tail count, angle, spacing

### 4. Edge Treatments & Profiles

- Chamfers, roundovers, bevels on edges
- Taper tool for tapered legs

### 5. Curves

- Arc and spline tools — arched aprons, shaped seat edges, curved stretchers
- Full-size template export — print 1:1 PDF to trace onto workpiece

### 6. Cabinet-Specific Tools

- Standard cabinet dimensions — base (34-1/2" + countertop), wall cabinet depths (12"), toe kick (4" x 3-1/2")
- Face frame builder — specify stile/rail widths, auto-generate frame to fit carcase
- Door overlay calculator — inset, partial overlay, full overlay with configurable reveal gaps
- Hinge bore placement — standard 35mm Euro hinge boring patterns
- Shelf pin hole layout — evenly spaced holes with configurable start/stop/spacing (32mm system)
- Drawer box sizing — given an opening and slide type, calculate box dimensions accounting for slide clearances
- Drawer slide clearances — side-mount (1/2" per side), under-mount, center-mount

### 7. Modeling Workflow Tools

- Component instancing — define a part once, place multiple times, edit one and all update
- Mirror / symmetry — design half, mirror the other
- Linear array — evenly spaced copies (shelf pin holes, slats, pickets)
- Hide / show parts — toggle visibility of individual parts or groups
- Lock parts — prevent accidentally moving a part while working on adjacent ones
- Construction lines / reference planes — temporary geometry for alignment (not in cut list)
- Group into sub-assemblies — named groups like "left side panel," "drawer bank," "face frame"

### 8. Lumber Library

- Standard dimensional lumber sizes (2x4, 1x6, etc.) with real vs nominal dimensions
- Rough lumber in quarter notation — 4/4, 5/4, 6/4, 8/4
- Milling allowance config — default +1/2" width and thickness for jointing/planing (user configurable)
- Wood species database — grain direction visualization, density, hardness, color/texture previews

### 9. Hardware Catalog

- Screws, hinges, drawer slides, knobs, shelf pins with real dimensions
- Separate hardware BOM — distinct from the cut list
- Available on phone mode for purchasing

### 10. Cut List & Board Optimization

- Auto-generated bill of materials from the 3D model — part name, quantity, dimensions, material
- Distinguishes rough vs dimensional lumber
- Sheet/board optimization — lay out parts on standard sheets or rough lumber to minimize waste
- Milling allowances applied for rough lumber parts

### 11. Shopping List

- Aggregated by material type — board-feet for rough lumber, sheet count for plywood
- Cost estimator based on entered $/board-foot or $/sheet
- Check-off interface for in-store use

### 12. 2D Output & Drawings

- Shop drawings — front/side/top orthographic views with dimensions
- Section views — cut through the model to show internal joinery
- Auto-dimensioning — place dimension chains on exported drawings
- Export formats — PDF for shop prints, SVG, DXF for CNC, STL for 3D printing jigs
- Full-size tiled template printing for curved parts

### 13. Color Coding

- Color by material — visually distinguish species/material at a glance
- Color by sub-assembly — see which parts belong to which group

### 14. Annotations & Notes

- Text notes on the model — "pre-drill here," "glue face only," "align flush at top"
- Per-part notes — visible in shop mode when tapping a part
- Project-level notes — overall build notes

### 15. Assembly Visualization

- Exploded view — pull assembly apart to see how pieces fit
- Assembly order — step-by-step build sequence with annotations
- Sub-assembly breakdown — build order across groups
- Which-face-goes-where indicators — reference faces, inside/outside, top/bottom
- Glue-up groupings — which parts get glued in each stage

### 16. Viewport & Visualization

- Orbit, pan, zoom — standard 3D navigation with trackpad and mouse
- Preset camera angles — front, back, top, isometric
- Render modes — wireframe, solid, textured (with wood grain), transparent
- Section plane tool — slice through model to reveal internal structure

### 17. Furniture Dimension Reference

- Standard ergonomic dimensions — table height (29-30"), seat height (17-18"), counter height (36"), shelf depth
- Guide overlays — optional ghost lines showing standard heights while designing

---

## Storage & Project Management

- **GitHub OAuth** — authenticate with GitHub to access a designated repo
- **Project = JSON file** — each project saved as a JSON file in a single repo (e.g., `projects/workbench.json`)
- **Save** — commits the project file via the GitHub API with a user-provided commit message
- **Load** — lists available projects from the repo, fetches and opens
- **Version history** — GitHub commit history provides free versioning
- **Auto-save locally** — periodic save to browser storage to prevent data loss
- **Duplicate a project** — copy an existing design as a starting point
- **Search across projects** — find past designs
- **Thumbnail preview** — auto-generated screenshot for the project list
- **Project metadata** — name, status (designing / buying / building / finished), dates

---

## Non-Functional Requirements

- **Web-based** — runs in the browser, no install required
- **Responsive** — adapts UI for desktop, iPad, and phone screen sizes
- **Offline / PWA** — works without connectivity on all three devices
- **Units** — inches only, fractional display
- **Single user** — no collaboration features needed
- **No finish/paint tracking**
- **No wood movement calculations**
- **No bent lamination or steam bending**
- **No time tracking**
