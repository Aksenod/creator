import { describe, it, expect } from 'vitest'
import { migrateFills, fillsToCSS } from './fillUtils'
import type { SolidFill, GradientFill, ImageFill } from '../types/fills'

const solid = (color = '#ff0000', opts?: Partial<SolidFill>): SolidFill => ({
  id: '1', type: 'solid', color, opacity: 1, visible: true, blendMode: 'normal',
  ...opts,
})

const gradient = (opts?: Partial<GradientFill>): GradientFill => ({
  id: '2', type: 'gradient', gradientType: 'linear', angle: 180,
  stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }],
  opacity: 1, visible: true, blendMode: 'normal',
  ...opts,
})

const image = (url = 'https://example.com/img.jpg', opts?: Partial<ImageFill>): ImageFill => ({
  id: '3', type: 'image', url, scaleMode: 'fill', opacity: 1, visible: true, blendMode: 'normal',
  ...opts,
})

describe('migrateFills', () => {
  it('returns fills array if already present', () => {
    const fills = [solid()]
    expect(migrateFills({ fills })).toBe(fills)
  })

  it('migrates backgroundColor to solid fill', () => {
    const result = migrateFills({ backgroundColor: '#00ff00' })
    expect(result).toHaveLength(1)
    expect(result![0].type).toBe('solid')
    expect((result![0] as SolidFill).color).toBe('#00ff00')
  })

  it('returns undefined when no fills and no backgroundColor', () => {
    expect(migrateFills({})).toBeUndefined()
  })

  it('returns undefined for empty fills array', () => {
    expect(migrateFills({ fills: [] })).toBeUndefined()
  })

  it('prefers fills over backgroundColor', () => {
    const fills = [solid('#ff0000')]
    const result = migrateFills({ fills, backgroundColor: '#00ff00' })
    expect((result![0] as SolidFill).color).toBe('#ff0000')
  })
})

describe('fillsToCSS', () => {
  it('returns empty object for undefined fills', () => {
    expect(fillsToCSS(undefined)).toEqual({})
  })

  it('returns empty object for empty fills array', () => {
    expect(fillsToCSS([])).toEqual({})
  })

  it('uses fallback when no fills', () => {
    expect(fillsToCSS(undefined, '#ccc')).toEqual({ backgroundColor: '#ccc' })
  })

  it('returns backgroundColor:undefined for visible fills (clears legacy)', () => {
    const result = fillsToCSS([solid()])
    expect(result.backgroundColor).toBeUndefined()
    expect(result.backgroundImage).toBeDefined()
  })

  it('skips invisible fills', () => {
    const result = fillsToCSS([solid('#ff0000', { visible: false })])
    expect(result).toEqual({ backgroundColor: undefined })
  })

  it('handles solid fill → linear-gradient layer', () => {
    const result = fillsToCSS([solid('#ff0000')])
    expect(result.backgroundImage).toContain('linear-gradient')
    expect(result.backgroundImage).toContain('rgba(255,0,0,1)')
  })

  it('handles gradient fill', () => {
    const result = fillsToCSS([gradient()])
    expect(result.backgroundImage).toContain('linear-gradient(180deg')
  })

  it('handles radial gradient', () => {
    const result = fillsToCSS([gradient({ gradientType: 'radial' })])
    expect(result.backgroundImage).toContain('radial-gradient(circle')
  })

  it('handles image fill', () => {
    const result = fillsToCSS([image('https://example.com/img.jpg')])
    expect(result.backgroundImage).toContain('url(https://example.com/img.jpg)')
    expect(result.backgroundSize).toContain('cover')
    expect(result.backgroundRepeat).toContain('no-repeat')
  })

  it('handles image fill with fit mode', () => {
    const result = fillsToCSS([image('x.jpg', { scaleMode: 'fit' })])
    expect(result.backgroundSize).toContain('contain')
  })

  it('handles image fill with tile mode', () => {
    const result = fillsToCSS([image('x.jpg', { scaleMode: 'tile' })])
    expect(result.backgroundSize).toContain('auto')
    expect(result.backgroundRepeat).toContain('repeat')
  })

  it('stacks multiple fills', () => {
    const result = fillsToCSS([solid('#ff0000'), gradient()])
    // Both layers produce linear-gradient(...), joined by ', '
    // Count occurrences of 'linear-gradient' as layer indicator
    const layerCount = (result.backgroundImage!.match(/linear-gradient/g) || []).length
    expect(layerCount).toBe(2)
  })

  it('handles solid fill with opacity', () => {
    const result = fillsToCSS([solid('#ff0000', { opacity: 0.5 })])
    expect(result.backgroundImage).toContain('rgba(255,0,0,0.5)')
  })
})
