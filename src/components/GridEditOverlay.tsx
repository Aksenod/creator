import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../store'
import { parseTracks, serializeTracks } from './Properties/LayoutSection'
import type { GridTrack } from './Properties/LayoutSection'

type Props = {
  artboardId: string
}

type GridRect = { top: number; left: number; width: number; height: number }

function getTrackSizes(computed: string): number[] {
  // computed: "100px 200px 300px" (браузер всегда раскрывает в px)
  return computed.split(/\s+/).filter(Boolean).map(t => {
    const m = t.match(/^([\d.]+)px$/)
    return m ? parseFloat(m[1]) : 0
  })
}

type DragState = {
  axis: 'col' | 'row'
  index: number     // разделитель между track[index-1] и track[index]
  startX: number
  startY: number
  originalTracks: GridTrack[]
  trackSizesPx: number[]
}

export function GridEditOverlay({ artboardId }: Props) {
  const { gridEditElementId, setGridEditElementId, project, updateElement } = useEditorStore()
  const artboard = project?.artboards[artboardId]
  const element = gridEditElementId && artboard ? artboard.elements[gridEditElementId] : null

  const [gridRect, setGridRect] = useState<GridRect | null>(null)
  // CSS-пиксели (до zoom): треки и gap
  const [colSizesCss, setColSizesCss] = useState<number[]>([])
  const [rowSizesCss, setRowSizesCss] = useState<number[]>([])
  const [colGapCss, setColGapCss] = useState(0)
  const [rowGapCss, setRowGapCss] = useState(0)
  // CSS→screen масштаб (из-за CSS zoom на артборде)
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const dragRef = useRef<DragState | null>(null)
  const rafRef = useRef<number | null>(null)

  // Найти DOM и вычислить размеры
  const refreshLayout = useCallback(() => {
    if (!gridEditElementId) return
    const domEl = document.querySelector(`[data-element-id="${gridEditElementId}"]`) as HTMLElement | null
    if (!domEl) return

    const rect = domEl.getBoundingClientRect()
    setGridRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })

    const cs = window.getComputedStyle(domEl)
    const cols = getTrackSizes(cs.gridTemplateColumns)
    const rows = getTrackSizes(cs.gridTemplateRows)
    const cGap = parseFloat(cs.columnGap) || 0
    const rGap = parseFloat(cs.rowGap) || 0

    setColSizesCss(cols)
    setRowSizesCss(rows)
    setColGapCss(cGap)
    setRowGapCss(rGap)

    // Вычислить реальный scale (CSS zoom эффект)
    // totalCSSWidth = сумма треков + gap между ними
    const totalCssW = cols.reduce((s, v) => s + v, 0) + Math.max(0, cols.length - 1) * cGap
    const totalCssH = rows.reduce((s, v) => s + v, 0) + Math.max(0, rows.length - 1) * rGap
    setScaleX(totalCssW > 0 ? rect.width / totalCssW : 1)
    setScaleY(totalCssH > 0 ? rect.height / totalCssH : 1)
  }, [gridEditElementId])

  useEffect(() => {
    refreshLayout()
    // rAF loop для мгновенного обновления при drag
    let running = true
    const loop = () => {
      if (!running) return
      refreshLayout()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      running = false
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [refreshLayout])

  // Mouse drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag || !gridEditElementId || !artboard || !element) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY

      // Конвертируем screen-delta в CSS-delta (обратный zoom)
      const cssScale = drag.axis === 'col' ? scaleX : scaleY
      const delta = (drag.axis === 'col' ? dx : dy) / (cssScale || 1)
      const prevPx = drag.trackSizesPx[drag.index - 1] ?? 0
      const nextPx = drag.trackSizesPx[drag.index] ?? 0

      const newPrev = Math.max(0, prevPx + delta)
      const newNext = Math.max(0, nextPx - delta)

      // Обновляем треки: при fr конвертируем в px (пропорционально)
      const origTracks = drag.originalTracks
      if (drag.index - 1 < origTracks.length && drag.index < origTracks.length) {
        const newTracks = origTracks.map((t, i) => {
          if (i === drag.index - 1) {
            if (t.unit === 'fr') {
              // fr → сохраняем пропорцию: newFr = origFr * (newPx / origPx)
              const origPx = prevPx || 1
              return { ...t, value: Math.max(0.1, t.value * newPrev / origPx) }
            }
            return { ...t, value: Math.round(newPrev) }
          }
          if (i === drag.index) {
            if (t.unit === 'fr') {
              const origPx = nextPx || 1
              return { ...t, value: Math.max(0.1, t.value * newNext / origPx) }
            }
            return { ...t, value: Math.round(newNext) }
          }
          return t
        })

        const prop = drag.axis === 'col' ? 'gridTemplateColumns' : 'gridTemplateRows'
        updateElement(artboardId, gridEditElementId, {
          styles: { [prop]: serializeTracks(newTracks) },
        })
      }
    }

    const onUp = () => {
      dragRef.current = null
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [artboardId, gridEditElementId, artboard, element, updateElement, scaleX, scaleY])

  if (!gridEditElementId || !gridRect || !element) return null

  const colTracks = parseTracks(element.styles.gridTemplateColumns)
  const rowTracks = parseTracks(element.styles.gridTemplateRows)

  // Вычислить позиции разделителей с учётом gap и zoom
  // Каждая линия рисуется посередине gap между треками
  const colLines: number[] = []
  let cx = gridRect.left
  for (let i = 0; i < colSizesCss.length; i++) {
    cx += colSizesCss[i] * scaleX
    if (i < colSizesCss.length - 1) {
      const gapScreen = colGapCss * scaleX
      colLines.push(cx + gapScreen / 2)  // посередине gap
      cx += gapScreen
    }
  }

  const rowLines: number[] = []
  let ry = gridRect.top
  for (let i = 0; i < rowSizesCss.length; i++) {
    ry += rowSizesCss[i] * scaleY
    if (i < rowSizesCss.length - 1) {
      const gapScreen = rowGapCss * scaleY
      rowLines.push(ry + gapScreen / 2)
      ry += gapScreen
    }
  }

  // Позиции центра каждого track (для лейблов)
  const colCenters: number[] = []
  cx = gridRect.left
  for (let i = 0; i < colSizesCss.length; i++) {
    colCenters.push(cx + (colSizesCss[i] * scaleX) / 2)
    cx += colSizesCss[i] * scaleX + (i < colSizesCss.length - 1 ? colGapCss * scaleX : 0)
  }

  const rowCenters: number[] = []
  ry = gridRect.top
  for (let i = 0; i < rowSizesCss.length; i++) {
    rowCenters.push(ry + (rowSizesCss[i] * scaleY) / 2)
    ry += rowSizesCss[i] * scaleY + (i < rowSizesCss.length - 1 ? rowGapCss * scaleY : 0)
  }

  const startColDrag = (dividerIndex: number, e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = {
      axis: 'col',
      index: dividerIndex,
      startX: e.clientX,
      startY: e.clientY,
      originalTracks: [...colTracks],
      trackSizesPx: [...colSizesCss],  // CSS px (до zoom)
    }
  }

  const startRowDrag = (dividerIndex: number, e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = {
      axis: 'row',
      index: dividerIndex,
      startX: e.clientX,
      startY: e.clientY,
      originalTracks: [...rowTracks],
      trackSizesPx: [...rowSizesCss],  // CSS px (до zoom)
    }
  }

  const addCol = () => {
    const newTracks = [...colTracks, { value: 1, unit: 'fr' as const }]
    updateElement(artboardId, gridEditElementId, {
      styles: { gridTemplateColumns: serializeTracks(newTracks) },
    })
  }

  const addRow = () => {
    const newTracks = [...rowTracks, { value: 1, unit: 'fr' as const }]
    updateElement(artboardId, gridEditElementId, {
      styles: { gridTemplateRows: serializeTracks(newTracks) },
    })
  }

  const removeCol = (i: number) => {
    const newTracks = colTracks.filter((_, idx) => idx !== i)
    updateElement(artboardId, gridEditElementId, {
      styles: { gridTemplateColumns: serializeTracks(newTracks) || undefined },
    })
  }

  const removeRow = (i: number) => {
    const newTracks = rowTracks.filter((_, idx) => idx !== i)
    updateElement(artboardId, gridEditElementId, {
      styles: { gridTemplateRows: serializeTracks(newTracks) || undefined },
    })
  }

  const trackLabel = (track: GridTrack) => {
    if (track.unit === 'auto') return 'auto'
    const v = track.unit === 'fr' ? track.value.toFixed(2).replace(/\.?0+$/, '') : Math.round(track.value)
    return `${v}${track.unit}`
  }

  const overlay = (
    <div
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2000,
      }}
    >
      {/* Grid outline */}
      <div style={{
        position: 'absolute',
        top: gridRect.top, left: gridRect.left,
        width: gridRect.width, height: gridRect.height,
        border: '2px solid rgba(0,102,255,0.5)',
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }} />

      {/* Vertical column dividers */}
      {colLines.slice(0, -1).map((x, i) => (
        <div
          key={`col-line-${i}`}
          onMouseDown={(e) => startColDrag(i + 1, e)}
          style={{
            position: 'absolute',
            left: x - 4,
            top: gridRect.top,
            height: gridRect.height,
            width: 8,
            cursor: 'col-resize',
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 2, height: '100%',
            background: 'rgba(0,102,255,0.4)',
            borderRadius: 1,
          }} />
        </div>
      ))}

      {/* Horizontal row dividers */}
      {rowLines.slice(0, -1).map((y, i) => (
        <div
          key={`row-line-${i}`}
          onMouseDown={(e) => startRowDrag(i + 1, e)}
          style={{
            position: 'absolute',
            top: y - 4,
            left: gridRect.left,
            width: gridRect.width,
            height: 8,
            cursor: 'row-resize',
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            height: 2, width: '100%',
            background: 'rgba(0,102,255,0.4)',
            borderRadius: 1,
          }} />
        </div>
      ))}

      {/* Column labels & delete buttons */}
      {colCenters.map((cx, i) => (
        <div
          key={`col-label-${i}`}
          style={{
            position: 'absolute',
            left: cx,
            top: gridRect.top - 24,
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            pointerEvents: 'auto',
          }}
        >
          <div style={{
            fontSize: 10, color: '#0066ff', background: 'rgba(230,240,255,0.9)',
            padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap',
            border: '1px solid rgba(0,102,255,0.2)',
          }}>
            {colTracks[i] ? trackLabel(colTracks[i]) : ''}
          </div>
          <button
            onClick={() => removeCol(i)}
            title="Удалить колонку"
            style={{
              border: 'none', background: 'rgba(255,80,80,0.8)', color: '#fff',
              borderRadius: '50%', width: 14, height: 14, fontSize: 10,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, padding: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}

      {/* Row labels & delete buttons */}
      {rowCenters.map((ry, i) => (
        <div
          key={`row-label-${i}`}
          style={{
            position: 'absolute',
            top: ry,
            left: gridRect.left - 50,
            transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: 3,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={() => removeRow(i)}
            title="Удалить строку"
            style={{
              border: 'none', background: 'rgba(255,80,80,0.8)', color: '#fff',
              borderRadius: '50%', width: 14, height: 14, fontSize: 10,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, padding: 0, flexShrink: 0,
            }}
          >
            ×
          </button>
          <div style={{
            fontSize: 10, color: '#0066ff', background: 'rgba(230,240,255,0.9)',
            padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap',
            border: '1px solid rgba(0,102,255,0.2)',
          }}>
            {rowTracks[i] ? trackLabel(rowTracks[i]) : ''}
          </div>
        </div>
      ))}

      {/* Add column button */}
      <button
        onClick={addCol}
        title="Добавить колонку"
        style={{
          position: 'absolute',
          left: gridRect.left + gridRect.width + 6,
          top: gridRect.top + gridRect.height / 2 - 12,
          width: 24, height: 24,
          border: '1px solid rgba(0,102,255,0.5)',
          borderRadius: 4, background: 'rgba(230,240,255,0.9)',
          color: '#0066ff', fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto',
          lineHeight: 1, padding: 0,
        }}
      >
        +
      </button>

      {/* Add row button */}
      <button
        onClick={addRow}
        title="Добавить строку"
        style={{
          position: 'absolute',
          top: gridRect.top + gridRect.height + 6,
          left: gridRect.left + gridRect.width / 2 - 12,
          width: 24, height: 24,
          border: '1px solid rgba(0,102,255,0.5)',
          borderRadius: 4, background: 'rgba(230,240,255,0.9)',
          color: '#0066ff', fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'auto',
          lineHeight: 1, padding: 0,
        }}
      >
        +
      </button>

      {/* Done button — над центром grid */}
      <button
        onClick={() => setGridEditElementId(null)}
        data-testid="grid-edit-done"
        style={{
          position: 'absolute',
          top: Math.max(8, gridRect.top - 34),
          left: gridRect.left + gridRect.width / 2 - 36,
          padding: '5px 14px',
          border: '1px solid #0066ff',
          borderRadius: 5, background: '#0066ff',
          color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', pointerEvents: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        Done
      </button>
    </div>
  )

  return createPortal(overlay, document.body)
}
