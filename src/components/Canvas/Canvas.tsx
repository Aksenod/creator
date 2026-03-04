import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store'
import type { Artboard } from '../../types'
import { resolveStyles } from '../../utils/resolveStyles'
import { parseCssValue, composeCssValue } from '../Properties/shared/FigmaInput'
import { getCSSPosition } from '../../utils/cssUtils'
import { migrateFills, fillsToCSS } from '../../utils/fillUtils'
import { useCanvasDnD } from '../../hooks/useCanvasDnD'
import { getGridCellsById } from '../../utils/gridUtils'
import { findParentId } from '../../utils/treeUtils'
import type { Camera } from '../../hooks/useCanvasTransform'

// --- Resize handles ---

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

type ResizeState = {
  elementId: string
  handle: HandleDir
  startMouseX: number
  startMouseY: number
  startW: number
  startH: number
  unitW: string
  unitH: string
  startNumW: number
  startNumH: number
}

type RadiusCorner = 'tl' | 'tr' | 'br' | 'bl'

type RadiusResizeState = {
  artboardId: string
  elementId: string
  corner: RadiusCorner
  startMouseX: number
  startMouseY: number
  startRadius: number
  maxRadius: number
}

const HANDLE_CURSORS: Record<HandleDir, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
  e: 'ew-resize', se: 'nwse-resize', s: 'ns-resize',
  sw: 'nesw-resize', w: 'ew-resize',
}

const HANDLES: Array<{ id: HandleDir; style: React.CSSProperties }> = [
  { id: 'nw', style: { top: -3, left: -3 } },
  { id: 'n',  style: { top: -3, left: 'calc(50% - 3px)' } },
  { id: 'ne', style: { top: -3, right: -3 } },
  { id: 'e',  style: { top: 'calc(50% - 3px)', right: -3 } },
  { id: 'se', style: { bottom: -3, right: -3 } },
  { id: 's',  style: { bottom: -3, left: 'calc(50% - 3px)' } },
  { id: 'sw', style: { bottom: -3, left: -3 } },
  { id: 'w',  style: { top: 'calc(50% - 3px)', left: -3 } },
]

// Visual: how deep the handle sits inside the element per radius unit
const RADIUS_HANDLE_K = 0.30
// Drag sensitivity: higher = more radius change per pixel of mouse movement
const RADIUS_DRAG_SPEED = 6

// --- Canvas ---

type Props = {
  artboard: Artboard
  previewMode?: boolean
  /** CSS zoom scale для thumbnail-превью (non-plain режим). В CanvasEditor не используется. */
  scale?: number
  /** Ref на камеру из useCanvasTransform — нужен для корректного resize в CanvasEditor. */
  cameraRef?: React.RefObject<Camera>
  /** Без внешней обёртки с центровкой — для CanvasEditor */
  plain?: boolean
  /** Синяя рамка активного артборда */
  isActive?: boolean
  /** Вызывается при клике на фон артборда (не на элемент) */
  onArtboardClick?: () => void
  /** Визуальная ширина для BP-preview; не меняет artboard.width */
  displayWidth?: number
}

export function Canvas({ artboard, previewMode, scale = 1, cameraRef, plain, onArtboardClick, displayWidth }: Props) {
  const effectiveWidth = displayWidth ?? artboard.width

  const {
    selectElement, selectedElementId, selectedElementIds,
    toggleSelectElement, updateElement, activeArtboardId, activeBreakpointId,
    setActiveArtboard,
  } = useEditorStore()

  const resizeRef = useRef<ResizeState | null>(null)
  const radiusRef = useRef<RadiusResizeState | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editingInputRef = useRef<HTMLInputElement | null>(null)
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const { startDrag, dropIndicator, draggingId, cellDropTarget, cellDragParentId } = useCanvasDnD(previewMode ? null : artboard)

  const gridCells = cellDragParentId ? getGridCellsById(cellDragParentId) : []

  // Глобальные обработчики resize (mousemove/mouseup)
  useEffect(() => {
    if (previewMode) return

    const onMouseMove = (e: MouseEvent) => {
      // Radius resize
      const rState = radiusRef.current
      if (rState) {
        const currentScale = cameraRef?.current?.scale ?? scale
        const dx = (e.clientX - rState.startMouseX) / currentScale
        const dy = (e.clientY - rState.startMouseY) / currentScale
        // Diagonal direction depends on corner
        const signX = rState.corner === 'tl' || rState.corner === 'bl' ? 1 : -1
        const signY = rState.corner === 'tl' || rState.corner === 'tr' ? 1 : -1
        const diag = (dx * signX + dy * signY) / 2
        const newRadius = Math.round(Math.max(0, Math.min(rState.startRadius + diag * RADIUS_DRAG_SPEED, rState.maxRadius)))
        const cornerProp = {
          tl: 'borderTopLeftRadius',
          tr: 'borderTopRightRadius',
          br: 'borderBottomRightRadius',
          bl: 'borderBottomLeftRadius',
        }[rState.corner]
        if (e.shiftKey) {
          updateElement(rState.artboardId, rState.elementId, {
            styles: {
              borderRadius: newRadius,
              borderTopLeftRadius: undefined,
              borderTopRightRadius: undefined,
              borderBottomRightRadius: undefined,
              borderBottomLeftRadius: undefined,
            },
          })
        } else {
          updateElement(rState.artboardId, rState.elementId, {
            styles: { [cornerProp]: newRadius },
          })
        }
        return
      }

      // Size resize
      const state = resizeRef.current
      if (!state || !activeArtboardId) return

      const currentScale = cameraRef?.current?.scale ?? scale
      const dx = (e.clientX - state.startMouseX) / currentScale
      const dy = (e.clientY - state.startMouseY) / currentScale

      let newW = state.startW
      let newH = state.startH

      if (['se', 'ne', 'e'].includes(state.handle)) newW = Math.max(20, state.startW + dx)
      if (['sw', 'nw', 'w'].includes(state.handle)) newW = Math.max(20, state.startW - dx)
      if (['se', 'sw', 's'].includes(state.handle)) newH = Math.max(20, state.startH + dy)
      if (['ne', 'nw', 'n'].includes(state.handle)) newH = Math.max(20, state.startH - dy)

      const ratioW = state.startW > 0 ? newW / state.startW : 1
      const ratioH = state.startH > 0 ? newH / state.startH : 1

      const pxFallback = (u: string) => u === 'px' || u === 'auto' || u === 'none'

      const finalNumW = pxFallback(state.unitW)
        ? Math.round(newW)
        : Math.round(state.startNumW * ratioW * 100) / 100
      const finalNumH = pxFallback(state.unitH)
        ? Math.round(newH)
        : Math.round(state.startNumH * ratioH * 100) / 100

      const uW = pxFallback(state.unitW) ? 'px' : state.unitW
      const uH = pxFallback(state.unitH) ? 'px' : state.unitH

      updateElement(activeArtboardId, state.elementId, {
        styles: {
          width: composeCssValue(String(finalNumW), uW as any),
          height: composeCssValue(String(finalNumH), uH as any),
        },
      })
    }

    const onMouseUp = () => {
      resizeRef.current = null
      radiusRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [previewMode, scale, cameraRef, activeArtboardId, updateElement])

  // Авто-фокус на input/textarea при начале редактирования
  useEffect(() => {
    if (editingId) {
      if (editingInputRef.current) {
        editingInputRef.current.focus()
        editingInputRef.current.select()
      } else if (editingTextareaRef.current) {
        editingTextareaRef.current.focus()
        editingTextareaRef.current.select()
      }
    }
  }, [editingId])

  const startResize = (e: React.MouseEvent, id: string, handle: HandleDir) => {
    e.stopPropagation()
    e.preventDefault()

    const elDom = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
    if (!elDom) return
    const rect = elDom.getBoundingClientRect()

    const el = artboard.elements[id]
    const resolved = el ? resolveStyles(el, activeBreakpointId) : undefined
    const parsedW = parseCssValue(resolved?.width)
    const parsedH = parseCssValue(resolved?.height)

    const currentScale = cameraRef?.current?.scale ?? scale
    const startW = rect.width / currentScale
    const startH = rect.height / currentScale
    resizeRef.current = {
      elementId: id,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW,
      startH,
      unitW: parsedW.unit,
      unitH: parsedH.unit,
      startNumW: parsedW.num ? parseFloat(parsedW.num) : startW,
      startNumH: parsedH.num ? parseFloat(parsedH.num) : startH,
    }

    document.body.style.cursor = HANDLE_CURSORS[handle]
    document.body.style.userSelect = 'none'
  }

  const startRadiusResize = (e: React.MouseEvent, id: string, corner: RadiusCorner, cornerRadius: number) => {
    e.stopPropagation()
    e.preventDefault()

    const elDom = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement
    if (!elDom) return
    const rect = elDom.getBoundingClientRect()

    const currentScale = cameraRef?.current?.scale ?? scale
    const w = rect.width / currentScale
    const h = rect.height / currentScale

    radiusRef.current = {
      artboardId: artboard.id,
      elementId: id,
      corner,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startRadius: cornerRadius,
      maxRadius: Math.min(w / 2, h / 2),
    }

    const cursor = corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize'
    document.body.style.cursor = cursor
    document.body.style.userSelect = 'none'
  }

  function resolveVpUnit(value: string | undefined, artW: number, artH: number): string | undefined {
    if (!value) return value
    const m = value.match(/^(-?[\d.]+)(vw|vh|svw|svh)$/)
    if (!m) return value
    const n = parseFloat(m[1])
    const base = (m[2] === 'vw' || m[2] === 'svw') ? artW : artH
    return `${Math.round(n * base / 100 * 100) / 100}px`
  }

  const parentOfSelectedId = selectedElementId && artboard
    ? findParentId(artboard, selectedElementId)
    : null

  const renderElement = (id: string): React.ReactNode => {
    const el = artboard.elements[id]
    if (!el) return null
    if (el.hidden) return null

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

    const isParentOfSelected = !previewMode && id === parentOfSelectedId

    // Для static-элементов когда нужны absolute-дочерние (resize handles, drop indicators, dash overlay)
    const needsRelative =
      !previewMode &&
      cssPosition === 'static' &&
      (isSelected || isDropBefore || isDropAfter || isDropInto || isParentOfSelected)

    // Outline: приоритет — drop indicator > selection > hover
    let outline: string
    if (previewMode || el.type === 'body') {
      outline = 'none'
    } else if (isDropInto) {
      outline = '2px solid #0066ff'         // синий — вставить внутрь
    } else if (isDropParent) {
      outline = '2px solid #ff8c00'         // оранжевый — parent-контейнер
    } else if (isSelected) {
      outline = '1px solid #0066ff'
    } else if (isHovered) {
      outline = '1px solid #0066ff'
    } else {
      outline = 'none'
    }

    const style: React.CSSProperties = {
      position: needsRelative ? 'relative' : cssPosition,
      width: resolveVpUnit(s.width, effectiveWidth, artboard.height) ?? 'auto',
      height: resolveVpUnit(s.height, effectiveWidth, artboard.height) ?? 'auto',
      minWidth: resolveVpUnit(s.minWidth, effectiveWidth, artboard.height),
      maxWidth: resolveVpUnit(s.maxWidth, effectiveWidth, artboard.height),
      minHeight: resolveVpUnit(s.minHeight, effectiveWidth, artboard.height) ?? 20,
      maxHeight: resolveVpUnit(s.maxHeight, effectiveWidth, artboard.height),
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
      ...fillsToCSS(migrateFills(s), s.backgroundColor),
      backgroundClip: s.backgroundClip,
      WebkitBackgroundClip: s.backgroundClip,
      mixBlendMode: s.blendMode as React.CSSProperties['mixBlendMode'],
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
      borderTopLeftRadius: s.borderTopLeftRadius,
      borderTopRightRadius: s.borderTopRightRadius,
      borderBottomRightRadius: s.borderBottomRightRadius,
      borderBottomLeftRadius: s.borderBottomLeftRadius,
      borderWidth: s.borderWidth,
      borderColor: s.borderColor,
      borderStyle: s.borderStyle as React.CSSProperties['borderStyle'],
      overflow: (!previewMode && el.type !== 'body' && (isSelected || isParentOfSelected)) ? 'visible' : s.overflow,
      padding: s.paddingTop !== undefined
        ? `${s.paddingTop}px ${s.paddingRight ?? 0}px ${s.paddingBottom ?? 0}px ${s.paddingLeft ?? 0}px`
        : undefined,
      margin: s.marginTop !== undefined || s.marginRight !== undefined || s.marginBottom !== undefined || s.marginLeft !== undefined
        ? `${s.marginTop ?? 0}px ${s.marginRight ?? 0}px ${s.marginBottom ?? 0}px ${s.marginLeft ?? 0}px`
        : undefined,
      zIndex: s.zIndex,
      outline,
      outlineOffset: previewMode ? undefined : (isDropInto || isDropParent ? -2 : -1),
      // Синяя линия вставки через box-shadow (не меняет layout)
      boxShadow: isDropBefore
        ? '0 -2px 0 0 #0066ff'
        : isDropAfter
        ? '0 2px 0 0 #0066ff'
        : undefined,
      opacity: isDragging ? (s.opacity ?? 1) * 0.4 : (s.opacity ?? 1),
      cursor: 'default',
      boxSizing: 'border-box',
    }

    // For input elements, padding should be on the <input> itself (to push text inside), not on the wrapper div
    if (el.type === 'input') {
      style.padding = undefined
    }

    // Offsets для non-static positioning (только если не needsRelative)
    // normalizeOffset: backward compat — legacy числовые значения → "Npx"
    const normalizeOffset = (v: string | number | undefined) =>
      typeof v === 'number' ? `${v}px` : v
    if (cssPosition !== 'static') {
      style.top    = normalizeOffset(s.top)    ?? el.pin?.top
      style.right  = normalizeOffset(s.right)  ?? el.pin?.right
      style.bottom = normalizeOffset(s.bottom) ?? el.pin?.bottom
      style.left   = normalizeOffset(s.left)   ?? el.pin?.left
    }

    // Общие обработчики для wrapper
    const wrapperHandlers = previewMode ? {} : {
      onMouseEnter: (e: React.MouseEvent) => { e.stopPropagation(); setHoveredId(id) },
      onMouseLeave: () => setHoveredId(null),
      onMouseDown: (e: React.MouseEvent) => {
        if (e.button !== 0 || resizeRef.current || radiusRef.current || e.shiftKey || e.metaKey) return
        startDrag(e, id)
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        if (e.shiftKey || e.metaKey) {
          setActiveArtboard(artboard.id)
          toggleSelectElement(id)
        } else {
          setActiveArtboard(artboard.id)
          selectElement(id)
        }
      },
    }

    // Пунктирная обводка родителя при выделении дочернего (overlay с кастомным dash pattern)
    const parentDashOverlay = isParentOfSelected && el.type !== 'body' && (
      <div
        key="parent-dash"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9,
          backgroundImage: [
            'repeating-linear-gradient(90deg, #0066ff 0, #0066ff 8px, transparent 8px, transparent 16px)',
            'repeating-linear-gradient(90deg, #0066ff 0, #0066ff 8px, transparent 8px, transparent 16px)',
            'repeating-linear-gradient(0deg, #0066ff 0, #0066ff 8px, transparent 8px, transparent 16px)',
            'repeating-linear-gradient(0deg, #0066ff 0, #0066ff 8px, transparent 8px, transparent 16px)',
          ].join(', '),
          backgroundSize: '100% 1px, 100% 1px, 1px 100%, 1px 100%',
          backgroundPosition: '0 0, 0 100%, 0 0, 100% 0',
          backgroundRepeat: 'no-repeat',
        }}
      />
    )

    const resizeHandles = isSelected && !previewMode && el.type !== 'body' && HANDLES.map(h => (
      <div
        key={h.id}
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          background: '#fff',
          border: '1px solid #0066ff',
          borderRadius: '50%',
          zIndex: 10,
          cursor: HANDLE_CURSORS[h.id],
          ...h.style,
        }}
        onMouseDown={(e) => startResize(e, id, h.id)}
      />
    ))

    // Border-radius handles — круглые, по одному на каждый угол
    const showRadiusHandles = isSelected && !previewMode && el.type !== 'body' && el.type !== 'text'
    const baseRadius = typeof s.borderRadius === 'number' ? s.borderRadius : parseInt(String(s.borderRadius)) || 0
    const cornerRadii = {
      tl: s.borderTopLeftRadius ?? baseRadius,
      tr: s.borderTopRightRadius ?? baseRadius,
      br: s.borderBottomRightRadius ?? baseRadius,
      bl: s.borderBottomLeftRadius ?? baseRadius,
    }
    const radiusHandles = showRadiusHandles && ([
      { corner: 'tl' as RadiusCorner, cursor: 'nwse-resize', pos: { top: RADIUS_HANDLE_K * cornerRadii.tl + 10, left: RADIUS_HANDLE_K * cornerRadii.tl + 10 } },
      { corner: 'tr' as RadiusCorner, cursor: 'nesw-resize', pos: { top: RADIUS_HANDLE_K * cornerRadii.tr + 10, right: RADIUS_HANDLE_K * cornerRadii.tr + 10 } },
      { corner: 'br' as RadiusCorner, cursor: 'nwse-resize', pos: { bottom: RADIUS_HANDLE_K * cornerRadii.br + 10, right: RADIUS_HANDLE_K * cornerRadii.br + 10 } },
      { corner: 'bl' as RadiusCorner, cursor: 'nesw-resize', pos: { bottom: RADIUS_HANDLE_K * cornerRadii.bl + 10, left: RADIUS_HANDLE_K * cornerRadii.bl + 10 } },
    ].map(h => (
      <div
        key={`radius-${h.corner}`}
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          background: '#fff',
          border: '1px solid #0066ff',
          borderRadius: '50%',
          zIndex: 11,
          cursor: h.cursor,
          ...h.pos,
        }}
        onMouseDown={(e) => startRadiusResize(e, id, h.corner, cornerRadii[h.corner])}
      />
    )))

    // Image с src → рендерим <img> внутри wrapper <div>
    if (el.type === 'image' && el.src) {
      // Wrapper нуждается в position:relative чтобы img (absolute) заполнил его
      const imgWrapperStyle: React.CSSProperties = {
        ...style,
        position: needsRelative ? 'relative' : cssPosition,
        overflow: style.overflow ?? 'hidden',
      }
      // Если position static/relative — гарантируем relative для img inset:0
      if (imgWrapperStyle.position === 'static') {
        imgWrapperStyle.position = 'relative'
      }
      return (
        <div
          key={id}
          data-element-id={id}
          style={imgWrapperStyle}
          {...wrapperHandlers}
        >
          <img
            src={el.src}
            alt={el.alt || ''}
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: s.objectFit ?? 'cover',
              objectPosition: s.objectPosition ?? 'center',
              pointerEvents: 'none',
            }}
          />
          {resizeHandles}
          {parentDashOverlay}
          {radiusHandles}
        </div>
      )
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
          if (e.button !== 0 || resizeRef.current || radiusRef.current || e.shiftKey || e.metaKey) return
          startDrag(e, id)
        }}
        onClick={previewMode ? undefined : (e) => {
          e.stopPropagation()
          if (e.shiftKey || e.metaKey) {
            setActiveArtboard(artboard.id)
            toggleSelectElement(id)
          } else {
            setActiveArtboard(artboard.id)
            selectElement(id)
          }
        }}
        onDoubleClick={previewMode || editingId !== null ? undefined : (e) => {
          e.stopPropagation()
          if (el.type === 'text' || el.type === 'button' || el.type === 'input') {
            setEditingId(id)
          }
        }}
      >
        {editingId === id ? (
          el.type === 'text' ? (
            <textarea
              ref={editingTextareaRef}
              value={el.content ?? ''}
              onChange={(e) => updateElement(artboard.id, id, { content: e.target.value })}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setEditingId(null)
                }
              }}
              style={{
                width: '100%',
                minHeight: '1.2em',
                border: '1px solid #0066ff',
                borderRadius: 2,
                padding: 2,
                background: '#fff',
                color: s.color,
                fontSize: s.fontSize,
                fontWeight: s.fontWeight,
                fontFamily: s.fontFamily,
                lineHeight: s.lineHeight,
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <input
              ref={editingInputRef}
              type="text"
              value={el.content ?? ''}
              onChange={(e) => updateElement(artboard.id, id, { content: e.target.value })}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setEditingId(null)
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  setEditingId(null)
                }
              }}
              style={{
                width: '100%',
                border: '1px solid #0066ff',
                borderRadius: 2,
                padding: '2px 4px',
                background: '#fff',
                color: s.color,
                fontSize: s.fontSize,
                fontWeight: s.fontWeight,
                fontFamily: s.fontFamily,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )
        ) : (
          el.type === 'input' ? (
            <input
              type={el.inputType || 'text'}
              placeholder={el.content ?? ''}
              readOnly
              style={{
                width: '100%', height: '100%',
                border: 'none', background: 'transparent',
                color: s.color, fontSize: s.fontSize,
                fontFamily: s.fontFamily, fontWeight: s.fontWeight,
                pointerEvents: 'none', outline: 'none',
                boxSizing: 'border-box',
                paddingTop: s.paddingTop ?? 0,
                paddingRight: s.paddingRight ?? 0,
                paddingBottom: s.paddingBottom ?? 0,
                paddingLeft: s.paddingLeft ?? 0,
              }}
            />
          ) : (
            el.content && <span>{el.content}</span>
          )
        )}
        {el.children.map(renderElement)}

        {/* Resize handles — только для выбранного элемента, не в preview, не для body */}
        {resizeHandles}
        {parentDashOverlay}
        {radiusHandles}
      </div>
    )
  }

  // Берём overflow из body-элемента (как в настоящем браузере: overflow у body = overflow у viewport)
  const bodyEl = artboard.rootChildren
    .map(id => artboard.elements[id])
    .find(el => el?.type === 'body')
  const bodyOverflow = bodyEl ? resolveStyles(bodyEl, activeBreakpointId).overflow : undefined
  const artboardOverflow = bodyOverflow ?? 'hidden'

  const artboardBox = (
    <div
      data-testid="artboard-frame"
      style={{
        width: effectiveWidth,
        minHeight: artboard.height,
        background: '#fff',
        flexShrink: 0,
        boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
        outline: 'none',
        overflow: artboardOverflow,
        position: 'relative',
      }}
      onClick={plain ? (e) => {
        e.stopPropagation()
        setActiveArtboard(artboard.id)
        selectElement(null)
        onArtboardClick?.()
      } : undefined}
    >
      {artboard.rootChildren.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: artboard.height, color: '#aaa', fontSize: 13,
        }}>
          Add your first element using the toolbar
        </div>
      ) : (
        artboard.rootChildren.map(renderElement)
      )}
    </div>
  )

  return (
    <>
      {plain ? artboardBox : (
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
          {artboardBox}
        </div>
      )}

      {/* Grid cell overlay — рендерим через portal чтобы CSS zoom не влиял */}
      {cellDragParentId && gridCells.length > 0 && createPortal(
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
          {gridCells.map(cell => {
            const isHovered = cellDropTarget?.col === cell.col && cellDropTarget?.row === cell.row
            return (
              <div
                key={`${cell.col}-${cell.row}`}
                style={{
                  position: 'fixed',
                  top: cell.top,
                  left: cell.left,
                  width: cell.width,
                  height: cell.height,
                  background: isHovered ? 'rgba(0, 102, 255, 0.13)' : 'rgba(0, 102, 255, 0.04)',
                  border: isHovered ? '2px solid #0066ff' : '1px solid rgba(0, 102, 255, 0.2)',
                  borderRadius: 3,
                  boxSizing: 'border-box',
                  transition: 'background 0.08s, border 0.08s',
                }}
              />
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
