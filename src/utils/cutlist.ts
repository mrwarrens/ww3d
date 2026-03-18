import type { Part } from '../models/Part'

export interface Placement {
  partId: string
  x: number
  y: number
  length: number
  width: number
  rotated: boolean
}

export interface PackedSheet {
  placements: Placement[]
  wastePercent: number
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function getCutListParts(parts: Part[]): Part[] {
  return parts.filter(p => !p.parentId)
}

export function groupByMaterialType(parts: Part[]): { sheet: Part[]; hardwood: Part[]; dimensional: Part[] } {
  const result = { sheet: [] as Part[], hardwood: [] as Part[], dimensional: [] as Part[] }
  for (const part of parts) {
    const type = part.materialType ?? 'hardwood'
    result[type].push(part)
  }
  return result
}

export function groupByThickness(parts: Part[]): Map<number, Part[]> {
  const map = new Map<number, Part[]>()
  for (const part of parts) {
    const existing = map.get(part.thickness)
    if (existing) {
      existing.push(part)
    } else {
      map.set(part.thickness, [part])
    }
  }
  return map
}

const QUARTER_LOOKUP: Record<number, string> = {
  0.75: '4/4',
  1.0: '5/4',
  1.25: '6/4',
  1.5: '7/4',
  2.0: '8/4',
}

export function toQuarterNotation(thicknessInches: number): string {
  const rounded = Math.round(thicknessInches * 1000) / 1000
  if (QUARTER_LOOKUP[rounded] !== undefined) {
    return QUARTER_LOOKUP[rounded]
  }
  const quarters = Math.round(thicknessInches / 0.25) + 1
  return `${quarters}/4`
}

export function boardFeet(length: number, width: number, thickness: number): number {
  return (length * width * thickness) / 144
}

export function glueUpBoardCount(partWidth: number, availableBoardWidth: number, partLength: number, boardLength: number): number {
  const strips = Math.ceil(partWidth / availableBoardWidth)
  const stripsPerBoard = Math.floor(boardLength / partLength)
  return Math.ceil(strips / Math.max(stripsPerBoard, 1))
}

const NOMINAL_LOOKUP: Array<{ thickness: number; width: number; nominal: string }> = [
  { thickness: 1.5, width: 3.5, nominal: '2x4' },
  { thickness: 1.5, width: 5.5, nominal: '2x6' },
  { thickness: 1.5, width: 7.25, nominal: '2x8' },
  { thickness: 1.5, width: 9.25, nominal: '2x10' },
  { thickness: 1.5, width: 11.25, nominal: '2x12' },
  { thickness: 0.75, width: 1.5, nominal: '1x2' },
  { thickness: 0.75, width: 2.5, nominal: '1x3' },
  { thickness: 0.75, width: 3.5, nominal: '1x4' },
  { thickness: 0.75, width: 5.5, nominal: '1x6' },
  { thickness: 0.75, width: 7.25, nominal: '1x8' },
  { thickness: 0.75, width: 9.25, nominal: '1x10' },
  { thickness: 0.75, width: 11.25, nominal: '1x12' },
]

const NOMINAL_TOLERANCE = 0.05

export function toNominalSize(thickness: number, width: number): string {
  for (const entry of NOMINAL_LOOKUP) {
    if (
      Math.abs(entry.thickness - thickness) <= NOMINAL_TOLERANCE &&
      Math.abs(entry.width - width) <= NOMINAL_TOLERANCE
    ) {
      return entry.nominal
    }
  }
  return `${thickness}" × ${width}"`
}

export function assignBoardLength(partLength: number, availableLengths: number[]): number | null {
  let best: number | null = null
  for (const len of availableLengths) {
    if (len >= partLength) {
      if (best === null || len < best) {
        best = len
      }
    }
  }
  return best
}

export function packSheets(
  parts: Part[],
  sheetWidth: number,
  sheetHeight: number,
  gap: number
): PackedSheet[] {
  // Sort by area descending
  const sorted = [...parts].sort((a, b) => b.length * b.width - a.length * a.width)

  const sheets: { placements: Placement[]; freeRects: Rect[]; usedArea: number }[] = []

  function tryPlace(
    partLength: number,
    partWidth: number,
    freeRects: Rect[]
  ): { rect: Rect; rectIndex: number; rotated: boolean } | null {
    let best: { score: number; rect: Rect; rectIndex: number; rotated: boolean } | null = null

    const orientations: Array<{ l: number; w: number; rotated: boolean }> = [
      { l: partLength + gap, w: partWidth + gap, rotated: false },
    ]
    if (partLength !== partWidth) {
      orientations.push({ l: partWidth + gap, w: partLength + gap, rotated: true })
    }

    for (let i = 0; i < freeRects.length; i++) {
      const rect = freeRects[i]
      for (const { l, w, rotated } of orientations) {
        if (l <= rect.w && w <= rect.h) {
          // BSSF: minimize shorter leftover side
          const leftoverW = rect.w - l
          const leftoverH = rect.h - w
          const score = Math.min(leftoverW, leftoverH)
          if (best === null || score < best.score) {
            best = { score, rect, rectIndex: i, rotated }
          }
        }
      }
    }

    return best
  }

  function guillotineSplit(freeRects: Rect[], used: Rect, placedW: number, placedH: number): Rect[] {
    const remaining: Rect[] = []
    for (const rect of freeRects) {
      // Check if this rect intersects the placed area
      if (
        used.x + placedW <= rect.x ||
        used.x >= rect.x + rect.w ||
        used.y + placedH <= rect.y ||
        used.y >= rect.y + rect.h
      ) {
        remaining.push(rect)
        continue
      }

      // Guillotine split: try both axes, pick the one leaving the larger area
      const rightW = rect.x + rect.w - (used.x + placedW)
      const topH = rect.y + rect.h - (used.y + placedH)
      const splitHoriz = rightW * rect.h + (used.x - rect.x + placedW) * topH
      const splitVert = (used.y - rect.y + placedH) * rightW + rect.h * (used.x - rect.x)

      if (splitHoriz >= splitVert) {
        // Horizontal cut: right rectangle + top rectangle
        if (rightW > 0) {
          remaining.push({ x: used.x + placedW, y: rect.y, w: rightW, h: rect.h })
        }
        if (topH > 0) {
          remaining.push({ x: rect.x, y: used.y + placedH, w: used.x - rect.x + placedW, h: topH })
        }
      } else {
        // Vertical cut: top rectangle + right rectangle
        if (topH > 0) {
          remaining.push({ x: rect.x, y: used.y + placedH, w: rect.w, h: topH })
        }
        if (rightW > 0) {
          remaining.push({ x: used.x + placedW, y: rect.y, w: rightW, h: used.y - rect.y + placedH })
        }
      }
    }
    return remaining
  }

  for (const part of sorted) {
    let placed = false

    for (const sheet of sheets) {
      const result = tryPlace(part.length, part.width, sheet.freeRects)
      if (result) {
        const { rect, rotated } = result
        const placedL = rotated ? part.width : part.length
        const placedW = rotated ? part.length : part.width
        const effectiveL = placedL + gap
        const effectiveW = placedW + gap

        sheet.placements.push({
          partId: part.id,
          x: rect.x + gap / 2,
          y: rect.y + gap / 2,
          length: placedL,
          width: placedW,
          rotated,
        })
        sheet.usedArea += part.length * part.width
        sheet.freeRects = guillotineSplit(sheet.freeRects, rect, effectiveL, effectiveW)
        placed = true
        break
      }
    }

    if (!placed) {
      // Open a new sheet
      const newSheet = {
        placements: [] as Placement[],
        freeRects: [{ x: 0, y: 0, w: sheetWidth, h: sheetHeight }],
        usedArea: 0,
      }
      const result = tryPlace(part.length, part.width, newSheet.freeRects)
      if (result) {
        const { rect, rotated } = result
        const placedL = rotated ? part.width : part.length
        const placedW = rotated ? part.length : part.width
        const effectiveL = placedL + gap
        const effectiveW = placedW + gap

        newSheet.placements.push({
          partId: part.id,
          x: rect.x + gap / 2,
          y: rect.y + gap / 2,
          length: placedL,
          width: placedW,
          rotated,
        })
        newSheet.usedArea += part.length * part.width
        newSheet.freeRects = guillotineSplit(newSheet.freeRects, rect, effectiveL, effectiveW)
      } else {
        // Part doesn't fit in any orientation — place it alone on an oversized sheet
        newSheet.placements.push({
          partId: part.id,
          x: gap / 2,
          y: gap / 2,
          length: part.length,
          width: part.width,
          rotated: false,
        })
        newSheet.usedArea += part.length * part.width
        newSheet.freeRects = []
      }
      sheets.push(newSheet)
    }
  }

  const sheetArea = sheetWidth * sheetHeight
  return sheets.map(sheet => ({
    placements: sheet.placements,
    wastePercent: Math.max(0, 1 - sheet.usedArea / sheetArea),
  }))
}
