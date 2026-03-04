import { describe, it, expect } from 'vitest'
import {
  findParentId,
  collectDescendantIds,
  isDescendantOf,
  getSiblingInfo,
  getCommonParentId,
} from './treeUtils'
import type { Artboard, CanvasElement } from '../types'

function makeArtboard(): Artboard {
  // Structure: root → [a, b]
  //   a → [a1, a2]
  //   b → [b1]
  //   a1 → [a1x]
  const el = (id: string, children: string[] = []) => ({
    id, type: 'div' as const, tag: 'div', name: id, children, styles: {},
  }) as unknown as CanvasElement

  return {
    id: 'artboard',
    name: 'Test',
    width: 1440,
    height: 900,
    x: 0,
    y: 0,
    rootChildren: ['a', 'b'],
    elements: {
      a: el('a', ['a1', 'a2']),
      b: el('b', ['b1']),
      a1: el('a1', ['a1x']),
      a2: el('a2'),
      b1: el('b1'),
      a1x: el('a1x'),
    },
  } as Artboard
}

describe('findParentId', () => {
  const ab = makeArtboard()

  it('returns null for root children', () => {
    expect(findParentId(ab, 'a')).toBeNull()
    expect(findParentId(ab, 'b')).toBeNull()
  })

  it('finds parent of nested element', () => {
    expect(findParentId(ab, 'a1')).toBe('a')
    expect(findParentId(ab, 'b1')).toBe('b')
  })

  it('finds deeply nested parent', () => {
    expect(findParentId(ab, 'a1x')).toBe('a1')
  })

  it('returns null for non-existent element', () => {
    expect(findParentId(ab, 'nonexistent')).toBeNull()
  })
})

describe('collectDescendantIds', () => {
  const ab = makeArtboard()

  it('includes self', () => {
    const ids = collectDescendantIds(ab.elements, 'a2')
    expect(ids.has('a2')).toBe(true)
    expect(ids.size).toBe(1)
  })

  it('collects all descendants', () => {
    const ids = collectDescendantIds(ab.elements, 'a')
    expect(ids).toEqual(new Set(['a', 'a1', 'a2', 'a1x']))
  })

  it('handles leaf element', () => {
    const ids = collectDescendantIds(ab.elements, 'b1')
    expect(ids).toEqual(new Set(['b1']))
  })
})

describe('isDescendantOf', () => {
  const ab = makeArtboard()

  it('a1 is descendant of a', () => {
    expect(isDescendantOf(ab.elements, 'a1', 'a')).toBe(true)
  })

  it('a1x is descendant of a (deep)', () => {
    expect(isDescendantOf(ab.elements, 'a1x', 'a')).toBe(true)
  })

  it('b1 is not descendant of a', () => {
    expect(isDescendantOf(ab.elements, 'b1', 'a')).toBe(false)
  })

  it('element is descendant of itself', () => {
    expect(isDescendantOf(ab.elements, 'a', 'a')).toBe(true)
  })
})

describe('getSiblingInfo', () => {
  const ab = makeArtboard()

  it('root element siblings', () => {
    const info = getSiblingInfo(ab, 'a')
    expect(info).toEqual({ siblings: ['a', 'b'], index: 0 })
  })

  it('nested element siblings', () => {
    const info = getSiblingInfo(ab, 'a2')
    expect(info).toEqual({ siblings: ['a1', 'a2'], index: 1 })
  })

  it('returns null for non-existent', () => {
    expect(getSiblingInfo(ab, 'nonexistent')).toBeNull()
  })
})

describe('getCommonParentId', () => {
  const ab = makeArtboard()

  it('returns valid for siblings under same parent', () => {
    const result = getCommonParentId(ab, ['a1', 'a2'])
    expect(result).toEqual({ parentId: 'a', valid: true })
  })

  it('returns valid for root siblings', () => {
    const result = getCommonParentId(ab, ['a', 'b'])
    expect(result).toEqual({ parentId: null, valid: true })
  })

  it('returns invalid for elements with different parents', () => {
    const result = getCommonParentId(ab, ['a1', 'b1'])
    expect(result.valid).toBe(false)
  })

  it('returns invalid for empty array', () => {
    const result = getCommonParentId(ab, [])
    expect(result).toEqual({ parentId: null, valid: false })
  })

  it('returns valid for single element', () => {
    const result = getCommonParentId(ab, ['a1'])
    expect(result).toEqual({ parentId: 'a', valid: true })
  })
})
