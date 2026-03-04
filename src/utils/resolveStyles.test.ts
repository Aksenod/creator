import { describe, it, expect } from 'vitest'
import { resolveStyles, isOverriddenOnBp, isInheritedFromBp } from './resolveStyles'
import type { CanvasElement } from '../types'

function makeElement(overrides?: Partial<CanvasElement>): CanvasElement {
  return {
    id: 'el1',
    type: 'div',
    tag: 'div',
    name: 'Test',
    children: [],
    styles: { width: '200px', height: '100px' },
    breakpointStyles: {},
    ...overrides,
  } as CanvasElement
}

describe('resolveStyles', () => {
  it('returns base styles for desktop', () => {
    const el = makeElement()
    const result = resolveStyles(el, 'desktop')
    expect(result.width).toBe('200px')
  })

  it('returns base styles when no breakpointStyles', () => {
    const el = makeElement({ breakpointStyles: undefined })
    const result = resolveStyles(el, 'tablet')
    expect(result.width).toBe('200px')
  })

  it('applies tablet override', () => {
    const el = makeElement({
      breakpointStyles: { tablet: { width: '100%' } },
    })
    const result = resolveStyles(el, 'tablet')
    expect(result.width).toBe('100%')
    expect(result.height).toBe('100px') // inherited from base
  })

  it('mobile inherits tablet override', () => {
    const el = makeElement({
      breakpointStyles: { tablet: { width: '100%' } },
    })
    const result = resolveStyles(el, 'mobile')
    expect(result.width).toBe('100%')
  })

  it('cascade: laptop → tablet → mobile', () => {
    const el = makeElement({
      breakpointStyles: {
        laptop: { width: '80%' },
        tablet: { height: '50px' },
        mobile: { width: '100%' },
      },
    })
    // laptop: width=80%, height=100px
    expect(resolveStyles(el, 'laptop').width).toBe('80%')
    expect(resolveStyles(el, 'laptop').height).toBe('100px')

    // tablet: width=80% (from laptop), height=50px
    expect(resolveStyles(el, 'tablet').width).toBe('80%')
    expect(resolveStyles(el, 'tablet').height).toBe('50px')

    // mobile: width=100% (own), height=50px (from tablet)
    expect(resolveStyles(el, 'mobile').width).toBe('100%')
    expect(resolveStyles(el, 'mobile').height).toBe('50px')
  })

  it('does not mutate original styles', () => {
    const el = makeElement({
      breakpointStyles: { tablet: { width: '100%' } },
    })
    resolveStyles(el, 'tablet')
    expect(el.styles.width).toBe('200px')
  })
})

describe('isOverriddenOnBp', () => {
  it('returns false for desktop', () => {
    const el = makeElement()
    expect(isOverriddenOnBp(el, 'width', 'desktop')).toBe(false)
  })

  it('returns true when prop is set on current bp', () => {
    const el = makeElement({
      breakpointStyles: { tablet: { width: '100%' } },
    })
    expect(isOverriddenOnBp(el, 'width', 'tablet')).toBe(true)
  })

  it('returns false when prop is not set on current bp', () => {
    const el = makeElement({
      breakpointStyles: { tablet: { height: '50px' } },
    })
    expect(isOverriddenOnBp(el, 'width', 'tablet')).toBe(false)
  })

  it('returns false when no breakpointStyles', () => {
    const el = makeElement({ breakpointStyles: undefined })
    expect(isOverriddenOnBp(el, 'width', 'tablet')).toBe(false)
  })
})

describe('isInheritedFromBp', () => {
  it('returns false for desktop', () => {
    const el = makeElement()
    expect(isInheritedFromBp(el, 'width', 'desktop')).toBe(false)
  })

  it('returns true when prop exists in base but not on current bp', () => {
    const el = makeElement()
    expect(isInheritedFromBp(el, 'width', 'tablet')).toBe(true)
  })

  it('returns false when prop is overridden on current bp', () => {
    const el = makeElement({
      breakpointStyles: { tablet: { width: '100%' } },
    })
    expect(isInheritedFromBp(el, 'width', 'tablet')).toBe(false)
  })

  it('returns true when inherited from intermediate bp', () => {
    const el = makeElement({
      styles: { width: '200px', height: '100px' },
      breakpointStyles: { laptop: { width: '80%' } },
    })
    // mobile: width inherited from laptop (intermediate), not overridden on mobile
    expect(isInheritedFromBp(el, 'width', 'mobile')).toBe(true)
  })
})
