import React, { useRef } from 'react'
import { useEditorStore } from '../../store'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
import type { Artboard, CanvasElement } from '../../types'

// --- Thumbnail renderer (без интерактивности, без padding) ---

function renderThumbnailElement(
  id: string,
  elements: Artboard['elements'],
): React.ReactNode {
  const el: CanvasElement | undefined = elements[id]
  if (!el) return null

  const style: React.CSSProperties = {
    position: el.positionMode === 'pinned' ? 'absolute' : 'relative',
    width: el.styles.width ?? 'auto',
    height: el.styles.height ?? 'auto',
    display: el.styles.display ?? 'block',
    flexDirection: el.styles.flexDirection,
    flexWrap: el.styles.flexWrap,
    justifyContent: el.styles.justifyContent,
    alignItems: el.styles.alignItems,
    gap: el.styles.gap,
    backgroundColor: el.styles.backgroundColor,
    color: el.styles.color,
    fontSize: el.styles.fontSize,
    fontWeight: el.styles.fontWeight,
    lineHeight: el.styles.lineHeight,
    borderRadius: el.styles.borderRadius,
    padding: el.styles.paddingTop !== undefined
      ? `${el.styles.paddingTop}px ${el.styles.paddingRight ?? 0}px ${el.styles.paddingBottom ?? 0}px ${el.styles.paddingLeft ?? 0}px`
      : undefined,
    minHeight: 20,
    boxSizing: 'border-box',
    pointerEvents: 'none',
  }

  if (el.positionMode === 'pinned' && el.pin) {
    if (el.pin.top !== undefined) style.top = el.pin.top
    if (el.pin.right !== undefined) style.right = el.pin.right
    if (el.pin.bottom !== undefined) style.bottom = el.pin.bottom
    if (el.pin.left !== undefined) style.left = el.pin.left
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
