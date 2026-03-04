import { describe, it, expect } from 'vitest'
import { mergeClassStyles, getPropertySource } from '../resolveClassStyles'
import type { CSSClass } from '../../types/cssClass'
import type { CanvasElement } from '../../types'

const makeClass = (overrides: Partial<CSSClass> = {}): CSSClass => ({
  id: 'c1',
  name: 'test-class',
  styles: {},
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

const makeElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: 'el1',
  name: 'Element',
  type: 'div',
  positionMode: 'static',
  styles: {},
  children: [],
  ...overrides,
})

describe('mergeClassStyles', () => {
  it('returns empty object for no classes', () => {
    expect(mergeClassStyles([], 'desktop')).toEqual({})
  })

  it('returns base styles from single class', () => {
    const cls = makeClass({ styles: { width: '100px', fontSize: 16 } })
    expect(mergeClassStyles([cls], 'desktop')).toEqual({ width: '100px', fontSize: 16 })
  })

  it('merges multiple classes in order (later overrides earlier)', () => {
    const a = makeClass({ id: 'a', styles: { width: '100px', color: 'red' } })
    const b = makeClass({ id: 'b', styles: { width: '200px', fontSize: 14 } })
    const result = mergeClassStyles([a, b], 'desktop')
    expect(result.width).toBe('200px')
    expect(result.color).toBe('red')
    expect(result.fontSize).toBe(14)
  })

  it('applies breakpoint cascade for non-desktop', () => {
    const cls = makeClass({
      styles: { width: '100px' },
      breakpointStyles: {
        tablet: { width: '50%' },
      },
    })
    expect(mergeClassStyles([cls], 'tablet').width).toBe('50%')
    expect(mergeClassStyles([cls], 'desktop').width).toBe('100px')
  })

  it('breakpoint cascade is cumulative (laptop → tablet)', () => {
    const cls = makeClass({
      styles: { width: '100px', fontSize: 16 },
      breakpointStyles: {
        laptop: { fontSize: 14 },
        tablet: { width: '50%' },
      },
    })
    const result = mergeClassStyles([cls], 'tablet')
    expect(result.width).toBe('50%')
    expect(result.fontSize).toBe(14)
  })

  it('merges class breakpoint styles from multiple classes', () => {
    const a = makeClass({
      id: 'a',
      styles: { width: '100px' },
      breakpointStyles: { tablet: { width: '80%' } },
    })
    const b = makeClass({
      id: 'b',
      styles: { fontSize: 16 },
      breakpointStyles: { tablet: { fontSize: 12 } },
    })
    const result = mergeClassStyles([a, b], 'tablet')
    expect(result.width).toBe('80%')
    expect(result.fontSize).toBe(12)
  })

  it('handles undefined breakpointStyles gracefully', () => {
    const cls = makeClass({ styles: { width: '100px' } })
    expect(mergeClassStyles([cls], 'mobile').width).toBe('100px')
  })
})

describe('getPropertySource', () => {
  it('returns none when property not set anywhere', () => {
    const el = makeElement()
    expect(getPropertySource(el, 'width', 'desktop')).toBe('none')
  })

  it('returns local when set in element styles', () => {
    const el = makeElement({ styles: { width: '100px' } })
    expect(getPropertySource(el, 'width', 'desktop')).toBe('local')
  })

  it('returns local when set in element breakpointStyles', () => {
    const el = makeElement({
      breakpointStyles: { tablet: { width: '50%' } },
    })
    expect(getPropertySource(el, 'width', 'tablet')).toBe('local')
  })

  it('returns class when set only in class', () => {
    const cls = makeClass({ styles: { width: '100px' } })
    const el = makeElement({ classIds: ['c1'] })
    const cssClasses = { c1: cls }
    expect(getPropertySource(el, 'width', 'desktop', cssClasses)).toBe('class')
  })

  it('Webflow model: returns class even when el.styles also has the property', () => {
    const cls = makeClass({ styles: { width: '100px' } })
    const el = makeElement({ classIds: ['c1'], styles: { width: '200px' } })
    const cssClasses = { c1: cls }
    // With Webflow model, el.styles is ignored when classes exist
    expect(getPropertySource(el, 'width', 'desktop', cssClasses)).toBe('class')
  })

  it('returns none for property not in class when element has classIds', () => {
    const cls = makeClass({ styles: { width: '100px' } })
    const el = makeElement({ classIds: ['c1'] })
    const cssClasses = { c1: cls }
    expect(getPropertySource(el, 'fontSize', 'desktop', cssClasses)).toBe('none')
  })

  it('handles missing class IDs gracefully', () => {
    const el = makeElement({ classIds: ['nonexistent'] })
    expect(getPropertySource(el, 'width', 'desktop', {})).toBe('none')
  })

  it('returns class from breakpoint-level class styles', () => {
    const cls = makeClass({
      breakpointStyles: { tablet: { fontSize: 12 } },
    })
    const el = makeElement({ classIds: ['c1'] })
    expect(getPropertySource(el, 'fontSize', 'tablet', { c1: cls })).toBe('class')
  })
})

describe('resolveStyles with CSS classes', () => {
  // These tests use the actual resolveStyles from the main module
  // to verify end-to-end class resolution
  it('Webflow model: class styles only, el.styles ignored when classes exist', async () => {
    const { resolveStyles } = await import('../resolveStyles')

    const cls = makeClass({
      styles: { width: '100px', color: 'red' },
    })
    const el = makeElement({
      classIds: ['c1'],
      styles: { color: 'blue' }, // should be IGNORED (Webflow model)
    })

    const result = resolveStyles(el, 'desktop', { c1: cls })
    expect(result.width).toBe('100px') // from class
    expect(result.color).toBe('red')   // from class, NOT local
  })

  it('class breakpoint styles resolved, element bp ignored', async () => {
    const { resolveStyles } = await import('../resolveStyles')

    const cls = makeClass({
      styles: { width: '100px', fontSize: 16 },
      breakpointStyles: { tablet: { width: '80%' } },
    })
    const el = makeElement({
      classIds: ['c1'],
      styles: { fontSize: 14 }, // ignored
      breakpointStyles: { tablet: { fontSize: 12 } }, // ignored
    })

    const result = resolveStyles(el, 'tablet', { c1: cls })
    expect(result.width).toBe('80%')   // class breakpoint
    expect(result.fontSize).toBe(16)    // class base (el bp ignored)
  })

  it('without cssClasses param — backward compat', async () => {
    const { resolveStyles } = await import('../resolveStyles')

    const el = makeElement({
      styles: { width: '100px' },
    })
    const result = resolveStyles(el, 'desktop')
    expect(result.width).toBe('100px')
  })

  it('element without classes uses inline styles normally', async () => {
    const { resolveStyles } = await import('../resolveStyles')

    const el = makeElement({
      styles: { width: '200px', color: 'green' },
      breakpointStyles: { tablet: { width: '100%' } },
    })
    const result = resolveStyles(el, 'tablet')
    expect(result.width).toBe('100%')  // bp override
    expect(result.color).toBe('green') // base inline
  })

  it('missing class ID in cssClasses is filtered out', async () => {
    const { resolveStyles } = await import('../resolveStyles')

    const el = makeElement({
      classIds: ['nonexistent'],
      styles: { width: '100px' },
    })
    const result = resolveStyles(el, 'desktop', {})
    expect(result.width).toBe('100px')
  })
})
