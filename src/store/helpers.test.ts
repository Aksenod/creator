import { describe, it, expect } from 'vitest'
import { generateId, isContainerType, pushHistory, applyStyleUpdate, CONTAINER_TYPES } from './helpers'
import type { Project, CanvasElement } from '../types'

// --- generateId ---
describe('generateId', () => {
  it('returns a string of length 8', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBe(8)
  })

  it('returns alphanumeric characters only', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateId()).toMatch(/^[a-z0-9]+$/)
    }
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

// --- CONTAINER_TYPES ---
describe('CONTAINER_TYPES', () => {
  it('includes div and body', () => {
    expect(CONTAINER_TYPES).toContain('div')
    expect(CONTAINER_TYPES).toContain('body')
  })

  it('does not include non-container types', () => {
    expect(CONTAINER_TYPES).not.toContain('text')
    expect(CONTAINER_TYPES).not.toContain('image')
  })
})

// --- isContainerType ---
describe('isContainerType', () => {
  it('returns true for div', () => {
    expect(isContainerType('div')).toBe(true)
  })

  it('returns true for body', () => {
    expect(isContainerType('body')).toBe(true)
  })

  it('returns false for text', () => {
    expect(isContainerType('text')).toBe(false)
  })

  it('returns false for image', () => {
    expect(isContainerType('image')).toBe(false)
  })

  it('returns false for button', () => {
    expect(isContainerType('button')).toBe(false)
  })

  it('returns false for input', () => {
    expect(isContainerType('input')).toBe(false)
  })
})

// --- pushHistory ---
describe('pushHistory', () => {
  const makeProject = (id: string): Project => ({
    id,
    name: `Project ${id}`,
    artboards: {},
    artboardOrder: [],
    updatedAt: Date.now(),
  })

  it('sets new project and appends current to history', () => {
    const current = makeProject('a')
    const next = makeProject('b')
    const result = pushHistory([], -1, current, next)
    expect(result.project).toBe(next)
    expect(result.history).toEqual([current])
    expect(result.historyIndex).toBe(0)
  })

  it('clears future on new action', () => {
    const result = pushHistory([], -1, makeProject('a'), makeProject('b'))
    expect(result.future).toEqual([])
  })

  it('discards forward history beyond historyIndex', () => {
    const h = [makeProject('h0'), makeProject('h1'), makeProject('h2')]
    const result = pushHistory(h, 0, makeProject('current'), makeProject('next'))
    // Should only keep h[0] (index 0) + current
    expect(result.history).toHaveLength(2)
    expect(result.history[0]).toBe(h[0])
    expect(result.historyIndex).toBe(1)
  })

  it('caps history at 50 entries', () => {
    const bigHistory = Array.from({ length: 55 }, (_, i) => makeProject(`h${i}`))
    const result = pushHistory(bigHistory, 54, makeProject('current'), makeProject('next'))
    expect(result.history.length).toBeLessThanOrEqual(50)
  })

  it('does not mutate input history array', () => {
    const history = [makeProject('h0')]
    const historyCopy = [...history]
    pushHistory(history, 0, makeProject('cur'), makeProject('next'))
    expect(history).toEqual(historyCopy)
  })

  it('returns correct historyIndex for empty history', () => {
    const result = pushHistory([], -1, makeProject('a'), makeProject('b'))
    expect(result.historyIndex).toBe(0)
  })
})

// --- applyStyleUpdate ---
describe('applyStyleUpdate', () => {
  const baseElement: CanvasElement = {
    id: 'el1',
    name: 'Test',
    type: 'div',
    positionMode: 'static',
    styles: { width: '100px', height: '50px', display: 'flex' },
    children: [],
  }

  it('merges styles on desktop breakpoint', () => {
    const result = applyStyleUpdate(baseElement, { width: '200px' }, 'desktop')
    expect(result.styles.width).toBe('200px')
    expect(result.styles.height).toBe('50px')
    expect(result.styles.display).toBe('flex')
  })

  it('stores styles in breakpointStyles for non-desktop', () => {
    const result = applyStyleUpdate(baseElement, { width: '50%' }, 'tablet')
    expect(result.styles).toEqual(baseElement.styles) // base unchanged
    expect(result.breakpointStyles?.tablet).toEqual({ width: '50%' })
  })

  it('merges with existing breakpoint styles', () => {
    const elWithBp: CanvasElement = {
      ...baseElement,
      breakpointStyles: { tablet: { fontSize: 14 } },
    }
    const result = applyStyleUpdate(elWithBp, { width: '80%' }, 'tablet')
    expect(result.breakpointStyles?.tablet).toEqual({ fontSize: 14, width: '80%' })
  })

  it('applies extraProps to the element', () => {
    const result = applyStyleUpdate(baseElement, { width: '200px' }, 'desktop', { name: 'Updated' })
    expect(result.name).toBe('Updated')
    expect(result.styles.width).toBe('200px')
  })

  it('applies extraProps for non-desktop breakpoint', () => {
    const result = applyStyleUpdate(baseElement, { width: '50%' }, 'mobile', { name: 'Mobile' })
    expect(result.name).toBe('Mobile')
    expect(result.breakpointStyles?.mobile).toEqual({ width: '50%' })
  })

  it('does not mutate original element', () => {
    const original = { ...baseElement, styles: { ...baseElement.styles } }
    applyStyleUpdate(baseElement, { width: '999px' }, 'desktop')
    expect(baseElement.styles.width).toBe('100px')
    expect(original.styles.width).toBe('100px')
  })

  it('handles element without breakpointStyles on non-desktop', () => {
    const el: CanvasElement = { ...baseElement }
    delete el.breakpointStyles
    const result = applyStyleUpdate(el, { color: 'red' }, 'laptop')
    expect(result.breakpointStyles?.laptop).toEqual({ color: 'red' })
  })
})
