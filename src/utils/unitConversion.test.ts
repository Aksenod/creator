import { describe, it, expect } from 'vitest'
import { convertCssUnit, type ConvertRef } from './unitConversion'

const ref: ConvertRef = {
  percentBase: 1000, // parent = 1000px
  vwBase: 1440,      // artboard width
  vhBase: 900,       // artboard height
}

describe('convertCssUnit', () => {
  // Same unit — no conversion
  it('px → px (identity)', () => {
    expect(convertCssUnit(200, 'px', 'px', ref)).toBe(200)
  })
  it('% → % (identity)', () => {
    expect(convertCssUnit(50, '%', '%', ref)).toBe(50)
  })

  // px → other
  it('px → %', () => {
    expect(convertCssUnit(500, 'px', '%', ref)).toBe(50) // 500/1000*100
  })
  it('px → vw', () => {
    expect(convertCssUnit(720, 'px', 'vw', ref)).toBe(50) // 720/1440*100
  })
  it('px → vh', () => {
    expect(convertCssUnit(450, 'px', 'vh', ref)).toBe(50) // 450/900*100
  })

  // other → px
  it('% → px', () => {
    expect(convertCssUnit(50, '%', 'px', ref)).toBe(500) // 50*1000/100
  })
  it('vw → px', () => {
    expect(convertCssUnit(100, 'vw', 'px', ref)).toBe(1440)
  })
  it('vh → px', () => {
    expect(convertCssUnit(100, 'vh', 'px', ref)).toBe(900)
  })

  // cross conversion (from → px → to)
  it('% → vw', () => {
    // 50% of 1000px = 500px → 500/1440*100 = 34.72
    expect(convertCssUnit(50, '%', 'vw', ref)).toBe(34.72)
  })
  it('vw → %', () => {
    // 50vw = 720px → 720/1000*100 = 72%
    expect(convertCssUnit(50, 'vw', '%', ref)).toBe(72)
  })
  it('vh → vw', () => {
    // 50vh = 450px → 450/1440*100 = 31.25
    expect(convertCssUnit(50, 'vh', 'vw', ref)).toBe(31.25)
  })

  // Edge cases
  it('zero value', () => {
    expect(convertCssUnit(0, 'px', '%', ref)).toBe(0)
  })
  it('negative value', () => {
    expect(convertCssUnit(-100, 'px', '%', ref)).toBe(-10)
  })
  it('decimal value', () => {
    expect(convertCssUnit(1.5, 'px', '%', ref)).toBe(0.15)
  })

  // Division by zero protection (percentBase = 0)
  it('px → % with zero percentBase falls back to px value', () => {
    const zeroRef: ConvertRef = { percentBase: 0, vwBase: 1440, vhBase: 900 }
    expect(convertCssUnit(200, 'px', '%', zeroRef)).toBe(200)
  })
  it('px → vw with zero vwBase falls back to px value', () => {
    const zeroRef: ConvertRef = { percentBase: 1000, vwBase: 0, vhBase: 900 }
    expect(convertCssUnit(200, 'px', 'vw', zeroRef)).toBe(200)
  })
  it('px → vh with zero vhBase falls back to px value', () => {
    const zeroRef: ConvertRef = { percentBase: 1000, vwBase: 1440, vhBase: 0 }
    expect(convertCssUnit(200, 'px', 'vh', zeroRef)).toBe(200)
  })

  // Rounding
  it('px result is integer', () => {
    expect(convertCssUnit(33.33, '%', 'px', ref)).toBe(333) // Math.round
  })
  it('% result has max 2 decimals', () => {
    expect(convertCssUnit(333, 'px', '%', ref)).toBe(33.3)
  })

  // Large values
  it('large px → %', () => {
    expect(convertCssUnit(10000, 'px', '%', ref)).toBe(1000) // 1000%
  })
})
