import { useRef, useState, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store'
import type { Artboard } from '../types'
import type { Camera } from './useCanvasTransform'

export type MarqueeRect = {
  left: number
  top: number
  width: number
  height: number
}

const DEAD_ZONE = 3

function rectContainedIn(
  a: DOMRect,
  b: { left: number; top: number; right: number; bottom: number },
) {
  return a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom
}

export function useMarqueeSelection(
  artboard: Artboard | null,
  previewMode: boolean | undefined,
  cameraRef: React.RefObject<Camera> | undefined,
  scale: number,
  isActive: boolean | undefined,
) {
  const startRef = useRef<{ x: number; y: number; artboardRect: DOMRect } | null>(null)
  const activeRef = useRef(false)
  const wasMarqueeRef = useRef(false)
  const preSelectionRef = useRef<string[]>([])
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null)

  const storeRef = useRef(useEditorStore.getState())
  useEffect(() => useEditorStore.subscribe((s) => { storeRef.current = s }), [])

  const artboardRef = useRef(artboard)
  artboardRef.current = artboard

  const onArtboardMouseDown = useCallback((e: React.MouseEvent) => {
    if (previewMode || !isActive || !artboard) return
    if (e.button !== 0) return

    // Allow marquee on artboard background and on body element, not on real elements
    const target = e.target as HTMLElement
    const closestEl = target.closest('[data-element-id]')
    if (closestEl) {
      const elId = closestEl.getAttribute('data-element-id')
      if (elId) {
        const el = artboard.elements[elId]
        if (!el || el.type !== 'body') return
      }
    }

    const artboardFrame = target.closest('[data-testid="artboard-frame"]')
    if (!artboardFrame) return

    const artboardRect = artboardFrame.getBoundingClientRect()
    startRef.current = { x: e.clientX, y: e.clientY, artboardRect }
    activeRef.current = false
    wasMarqueeRef.current = false
    preSelectionRef.current = storeRef.current.selectedElementIds
  }, [previewMode, isActive, artboard])

  useEffect(() => {
    if (previewMode || !isActive) return

    const onMouseMove = (e: MouseEvent) => {
      const start = startRef.current
      if (!start) return

      if (!activeRef.current) {
        const dx = Math.abs(e.clientX - start.x)
        const dy = Math.abs(e.clientY - start.y)
        if (dx < DEAD_ZONE && dy < DEAD_ZONE) return
        activeRef.current = true
        wasMarqueeRef.current = true
        document.body.style.userSelect = 'none'
      }

      // Screen coordinates of marquee
      const screenLeft = Math.min(e.clientX, start.x)
      const screenTop = Math.min(e.clientY, start.y)
      const screenRight = Math.max(e.clientX, start.x)
      const screenBottom = Math.max(e.clientY, start.y)

      // Convert to artboard-local coordinates for overlay
      const currentScale = cameraRef?.current?.scale ?? scale
      const ar = start.artboardRect
      const localLeft = (screenLeft - ar.left) / currentScale
      const localTop = (screenTop - ar.top) / currentScale
      const localWidth = (screenRight - screenLeft) / currentScale
      const localHeight = (screenBottom - screenTop) / currentScale

      setMarqueeRect({ left: localLeft, top: localTop, width: localWidth, height: localHeight })

      // Find intersecting elements
      const ab = artboardRef.current
      if (!ab) return

      const marqueeScreen = { left: screenLeft, top: screenTop, right: screenRight, bottom: screenBottom }
      const foundIds: string[] = []

      // All selectable elements recursively (excluding body and hidden)
      const selectableIds: string[] = []
      const walk = (ids: string[]) => {
        for (const id of ids) {
          const el = ab.elements[id]
          if (!el || el.hidden) continue
          if (el.type !== 'body') selectableIds.push(id)
          if (el.children.length > 0) walk(el.children)
        }
      }
      walk(ab.rootChildren)

      for (const elId of selectableIds) {
        const el = ab.elements[elId]
        if (!el || el.hidden) continue
        const dom = document.querySelector(`[data-element-id="${elId}"]`) as HTMLElement
        if (!dom) continue
        const rect = dom.getBoundingClientRect()
        if (rectContainedIn(rect, marqueeScreen)) {
          foundIds.push(elId)
        }
      }

      // Live preview: update selection during drag
      if (e.shiftKey) {
        const combined = [...new Set([...preSelectionRef.current, ...foundIds])]
        storeRef.current.selectElements(combined)
      } else {
        storeRef.current.selectElements(foundIds)
      }
    }

    const onMouseUp = () => {
      if (!startRef.current) return
      startRef.current = null
      activeRef.current = false
      setMarqueeRect(null)
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [previewMode, isActive, cameraRef, scale])

  return { onArtboardMouseDown, marqueeRect, wasMarqueeRef }
}
