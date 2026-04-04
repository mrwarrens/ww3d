import { describe, it, expect } from 'vitest'
import { createPart } from '../src/models/Part'
import {
  getCutListParts,
  groupByMaterialType,
  groupByThickness,
  toQuarterNotation,
  boardFeet,
  glueUpBoardCount,
  decimalBoardsForPart,
  toNominalSize,
  assignBoardLength,
  packSheets,
  packHardwood,
} from '../src/utils/cutlist'

function makePart(overrides: Partial<Parameters<typeof createPart>[0]> & { id?: string } = {}) {
  const { id: _id, ...init } = overrides
  const part = createPart({
    length: 24,
    width: 12,
    position: { x: 0, y: 0, z: 0 },
    ...init,
  })
  if (overrides.id) {
    return { ...part, id: overrides.id }
  }
  return part
}

describe('getCutListParts', () => {
  it('returns all parts when none have parentId', () => {
    const parts = [makePart(), makePart()]
    expect(getCutListParts(parts)).toHaveLength(2)
  })

  it('excludes parts with parentId', () => {
    const parent = makePart()
    const child = { ...makePart(), parentId: parent.id }
    const result = getCutListParts([parent, child])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(parent.id)
  })

  it('returns empty array for empty input', () => {
    expect(getCutListParts([])).toHaveLength(0)
  })
})

describe('groupByMaterialType', () => {
  it('partitions parts into sheet, hardwood, dimensional', () => {
    const sheet = makePart({ materialType: 'sheet' })
    const hardwood = makePart({ materialType: 'hardwood' })
    const dimensional = makePart({ materialType: 'dimensional' })
    const result = groupByMaterialType([sheet, hardwood, dimensional])
    expect(result.sheet).toHaveLength(1)
    expect(result.hardwood).toHaveLength(1)
    expect(result.dimensional).toHaveLength(1)
  })

  it('defaults undefined materialType to hardwood', () => {
    const part = makePart()
    const partWithoutType = { ...part, materialType: undefined }
    const result = groupByMaterialType([partWithoutType])
    expect(result.hardwood).toHaveLength(1)
    expect(result.sheet).toHaveLength(0)
    expect(result.dimensional).toHaveLength(0)
  })

  it('handles all-sheet parts', () => {
    const parts = [makePart({ materialType: 'sheet' }), makePart({ materialType: 'sheet' })]
    const result = groupByMaterialType(parts)
    expect(result.sheet).toHaveLength(2)
    expect(result.hardwood).toHaveLength(0)
    expect(result.dimensional).toHaveLength(0)
  })
})

describe('groupByThickness', () => {
  it('groups parts by exact thickness', () => {
    const thin = makePart({ thickness: 0.75 })
    const thick = makePart({ thickness: 1.5 })
    const result = groupByThickness([thin, thick])
    expect(result.get(0.75)).toHaveLength(1)
    expect(result.get(1.5)).toHaveLength(1)
  })

  it('groups multiple parts with same thickness together', () => {
    const a = makePart({ thickness: 0.75 })
    const b = makePart({ thickness: 0.75 })
    const result = groupByThickness([a, b])
    expect(result.get(0.75)).toHaveLength(2)
  })

  it('returns empty map for empty input', () => {
    expect(groupByThickness([]).size).toBe(0)
  })
})

describe('toQuarterNotation', () => {
  it('returns 4/4 for 0.75"', () => expect(toQuarterNotation(0.75)).toBe('4/4'))
  it('returns 5/4 for 1.0"', () => expect(toQuarterNotation(1.0)).toBe('5/4'))
  it('returns 6/4 for 1.25"', () => expect(toQuarterNotation(1.25)).toBe('6/4'))
  it('returns 7/4 for 1.5"', () => expect(toQuarterNotation(1.5)).toBe('7/4'))
  it('returns 8/4 for 2.0"', () => expect(toQuarterNotation(2.0)).toBe('8/4'))

  it('computes non-standard thickness via formula', () => {
    // 0.5" → Math.round(0.5/0.25) + 1 = 2 + 1 = 3 → "3/4"
    expect(toQuarterNotation(0.5)).toBe('3/4')
  })

  it('rounds to nearest quarter for non-standard', () => {
    // 1.75" → Math.round(1.75/0.25) + 1 = 7 + 1 = 8 → "8/4"
    // (already in lookup as 2.0, but 1.75 is not)
    expect(toQuarterNotation(1.75)).toBe('8/4')
  })
})

describe('boardFeet', () => {
  it('computes (L * W * T) / 144', () => {
    expect(boardFeet(12, 12, 1)).toBeCloseTo(1.0)
    expect(boardFeet(24, 6, 0.75)).toBeCloseTo(24 * 6 * 0.75 / 144)
  })

  it('returns 0 for zero dimensions', () => {
    expect(boardFeet(0, 12, 1)).toBe(0)
  })
})

describe('decimalBoardsForPart', () => {
  it('returns fraction of board when part width fits in one strip', () => {
    // strips=ceil(4/6)=1, decimal=1*(24/96)=0.25
    const part = makePart({ length: 24, width: 4 })
    expect(decimalBoardsForPart(part, 6, 96)).toBeCloseTo(0.25)
  })

  it('returns doubled fraction when two strips required', () => {
    // strips=ceil(8/6)=2, decimal=2*(24/96)=0.50
    const part = makePart({ length: 24, width: 8 })
    expect(decimalBoardsForPart(part, 6, 96)).toBeCloseTo(0.5)
  })

  it('returns 1.0 when part exactly fills a board', () => {
    // strips=ceil(6/6)=1, decimal=1*(96/96)=1.0
    const part = makePart({ length: 96, width: 6 })
    expect(decimalBoardsForPart(part, 6, 96)).toBeCloseTo(1.0)
  })

  it('returns 1.0 when part length requires full board (no cross-cutting benefit)', () => {
    // strips=ceil(4/6)=1, stripsPerBoard=floor(96/60)=1, decimal=1/1=1.0
    const part = makePart({ length: 60, width: 4 })
    expect(decimalBoardsForPart(part, 6, 96)).toBeCloseTo(1.0)
  })

  it('returns 3.0 for bug-report case: part 24x6 with boardWidth=2, boardLength=36', () => {
    // strips=ceil(6/2)=3, stripsPerBoard=floor(36/24)=1, decimal=3/1=3.0
    const part = makePart({ length: 24, width: 6 })
    expect(decimalBoardsForPart(part, 2, 36)).toBeCloseTo(3.0)
  })
})

describe('glueUpBoardCount', () => {
  it('returns 1 when part width equals board width and fits once per board', () => {
    expect(glueUpBoardCount(6, 6, 24, 96)).toBe(1)
  })

  it('returns 2 when strips exceed stripsPerBoard', () => {
    // strips=2, stripsPerBoard=floor(96/60)=1, boardsToBuy=2
    expect(glueUpBoardCount(8, 6, 60, 96)).toBe(2)
  })

  it('returns 1 for part narrower than board', () => {
    expect(glueUpBoardCount(3, 6, 24, 96)).toBe(1)
  })

  it('uses cross-cutting: wide part but short length yields 1 board', () => {
    // strips=2, stripsPerBoard=floor(96/24)=4, boardsToBuy=ceil(2/4)=1
    expect(glueUpBoardCount(8, 6, 24, 96)).toBe(1)
  })

  it('accounts for partial strip sets across boards', () => {
    // strips=2, stripsPerBoard=floor(48/24)=2, boardsToBuy=ceil(2/2)=1
    expect(glueUpBoardCount(7, 6, 24, 48)).toBe(1)
  })

  it('handles 3 strips needing 1 board via cross-cutting', () => {
    // strips=3, stripsPerBoard=floor(96/24)=4, boardsToBuy=ceil(3/4)=1
    expect(glueUpBoardCount(13, 6, 24, 96)).toBe(1)
  })
})

describe('toNominalSize', () => {
  it('matches 1.5 x 3.5 to 2x4', () => expect(toNominalSize(1.5, 3.5)).toBe('2x4'))
  it('matches 1.5 x 5.5 to 2x6', () => expect(toNominalSize(1.5, 5.5)).toBe('2x6'))
  it('matches 1.5 x 7.25 to 2x8', () => expect(toNominalSize(1.5, 7.25)).toBe('2x8'))
  it('matches 1.5 x 9.25 to 2x10', () => expect(toNominalSize(1.5, 9.25)).toBe('2x10'))
  it('matches 1.5 x 11.25 to 2x12', () => expect(toNominalSize(1.5, 11.25)).toBe('2x12'))
  it('matches 0.75 x 1.5 to 1x2', () => expect(toNominalSize(0.75, 1.5)).toBe('1x2'))
  it('matches 0.75 x 3.5 to 1x4', () => expect(toNominalSize(0.75, 3.5)).toBe('1x4'))
  it('matches 0.75 x 5.5 to 1x6', () => expect(toNominalSize(0.75, 5.5)).toBe('1x6'))
  it('matches 0.75 x 7.25 to 1x8', () => expect(toNominalSize(0.75, 7.25)).toBe('1x8'))
  it('matches 0.75 x 9.25 to 1x10', () => expect(toNominalSize(0.75, 9.25)).toBe('1x10'))
  it('matches 0.75 x 11.25 to 1x12', () => expect(toNominalSize(0.75, 11.25)).toBe('1x12'))

  it('matches within tolerance', () => {
    expect(toNominalSize(1.52, 3.5)).toBe('2x4')
    expect(toNominalSize(1.5, 3.52)).toBe('2x4')
  })

  it('falls back to actual dimensions for unknown size', () => {
    expect(toNominalSize(2.0, 4.0)).toBe('2" × 4"')
  })
})

describe('assignBoardLength', () => {
  it('returns shortest board that fits', () => {
    expect(assignBoardLength(6, [8, 10, 12])).toBe(8)
  })

  it('returns exact match', () => {
    expect(assignBoardLength(8, [8, 10, 12])).toBe(8)
  })

  it('handles unsorted input', () => {
    expect(assignBoardLength(7, [12, 8, 10])).toBe(8)
  })

  it('returns null when nothing fits', () => {
    expect(assignBoardLength(14, [8, 10, 12])).toBeNull()
  })

  it('returns null for empty list', () => {
    expect(assignBoardLength(6, [])).toBeNull()
  })
})

describe('packSheets', () => {
  it('places a single part on one sheet', () => {
    const part = makePart({ length: 24, width: 12 })
    const result = packSheets([part], 48, 96, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements).toHaveLength(1)
    expect(result[0].placements[0].partId).toBe(part.id)
  })

  it('waste is 0 when part exactly fills sheet', () => {
    const part = makePart({ length: 48, width: 96 })
    const result = packSheets([part], 48, 96, 0)
    expect(result[0].wastePercent).toBeCloseTo(0, 5)
  })

  it('waste is non-negative', () => {
    const part = makePart({ length: 24, width: 12 })
    const result = packSheets([part], 48, 96, 0)
    expect(result[0].wastePercent).toBeGreaterThanOrEqual(0)
  })

  it('waste is <= 1', () => {
    const part = makePart({ length: 24, width: 12 })
    const result = packSheets([part], 48, 96, 0)
    expect(result[0].wastePercent).toBeLessThanOrEqual(1)
  })

  it('opens a second sheet when first is full', () => {
    // Two parts that together don't fit on one sheet
    const p1 = makePart({ id: 'p1', length: 48, width: 48 })
    const p2 = makePart({ id: 'p2', length: 48, width: 48 })
    const result = packSheets([p1, p2], 48, 48, 0)
    expect(result).toHaveLength(2)
  })

  it('packs multiple parts into one sheet before opening second', () => {
    // Four 12x24 parts should fit in a 48x96 sheet
    const parts = [
      makePart({ id: 'a', length: 12, width: 24 }),
      makePart({ id: 'b', length: 12, width: 24 }),
      makePart({ id: 'c', length: 12, width: 24 }),
      makePart({ id: 'd', length: 12, width: 24 }),
    ]
    const result = packSheets(parts, 48, 96, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements).toHaveLength(4)
  })

  it('uses rotation when it helps fit', () => {
    // A 40x10 part won't fit normally in a 15x48 sheet but rotated (10x40) will
    const part = makePart({ length: 40, width: 10 })
    const result = packSheets([part], 15, 48, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements[0].rotated).toBe(true)
  })

  it('places oversized part alone when it exceeds sheet dimensions', () => {
    const big = makePart({ length: 60, width: 60 })
    const result = packSheets([big], 48, 96, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements).toHaveLength(1)
    expect(result[0].placements[0].partId).toBe(big.id)
  })

  it('handles empty parts list', () => {
    const result = packSheets([], 48, 96, 0)
    expect(result).toHaveLength(0)
  })

  it('accounts for gap/kerf between parts', () => {
    // With gap=0.125, two 23.9375" parts fit: 23.9375 + 0.125 + 23.9375 = 48.0 ≤ 48
    const p1 = makePart({ id: 'p1', length: 23.9375, width: 10 })
    const p2 = makePart({ id: 'p2', length: 23.9375, width: 10 })
    const result = packSheets([p1, p2], 48, 20, 0.125)
    expect(result).toHaveLength(1)

    // Two 24.001" parts should NOT fit: 24.001 + 0.125 + 24.001 = 48.127 > 48
    const q1 = makePart({ id: 'q1', length: 24.001, width: 10 })
    const q2 = makePart({ id: 'q2', length: 24.001, width: 10 })
    const result2 = packSheets([q1, q2], 48, 20, 0.125)
    expect(result2).toHaveLength(2)
  })
})

describe('packSheets — MAXRECTS improvement', () => {
  it('L-shaped residual: large + two medium parts all fit on one sheet', () => {
    // Sheet 48×96. Place a 36×96 part — fills left 36" leaving a 12×96 strip on the right.
    // Two 12×48 parts should both fit in that right strip.
    const p1 = makePart({ id: 'p1', length: 36, width: 96 })
    const p2 = makePart({ id: 'p2', length: 12, width: 48 })
    const p3 = makePart({ id: 'p3', length: 12, width: 48 })
    const result = packSheets([p1, p2, p3], 48, 96, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements).toHaveLength(3)
  })

  it('corner packing: three 24×48 parts fit on a 48×96 sheet', () => {
    const p1 = makePart({ id: 'p1', length: 24, width: 48 })
    const p2 = makePart({ id: 'p2', length: 24, width: 48 })
    const p3 = makePart({ id: 'p3', length: 24, width: 48 })
    const result = packSheets([p1, p2, p3], 48, 96, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements).toHaveLength(3)
  })

  it('part exactly filling sheet height fits rotated instead of falling back to unrotated', () => {
    // A 48×6 part on a 24×48 sheet with gap=0.125: rotated it needs 48+gap=48.125 in the height
    // dimension. Before the fix, 48.125 > 48 failed the check, causing an unrotated fallback.
    // After the fix (freeRect height = sheetHeight + gap = 48.125), the check passes.
    const big = makePart({ id: 'big', length: 48, width: 6 })
    const result = packSheets([big], 24, 48, 0.125)
    expect(result).toHaveLength(1)
    const placement = result[0].placements[0]
    expect(placement.rotated).toBe(true)
    expect(placement.length).toBe(6)
    expect(placement.width).toBe(48)
  })
})

describe('packSheets — edge cases', () => {
  // Test 5 — Square part: rotation not attempted
  it('square part uses only one orientation (rotated === false)', () => {
    const part = makePart({ id: 'sq', length: 24, width: 24 })
    const result = packSheets([part], 48, 48, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements[0].rotated).toBe(false)
  })

  // Test 6 — Part larger than sheet in both orientations: oversized fallback
  it('oversized part fires fallback path and lands at x=0, y=0 with rotated false', () => {
    const gap = 0.125
    const part = makePart({ id: 'big', length: 60, width: 60 })
    const result = packSheets([part], 48, 48, gap)
    expect(result).toHaveLength(1)
    expect(result[0].placements).toHaveLength(1)
    const p = result[0].placements[0]
    expect(p.x).toBe(0)
    expect(p.y).toBe(0)
    expect(p.rotated).toBe(false)
  })

  // Test 8 — No overlaps between any two placements
  it('no two placements overlap when packing multiple parts onto one large sheet', () => {
    const parts = [
      makePart({ id: 'a', length: 30, width: 20 }),
      makePart({ id: 'b', length: 25, width: 15 }),
      makePart({ id: 'c', length: 20, width: 10 }),
      makePart({ id: 'd', length: 18, width: 12 }),
      makePart({ id: 'e', length: 15, width: 10 }),
      makePart({ id: 'f', length: 10, width: 8 }),
    ]
    const result = packSheets(parts, 96, 96, 0)
    // All parts should land on one sheet
    expect(result).toHaveLength(1)
    const placements = result[0].placements
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const a = placements[i]
        const b = placements[j]
        const overlaps =
          a.x < b.x + b.length &&
          a.x + a.length > b.x &&
          a.y < b.y + b.width &&
          a.y + a.width > b.y
        expect(overlaps).toBe(false)
      }
    }
  })

  // Test 9 — Sort by area descending: large part placed first
  it('places larger-area part first (placements[0] is the larger part)', () => {
    const small = makePart({ id: 'small', length: 6, width: 6 })
    const large = makePart({ id: 'large', length: 36, width: 48 })
    const result = packSheets([small, large], 48, 96, 0)
    expect(result).toHaveLength(1)
    expect(result[0].placements[0].partId).toBe('large')
  })

  // Test 10 — Gap between adjacent parts
  it('right edge of left part + gap equals left edge of right part when placed side by side', () => {
    const gap = 0.125
    const p1 = makePart({ id: 'p1', length: 20, width: 20 })
    const p2 = makePart({ id: 'p2', length: 20, width: 20 })
    const result = packSheets([p1, p2], 48, 20, gap)
    expect(result).toHaveLength(1)
    const placements = result[0].placements
    const left = placements.reduce((a, b) => (a.x < b.x ? a : b))
    const right = placements.reduce((a, b) => (a.x > b.x ? a : b))
    expect(left.x + left.length + gap).toBeCloseTo(right.x, 2)
  })

  // Test 11 — First placement coordinates when gap > 0
  it('first placement on a fresh sheet has x === 0 and y === 0', () => {
    const gap = 0.125
    const part = makePart({ id: 'p', length: 12, width: 8 })
    const result = packSheets([part], 48, 96, gap)
    expect(result).toHaveLength(1)
    const p = result[0].placements[0]
    expect(p.x).toBe(0)
    expect(p.y).toBe(0)
  })

  // Test 12 — Two full-sheet parts yield exactly 2 sheets
  it('two parts each exactly filling the sheet land on separate sheets', () => {
    const p1 = makePart({ id: 'p1', length: 48, width: 96 })
    const p2 = makePart({ id: 'p2', length: 48, width: 96 })
    const result = packSheets([p1, p2], 48, 96, 0)
    expect(result).toHaveLength(2)
  })

  // Test 13 — Oversized part alone; remaining normals pack together
  it('oversized part lands alone and three normal parts share one other sheet (2 total)', () => {
    const oversized = makePart({ id: 'big', length: 60, width: 60 })
    const n1 = makePart({ id: 'n1', length: 20, width: 20 })
    const n2 = makePart({ id: 'n2', length: 20, width: 20 })
    const n3 = makePart({ id: 'n3', length: 20, width: 20 })
    const result = packSheets([oversized, n1, n2, n3], 48, 48, 0)
    expect(result).toHaveLength(2)
    // Oversized is placed alone
    const bigSheet = result.find(s => s.placements.some(p => p.partId === 'big'))!
    expect(bigSheet.placements).toHaveLength(1)
    // All three normals share the other sheet
    const normalSheet = result.find(s => s.placements.some(p => p.partId === 'n1'))!
    expect(normalSheet.placements).toHaveLength(3)
  })

  // Test 14 — wastePercent reflects actual unused area
  it('wastePercent is ~0.5 when part covers half the sheet area', () => {
    const part = makePart({ id: 'p', length: 48, width: 48 })
    const result = packSheets([part], 48, 96, 0)
    expect(result).toHaveLength(1)
    expect(result[0].wastePercent).toBeCloseTo(0.5, 3)
  })

  // Test 15 — wastePercent clamped to 0 for oversized part
  it('wastePercent is clamped to 0 when oversized part exceeds sheet area', () => {
    const part = makePart({ id: 'big', length: 60, width: 60 })
    const result = packSheets([part], 48, 48, 0)
    expect(result).toHaveLength(1)
    expect(result[0].wastePercent).toBe(0)
  })
})

describe('packSheets -- boundary overflow regression', () => {
  // Two near-full-width parts must not overflow the sheet
  it('two exact-fit parts stay within sheet boundary', () => {
    const gap = 0.125
    const sheetWidth = 48
    const sheetHeight = 20
    const p1 = makePart({ id: 'p1', length: 23.9375, width: 10 })
    const p2 = makePart({ id: 'p2', length: 23.9375, width: 10 })
    const result = packSheets([p1, p2], sheetWidth, sheetHeight, gap)
    expect(result).toHaveLength(1)
    for (const sheet of result) {
      for (const p of sheet.placements) {
        expect(p.x + p.length).toBeLessThanOrEqual(sheetWidth)
        expect(p.y + p.width).toBeLessThanOrEqual(sheetHeight)
      }
    }
  })

  // First part starts at origin even when gap > 0
  it('first part starts at x=0, y=0 when gap is non-zero', () => {
    const gap = 0.25
    const part = makePart({ id: 'p', length: 12, width: 8 })
    const result = packSheets([part], 48, 96, gap)
    expect(result).toHaveLength(1)
    const p = result[0].placements[0]
    expect(p.x).toBe(0)
    expect(p.y).toBe(0)
  })

  // No placement overflows sheet boundary with multiple parts
  it('no placement overflows sheet boundary when packing 6 varied parts', () => {
    const gap = 0.125
    const sheetWidth = 96
    const sheetHeight = 48
    const parts = [
      makePart({ id: 'a', length: 30, width: 20 }),
      makePart({ id: 'b', length: 25, width: 15 }),
      makePart({ id: 'c', length: 40, width: 10 }),
      makePart({ id: 'd', length: 18, width: 18 }),
      makePart({ id: 'e', length: 50, width: 12 }),
      makePart({ id: 'f', length: 22, width: 30 }),
    ]
    const result = packSheets(parts, sheetWidth, sheetHeight, gap)
    for (const sheet of result) {
      for (const p of sheet.placements) {
        expect(p.x + p.length).toBeLessThanOrEqual(sheetWidth)
        expect(p.y + p.width).toBeLessThanOrEqual(sheetHeight)
      }
    }
  })
})

describe('packHardwood', () => {
  it('single part fitting in one board: 1 strip x 24" in 96" board → 1 board', () => {
    const part = makePart({ id: 'p1', length: 24, width: 4, materialType: 'hardwood' })
    const result = packHardwood([part], 6, 96)
    expect(result.totalBoards).toBe(1)
    expect(result.partBoardCounts.get('p1')).toBe(1)
  })

  it('two parts of length 60" share board 1 then need board 2: totalBoards = 2', () => {
    const p1 = makePart({ id: 'p1', length: 60, width: 4, materialType: 'hardwood' })
    const p2 = makePart({ id: 'p2', length: 60, width: 4, materialType: 'hardwood' })
    // board 0: strip 60" (remaining 36), strip 2: 60 > 36 → board 1
    const result = packHardwood([p1, p2], 6, 96)
    expect(result.totalBoards).toBe(2)
    expect(result.partBoardCounts.get('p1')).toBe(1)
    expect(result.partBoardCounts.get('p2')).toBe(1)
  })

  it('two parts sharing a board: lengths 36" and 48" both fit in 96" board → 1 board total', () => {
    const p1 = makePart({ id: 'p1', length: 48, width: 4, materialType: 'hardwood' })
    const p2 = makePart({ id: 'p2', length: 36, width: 4, materialType: 'hardwood' })
    const result = packHardwood([p1, p2], 6, 96)
    expect(result.totalBoards).toBe(1)
    expect(result.partBoardCounts.get('p1')).toBe(1)
    expect(result.partBoardCounts.get('p2')).toBe(1)
  })

  it('glue-up strip expansion: part width 8", boardWidth 6" → 2 strips both fit in one 96" board', () => {
    const part = makePart({ id: 'p1', length: 24, width: 8, materialType: 'hardwood' })
    // strips = ceil(8/6) = 2, each 24"; board 0 can hold both (72 remaining after first)
    const result = packHardwood([part], 6, 96)
    expect(result.totalBoards).toBe(1)
    expect(result.partBoardCounts.get('p1')).toBe(1)
  })

  it('part board count spans multiple boards when strips do not all fit on one board', () => {
    // width 13, boardWidth 6 → 3 strips of length 40"; board 0: strips 1+2 (remaining 56→16), board 1: strip 3
    const part = makePart({ id: 'p1', length: 40, width: 13, materialType: 'hardwood' })
    const result = packHardwood([part], 6, 96)
    expect(result.totalBoards).toBe(2)
    expect(result.partBoardCounts.get('p1')).toBe(2)
  })

  it('returns totalBoards 0 and empty map for empty parts list', () => {
    const result = packHardwood([], 6, 96)
    expect(result.totalBoards).toBe(0)
    expect(result.partBoardCounts.size).toBe(0)
  })
})
