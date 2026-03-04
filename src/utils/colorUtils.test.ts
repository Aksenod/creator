import { describe, it, expect } from 'vitest'
import {
  clamp,
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  hexToHsv,
  hsvToHex,
  isValidHex,
} from './colorUtils'

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })
  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
  it('handles equal min and max', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })
  it('handles negative ranges', () => {
    expect(clamp(0, -10, -5)).toBe(-5)
  })
})

describe('hexToRgb', () => {
  it('converts 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })
  it('converts without #', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 })
  })
  it('converts 3-digit hex', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
  })
  it('converts black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })
  it('converts white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
  })
  it('handles mixed case', () => {
    expect(hexToRgb('#FfAaBb')).toEqual({ r: 255, g: 170, b: 187 })
  })
})

describe('rgbToHex', () => {
  it('converts red', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
  })
  it('converts black', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
  })
  it('clamps values above 255', () => {
    expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000')
  })
  it('clamps negative values', () => {
    expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe('#000000')
  })
  it('rounds fractional values', () => {
    expect(rgbToHex({ r: 127.6, g: 0, b: 0 })).toBe('#800000')
  })
})

describe('rgbToHsv / hsvToRgb roundtrip', () => {
  const colors = [
    { r: 255, g: 0, b: 0 },     // red
    { r: 0, g: 255, b: 0 },     // green
    { r: 0, g: 0, b: 255 },     // blue
    { r: 255, g: 255, b: 0 },   // yellow
    { r: 0, g: 255, b: 255 },   // cyan
    { r: 255, g: 0, b: 255 },   // magenta
    { r: 128, g: 128, b: 128 }, // gray
    { r: 0, g: 0, b: 0 },       // black
    { r: 255, g: 255, b: 255 }, // white
  ]

  for (const rgb of colors) {
    it(`roundtrips rgb(${rgb.r},${rgb.g},${rgb.b})`, () => {
      const hsv = rgbToHsv(rgb)
      const back = hsvToRgb(hsv)
      expect(back.r).toBeCloseTo(rgb.r, 0)
      expect(back.g).toBeCloseTo(rgb.g, 0)
      expect(back.b).toBeCloseTo(rgb.b, 0)
    })
  }
})

describe('rgbToHsv edge cases', () => {
  it('black has h=0, s=0, v=0', () => {
    const hsv = rgbToHsv({ r: 0, g: 0, b: 0 })
    expect(hsv).toEqual({ h: 0, s: 0, v: 0 })
  })
  it('white has s=0, v=1', () => {
    const hsv = rgbToHsv({ r: 255, g: 255, b: 255 })
    expect(hsv.s).toBe(0)
    expect(hsv.v).toBe(1)
  })
  it('pure red has h=0, s=1, v=1', () => {
    const hsv = rgbToHsv({ r: 255, g: 0, b: 0 })
    expect(hsv.h).toBeCloseTo(0, 1)
    expect(hsv.s).toBeCloseTo(1, 5)
    expect(hsv.v).toBeCloseTo(1, 5)
  })
})

describe('hexToHsv / hsvToHex roundtrip', () => {
  it('roundtrips #ff0000', () => {
    const hsv = hexToHsv('#ff0000')
    expect(hsvToHex(hsv)).toBe('#ff0000')
  })
  it('roundtrips #336699', () => {
    const hsv = hexToHsv('#336699')
    expect(hsvToHex(hsv)).toBe('#336699')
  })
})

describe('isValidHex', () => {
  it('valid 6-digit with #', () => expect(isValidHex('#ff0000')).toBe(true))
  it('valid 3-digit with #', () => expect(isValidHex('#f00')).toBe(true))
  it('valid without #', () => expect(isValidHex('ff0000')).toBe(true))
  it('invalid — too short', () => expect(isValidHex('#ff')).toBe(false))
  it('invalid — too long', () => expect(isValidHex('#ff00000')).toBe(false))
  it('invalid — non-hex chars', () => expect(isValidHex('#gggggg')).toBe(false))
  it('invalid — empty', () => expect(isValidHex('')).toBe(false))
})
