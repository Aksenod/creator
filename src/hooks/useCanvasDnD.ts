import { useRef, useState, useEffect } from 'react'
import { useEditorStore } from '../store'
import { findParentId, isDescendantOf } from '../utils/treeUtils'
import { CONTAINER_TYPES } from '../store/helpers'
import { findCellAt, isManualGridChild, extractSpanNumber } from '../utils/gridUtils'
import type { Artboard, CanvasElement } from '../types'
import type { CellRect } from '../utils/gridUtils'

export type DropIndicator = {
  targetId: string | null   // Элемент у которого рисуем линию (null = root)
  parentId: string | null   // Куда вставим
  index: number             // Индекс в siblings БЕЗ dragging element (то, что ждёт moveElement)
  zone: 'before' | 'after' | 'into'
} | null

export type CellDropTarget = {
  col: number
  row: number
  parentId: string
  rect: CellRect
} | null

// ─── Regular DnD helpers ──────────────────────────────────────────────────────

function findDropInContainer(
  clientX: number,
  clientY: number,
  draggingId: string,
  containerId: string,
  containerEl: CanvasElement,
): DropIndicator {
  const children = containerEl.children.filter(id => id !== draggingId)

  if (children.length === 0) {
    return { targetId: containerId, parentId: containerId, index: 0, zone: 'into' }
  }

  let closestId: string | null = null
  let closestDist = Infinity
  let closestRect: DOMRect | null = null

  for (const childId of children) {
    const childDom = document.querySelector(`[data-element-id="${childId}"]`) as HTMLElement
    if (!childDom) continue
    const r = childDom.getBoundingClientRect()
    const cx = (r.left + r.right) / 2
    const cy = (r.top + r.bottom) / 2
    const dist = Math.hypot(clientX - cx, clientY - cy)
    if (dist < closestDist) {
      closestDist = dist
      closestId = childId
      closestRect = r
    }
  }

  if (!closestId || !closestRect) {
    return { targetId: containerId, parentId: containerId, index: children.length, zone: 'into' }
  }

  const idx = children.indexOf(closestId)
  const relY = (clientY - closestRect.top) / closestRect.height

  return relY <= 0.5
    ? { targetId: closestId, parentId: containerId, index: idx, zone: 'before' }
    : { targetId: closestId, parentId: containerId, index: idx + 1, zone: 'after' }
}

function findDropTarget(
  clientX: number,
  clientY: number,
  draggingId: string,
  artboard: Artboard,
): DropIndicator {
  const pointElements = document.elementsFromPoint(clientX, clientY)

  for (const domEl of pointElements) {
    const targetId = (domEl as HTMLElement).dataset?.elementId
    if (!targetId) continue
    if (targetId === draggingId) continue
    if (isDescendantOf(artboard.elements, targetId, draggingId)) continue

    const targetEl = artboard.elements[targetId]
    if (!targetEl) continue

    const rect = domEl.getBoundingClientRect()
    const relY = (clientY - rect.top) / rect.height
    const isContainer = CONTAINER_TYPES.includes(targetEl.type as typeof CONTAINER_TYPES[number])

    if (isContainer && relY > 0.08 && relY < 0.92) {
      return findDropInContainer(clientX, clientY, draggingId, targetId, targetEl)
    }

    const parentId = findParentId(artboard, targetId)
    const siblings = parentId ? (artboard.elements[parentId]?.children ?? []) : artboard.rootChildren
    const siblingsWithoutDragging = siblings.filter(id => id !== draggingId)
    const idx = siblingsWithoutDragging.indexOf(targetId)

    return relY <= 0.5
      ? { targetId, parentId, index: idx, zone: 'before' }
      : { targetId, parentId, index: idx + 1, zone: 'after' }
  }

  const rootWithoutDragging = artboard.rootChildren.filter(id => id !== draggingId)
  return { targetId: null, parentId: null, index: rootWithoutDragging.length, zone: 'after' }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCanvasDnD(artboard: Artboard | null) {
  const dragRef = useRef<{
    elementId: string
    startX: number
    startY: number
    active: boolean
  } | null>(null)

  const dropRef     = useRef<DropIndicator>(null)
  const cellDropRef = useRef<CellDropTarget>(null)
  const artboardRef = useRef(artboard)
  artboardRef.current = artboard

  const [draggingId,       setDraggingId]       = useState<string | null>(null)
  const [dropIndicator,    setDropIndicator]    = useState<DropIndicator>(null)
  const [cellDropTarget,   setCellDropTarget]   = useState<CellDropTarget>(null)
  const [cellDragParentId, setCellDragParentId] = useState<string | null>(null)

  const storeRef = useRef(useEditorStore.getState())
  useEffect(() => useEditorStore.subscribe((s) => { storeRef.current = s }), [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return

      if (!drag.active) {
        const dx = Math.abs(e.clientX - drag.startX)
        const dy = Math.abs(e.clientY - drag.startY)
        if (dx < 5 && dy < 5) return
        drag.active = true
        setDraggingId(drag.elementId)
        storeRef.current.selectElement(drag.elementId)
        document.body.style.cursor    = 'grabbing'
        document.body.style.userSelect = 'none'
      }

      const ab = artboardRef.current
      if (!ab) return

      // Manual grid child: cell-based drop
      const draggedEl = ab.elements[drag.elementId]
      if (draggedEl && isManualGridChild(draggedEl, ab)) {
        const parentId = findParentId(ab, drag.elementId)
        if (parentId) {
          const gridDom = document.querySelector(`[data-element-id="${parentId}"]`) as HTMLElement | null
          if (gridDom) {
            const hit = findCellAt(e.clientX, e.clientY, gridDom)
            const target: CellDropTarget = hit ? { ...hit, parentId } : null
            cellDropRef.current = target
            setCellDropTarget(target)
            setCellDragParentId(parentId)
            dropRef.current = null
            setDropIndicator(null)
            return
          }
        }
      }

      // Обычный DnD
      const target = findDropTarget(e.clientX, e.clientY, drag.elementId, ab)
      dropRef.current = target
      setDropIndicator(target)
      cellDropRef.current = null
      setCellDropTarget(null)
      setCellDragParentId(null)
    }

    const onMouseUp = () => {
      const drag = dragRef.current
      if (drag?.active) {
        const { activeArtboardId, moveElement, updateElement } = storeRef.current
        const ab = artboardRef.current

        if (activeArtboardId && ab) {
          const cellTarget = cellDropRef.current

          if (cellTarget) {
            // Manual grid child: сохраняем span, обновляем позицию
            const el = ab.elements[drag.elementId]
            const colSpan = extractSpanNumber(el?.styles.gridColumn)
            const rowSpan = extractSpanNumber(el?.styles.gridRow)
            updateElement(activeArtboardId, drag.elementId, {
              styles: {
                gridColumn: colSpan > 1 ? `${cellTarget.col} / span ${colSpan}` : String(cellTarget.col),
                gridRow:    rowSpan > 1 ? `${cellTarget.row} / span ${rowSpan}` : String(cellTarget.row),
              },
            })
          } else {
            const di = dropRef.current
            if (di) {
              const currentParentId = findParentId(ab, drag.elementId)
              const originalSiblings = currentParentId
                ? (ab.elements[currentParentId]?.children ?? [])
                : ab.rootChildren
              const originalIdx = originalSiblings.indexOf(drag.elementId)
              if (!(di.parentId === currentParentId && di.index === originalIdx)) {
                moveElement(activeArtboardId, drag.elementId, di.parentId, di.index)
              }
            }
          }
        }
      }

      dragRef.current    = null
      dropRef.current    = null
      cellDropRef.current = null
      setDraggingId(null)
      setDropIndicator(null)
      setCellDropTarget(null)
      setCellDragParentId(null)
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [])

  const startDrag = (e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    dragRef.current = { elementId, startX: e.clientX, startY: e.clientY, active: false }
  }

  return { startDrag, dropIndicator, draggingId, cellDropTarget, cellDragParentId }
}
