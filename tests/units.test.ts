import { describe, it, expect } from 'vitest'
import { toFractionalInches, parseInches } from '../src/utils/units'

describe('toFractionalInches', () => {
  it('formats whole numbers', () => {
    expect(toFractionalInches(24)).toBe('24"')
    expect(toFractionalInches(1)).toBe('1"')
    expect(toFractionalInches(0)).toBe('0"')
  })

  it('formats mixed numbers', () => {
    expect(toFractionalInches(3.5)).toBe('3-1/2"')
    expect(toFractionalInches(5.25)).toBe('5-1/4"')
    expect(toFractionalInches(5.75)).toBe('5-3/4"')
    expect(toFractionalInches(2.125)).toBe('2-1/8"')
  })

  it('formats fractions less than 1', () => {
    expect(toFractionalInches(0.75)).toBe('3/4"')
    expect(toFractionalInches(0.5)).toBe('1/2"')
    expect(toFractionalInches(0.0625)).toBe('1/16"')
  })

  it('reduces fractions to lowest terms', () => {
    // 8/16 → 1/2, not 8/16
    expect(toFractionalInches(0.5)).toBe('1/2"')
    // 4/16 → 1/4
    expect(toFractionalInches(0.25)).toBe('1/4"')
    // 2/16 → 1/8
    expect(toFractionalInches(0.125)).toBe('1/8"')
  })

  it('uses 1/32 precision when specified', () => {
    expect(toFractionalInches(3.03125, 32)).toBe('3-1/32"')
    expect(toFractionalInches(0.03125, 32)).toBe('1/32"')
    expect(toFractionalInches(3.5, 32)).toBe('3-1/2"')
  })

  it('rounds to nearest 1/16 by default', () => {
    // 3.51 is closer to 3-1/2 (3.5) than 3-9/16 (3.5625)
    // midpoint between 3-1/2 and 3-9/16 is 3.53125; below that rounds to 3-1/2
    expect(toFractionalInches(3.51)).toBe('3-1/2"')
    expect(toFractionalInches(3.53)).toBe('3-1/2"')
    // above midpoint rounds up to 3-9/16
    expect(toFractionalInches(3.54)).toBe('3-9/16"')
  })

  it('formats board thickness (3/4")', () => {
    expect(toFractionalInches(0.75)).toBe('3/4"')
  })
})

describe('parseInches', () => {
  it('parses decimal strings', () => {
    expect(parseInches('3.5')).toBe(3.5)
    expect(parseInches('0.75')).toBe(0.75)
    expect(parseInches('24')).toBe(24)
    expect(parseInches('12')).toBe(12)
  })

  it('parses fractions only', () => {
    expect(parseInches('1/2')).toBe(0.5)
    expect(parseInches('3/4')).toBe(0.75)
    expect(parseInches('1/16')).toBe(0.0625)
  })

  it('parses mixed numbers with hyphen', () => {
    expect(parseInches('3-1/2')).toBe(3.5)
    expect(parseInches('5-3/4')).toBe(5.75)
    expect(parseInches('2-1/8')).toBe(2.125)
  })

  it('parses mixed numbers with space', () => {
    expect(parseInches('3 1/2')).toBe(3.5)
    expect(parseInches('5 3/4')).toBe(5.75)
  })

  it('trims whitespace', () => {
    expect(parseInches('  3.5  ')).toBe(3.5)
    expect(parseInches('  3-1/2  ')).toBe(3.5)
  })

  it('round-trips with toFractionalInches', () => {
    const values = [0.5, 0.75, 3.5, 5.25, 24, 12.0625]
    for (const v of values) {
      const displayed = toFractionalInches(v)
      // strip trailing " before parsing
      const stripped = displayed.slice(0, -1)
      expect(parseInches(stripped)).toBeCloseTo(v, 6)
    }
  })

  it('throws on invalid input', () => {
    expect(() => parseInches('abc')).toThrow()
    expect(() => parseInches('')).toThrow()
    expect(() => parseInches('3-1/0')).toThrow()
  })
})
