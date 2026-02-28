import { useEditorStore } from '../../store'
import type { Artboard } from '../../types'
import type { Transform } from '../../hooks/useCanvasTransform'

type Props = { artboard: Artboard; transform?: Transform; previewMode?: boolean }

export function Canvas({ artboard, transform, previewMode }: Props) {
  const { selectElement, selectedElementId } = useEditorStore()

  const renderElement = (id: string): React.ReactNode => {
    const el = artboard.elements[id]
    if (!el) return null

    const isSelected = selectedElementId === id

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
        style={style}
        onClick={previewMode ? undefined : (e) => { e.stopPropagation(); selectElement(id) }}
      >
        {el.content && <span>{el.content}</span>}
        {el.children.map(renderElement)}
      </div>
    )
  }

  const t = transform ?? { x: 0, y: 0, scale: 1 }

  return (
    <div
      style={{ padding: 40 }}
      onClick={() => selectElement(null)}
    >
      <div
        style={{
          transformOrigin: '0 0',
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
          willChange: 'transform',
        }}
      >
        <div style={{
          width: artboard.width,
          background: '#fff',
          minHeight: artboard.height,
          position: 'relative',
          boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
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
