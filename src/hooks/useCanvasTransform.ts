import { useState, useRef, useEffect, useCallback } from 'react'

export type Transform = { x: number; y: number; scale: number }

const MIN_SCALE = 0.05
const MAX_SCALE = 4
const ZOOM_SPEED = 0.001

export function useCanvasTransform(containerRef: React.RefObject<HTMLElement>) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)
  const spaceDown = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const zoom = useCallback((delta: number, originX: number, originY: number) => {
    setTransform((t) => {
      const factor = 1 - delta * ZOOM_SPEED * 100
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor))
      const ratio = newScale / t.scale
      return {
        scale: newScale,
        x: originX - ratio * (originX - t.x),
        y: originY - ratio * (originY - t.y),
      }
    })
  }, [])

  const resetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return
    setTransform({ x: 60, y: 60, scale: 0.5 })
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const originX = e.clientX - rect.left
      const originY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        zoom(e.deltaY, originX, originY)
      } else {
        // Pan с колесом
        setTransform((t) => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }))
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceDown.current = true
        el.style.cursor = 'grab'
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') { e.preventDefault(); fitToScreen() }
      if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); resetZoom() }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown.current = false
        el.style.cursor = 'default'
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (spaceDown.current) {
        isPanning.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
        el.style.cursor = 'grabbing'
        e.preventDefault()
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      lastMouse.current = { x: e.clientX, y: e.clientY }
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
    }

    const onMouseUp = () => {
      if (isPanning.current) {
        isPanning.current = false
        el.style.cursor = spaceDown.current ? 'grab' : 'default'
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [containerRef, zoom, fitToScreen, resetZoom])

  return { transform, zoom, resetZoom, fitToScreen }
}
