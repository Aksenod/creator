import React, { useEffect, useRef } from 'react'
import { useEditorStore } from '../../store'
import type { Artboard } from '../../types'
import { resolveStyles } from '../../utils/resolveStyles'

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

  // Глобальные обработчики resize (mousemove/mouseup)
  useEffect(() => {
    if (previewMode) return

    const onMouseMove = (e: MouseEvent) => {
      const state = resizeRef.current
      if (!state || !activeArtboardId) return

      // Конвертируем screen-delta → design-delta с учётом scale
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

    // Берём реальные rendered размеры элемента через DOM
    const elDom = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
    if (!elDom) return
    const rect = elDom.getBoundingClientRect()

    resizeRef.current = {
      elementId: id,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      // rect уже в screen pixels (с учётом scale), делим обратно → design pixels
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

    // Эффективные стили с учётом cascade (base + BP overrides)
    const s = resolveStyles(el, activeBreakpointId)

    const style: React.CSSProperties = {
      position: el.positionMode === 'pinned' ? 'absolute' : 'relative',
      width: s.width ?? 'auto',
      height: s.height ?? 'auto',
      display: s.display ?? 'block',
      flexDirection: s.flexDirection,
      flexWrap: s.flexWrap,
      justifyContent: s.justifyContent,
      alignItems: s.alignItems,
      gap: s.gap,
      backgroundColor: s.backgroundColor,
      color: s.color,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      borderRadius: s.borderRadius,
      padding: s.paddingTop !== undefined
        ? `${s.paddingTop}px ${s.paddingRight ?? 0}px ${s.paddingBottom ?? 0}px ${s.paddingLeft ?? 0}px`
        : undefined,
      outline: previewMode ? 'none' : (isSelected ? '2px solid #0066ff' : '1px dashed #ddd'),
      outlineOffset: previewMode ? undefined : (isSelected ? -2 : -1),
      minHeight: 20,
      cursor: 'default',
      boxSizing: 'border-box',
    }

    if (el.positionMode === 'pinned' && el.pin) {
      if (el.pin.top !== undefined) style.top = el.pin.top
      if (el.pin.right !== undefined) style.right = el.pin.right
      if (el.pin.bottom !== undefined) style.bottom = el.pin.bottom
      if (el.pin.left !== undefined) style.left = el.pin.left
    }

    return (
      <div
        key={id}
        data-element-id={id}
        style={style}
        onClick={previewMode ? undefined : (e) => {
          e.stopPropagation()
          if (e.shiftKey) toggleSelectElement(id)
          else selectElement(id)
        }}
      >
        {el.content && <span>{el.content}</span>}
        {el.children.map(renderElement)}

        {/* Resize handles — только для выбранного элемента, не в preview */}
        {isSelected && !previewMode && HANDLES.map(h => (
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

  const scaledW = Math.round(artboard.width * scale)
  const scaledH = Math.round(artboard.height * scale)

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 0',
      }}
      onClick={() => selectElement(null)}
    >
      {/*
        Wrapper занимает правильное место в layout (scaledW × scaledH),
        артборд внутри абсолютно позиционирован и масштабирован через transform.
        Это позволяет flexbox корректно центрировать артборд.
      */}
      <div style={{
        position: 'relative',
        width: scaledW,
        minHeight: scaledH,
        flexShrink: 0,
      }}>
        <div style={{
          width: artboard.width,
          minHeight: artboard.height,
          background: '#fff',
          position: 'absolute',
          top: 0,
          left: 0,
          boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
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
    </div>
  )
}
