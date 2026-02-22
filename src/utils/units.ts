function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * Converts decimal inches to fractional display string.
 * Examples: 3.5 → "3-1/2"", 0.75 → "3/4"", 24 → "24""
 */
export function toFractionalInches(inches: number, precision: 16 | 32 = 16): string {
  const totalUnits = Math.round(inches * precision)
  const wholeUnits = Math.floor(totalUnits / precision)
  const remainderUnits = totalUnits % precision

  if (remainderUnits === 0) {
    return `${wholeUnits}"`
  }

  const divisor = gcd(remainderUnits, precision)
  const numerator = remainderUnits / divisor
  const denominator = precision / divisor

  if (wholeUnits === 0) {
    return `${numerator}/${denominator}"`
  }

  return `${wholeUnits}-${numerator}/${denominator}"`
}

/**
 * Parses user-entered inch strings to decimal inches.
 * Accepts: "3.5", "3-1/2", "3 1/2", "1/2", "24"
 * Throws on unparseable input.
 */
export function parseInches(input: string): number {
  const trimmed = input.trim()

  // Decimal: "3.5"
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed)
  }

  // Fraction only: "1/2"
  const fractionOnly = /^(\d+)\/(\d+)$/.exec(trimmed)
  if (fractionOnly) {
    const num = parseInt(fractionOnly[1], 10)
    const den = parseInt(fractionOnly[2], 10)
    if (den === 0) throw new Error(`Invalid input: "${input}"`)
    return num / den
  }

  // Mixed number with hyphen or space: "3-1/2" or "3 1/2"
  const mixed = /^(\d+)[-\s](\d+)\/(\d+)$/.exec(trimmed)
  if (mixed) {
    const whole = parseInt(mixed[1], 10)
    const num = parseInt(mixed[2], 10)
    const den = parseInt(mixed[3], 10)
    if (den === 0) throw new Error(`Invalid input: "${input}"`)
    return whole + num / den
  }

  throw new Error(`Invalid input: "${input}"`)
}
