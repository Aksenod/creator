import { describe, it, expect } from 'vitest'
import {
  parseTrackSizes,
  parseGridLine,
  serializeGridLine,
  isSpanOnlyValue,
  extractSpanNumber,
  getSpanString,
  spanVal,
  detectGridChildMode,
} from './gridUtils'

describe('parseTrackSizes', () => {
  it('parses single value', () => {
    expect(parseTrackSizes('100px')).toEqual([100])
  })
  it('parses multiple values', () => {
    expect(parseTrackSizes('100px 200px 50px')).toEqual([100, 200, 50])
  })
  it('returns 0 for non-px values', () => {
    expect(parseTrackSizes('1fr 2fr')).toEqual([0, 0])
  })
  it('handles empty string', () => {
    expect(parseTrackSizes('')).toEqual([])
  })
  it('handles decimal px values', () => {
    expect(parseTrackSizes('100.5px')).toEqual([100.5])
  })
  it('handles extra whitespace', () => {
    expect(parseTrackSizes('  100px   200px  ')).toEqual([100, 200])
  })
})

describe('parseGridLine', () => {
  it('returns defaults for undefined', () => {
    expect(parseGridLine(undefined)).toEqual({ start: '', end: '', isSpan: false })
  })
  it('parses single value', () => {
    expect(parseGridLine('2')).toEqual({ start: '2', end: '', isSpan: false })
  })
  it('parses start/end', () => {
    expect(parseGridLine('1 / 3')).toEqual({ start: '1', end: '3', isSpan: false })
  })
  it('parses span value', () => {
    expect(parseGridLine('1 / span 2')).toEqual({ start: '1', end: '2', isSpan: true })
  })
  it('parses span without space', () => {
    expect(parseGridLine('1 / span2')).toEqual({ start: '1', end: '2', isSpan: true })
  })
})

describe('serializeGridLine', () => {
  it('returns undefined for empty start', () => {
    expect(serializeGridLine('', '', false)).toBeUndefined()
  })
  it('returns start only when no end', () => {
    expect(serializeGridLine('2', '', false)).toBe('2')
  })
  it('serializes start/end', () => {
    expect(serializeGridLine('1', '3', false)).toBe('1 / 3')
  })
  it('serializes span', () => {
    expect(serializeGridLine('1', '2', true)).toBe('1 / span 2')
  })
  it('defaults span to 1 when end is empty', () => {
    expect(serializeGridLine('1', '', true)).toBe('1 / span 1')
  })
})

describe('isSpanOnlyValue', () => {
  it('true for undefined', () => expect(isSpanOnlyValue(undefined)).toBe(true))
  it('true for empty string', () => expect(isSpanOnlyValue('')).toBe(true))
  it('true for span 2', () => expect(isSpanOnlyValue('span 2')).toBe(true))
  it('true for span2', () => expect(isSpanOnlyValue('span2')).toBe(true))
  it('false for explicit line', () => expect(isSpanOnlyValue('1 / span 2')).toBe(false))
  it('false for just a number', () => expect(isSpanOnlyValue('2')).toBe(false))
})

describe('extractSpanNumber', () => {
  it('returns 1 for undefined', () => expect(extractSpanNumber(undefined)).toBe(1))
  it('returns 1 for empty', () => expect(extractSpanNumber('')).toBe(1))
  it('returns N from span N', () => expect(extractSpanNumber('span 3')).toBe(3))
  it('extracts from "1 / span 2"', () => expect(extractSpanNumber('1 / span 2')).toBe(2))
  it('returns 1 for plain number', () => expect(extractSpanNumber('2')).toBe(1))
})

describe('getSpanString', () => {
  it('returns "" for undefined', () => expect(getSpanString(undefined)).toBe(''))
  it('returns N for "span N"', () => expect(getSpanString('span 3')).toBe('3'))
  it('returns "" for non-span', () => expect(getSpanString('2')).toBe(''))
  it('returns "" for "1 / span 2"', () => expect(getSpanString('1 / span 2')).toBe(''))
})

describe('spanVal', () => {
  it('returns undefined for empty', () => expect(spanVal('')).toBeUndefined())
  it('returns undefined for 1', () => expect(spanVal('1')).toBeUndefined())
  it('returns "span 2" for "2"', () => expect(spanVal('2')).toBe('span 2'))
  it('returns undefined for NaN', () => expect(spanVal('abc')).toBeUndefined())
  it('returns "span 5" for "5"', () => expect(spanVal('5')).toBe('span 5'))
})

describe('detectGridChildMode', () => {
  it('auto when both undefined', () => {
    expect(detectGridChildMode(undefined, undefined)).toBe('auto')
  })
  it('auto when span only', () => {
    expect(detectGridChildMode('span 2', 'span 1')).toBe('auto')
  })
  it('manual when explicit column', () => {
    expect(detectGridChildMode('1 / 3', undefined)).toBe('manual')
  })
  it('manual when explicit row', () => {
    expect(detectGridChildMode(undefined, '2 / 4')).toBe('manual')
  })
})
