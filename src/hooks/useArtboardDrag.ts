import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store'
import type { Camera } from './useCanvasTransform'

type SnapLine =
  | { axis: 'x'; x: number; y1: number; y2: number }
  | { axis: 'y'; y: number; x1: number; x2: number }

const SNAP_THRESHOLD_PX = 8

export function computeSnap(
  dragId: string,
  rawX: number,
  rawY: number,
  artboards: Record<string, { x: number; y: number; width: number; height: number }>,
  artboardOrder: string[],
  scale: number,
): { x: number; y: number; lines: SnapLine[] } {
  const dragging = artboards[dragId]
  if (!dragging) return { x: rawX, y: rawY, lines: [] }
  const threshold = SNAP_THRESHOLD_PX / scale
  const dragW = dragging.width
  const dragH = dragging.height

  interface XCand { delta: number; targetVal: number; otherT: number; otherB: number }
  interface YCand { delta: number; targetVal: number; otherL: number; otherR: number }
  let bestX: XCand | null = null
  let bestY: YCand | null = null

  for (const otherId of artboardOrder) {
    if (otherId === dragId) continue
    const other = artboards[otherId]
    if (!other) continue
    const oL = other.x, oR = other.x + other.width
    const oT = other.y, oB = other.y + other.height
    const oCX = (oL + oR) / 2, oCY = (oT + oB) / 2
    const dL = rawX, dR = rawX + dragW, dCX = rawX + dragW / 2
    const dT = rawY, dB = rawY + dragH, dCY = rawY + dragH / 2

    for (const [drag, target] of [
      [dL, oL], [dL, oR], [dR, oL], [dR, oR], [dCX, oCX],
    ] as [number, number][]) {
      const delta = target - drag
      if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta)))
        bestX = { delta, targetVal: target, otherT: oT, otherB: oB }
    }
    for (const [drag, target] of [
      [dT, oT], [dT, oB], [dB, oT], [dB, oB], [dCY, oCY],
    ] as [number, number][]) {
      const delta = target - drag
      if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta)))
        bestY = { delta, targetVal: target, otherL: oL, otherR: oR }
    }
  }

  const finalX = rawX + (bestX?.delta ?? 0)
  const finalY = rawY + (bestY?.delta ?? 0)
  const lines: SnapLine[] = []
  if (bestX) lines.push({ axis: 'x', x: bestX.targetVal, y1: Math.min(finalY, bestX.otherT) - 8, y2: Math.max(finalY + dragH, bestX.otherB) + 8 })
  if (bestY) lines.push({ axis: 'y', y: bestY.targetVal, x1: Math.min(finalX, bestY.otherL) - 8, x2: Math.max(finalX + dragW, bestY.otherR) + 8 })
  return { x: finalX, y: finalY, lines }
}

export type { SnapLine }

export function useArtboardDrag(
  cameraRef: React.RefObject<Camera>,
  artboardElRefs: React.RefObject<Map<string, HTMLDivElement>>,
) {
  const [snapLines, setSnapLines] = useState<SnapLine[]>([])
  const artboardDragRef = useRef<{
    artboardId: string
    startMouseX: number
    startMouseY: number
    startArtX: number
    startArtY: number
    active: boolean
  } | null>(null)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const d = artboardDragRef.current
      if (!d) return
      const camera = cameraRef.current
      if (!camera) return
      const scale = camera.scale
      const dx = (e.clientX - d.startMouseX) / scale
      const dy = (e.clientY - d.startMouseY) / scale
      if (!d.active) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
        d.active = true
        document.body.style.cursor = 'grabbing'
      }
      const rawX = d.startArtX + dx
      const rawY = d.startArtY + dy
      const state = useEditorStore.getState()
      const { x: newX, y: newY, lines } = computeSnap(
        d.artboardId, rawX, rawY,
        state.project!.artboards, state.project!.artboardOrder, scale,
      )
      setSnapLines(lines)
      const el = artboardElRefs.current?.get(d.artboardId)
      if (el) {
        el.style.left = newX + 'px'
        el.style.top = newY + 'px'
      }
      useEditorStore.getState().moveArtboardTemp(d.artboardId, newX, newY)
    }
    const onMouseUp = (e: MouseEvent) => {
      const d = artboardDragRef.current
      if (!d || !d.active) { artboardDragRef.current = null; return }
      const camera = cameraRef.current
      if (!camera) return
      const scale = camera.scale
      const rawX = d.startArtX + (e.clientX - d.startMouseX) / scale
      const rawY = d.startArtY + (e.clientY - d.startMouseY) / scale
      const state = useEditorStore.getState()
      const { x: newX, y: newY } = computeSnap(
        d.artboardId, rawX, rawY,
        state.project!.artboards, state.project!.artboardOrder, scale,
      )
      useEditorStore.getState().moveArtboard(d.artboardId, newX, newY)
      artboardDragRef.current = null
      setSnapLines([])
      document.body.style.cursor = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [cameraRef, artboardElRefs])

  const startArtboardDrag = (artboardId: string, e: React.MouseEvent, artX: number, artY: number) => {
    artboardDragRef.current = {
      artboardId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startArtX: artX,
      startArtY: artY,
      active: false,
    }
  }

  return { snapLines, startArtboardDrag }
}
