import { describe, it, expect } from 'vitest'
import { getCSSPosition } from './cssUtils'

describe('getCSSPosition', () => {
  it('static', () => expect(getCSSPosition('static')).toBe('static'))
  it('flow → static', () => expect(getCSSPosition('flow')).toBe('static'))
  it('relative', () => expect(getCSSPosition('relative')).toBe('relative'))
  it('absolute', () => expect(getCSSPosition('absolute')).toBe('absolute'))
  it('pinned → absolute', () => expect(getCSSPosition('pinned')).toBe('absolute'))
  it('fixed', () => expect(getCSSPosition('fixed')).toBe('fixed'))
  it('sticky', () => expect(getCSSPosition('sticky')).toBe('sticky'))
  it('unknown → static', () => expect(getCSSPosition('unknown')).toBe('static'))
  it('empty → static', () => expect(getCSSPosition('')).toBe('static'))
})
