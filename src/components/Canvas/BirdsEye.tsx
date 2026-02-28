import React, { useRef } from 'react'
import { useEditorStore } from '../../store'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
import type { Artboard, CanvasElement } from '../../types'
import { getCSSPosition } from '../../utils/cssUtils'

// --- Thumbnail renderer (без интерактивности, без padding) ---

function renderThumbnailElement(
  id: string,
  elements: Artboard['elements'],
): React.ReactNode {
  const el: CanvasElement | undefined = elements[id]
  if (!el) return null

  const cssPosition = getCSSPosition(el.positionMode)

  const s = el.styles
  const style: React.CSSProperties = {
    position: cssPosition,
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
    minHeight: 20,
    boxSizing: 'border-box',
    pointerEvents: 'none',
  }

  if (cssPosition !== 'static') {
    if (s.top !== undefined) style.top = s.top
    else if (el.pin?.top !== undefined) style.top = el.pin.top
    if (s.right !== undefined) style.right = s.right
    else if (el.pin?.right !== undefined) style.right = el.pin.right
    if (s.bottom !== undefined) style.bottom = s.bottom
    else if (el.pin?.bottom !== undefined) style.bottom = el.pin.bottom
    if (s.left !== undefined) style.left = s.left
    else if (el.pin?.left !== undefined) style.left = el.pin.left
  }

  return (
    <div key={id} style={style}>
      {el.content && <span>{el.content}</span>}
      {el.children.map(childId => renderThumbnailElement(childId, elements))}
    </div>
  )
}

// --- BirdsEye ---

export function BirdsEye() {
  const { project, enterArtboard, addArtboard } = useEditorStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const { transform } = useCanvasTransform(containerRef as React.RefObject<HTMLElement>)

  if (!project) return null

  const scalePercent = Math.round(transform.scale * 100)

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Топбар */}
      <div style={{
        height: 48, background: '#fff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        gap: 16, flexShrink: 0, zIndex: 10,
      }}>
        <span style={{ fontWeight: 600 }}>{project.name}</span>
        <button
          onClick={() => addArtboard('Page ' + (project.artboardOrder.length + 1))}
          style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
        >
          + Артборд
        </button>
      </div>

      {/* Холст */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          background: '#e8e8e8',
          backgroundImage: 'radial-gradient(circle, #c0c0c0 1px, transparent 1px)',
          backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
          overflow: 'hidden',
          position: 'relative',
          outline: 'none',
        }}
        tabIndex={0}
      >
        {/* Трансформируемый слой */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          transformOrigin: '0 0',
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}>
          {project.artboardOrder.map((id) => {
            const artboard = project.artboards[id]
            return (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: artboard.x,
                  top: artboard.y,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {/* Артборд-карточка с реальным превью элементов */}
                <div
                  onDoubleClick={() => enterArtboard(id)}
                  data-testid="artboard-card"
                  style={{
                    width: artboard.width,
                    height: artboard.height,
                    background: '#fff',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    userSelect: 'none',
                  }}
                >
                  {artboard.rootChildren.length === 0 ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: '100%', color: '#aaa', fontSize: 14, pointerEvents: 'none',
                    }}>
                      Пусто
                    </div>
                  ) : (
                    artboard.rootChildren.map(childId =>
                      renderThumbnailElement(childId, artboard.elements)
                    )
                  )}
                </div>

                <span style={{ fontSize: 13, color: '#555', background: 'transparent' }}>
                  {artboard.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Статусбар с зумом */}
      <div style={{
        height: 32, background: '#fff', borderTop: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        fontSize: 12, color: '#888', gap: 16, flexShrink: 0,
      }}>
        <span>{scalePercent}%</span>
        <span style={{ color: '#ccc' }}>·</span>
        <span>⌘0 — по экрану · ⌘1 — 100% · Space+drag — панорама · ⌘+колесо — зум</span>
      </div>
    </div>
  )
}
