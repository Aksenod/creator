import { describe, it, expect } from 'vitest'
import { getArtboardOutline, getArtboardLabelColor, getArtboardLabelWeight } from './artboardStyles'

describe('getArtboardOutline', () => {
  it('active artboard → thin dark outline', () => {
    expect(getArtboardOutline(true, false)).toBe('1px solid #0a0a0a')
  })
  it('active takes priority over selected', () => {
    expect(getArtboardOutline(true, true)).toBe('1px solid #0a0a0a')
  })
  it('selected (not active) → blue outline', () => {
    expect(getArtboardOutline(false, true)).toBe('2px solid #0066ff')
  })
  it('neither active nor selected → no outline', () => {
    expect(getArtboardOutline(false, false)).toBeUndefined()
  })
})

describe('getArtboardLabelColor', () => {
  it('active → dark', () => {
    expect(getArtboardLabelColor(true)).toBe('#0a0a0a')
  })
  it('not active → gray', () => {
    expect(getArtboardLabelColor(false)).toBe('#555')
  })
})

describe('getArtboardLabelWeight', () => {
  it('active → semibold', () => {
    expect(getArtboardLabelWeight(true)).toBe(600)
  })
  it('not active → normal', () => {
    expect(getArtboardLabelWeight(false)).toBe(400)
  })
})
