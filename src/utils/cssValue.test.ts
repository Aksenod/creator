import { describe, it, expect } from 'vitest'
import { parseCssValue, composeCssValue } from '../components/Properties/shared/FigmaInput'

describe('parseCssValue', () => {
  it('parses px value', () => {
    expect(parseCssValue('100px')).toEqual({ num: '100', unit: 'px' })
  })
  it('parses % value', () => {
    expect(parseCssValue('50%')).toEqual({ num: '50', unit: '%' })
  })
  it('parses vw value', () => {
    expect(parseCssValue('10vw')).toEqual({ num: '10', unit: 'vw' })
  })
  it('parses vh value', () => {
    expect(parseCssValue('20vh')).toEqual({ num: '20', unit: 'vh' })
  })
  it('parses em value', () => {
    expect(parseCssValue('1.5em')).toEqual({ num: '1.5', unit: 'em' })
  })
  it('parses rem value', () => {
    expect(parseCssValue('2rem')).toEqual({ num: '2', unit: 'rem' })
  })
  it('parses auto', () => {
    expect(parseCssValue('auto')).toEqual({ num: '', unit: 'auto' })
  })
  it('parses none', () => {
    expect(parseCssValue('none')).toEqual({ num: '', unit: 'none' })
  })
  it('parses undefined', () => {
    expect(parseCssValue(undefined)).toEqual({ num: '', unit: 'auto' })
  })
  it('parses empty string', () => {
    expect(parseCssValue('')).toEqual({ num: '', unit: 'auto' })
  })
  it('parses bare number as px', () => {
    expect(parseCssValue('200')).toEqual({ num: '200', unit: 'px' })
  })
  it('parses negative value', () => {
    expect(parseCssValue('-10px')).toEqual({ num: '-10', unit: 'px' })
  })
  it('parses decimal value', () => {
    expect(parseCssValue('0.5%')).toEqual({ num: '0.5', unit: '%' })
  })
  it('parses zero', () => {
    expect(parseCssValue('0px')).toEqual({ num: '0', unit: 'px' })
  })
  it('parses number without unit defaults to px', () => {
    expect(parseCssValue('42')).toEqual({ num: '42', unit: 'px' })
  })
  it('returns default for non-numeric string', () => {
    expect(parseCssValue('abc')).toEqual({ num: '', unit: 'px' })
  })
  it('parses svw unit', () => {
    expect(parseCssValue('100svw')).toEqual({ num: '100', unit: 'svw' })
  })
  it('parses ch unit', () => {
    expect(parseCssValue('80ch')).toEqual({ num: '80', unit: 'ch' })
  })
})

describe('composeCssValue', () => {
  it('composes px', () => {
    expect(composeCssValue('100', 'px')).toBe('100px')
  })
  it('composes %', () => {
    expect(composeCssValue('50', '%')).toBe('50%')
  })
  it('returns auto for auto unit', () => {
    expect(composeCssValue('', 'auto')).toBe('auto')
    expect(composeCssValue('100', 'auto')).toBe('auto')
  })
  it('returns none for none unit', () => {
    expect(composeCssValue('', 'none')).toBe('none')
  })
  it('returns empty for empty num', () => {
    expect(composeCssValue('', 'px')).toBe('')
  })
  it('composes zero', () => {
    expect(composeCssValue('0', 'px')).toBe('0px')
  })
  it('composes negative', () => {
    expect(composeCssValue('-10', 'px')).toBe('-10px')
  })
  it('composes decimal', () => {
    expect(composeCssValue('1.5', 'vw')).toBe('1.5vw')
  })
})
