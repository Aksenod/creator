import { useState, useRef, useEffect, useCallback } from 'react'

export type Camera = { scale: number; offsetX: number; offsetY: number }

const MIN_SCALE = 0.05
const MAX_SCALE = 4

/**
 * Camera-based canvas transform.
 *
 * Zoom/pan updates are applied DIRECTLY to the DOM via refs — no React re-renders.
 * Only `scalePercent` is React state (updated via RAF for the zoom indicator).
 *
 * @param containerRef — the outer scrollable/clip container
 * @param worldRef     — the inner "world layer" div that gets CSS transform applied
 */
export function useCanvasTransform(
  containerRef: React.RefObject<HTMLElement>,
  worldRef: React.RefObject<HTMLElement>,
) {
  const cameraRef = useRef<Camera>({ scale: 1, offsetX: 0, offsetY: 0 })
  const [scalePercent, setScalePercent] = useState(100)

  const isPanning = useRef(false)
  const spaceDown = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const rafId = useRef<number>(0)

  // --- Core: apply camera to DOM without React re-render ---
  const applyTransform = useCallback(() => {
    const { scale, offsetX, offsetY } = cameraRef.current

    if (worldRef.current) {
      worldRef.current.style.transform =
        `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
    }

    if (containerRef.current) {
      containerRef.current.style.backgroundSize =
        `${20 * scale}px ${20 * scale}px`
      containerRef.current.style.backgroundPosition =
        `${offsetX}px ${offsetY}px`
    }

    // Update zoom indicator via RAF — low-frequency, doesn't affect perf
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      setScalePercent(Math.round(cameraRef.current.scale * 100))
    })
  }, [worldRef, containerRef])

  // --- Actions ---

  const zoom = useCallback((delta: number, originX: number, originY: number) => {
    const c = cameraRef.current
    const factor = Math.pow(0.999, delta)
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, c.scale * factor))
    const ratio = newScale / c.scale
    cameraRef.current = {
      scale: newScale,
      offsetX: originX - ratio * (originX - c.offsetX),
      offsetY: originY - ratio * (originY - c.offsetY),
    }
    applyTransform()
  }, [applyTransform])

  const resetZoom = useCallback(() => {
    cameraRef.current = { scale: 1, offsetX: 0, offsetY: 0 }
    applyTransform()
  }, [applyTransform])

  const fitToScreen = useCallback((contentWidth = 1440) => {
    if (!containerRef.current) return
    const { offsetWidth } = containerRef.current
    const hPadding = 80
    const vPadding = 60
    const scaleX = (offsetWidth - hPadding) / contentWidth
    const scale = Math.min(scaleX, 1)
    const offsetX = Math.max(hPadding / 2, (offsetWidth - contentWidth * scale) / 2)
    const offsetY = vPadding / 2
    cameraRef.current = { scale, offsetX, offsetY }
    applyTransform()
  }, [containerRef, applyTransform])

  // Apply on mount so background grid is visible from the start
  useEffect(() => {
    applyTransform()
  }, [applyTransform])

  // --- Event listeners ---
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const originX = e.clientX - rect.left
      const originY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        // Pinch (trackpad) gives small deltaY (<10), wheel gives large (100+)
        const normalizedDelta = Math.abs(e.deltaY) < 10
          ? e.deltaY * 100
          : e.deltaY
        zoom(normalizedDelta, originX, originY)
      } else {
        // Scroll to pan
        const c = cameraRef.current
        cameraRef.current = {
          ...c,
          offsetX: c.offsetX - e.deltaX,
          offsetY: c.offsetY - e.deltaY,
        }
        applyTransform()
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
      const c = cameraRef.current
      cameraRef.current = { ...c, offsetX: c.offsetX + dx, offsetY: c.offsetY + dy }
      applyTransform()
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
  }, [containerRef, zoom, fitToScreen, resetZoom, applyTransform])

  return { cameraRef, scalePercent, zoom, resetZoom, fitToScreen }
}
