import { describe, it, expect } from 'vitest'
import { getCascadeChain } from './breakpoints'

describe('getCascadeChain', () => {
  it('desktop returns empty chain', () => {
    expect(getCascadeChain('desktop')).toEqual([])
  })
  it('laptop returns [laptop]', () => {
    expect(getCascadeChain('laptop')).toEqual(['laptop'])
  })
  it('tablet returns [laptop, tablet]', () => {
    expect(getCascadeChain('tablet')).toEqual(['laptop', 'tablet'])
  })
  it('mobile returns [laptop, tablet, mobile]', () => {
    expect(getCascadeChain('mobile')).toEqual(['laptop', 'tablet', 'mobile'])
  })
})
