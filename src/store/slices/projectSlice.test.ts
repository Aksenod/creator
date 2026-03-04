import { describe, it, expect } from 'vitest'
import { createDefaultArtboard, syncProjectToAll } from './projectSlice'
import type { Project } from '../../types'

// --- createDefaultArtboard ---
describe('createDefaultArtboard', () => {
  it('creates artboard with given name', () => {
    const ab = createDefaultArtboard('Home')
    expect(ab.name).toBe('Home')
  })

  it('has default dimensions 1440x900', () => {
    const ab = createDefaultArtboard('Page')
    expect(ab.width).toBe(1440)
    expect(ab.height).toBe(900)
  })

  it('uses provided x,y coordinates', () => {
    const ab = createDefaultArtboard('Page', 200, 300)
    expect(ab.x).toBe(200)
    expect(ab.y).toBe(300)
  })

  it('defaults x,y to 0', () => {
    const ab = createDefaultArtboard('Page')
    expect(ab.x).toBe(0)
    expect(ab.y).toBe(0)
  })

  it('creates a body element in elements', () => {
    const ab = createDefaultArtboard('Page')
    const bodyId = ab.rootChildren[0]
    expect(bodyId).toBeDefined()
    const body = ab.elements[bodyId]
    expect(body).toBeDefined()
    expect(body.type).toBe('body')
    expect(body.name).toBe('Body')
    expect(body.className).toBe('body')
  })

  it('rootChildren contains exactly the body id', () => {
    const ab = createDefaultArtboard('Page')
    expect(ab.rootChildren).toHaveLength(1)
    expect(ab.elements[ab.rootChildren[0]]).toBeDefined()
  })

  it('generates unique ids each time', () => {
    const a = createDefaultArtboard('A')
    const b = createDefaultArtboard('B')
    expect(a.id).not.toBe(b.id)
  })

  it('body element has width 100% and display block', () => {
    const ab = createDefaultArtboard('Page')
    const body = ab.elements[ab.rootChildren[0]]
    expect(body.styles.width).toBe('100%')
    expect(body.styles.display).toBe('block')
  })

  it('body element has empty children', () => {
    const ab = createDefaultArtboard('Page')
    const body = ab.elements[ab.rootChildren[0]]
    expect(body.children).toEqual([])
  })
})

// --- syncProjectToAll ---
describe('syncProjectToAll', () => {
  const makeProject = (id: string, name = 'P'): Project => ({
    id,
    name,
    artboards: {},
    artboardOrder: [],
    updatedAt: Date.now(),
  })

  it('adds project if not in array', () => {
    const all = [makeProject('a')]
    const newP = makeProject('b')
    const result = syncProjectToAll(all, newP)
    expect(result).toHaveLength(2)
    expect(result[1]).toBe(newP)
  })

  it('updates existing project in array', () => {
    const all = [makeProject('a', 'Old'), makeProject('b')]
    const updated = makeProject('a', 'New')
    const result = syncProjectToAll(all, updated)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('New')
  })

  it('does not mutate original array', () => {
    const all = [makeProject('a')]
    const copy = [...all]
    syncProjectToAll(all, makeProject('b'))
    expect(all).toEqual(copy)
  })

  it('preserves order when updating', () => {
    const all = [makeProject('a'), makeProject('b'), makeProject('c')]
    const updated = makeProject('b', 'Updated')
    const result = syncProjectToAll(all, updated)
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('b')
    expect(result[1].name).toBe('Updated')
    expect(result[2].id).toBe('c')
  })

  it('handles empty array', () => {
    const result = syncProjectToAll([], makeProject('x'))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('x')
  })
})
