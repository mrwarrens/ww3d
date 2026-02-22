import { describe, it, expect } from 'vitest'
import { createPart } from '../src/models/Part'

const baseInit = {
  length: 12,
  width: 6,
  position: { x: 0, y: 0.375, z: 0 },
}

describe('createPart', () => {
  it('returns a Part with all required fields', () => {
    const part = createPart(baseInit)
    expect(part).toHaveProperty('id')
    expect(part).toHaveProperty('name')
    expect(part).toHaveProperty('length')
    expect(part).toHaveProperty('width')
    expect(part).toHaveProperty('thickness')
    expect(part).toHaveProperty('position')
    expect(part).toHaveProperty('rotation')
    expect(part).toHaveProperty('color')
  })

  it('generates a non-empty string id', () => {
    const part = createPart(baseInit)
    expect(typeof part.id).toBe('string')
    expect(part.id.length).toBeGreaterThan(0)
  })

  it('generates unique ids for each call', () => {
    const a = createPart(baseInit)
    const b = createPart(baseInit)
    expect(a.id).not.toBe(b.id)
  })

  it('preserves provided length and width', () => {
    const part = createPart({ ...baseInit, length: 24, width: 8 })
    expect(part.length).toBe(24)
    expect(part.width).toBe(8)
  })

  it('preserves provided position', () => {
    const pos = { x: 3, y: 0.375, z: -2 }
    const part = createPart({ ...baseInit, position: pos })
    expect(part.position).toEqual(pos)
  })

  it('defaults thickness to 0.75', () => {
    const part = createPart(baseInit)
    expect(part.thickness).toBe(0.75)
  })

  it('uses provided thickness when given', () => {
    const part = createPart({ ...baseInit, thickness: 1.5 })
    expect(part.thickness).toBe(1.5)
  })

  it('defaults name to "Board"', () => {
    const part = createPart(baseInit)
    expect(part.name).toBe('Board')
  })

  it('uses provided name when given', () => {
    const part = createPart({ ...baseInit, name: 'Side Panel' })
    expect(part.name).toBe('Side Panel')
  })

  it('defaults rotation to zero on all axes', () => {
    const part = createPart(baseInit)
    expect(part.rotation).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('uses provided rotation when given', () => {
    const rot = { x: 0, y: Math.PI / 2, z: 0 }
    const part = createPart({ ...baseInit, rotation: rot })
    expect(part.rotation).toEqual(rot)
  })

  it('defaults color to a non-empty string', () => {
    const part = createPart(baseInit)
    expect(typeof part.color).toBe('string')
    expect(part.color.length).toBeGreaterThan(0)
  })

  it('uses provided color when given', () => {
    const part = createPart({ ...baseInit, color: '#ff0000' })
    expect(part.color).toBe('#ff0000')
  })
})
