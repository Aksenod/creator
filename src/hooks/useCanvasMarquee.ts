import { useRef, useState, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store'

export type CanvasMarqueeRect = {
  left: number
  top: number
  width: number
  height: number
}

const DEAD_ZONE = 3

function rectsIntersect(
  a: DOMRect,
  b: { left: number; top: number; right: number; bottom: number },
) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

export function useCanvasMarquee(
  artboardElRefs: React.RefObject<Map<string, HTMLDivElement>>,
  isPreview: boolean,
) {
  const startRef = useRef<{ x: number; y: number; containerRect: DOMRect } | null>(null)
  const activeRef = useRef(false)
  const wasMarqueeRef = useRef(false)
  const [marqueeRect, setMarqueeRect] = useState<CanvasMarqueeRect | null>(null)

  const storeRef = useRef(useEditorStore.getState())
  useEffect(() => useEditorStore.subscribe((s) => { storeRef.current = s }), [])

  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPreview) return
    if (e.button !== 0) return
    // Only start on canvas background itself (not on artboards or other children)
    if (e.target !== e.currentTarget) return

    const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    startRef.current = { x: e.clientX, y: e.clientY, containerRect }
    activeRef.current = false
    wasMarqueeRef.current = false
  }, [isPreview])

  useEffect(() => {
    if (isPreview) return

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

      // Convert to container-local coordinates for overlay
      const cr = start.containerRect
      setMarqueeRect({
        left: screenLeft - cr.left,
        top: screenTop - cr.top,
        width: screenRight - screenLeft,
        height: screenBottom - screenTop,
      })

      // Find intersecting artboards
      const marqueeScreen = { left: screenLeft, top: screenTop, right: screenRight, bottom: screenBottom }
      const foundIds: string[] = []

      const refs = artboardElRefs.current
      if (refs) {
        refs.forEach((el, artboardId) => {
          const rect = el.getBoundingClientRect()
          if (rectsIntersect(rect, marqueeScreen)) {
            foundIds.push(artboardId)
          }
        })
      }

      storeRef.current.selectArtboards(foundIds)
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
  }, [isPreview, artboardElRefs])

  return { onCanvasMouseDown, marqueeRect, wasCanvasMarqueeRef: wasMarqueeRef }
}
