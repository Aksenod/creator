import React, { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import type { Artboard } from '../../types'
import { resolveStyles } from '../../utils/resolveStyles'
import { getCSSPosition } from '../../utils/cssUtils'
import { useCanvasDnD } from '../../hooks/useCanvasDnD'

// --- Resize handles ---

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

type ResizeState = {
  elementId: string
  handle: HandleDir
  startMouseX: number
  startMouseY: number
  startW: number
  startH: number
}

const HANDLE_CURSORS: Record<HandleDir, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
  e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize',
  sw: 'nesw-resize', w: 'ew-resize',
}

const HANDLES: Array<{ id: HandleDir; style: React.CSSProperties }> = [
  { id: 'nw', style: { top: -4, left: -4 } },
  { id: 'n',  style: { top: -4, left: 'calc(50% - 4px)' } },
  { id: 'ne', style: { top: -4, right: -4 } },
  { id: 'e',  style: { top: 'calc(50% - 4px)', right: -4 } },
  { id: 'se', style: { bottom: -4, right: -4 } },
  { id: 's',  style: { bottom: -4, left: 'calc(50% - 4px)' } },
  { id: 'sw', style: { bottom: -4, left: -4 } },
  { id: 'w',  style: { top: 'calc(50% - 4px)', left: -4 } },
]

// --- Canvas ---

type Props = { artboard: Artboard; previewMode?: boolean; scale?: number }

export function Canvas({ artboard, previewMode, scale = 1 }: Props) {
  const {
    selectElement, selectedElementId, selectedElementIds,
    toggleSelectElement, updateElement, activeArtboardId, activeBreakpointId,
  } = useEditorStore()

  const resizeRef = useRef<ResizeState | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { startDrag, dropIndicator, draggingId } = useCanvasDnD(previewMode ? null : artboard)

  // Глобальные обработчики resize (mousemove/mouseup)
  useEffect(() => {
    if (previewMode) return

    const onMouseMove = (e: MouseEvent) => {
      const state = resizeRef.current
      if (!state || !activeArtboardId) return

      const dx = (e.clientX - state.startMouseX) / scale
      const dy = (e.clientY - state.startMouseY) / scale

      let newW = state.startW
      let newH = state.startH

      if (['se', 'ne', 'e'].includes(state.handle)) newW = Math.max(20, state.startW + dx)
      if (['sw', 'nw', 'w'].includes(state.handle)) newW = Math.max(20, state.startW - dx)
      if (['se', 'sw', 's'].includes(state.handle)) newH = Math.max(20, state.startH + dy)
      if (['ne', 'nw', 'n'].includes(state.handle)) newH = Math.max(20, state.startH - dy)

      updateElement(activeArtboardId, state.elementId, {
        styles: { width: `${Math.round(newW)}px`, height: `${Math.round(newH)}px` },
      })
    }

    const onMouseUp = () => {
      resizeRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [previewMode, scale, activeArtboardId, updateElement])

  const startResize = (e: React.MouseEvent, id: string, handle: HandleDir) => {
    e.stopPropagation()
    e.preventDefault()

    const elDom = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
    if (!elDom) return
    const rect = elDom.getBoundingClientRect()

    resizeRef.current = {
      elementId: id,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: rect.width / scale,
      startH: rect.height / scale,
    }

    document.body.style.cursor = HANDLE_CURSORS[handle]
    document.body.style.userSelect = 'none'
  }

  const renderElement = (id: string): React.ReactNode => {
    const el = artboard.elements[id]
    if (!el) return null

    const isSelected = selectedElementIds.includes(id) || selectedElementId === id
    const isDragging = draggingId === id
    const isHovered = hoveredId === id

    // Drop indicator flags
    const isDropBefore = !previewMode && dropIndicator?.zone === 'before' && dropIndicator.targetId === id
    const isDropAfter  = !previewMode && dropIndicator?.zone === 'after'  && dropIndicator.targetId === id
    const isDropInto   = !previewMode && dropIndicator?.zone === 'into'   && dropIndicator.targetId === id
    // Оранжевый: родительский контейнер (zone before/after) — только для flow-элементов
    const isDropParent = !previewMode && dropIndicator?.zone !== 'into' && dropIndicator?.parentId === id

    const s = resolveStyles(el, activeBreakpointId)
    const cssPosition = getCSSPosition(el.positionMode)

    // Для static-элементов когда нужны absolute-дочерние (resize handles, drop indicators)
    const needsRelative =
      !previewMode &&
      cssPosition === 'static' &&
      (isSelected || isDropBefore || isDropAfter || isDropInto)

    // Outline: приоритет — drop indicator > selection > hover
    let outline: string
    if (previewMode || el.type === 'body') {
      outline = 'none'
    } else if (isDropInto) {
      outline = '2px solid #0066ff'         // синий — вставить внутрь
    } else if (isDropParent) {
      outline = '2px solid #ff8c00'         // оранжевый — parent-контейнер
    } else if (isSelected) {
      outline = '2px solid #0066ff'
    } else if (isHovered) {
      outline = '1px solid #0066ff'
    } else {
      outline = '1px dashed #ddd'
    }

    const style: React.CSSProperties = {
      position: needsRelative ? 'relative' : cssPosition,
      width: s.width ?? 'auto',
      height: s.height ?? 'auto',
      minWidth: s.minWidth,
      maxWidth: s.maxWidth,
      minHeight: s.minHeight ?? 20,
      maxHeight: s.maxHeight,
      display: s.display ?? 'block',
      flexDirection: s.flexDirection,
      flexWrap: s.flexWrap,
      justifyContent: s.justifyContent,
      alignItems: s.alignItems,
      gap: s.gap,
      gridTemplateColumns: s.gridTemplateColumns,
      gridTemplateRows: s.gridTemplateRows,
      gridAutoFlow: s.gridAutoFlow,
      columnGap: s.columnGap,
      rowGap: s.rowGap,
      gridColumn: s.gridColumn,
      gridRow: s.gridRow,
      alignSelf: s.alignSelf,
      justifySelf: s.justifySelf,
      backgroundColor: s.backgroundColor,
      color: s.color,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontFamily: s.fontFamily,
      lineHeight: s.lineHeight,
      textAlign: s.textAlign,
      textDecoration: s.textDecoration,
      letterSpacing: s.letterSpacing,
      textTransform: s.textTransform,
      borderRadius: s.borderRadius,
      borderWidth: s.borderWidth,
      borderColor: s.borderColor,
      borderStyle: s.borderStyle as React.CSSProperties['borderStyle'],
      overflow: s.overflow,
      padding: s.paddingTop !== undefined
        ? `${s.paddingTop}px ${s.paddingRight ?? 0}px ${s.paddingBottom ?? 0}px ${s.paddingLeft ?? 0}px`
        : undefined,
      margin: s.marginTop !== undefined || s.marginRight !== undefined || s.marginBottom !== undefined || s.marginLeft !== undefined
        ? `${s.marginTop ?? 0}px ${s.marginRight ?? 0}px ${s.marginBottom ?? 0}px ${s.marginLeft ?? 0}px`
        : undefined,
      zIndex: s.zIndex,
      outline,
      outlineOffset: previewMode ? undefined : (isSelected || isDropInto || isDropParent ? -2 : -1),
      // Синяя линия вставки через box-shadow (не меняет layout)
      boxShadow: isDropBefore
        ? '0 -2px 0 0 #0066ff'
        : isDropAfter
        ? '0 2px 0 0 #0066ff'
        : undefined,
      opacity: isDragging ? 0.4 : 1,
      cursor: 'default',
      boxSizing: 'border-box',
    }

    // Offsets для non-static positioning (только если не needsRelative)
    if (cssPosition !== 'static') {
      style.top    = s.top    !== undefined ? s.top    : el.pin?.top
      style.right  = s.right  !== undefined ? s.right  : el.pin?.right
      style.bottom = s.bottom !== undefined ? s.bottom : el.pin?.bottom
      style.left   = s.left   !== undefined ? s.left   : el.pin?.left
    }

    return (
      <div
        key={id}
        data-element-id={id}
        style={style}
        onMouseEnter={previewMode ? undefined : (e) => { e.stopPropagation(); setHoveredId(id) }}
        onMouseLeave={previewMode ? undefined : () => setHoveredId(null)}
        onMouseDown={previewMode ? undefined : (e) => {
          // Resize handles вызывают stopPropagation сами — сюда не попадут
          if (e.button !== 0 || resizeRef.current) return
          startDrag(e, id)
        }}
        onClick={previewMode ? undefined : (e) => {
          e.stopPropagation()
          if (e.shiftKey) toggleSelectElement(id)
          else selectElement(id)
        }}
      >
        {el.content && <span>{el.content}</span>}
        {el.children.map(renderElement)}

        {/* Resize handles — только для выбранного элемента, не в preview, не для body */}
        {isSelected && !previewMode && el.type !== 'body' && HANDLES.map(h => (
          <div
            key={h.id}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              background: '#fff',
              border: '1.5px solid #0066ff',
              borderRadius: 1,
              zIndex: 10,
              cursor: HANDLE_CURSORS[h.id],
              ...h.style,
            }}
            onMouseDown={(e) => startResize(e, id, h.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 80,
      }}
      onClick={() => selectElement(null)}
    >
      <div style={{
        width: artboard.width,
        minHeight: artboard.height,
        background: '#fff',
        flexShrink: 0,
        boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
        zoom: scale !== 1 ? scale : undefined,
      }}>
        {artboard.rootChildren.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: artboard.height, color: '#aaa', fontSize: 13,
          }}>
            Добавь первый элемент через панель инструментов
          </div>
        ) : (
          artboard.rootChildren.map(renderElement)
        )}
      </div>
    </div>
  )
}
