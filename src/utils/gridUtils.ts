import type { CanvasElement, Artboard } from '../types'
import { findParentId } from './treeUtils'

// ─── Track parsing ────────────────────────────────────────────────────────────

export function parseTrackSizes(computed: string): number[] {
  return computed.split(/\s+/).filter(Boolean).map(t => {
    const m = t.match(/^([\d.]+)px$/)
    return m ? parseFloat(m[1]) : 0
  })
}

// ─── Grid layout ──────────────────────────────────────────────────────────────

export type GridLayout = {
  containerRect: DOMRect
  colSizes: number[]
  rowSizes: number[]
  colGap: number
  rowGap: number
  scaleX: number
  scaleY: number
}

export function getGridLayout(gridEl: HTMLElement): GridLayout | null {
  const containerRect = gridEl.getBoundingClientRect()
  const cs = window.getComputedStyle(gridEl)
  const colSizes = parseTrackSizes(cs.gridTemplateColumns)
  const rowSizes = parseTrackSizes(cs.gridTemplateRows)
  const colGap = parseFloat(cs.columnGap) || 0
  const rowGap = parseFloat(cs.rowGap) || 0
  if (colSizes.length === 0 || rowSizes.length === 0) return null

  const totalCssW = colSizes.reduce((s, v) => s + v, 0) + Math.max(0, colSizes.length - 1) * colGap
  const totalCssH = rowSizes.reduce((s, v) => s + v, 0) + Math.max(0, rowSizes.length - 1) * rowGap
  const scaleX = totalCssW > 0 ? containerRect.width / totalCssW : 1
  const scaleY = totalCssH > 0 ? containerRect.height / totalCssH : 1

  return { containerRect, colSizes, rowSizes, colGap, rowGap, scaleX, scaleY }
}

// ─── Cell rects ───────────────────────────────────────────────────────────────

export type CellRect = {
  top: number; left: number; width: number; height: number
  col: number; row: number
}

export function computeGridCells(gridEl: HTMLElement): CellRect[] {
  const layout = getGridLayout(gridEl)
  if (!layout) return []
  const { containerRect, colSizes, rowSizes, colGap, rowGap, scaleX, scaleY } = layout

  const cells: CellRect[] = []
  let y = containerRect.top
  for (let ri = 0; ri < rowSizes.length; ri++) {
    const rowH = rowSizes[ri] * scaleY
    let x = containerRect.left
    for (let ci = 0; ci < colSizes.length; ci++) {
      const colW = colSizes[ci] * scaleX
      cells.push({ top: y, left: x, width: colW, height: rowH, col: ci + 1, row: ri + 1 })
      x += colW + (ci < colSizes.length - 1 ? colGap * scaleX : 0)
    }
    y += rowH + (ri < rowSizes.length - 1 ? rowGap * scaleY : 0)
  }
  return cells
}

export function getGridCellsById(elementId: string): CellRect[] {
  const el = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement | null
  return el ? computeGridCells(el) : []
}

// Найти ячейку под курсором; если попадает в gap — ищем ближайшую
export function findCellAt(
  clientX: number,
  clientY: number,
  gridEl: HTMLElement,
): { col: number; row: number; rect: CellRect } | null {
  const cells = computeGridCells(gridEl)
  if (cells.length === 0) return null

  // Точное попадание
  for (const cell of cells) {
    if (
      clientX >= cell.left && clientX < cell.left + cell.width &&
      clientY >= cell.top  && clientY < cell.top  + cell.height
    ) {
      return { col: cell.col, row: cell.row, rect: cell }
    }
  }

  // Курсор в gap или на краю — ищем ближайшую ячейку
  const containerRect = gridEl.getBoundingClientRect()
  if (
    clientX < containerRect.left || clientX > containerRect.right ||
    clientY < containerRect.top  || clientY > containerRect.bottom
  ) return null

  let best: CellRect | null = null
  let minDist = Infinity
  for (const cell of cells) {
    const cx = cell.left + cell.width  / 2
    const cy = cell.top  + cell.height / 2
    const d = Math.hypot(clientX - cx, clientY - cy)
    if (d < minDist) { minDist = d; best = cell }
  }
  return best ? { col: best.col, row: best.row, rect: best } : null
}

// ─── Grid line value parsing / serialization ──────────────────────────────────

export function parseGridLine(val?: string): { start: string; end: string; isSpan: boolean } {
  if (!val) return { start: '', end: '', isSpan: false }
  const parts = val.split('/').map(s => s.trim())
  if (parts.length === 1) return { start: parts[0], end: '', isSpan: false }
  const end = parts[1]
  const isSpan = end.startsWith('span')
  return { start: parts[0], end: isSpan ? end.replace(/^span\s*/, '') : end, isSpan }
}

export function serializeGridLine(start: string, end: string, isSpan: boolean): string | undefined {
  if (!start) return undefined
  if (!isSpan && !end) return start
  return `${start} / ${isSpan ? `span ${end || '1'}` : end}`
}

// ─── Span utilities ───────────────────────────────────────────────────────────

/** "span N" или пусто → true; наличие явной стартовой линии → false */
export function isSpanOnlyValue(val?: string): boolean {
  return !val || /^span\s*\d+$/.test(val.trim())
}

/** "span N" или "start / span N" → N как number, по умолчанию 1 */
export function extractSpanNumber(val?: string): number {
  if (!val) return 1
  const m = val.match(/span\s*(\d+)/)
  return m ? parseInt(m[1]) : 1
}

/** "span N" → "N"; иначе "" */
export function getSpanString(val?: string): string {
  const m = val?.match(/^span\s*(\d+)$/)
  return m ? m[1] : ''
}

/** N → "span N" если N>1, иначе undefined */
export function spanVal(n: string): string | undefined {
  const num = parseInt(n, 10)
  return !n || isNaN(num) || num <= 1 ? undefined : `span ${num}`
}

// ─── Mode detection ───────────────────────────────────────────────────────────

export function detectGridChildMode(
  gridColumn?: string,
  gridRow?: string,
): 'auto' | 'manual' {
  return isSpanOnlyValue(gridColumn) && isSpanOnlyValue(gridRow) ? 'auto' : 'manual'
}

export function isManualGridChild(element: CanvasElement, artboard: Artboard): boolean {
  const parentId = findParentId(artboard, element.id)
  if (!parentId) return false
  const parent = artboard.elements[parentId]
  if (!parent || parent.styles.display !== 'grid') return false
  return detectGridChildMode(element.styles.gridColumn, element.styles.gridRow) === 'manual'
}
