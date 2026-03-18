# Cut List — Functional & Technical Specification

## 1. Overview

The cut list is a phone-optimized view (`#/cutlist`) that helps users figure out how much wood to buy at the lumber yard. It reads the existing project data, groups parts by material type, and provides calculators for sheet goods nesting, hardwood edge glue-ups, and dimensional lumber length selection.

---

## 2. Functional Specification

### 2.1 Navigation

- Hash-based routing: `#/cutlist` loads the cut list view (phone/mobile use); any other hash (or no hash) loads the 3D design view
- The cut list page has a "Design" back-link in its header that returns to `#/`
- The "Cut List" item in App's Menu dropdown opens the cut list as a **modal overlay** over the 3D canvas (desktop use) — it does not navigate to `#/cutlist`
- The modal is dismissed by clicking × in the header, pressing Escape, or clicking the backdrop
- The 3D canvas remains mounted and visible (dimmed) behind the modal

### 2.2 Material Types

Each top-level part has a `materialType` field:
- `'sheet'` — plywood, MDF, melamine, etc. (full-sheet goods)
- `'hardwood'` — solid lumber sold by the board foot (often requires edge glue-up)
- `'dimensional'` — construction lumber sold in fixed lengths (2x4, 1x6, etc.)

Default is `'hardwood'`. Child parts (cuts) inherit their parent's material type for display purposes but do not have their own `materialType` field.

### 2.3 Cut List View Layout

```
[Header: project name | "Design" link | "Load" button]
[Sheet Goods section — collapsible]
[Hardwood Lumber section — collapsible]
[Dimensional Lumber section — collapsible]
```

- Mobile-first: `max-width: 600px; margin: 0 auto; padding: 16px`
- Light background: `background: #f5f5f5; color: #222`
- Only top-level parts (`!parentId`) appear in the cut list

### 2.4 Sheet Goods Section

Groups parts by thickness. Per thickness group:
- Header shows thickness (e.g., "3/4"")
- Editable sheet size inputs: Width (default 48") and Height (default 96")
- 2D nesting diagram (SVG) showing how parts fit on sheets with 1/2" kerf gap between parts
- Summary: "N sheets, X% waste"

Parts use `length` × `width` as the 2D footprint (they lie flat on sheets).

### 2.5 Hardwood Lumber Section

Groups parts by thickness, displayed in quarter notation (e.g., 3/4" → "4/4"). Per group:
- Quarter notation header (e.g., "4/4 stock")
- Editable board width input (default 6") and board length input (default 96")
- Per-part row: name, L × W dimensions, number of boards needed for glue-up
- Warning badge if `part.length > board length` (end-to-end joint required — not recommended)
- Group totals: total boards needed, total board-feet

Board-feet formula: `(length × width × thickness) / 144`

### 2.6 Dimensional Lumber Section

Groups parts by nominal size (e.g., "2×4", "1×6"). Per group:
- Nominal size header
- Editable available lengths list (add/remove lengths, default: [96", 120", 144"])
- Per-part row: name, required length, assigned board length (shortest available that fits)
- Warning badge if no available length fits the part
- Group summary: count per length (e.g., "3× 8', 2× 10'"), total linear feet

### 2.7 Settings Persistence

User-entered board widths, sheet sizes, and available lengths are saved to the project's `cutListSettings` field and persist across save/load cycles.

### 2.8 Load Project

The cut list page has a "Load" button that opens a file picker to load a JSON project file. After loading, the cut list updates to reflect the new project's parts.

---

## 3. Data Model Changes

### 3.1 Part interface (`src/models/Part.ts`)

Add optional field:
```typescript
materialType?: 'sheet' | 'hardwood' | 'dimensional'
```

Added to `PartInit` as optional. Default to `'hardwood'` in `createPart`.

### 3.2 Project interface (`src/models/Project.ts`)

```typescript
interface CutListSettings {
  // Keyed by thickness in inches (as string for map key, e.g., "0.75")
  sheetGoods: Record<string, { sheetWidth: number; sheetHeight: number }>
  hardwood: Record<string, { boardWidth: number; boardLength: number }>
  // Keyed by nominal size string (e.g., "2x4")
  dimensional: Record<string, { availableLengths: number[] }>
}
```

Added to Project as `cutListSettings?: CutListSettings`. Missing in deserialized projects defaults to empty settings.

### 3.3 Zustand store (`src/stores/projectStore.ts`)

- Add `'materialType'` to the `updatePart` Pick union
- Add `updateCutListSettings(settings: CutListSettings)` action

### 3.4 PropertiesPanel (`src/components/PropertiesPanel.tsx`)

- Add `'materialType'` to `onUpdate` Pick union in Props
- Add segmented button row (Sheet / Hardwood / Dimensional) for top-level parts only (`!part.parentId`)
- Reuse `.part-panel-shape` CSS pattern; add `.part-panel-material` class with identical styling

---

## 4. Routing (`src/main.tsx`)

Replace single `<App />` render with:

```typescript
function Root() {
  const [route, setRoute] = useState(window.location.hash)
  useEffect(() => {
    const handler = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  if (route === '#/cutlist') return <CutListView />
  return <App />
}
```

---

## 5. Cut List Computation (`src/utils/cutlist.ts`)

All pure functions — no React, no side effects, fully unit-testable.

### 5.1 Part filtering

```typescript
function getCutListParts(parts: Part[]): Part[]
// Returns only top-level parts (!part.parentId)
```

### 5.2 Grouping

```typescript
function groupByMaterialType(parts: Part[]): {
  sheet: Part[]
  hardwood: Part[]
  dimensional: Part[]
}

function groupByThickness(parts: Part[]): Map<number, Part[]>
// Groups parts by exact thickness value
```

### 5.3 Quarter notation (hardwood display)

```typescript
function toQuarterNotation(thicknessInches: number): string
// Convention: finished thickness + 1/4" = quarter notation
// 0.75 → "4/4"
// 1.0  → "5/4"
// 1.25 → "6/4"
// 1.5  → "7/4"
// 2.0  → "8/4"
// Lookup table for common values; nearest quarter for others
```

### 5.4 Board feet

```typescript
function boardFeet(length: number, width: number, thickness: number): number
// (length × width × thickness) / 144
```

### 5.5 Glue-up board count

```typescript
function glueUpBoardCount(partWidth: number, availableBoardWidth: number): number
// Math.ceil(partWidth / availableBoardWidth)
```

### 5.6 Nominal size (dimensional lumber)

```typescript
function toNominalSize(thickness: number, width: number): string
// Lookup table: actual → nominal
// 1.5 × 3.5 → "2x4"
// 1.5 × 5.5 → "2x6"
// 1.5 × 7.25 → "2x8"
// 0.75 × 3.5 → "1x4"
// 0.75 × 5.5 → "1x6"
// etc.
// Fallback: show actual dimensions if no match
```

### 5.7 Board length assignment (dimensional)

```typescript
function assignBoardLength(
  partLength: number,
  availableLengths: number[]  // sorted ascending
): number | null
// Returns shortest available length >= partLength
// Returns null if none fit
```

### 5.8 Guillotine bin packing (sheet goods)

```typescript
interface Placement {
  partId: string
  partName: string
  x: number        // origin on sheet
  y: number
  width: number    // placed width (may be rotated)
  height: number   // placed height
  rotated: boolean
  color: string
}

interface PackedSheet {
  placements: Placement[]
  wastePercent: number
}

function packSheets(
  parts: Part[],
  sheetWidth: number,
  sheetHeight: number,
  gap: number       // kerf gap, 0.5 inches
): PackedSheet[]
```

**Algorithm: Guillotine Best Short Side Fit (BSSF)**

1. Sort parts by area descending (largest first)
2. For each part, effective size = `(partLength + gap) × (partWidth + gap)`
3. Maintain list of free rectangles per sheet (initially: one full-sheet rect)
4. For each part, try both orientations (normal and rotated 90°) in each free rect
5. Choose the placement where the shorter remaining side after placement is minimized (BSSF heuristic)
6. On placement, split the used free rect with a guillotine cut; choose the split axis that maximizes the larger remainder
7. If no free rect fits the part on any existing sheet, open a new sheet
8. Waste = `1 - (sum of actual part areas / (numSheets × sheetW × sheetH))`

---

## 6. Components

### 6.1 `src/components/CutListView.tsx` (new)

Top-level content component. Reads from `useProjectStore`. Used in two contexts:

- **Hash route** (`#/cutlist`): rendered full-page by `Root` in `main.tsx`; header shows "Design" hash link
- **Modal** (design view overlay): rendered inside a modal backdrop by `App.tsx`; header shows × close button

Props:
```typescript
interface CutListViewProps {
  onClose?: () => void  // provided when used as modal; absent when used as hash route
}
```

- When `onClose` is provided, the header "Design" link is replaced with a `×` button that calls `onClose`
- Manages local state for per-section user inputs; syncs to store via `updateCutListSettings` on change
- File input for loading JSON (reuses `deserializeProject` + `loadProject`)
- Renders three collapsible sections: Sheet Goods, Hardwood Lumber, Dimensional Lumber

### 6.2 `src/components/SheetNestingDiagram.tsx` (new)

SVG-based 2D visualization.

Props: `PackedSheet[]`, `sheetWidth: number`, `sheetHeight: number`

- One `<svg viewBox="0 0 W H" width="100%">` per sheet
- Sheet outline: light gray stroke rect
- Parts: colored `<rect>` (using `part.color`) with `<text>` label (name + dimensions)
- Responsive: SVG scales to container width

### 6.3 Sheet Goods Section (within CutListView)

Per thickness group:
- Thickness header (fractional inches)
- Editable sheet width and height inputs (pre-populated from settings, default 48×96)
- Calls `packSheets()` on each render; passes results to `SheetNestingDiagram`
- Shows "N sheets, X% waste" summary

### 6.4 Hardwood Section (within CutListView)

Per thickness group:
- Quarter notation header
- Editable board width input (default 6") and board length input (default 96")
- Table: part name | L × W | boards for glue-up
- Warning badge on rows where `part.length > boardLength`
- Group footer: total boards, total board-feet

### 6.5 Dimensional Section (within CutListView)

Per nominal size group:
- Nominal size header
- Available lengths list with add/remove controls (default [96, 120, 144])
- Table: part name | required length | assigned board length (or warning)
- Group footer: count per length, total linear feet

---

## 7. CSS

All styles in `index.html` `<style>` block. New classes:

| Class | Purpose |
|-------|---------|
| `.cutlist-page` | Light background, full-height, `max-width: 600px` centered |
| `.cutlist-header` | Project name, nav link, load button row |
| `.cutlist-section` | Collapsible card with styled header + body |
| `.cutlist-section-header` | Clickable header row with collapse toggle |
| `.cutlist-table` | Part list table (simple, readable, mobile-friendly) |
| `.cutlist-input` | Editable inputs (board width, sheet size, etc.) |
| `.cutlist-warning` | Warning badge — amber text/border |
| `.cutlist-sheet-svg` | Container for SVG nesting diagram |
| `.part-panel-material` | Segmented button row — identical CSS to `.part-panel-shape` |
| `.cutlist-modal-backdrop` | Fixed full-viewport overlay, semi-transparent dark bg, z-index above canvas |
| `.cutlist-modal-card` | Centered scrollable content card, max-width 600px, light bg |

---

## 8. Existing Code to Reuse

| What | Location | Usage |
|------|----------|-------|
| Fractional inch display | `src/utils/units.ts` `toFractionalInches()` | All dimension display |
| Inch parsing | `src/utils/units.ts` `parseInches()` | User input fields |
| Project deserialization | `src/models/Project.ts` `deserializeProject()` | Load button on cut list page |
| Store load action | `src/stores/projectStore.ts` `loadProject()` | After deserialize |
| Segmented button CSS | `index.html` `.part-panel-shape` | Material type toggle in PropertiesPanel |

---

## 9. Task Breakdown

All tasks are Phase 7. Last existing task ID is 112; these start at 113.

| ID | Task | Deps |
|----|------|------|
| 113 | Add `materialType` field to Part model; store wiring; unit tests | — |
| 114 | Material type selector in PropertiesPanel; browser tests | 113 |
| 115 | Hash-based routing; skeleton CutListView; "Cut List" menu item; browser tests | — |
| 116 | `src/utils/cutlist.ts` — all pure computation functions; unit tests | 113 |
| 117 | `CutListSettings` on Project; `updateCutListSettings` store action; serialize/deserialize; unit tests | 113 |
| 118 | Sheet goods section + SheetNestingDiagram; browser tests | 115, 116, 117 |
| 119 | Hardwood lumber section; browser tests | 115, 116, 117 |
| 120 | Dimensional lumber section; browser tests | 115, 116, 117 |
| 121 | Cut list modal overlay in design view; browser tests | 118, 119, 120 |

---

## 10. Verification Checklist

1. `npm test -- --run` — all existing + new tests pass
2. `npm run build` — production build succeeds
3. Manual smoke test:
   - Create a project with parts of each material type
   - Navigate to `#/cutlist` via Menu → Cut List
   - Sheet Goods: nesting diagram shows with 1/2" gaps; waste % is reasonable
   - Hardwood: glue-up counts correct; warning shown on parts longer than board
   - Dimensional: length assignments correct; warning shown when no length fits
   - Changing board width / sheet size / available lengths updates calculations immediately
   - Save project, reload via cut list Load button — settings persist
4. Mobile viewport (375px): layout is readable and usable
