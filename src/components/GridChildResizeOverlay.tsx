import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../store'
import { findParentId } from '../utils/treeUtils'
import { resolveStyles } from '../utils/resolveStyles'

type Props = { artboardId: string }
type Rect = { top: number; left: number; width: number; height: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTrackSizes(computed: string): number[] {
  if (!computed || computed === 'none') return []
  return computed.split(/\s+/).filter(Boolean).map(t => {
    const m = t.match(/^([\d.]+)px$/)
    return m ? parseFloat(m[1]) : 0
  })
}

/** screen-позиции CSS grid lines (N треков → N+1 линий, lines[i] = line i+1) */
function computeLines(origin: number, sizes: number[], gap: number, scale: number): number[] {
  const lines: number[] = [origin]
  let pos = origin
  for (let i = 0; i < sizes.length; i++) {
    pos += sizes[i] * scale
    lines.push(pos)
    if (i < sizes.length - 1) pos += gap * scale
  }
  return lines
}

/** Найти CSS line (1-indexed) по позиции мыши: первую line ≥ mouse */
function snapLine(mouse: number, lines: number[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (mouse < lines[i] + 6) return i + 1
  }
  return lines.length
}

// ─── Типы drag ────────────────────────────────────────────────────────────────

type Handle = 'col-start' | 'col-end' | 'row-start' | 'row-end'

type DragState = {
  handle: Handle
  colStart: number; colEnd: number
  rowStart: number; rowEnd: number
  // Зафиксированные (противоположные) края
  fixColStart: number; fixColEnd: number
  fixRowStart: number; fixRowEnd: number
}

// ─── Компонент ───────────────────────────────────────────────────────────────

export function GridChildResizeOverlay({ artboardId }: Props) {
  const { selectedElementId, project, activeBreakpointId, updateElement } = useEditorStore()

  const artboard = project?.artboards[artboardId]
  const parentId = artboard && selectedElementId ? findParentId(artboard, selectedElementId) : null
  const parentEl = parentId && artboard ? artboard.elements[parentId] : null
  const parentStyles = parentEl ? resolveStyles(parentEl, activeBreakpointId) : null
  const isGridChild = parentStyles?.display === 'grid'

  const [childRect, setChildRect] = useState<Rect | null>(null)
  const [colLines, setColLines] = useState<number[]>([])
  const [rowLines, setRowLines] = useState<number[]>([])
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hlRect, setHlRect] = useState<Rect | null>(null)
  const rafRef = useRef<number | null>(null)

  // ─── Layout refresh ────────────────────────────────────────────────────────

  const refreshLayout = useCallback(() => {
    if (!selectedElementId || !parentId || !isGridChild) return
    const childDom = document.querySelector(`[data-element-id="${selectedElementId}"]`) as HTMLElement | null
    const parentDom = document.querySelector(`[data-element-id="${parentId}"]`) as HTMLElement | null
    if (!childDom || !parentDom) return

    const cr = childDom.getBoundingClientRect()
    setChildRect({ top: cr.top, left: cr.left, width: cr.width, height: cr.height })

    const pcs = window.getComputedStyle(parentDom)
    const pr = parentDom.getBoundingClientRect()
    const colSizes = getTrackSizes(pcs.gridTemplateColumns)
    const rowSizes = getTrackSizes(pcs.gridTemplateRows)
    const cGap = parseFloat(pcs.columnGap) || 0
    const rGap = parseFloat(pcs.rowGap) || 0

    const totalW = colSizes.reduce((s, v) => s + v, 0) + Math.max(0, colSizes.length - 1) * cGap
    const totalH = rowSizes.reduce((s, v) => s + v, 0) + Math.max(0, rowSizes.length - 1) * rGap
    const sx = totalW > 0 ? pr.width / totalW : 1
    const sy = totalH > 0 ? pr.height / totalH : 1

    setColLines(computeLines(pr.left, colSizes, cGap, sx))
    setRowLines(computeLines(pr.top, rowSizes, rGap, sy))
  }, [selectedElementId, parentId, isGridChild])

  useEffect(() => {
    if (!isGridChild) return
    refreshLayout()
    let running = true
    const loop = () => { if (!running) return; refreshLayout(); rafRef.current = requestAnimationFrame(loop) }
    rafRef.current = requestAnimationFrame(loop)
    return () => { running = false; if (rafRef.current != null) cancelAnimationFrame(rafRef.current) }
  }, [isGridChild, refreshLayout])

  // ─── Drag ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!drag) return

    const onMove = (e: MouseEvent) => {
      const d = drag
      let cs = d.colStart, ce = d.colEnd, rs = d.rowStart, re = d.rowEnd

      const h = d.handle
      // Колонки
      if (h === 'col-start') {
        cs = Math.min(snapLine(e.clientX, colLines), d.fixColEnd - 1)
        ce = d.fixColEnd
      } else if (h === 'col-end') {
        ce = Math.max(snapLine(e.clientX, colLines), d.fixColStart + 1)
        cs = d.fixColStart
      }
      // Строки
      if (h === 'row-start') {
        rs = Math.min(snapLine(e.clientY, rowLines), d.fixRowEnd - 1)
        re = d.fixRowEnd
      } else if (h === 'row-end') {
        re = Math.max(snapLine(e.clientY, rowLines), d.fixRowStart + 1)
        rs = d.fixRowStart
      }

      if (cs !== d.colStart || ce !== d.colEnd || rs !== d.rowStart || re !== d.rowEnd) {
        setDrag({ ...d, colStart: cs, colEnd: ce, rowStart: rs, rowEnd: re })
      }

      // Highlight
      const x1 = colLines[cs - 1] ?? 0
      const x2 = colLines[ce - 1] ?? 0
      const y1 = rowLines[rs - 1] ?? 0
      const y2 = rowLines[re - 1] ?? 0
      if (x1 && x2 && y1 && y2) {
        setHlRect({ top: y1, left: x1, width: x2 - x1, height: y2 - y1 })
      }
    }

    const onUp = () => {
      if (!drag || !selectedElementId) { setDrag(null); setHlRect(null); return }
      const { colStart, colEnd, rowStart, rowEnd } = drag
      updateElement(artboardId, selectedElementId, {
        styles: {
          gridColumn: `${colStart} / ${colEnd}`,
          gridRow: `${rowStart} / ${rowEnd}`,
        },
      })
      setDrag(null)
      setHlRect(null)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [drag, colLines, rowLines, selectedElementId, artboardId, updateElement])

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!isGridChild || !childRect || colLines.length < 2) return null

  const childDom = document.querySelector(`[data-element-id="${selectedElementId}"]`) as HTMLElement | null
  const cs = childDom ? window.getComputedStyle(childDom) : null
  const colStart = drag?.colStart ?? (cs ? parseInt(cs.gridColumnStart) || 1 : 1)
  const colEnd   = drag?.colEnd   ?? (cs ? parseInt(cs.gridColumnEnd)   || 2 : 2)
  const rowStart = drag?.rowStart ?? (cs ? parseInt(cs.gridRowStart)    || 1 : 1)
  const rowEnd   = drag?.rowEnd   ?? (cs ? parseInt(cs.gridRowEnd)      || 2 : 2)

  const colSpan = colEnd - colStart
  const rowSpan = rowEnd - rowStart

  const startDrag = (handle: Handle, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const csDom = childDom ? window.getComputedStyle(childDom) : null
    const cs0 = csDom ? parseInt(csDom.gridColumnStart) || 1 : 1
    const ce0 = csDom ? parseInt(csDom.gridColumnEnd)   || 2 : 2
    const rs0 = csDom ? parseInt(csDom.gridRowStart)    || 1 : 1
    const re0 = csDom ? parseInt(csDom.gridRowEnd)      || 2 : 2
    setDrag({
      handle,
      colStart: cs0, colEnd: ce0, rowStart: rs0, rowEnd: re0,
      fixColStart: cs0, fixColEnd: ce0,
      fixRowStart: rs0, fixRowEnd: re0,
    })
    setHlRect(childRect)
  }

  // Цвет хэндла
  const hColor = (h: Handle) =>
    drag?.handle === h ? '#0066ff' : 'rgba(0,102,255,0.75)'

  const sideHandle = (
    h: Handle,
    style: React.CSSProperties,
    inner: React.CSSProperties,
  ) => (
    <div
      key={h}
      style={{ position: 'absolute', pointerEvents: 'auto', ...style }}
      onMouseDown={(e) => startDrag(h, e)}
    >
      <div style={{
        background: hColor(h),
        borderRadius: 2,
        boxShadow: '0 0 0 2px #fff',
        ...inner,
      }} />
    </div>
  )

  const { top: T, left: L, width: W, height: H } = childRect

  const overlay = (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2005 }}>

      {/* Span badge */}
      {(colSpan > 1 || rowSpan > 1) && !drag && (
        <div style={{
          position: 'absolute', top: T + 4, left: L + 4,
          background: '#0066ff', color: '#fff',
          fontSize: 10, fontWeight: 600, padding: '2px 5px',
          borderRadius: 3, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {colSpan > 1 ? `${colSpan} cols` : ''}
          {colSpan > 1 && rowSpan > 1 ? ' × ' : ''}
          {rowSpan > 1 ? `${rowSpan} rows` : ''}
        </div>
      )}

      {/* Highlight при drag */}
      {drag && hlRect && (
        <div style={{
          position: 'absolute',
          top: hlRect.top, left: hlRect.left,
          width: hlRect.width, height: hlRect.height,
          background: 'rgba(0,102,255,0.1)',
          border: '2px solid rgba(0,102,255,0.55)',
          pointerEvents: 'none', boxSizing: 'border-box', borderRadius: 2,
        }} />
      )}

      {/* Tooltip при drag */}
      {drag && (
        <div style={{
          position: 'absolute',
          top: T - 26, left: L + W / 2,
          transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff',
          fontSize: 11, fontWeight: 600, padding: '3px 7px',
          borderRadius: 4, pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {`col ${drag.colStart}/${drag.colEnd}  row ${drag.rowStart}/${drag.rowEnd}`}
        </div>
      )}

      {/* ── Стороны ── */}

      {/* Левый (col-start) */}
      {sideHandle('col-start',
        { top: T + H / 2 - 10, left: L - 5, width: 10, height: 20, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        { width: 4, height: 16 }
      )}

      {/* Правый (col-end) */}
      {sideHandle('col-end',
        { top: T + H / 2 - 10, left: L + W - 5, width: 10, height: 20, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        { width: 4, height: 16 }
      )}

      {/* Верхний (row-start) */}
      {rowLines.length > 1 && sideHandle('row-start',
        { left: L + W / 2 - 10, top: T - 5, width: 20, height: 10, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        { height: 4, width: 16 }
      )}

      {/* Нижний (row-end) */}
      {rowLines.length > 1 && sideHandle('row-end',
        { left: L + W / 2 - 10, top: T + H - 5, width: 20, height: 10, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        { height: 4, width: 16 }
      )}


    </div>
  )

  return createPortal(overlay, document.body)
}
