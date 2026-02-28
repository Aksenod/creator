import React from 'react'
import { useEditorStore } from '../../store'
import type { Artboard } from '../../types'

type Props = { artboard: Artboard; previewMode?: boolean; scale?: number }

export function Canvas({ artboard, previewMode, scale = 1 }: Props) {
  const { selectElement, selectedElementId, selectedElementIds, toggleSelectElement } = useEditorStore()

  const renderElement = (id: string): React.ReactNode => {
    const el = artboard.elements[id]
    if (!el) return null

    const isSelected = selectedElementIds.includes(id) || selectedElementId === id

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
        onClick={previewMode ? undefined : (e) => {
          e.stopPropagation()
          if (e.shiftKey) toggleSelectElement(id)
          else selectElement(id)
        }}
      >
        {el.content && <span>{el.content}</span>}
        {el.children.map(renderElement)}
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
        padding: '40px 0',
      }}
      onClick={() => selectElement(null)}
    >
      <div style={{
        width: artboard.width,
        background: '#fff',
        minHeight: artboard.height,
        position: 'relative',
        boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        flexShrink: 0,
        ...(scale !== 1 ? { zoom: scale } as React.CSSProperties : {}),
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
