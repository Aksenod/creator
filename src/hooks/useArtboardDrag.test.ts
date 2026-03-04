import { describe, it, expect } from 'vitest'
import { computeSnap } from './useArtboardDrag'

const makeArtboards = (list: Array<{ id: string; x: number; y: number; width: number; height: number }>) => {
  const artboards: Record<string, { x: number; y: number; width: number; height: number }> = {}
  for (const ab of list) artboards[ab.id] = { x: ab.x, y: ab.y, width: ab.width, height: ab.height }
  return artboards
}

describe('computeSnap', () => {
  const drag = { id: 'a', x: 0, y: 0, width: 200, height: 100 }
  const other = { id: 'b', x: 300, y: 0, width: 200, height: 100 }

  // --- Basic snapping ---
  describe('X-axis snapping', () => {
    it('snaps left edge to left edge', () => {
      const artboards = makeArtboards([
        { ...drag, x: 297, y: 0 }, // rawX close to other's left edge
        other,
      ])
      const result = computeSnap('a', 297, 0, artboards, ['a', 'b'], 1)
      expect(result.x).toBe(300) // snapped to other.x
    })

    it('snaps right edge to left edge', () => {
      // drag right edge = rawX + 200 should snap to other.x = 300
      // So rawX + 200 = 300 → rawX = 100; let's be close: rawX = 98
      const artboards = makeArtboards([
        { ...drag, x: 98, y: 0 },
        other,
      ])
      const result = computeSnap('a', 98, 0, artboards, ['a', 'b'], 1)
      expect(result.x).toBe(100) // 100 + 200 = 300
    })

    it('snaps center to center', () => {
      // drag center = rawX + 100, other center = 300 + 100 = 400
      // rawX + 100 = 400 → rawX = 300; close: 297
      const artboards = makeArtboards([
        { ...drag, x: 297, y: 50 },
        other,
      ])
      const result = computeSnap('a', 297, 50, artboards, ['a', 'b'], 1)
      expect(result.x).toBe(300) // center snaps to 400
    })

    it('does not snap when beyond threshold', () => {
      const artboards = makeArtboards([
        { ...drag, x: 280, y: 0 },
        other,
      ])
      const result = computeSnap('a', 280, 0, artboards, ['a', 'b'], 1)
      expect(result.x).toBe(280) // no snap, too far
    })
  })

  describe('Y-axis snapping', () => {
    it('snaps top edge to top edge', () => {
      const other2 = { id: 'b', x: 300, y: 200, width: 200, height: 100 }
      const artboards = makeArtboards([
        { ...drag, x: 0, y: 197 },
        other2,
      ])
      const result = computeSnap('a', 0, 197, artboards, ['a', 'b'], 1)
      expect(result.y).toBe(200)
    })

    it('snaps bottom edge to top edge', () => {
      // drag bottom = rawY + 100 should snap to other.y = 200
      // rawY + 100 = 200 → rawY = 100; close: 98
      const other2 = { id: 'b', x: 300, y: 200, width: 200, height: 100 }
      const artboards = makeArtboards([
        { ...drag, x: 0, y: 98 },
        other2,
      ])
      const result = computeSnap('a', 0, 98, artboards, ['a', 'b'], 1)
      expect(result.y).toBe(100)
    })
  })

  // --- Snap lines ---
  describe('snap lines', () => {
    it('generates X snap line', () => {
      const artboards = makeArtboards([
        { ...drag, x: 299, y: 0 },
        other,
      ])
      const result = computeSnap('a', 299, 0, artboards, ['a', 'b'], 1)
      const xLine = result.lines.find(l => l.axis === 'x')
      expect(xLine).toBeDefined()
      expect(xLine!.axis).toBe('x')
    })

    it('generates Y snap line', () => {
      const other2 = { id: 'b', x: 0, y: 200, width: 200, height: 100 }
      const artboards = makeArtboards([
        { ...drag, x: 0, y: 198 },
        other2,
      ])
      const result = computeSnap('a', 0, 198, artboards, ['a', 'b'], 1)
      const yLine = result.lines.find(l => l.axis === 'y')
      expect(yLine).toBeDefined()
      expect(yLine!.axis).toBe('y')
    })

    it('no lines when no snap', () => {
      const artboards = makeArtboards([
        { ...drag, x: 0, y: 0 },
        { id: 'b', x: 1000, y: 1000, width: 200, height: 100 },
      ])
      const result = computeSnap('a', 0, 0, artboards, ['a', 'b'], 1)
      expect(result.lines).toHaveLength(0)
    })
  })

  // --- Scale ---
  describe('scale handling', () => {
    it('adjusts threshold by scale', () => {
      // threshold = 8 / scale. At scale=0.5, threshold=16
      const artboards = makeArtboards([
        { ...drag, x: 285, y: 0 }, // distance = 15 to other.x=300
        other,
      ])
      // At scale=1, 15px > 8px threshold → no snap
      const r1 = computeSnap('a', 285, 0, artboards, ['a', 'b'], 1)
      expect(r1.x).toBe(285)
      // At scale=0.5, threshold=16 → 15px < 16px → snap
      const r2 = computeSnap('a', 285, 0, artboards, ['a', 'b'], 0.5)
      expect(r2.x).toBe(300)
    })
  })

  // --- Edge cases ---
  describe('edge cases', () => {
    it('returns raw coords if dragId not found', () => {
      const artboards = makeArtboards([other])
      const result = computeSnap('nonexistent', 50, 60, artboards, ['b'], 1)
      expect(result.x).toBe(50)
      expect(result.y).toBe(60)
      expect(result.lines).toEqual([])
    })

    it('handles empty artboardOrder', () => {
      const artboards = makeArtboards([{ ...drag, x: 100, y: 100 }])
      const result = computeSnap('a', 100, 100, artboards, [], 1)
      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
      expect(result.lines).toEqual([])
    })

    it('skips self in artboardOrder', () => {
      const artboards = makeArtboards([{ ...drag, x: 100, y: 100 }])
      const result = computeSnap('a', 100, 100, artboards, ['a'], 1)
      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
    })

    it('handles negative coordinates', () => {
      const artboards = makeArtboards([
        { id: 'a', x: -100, y: -100, width: 200, height: 100 },
        { id: 'b', x: -100, y: 200, width: 200, height: 100 },
      ])
      const result = computeSnap('a', -103, -100, artboards, ['a', 'b'], 1)
      expect(result.x).toBe(-100) // snaps left edges
    })

    it('picks closest snap when multiple candidates', () => {
      const artboards = makeArtboards([
        { id: 'a', x: 0, y: 0, width: 100, height: 100 },
        { id: 'b', x: 200, y: 0, width: 100, height: 100 },
        { id: 'c', x: 203, y: 0, width: 100, height: 100 }, // closer
      ])
      const result = computeSnap('a', 198, 0, artboards, ['a', 'b', 'c'], 1)
      // Should snap to closest: 200 (distance 2) vs 203 (distance 5)
      expect(result.x).toBe(200)
    })
  })
})
