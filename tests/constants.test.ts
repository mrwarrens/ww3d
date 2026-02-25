import { describe, it, expect } from 'vitest'
import { SNAP_INCREMENT, snapToGrid } from '../src/utils/constants'

describe('SNAP_INCREMENT', () => {
  it('is 1/16 inch', () => {
    expect(SNAP_INCREMENT).toBeCloseTo(0.0625)
  })
})

describe('snapToGrid', () => {
  it('leaves exact grid values unchanged', () => {
    expect(snapToGrid(0)).toBeCloseTo(0)
    expect(snapToGrid(0.0625)).toBeCloseTo(0.0625)
    expect(snapToGrid(0.5)).toBeCloseTo(0.5)
    expect(snapToGrid(1.0)).toBeCloseTo(1.0)
    expect(snapToGrid(12.0)).toBeCloseTo(12.0)
  })

  it('rounds down when below the midpoint', () => {
    expect(snapToGrid(0.03)).toBeCloseTo(0)        // 0.03 < 0.03125 midpoint
    expect(snapToGrid(0.09)).toBeCloseTo(0.0625)   // 0.09 < 0.09375 midpoint
  })

  it('rounds up when at or above the midpoint', () => {
    expect(snapToGrid(0.032)).toBeCloseTo(0.0625)  // 0.032 >= 0.03125 midpoint
    expect(snapToGrid(0.1)).toBeCloseTo(0.125)     // 0.1 >= 0.09375 midpoint
  })

  it('snaps negative values correctly', () => {
    expect(snapToGrid(-0.03)).toBeCloseTo(0)
    expect(snapToGrid(-0.04)).toBeCloseTo(-0.0625)
  })

  it('snaps a non-trivial value correctly', () => {
    // 1.1 is between 1.0625 and 1.125; midpoint is 1.09375 so rounds up
    expect(snapToGrid(1.1)).toBeCloseTo(1.125)
    // 1.08 is below midpoint 1.09375 so rounds down
    expect(snapToGrid(1.08)).toBeCloseTo(1.0625)
  })
})
