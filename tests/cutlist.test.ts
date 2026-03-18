import { describe, it, expect } from 'vitest'
import { createPart } from '../src/models/Part'
import {
  getCutListParts,
  groupByMaterialType,
  groupByThickness,
  toQuarterNotation,
  boardFeet,
  glueUpBoardCount,
  toNominalSize,
  assignBoardLength,
  packSheets,
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
    // With gap=0.125, two 23.9375" parts should NOT fit in a 48" wide sheet
    // but two 23.875" parts should fit (23.875 + 0.125 + 23.875 + 0.125 = 48)
    const p1 = makePart({ id: 'p1', length: 23.875, width: 10 })
    const p2 = makePart({ id: 'p2', length: 23.875, width: 10 })
    const result = packSheets([p1, p2], 48, 20, 0.125)
    expect(result).toHaveLength(1)
  })
})
