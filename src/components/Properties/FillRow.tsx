import React, { useState, useRef, useCallback } from 'react'
import type { Fill } from '../../types/fills'
import { ColorPicker } from './shared/ColorPicker'

type Props = {
  fill: Fill
  onChange: (fill: Fill) => void
  onRemove: () => void
  onOpenGradient?: (anchorRect: DOMRect) => void
  onOpenImage?: (anchorRect: DOMRect) => void
  onDragStart?: (e: React.MouseEvent) => void
  isDragging?: boolean
  isDragOver?: 'above' | 'below' | null
}

export const FillRow = React.memo(function FillRow({ fill, onChange, onRemove, onOpenGradient, onOpenImage, onDragStart, isDragging, isDragOver }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const swatchRef = useRef<HTMLDivElement>(null)
  const [hexEditing, setHexEditing] = useState(false)
  const [hexDraft, setHexDraft] = useState('')

  const toggleVisible = useCallback(() => {
    onChange({ ...fill, visible: !fill.visible })
  }, [fill, onChange])

  const handleOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.min(100, Number(e.target.value)))
    onChange({ ...fill, opacity: v / 100 })
  }, [fill, onChange])

  const openPicker = useCallback(() => {
    if (!swatchRef.current) return
    const rect = swatchRef.current.getBoundingClientRect()
    if (fill.type === 'gradient') {
      onOpenGradient?.(rect)
      return
    }
    if (fill.type === 'image') {
      onOpenImage?.(rect)
      return
    }
    setAnchorRect(rect)
    setPickerOpen(true)
  }, [fill.type, onOpenGradient, onOpenImage])

  const closePicker = useCallback(() => setPickerOpen(false), [])

  const handleColorChange = useCallback((hex: string) => {
    if (fill.type === 'solid') {
      onChange({ ...fill, color: hex })
    }
  }, [fill, onChange])

  // Hex display
  const hexDisplay = fill.type === 'solid'
    ? fill.color.replace('#', '').toUpperCase()
    : fill.type === 'gradient'
      ? fill.gradientType === 'linear' ? 'Linear' : 'Radial'
      : 'Image'

  const hexEditable = fill.type === 'solid'

  const startHexEdit = useCallback(() => {
    if (!hexEditable) return
    setHexDraft(fill.type === 'solid' ? fill.color.replace('#', '').toUpperCase() : '')
    setHexEditing(true)
  }, [hexEditable, fill])

  const commitHex = useCallback(() => {
    setHexEditing(false)
    if (fill.type !== 'solid') return
    const v = hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
      onChange({ ...fill, color: v.toLowerCase() })
    }
  }, [hexDraft, fill, onChange])

  // Swatch preview
  const swatchBg = fill.type === 'solid'
    ? fill.color
    : fill.type === 'gradient'
      ? fill.gradientType === 'radial'
        ? `radial-gradient(circle, ${fill.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')})`
        : `linear-gradient(${fill.angle}deg, ${fill.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')})`
      : fill.url
        ? `url(${fill.url}) center/cover no-repeat`
        : '#eee'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      opacity: isDragging ? 0.3 : (fill.visible ? 1 : 0.45),
      height: 32,
      position: 'relative',
      borderTop: isDragOver === 'above' ? '2px solid #0a0a0a' : '2px solid transparent',
      borderBottom: isDragOver === 'below' ? '2px solid #0a0a0a' : '2px solid transparent',
    }}>
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{
          width: 16, height: 32, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'grab', color: '#d4d4d4',
        }}
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="6" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" />
          <circle cx="6" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" />
          <circle cx="6" cy="12" r="1.2" />
        </svg>
      </div>

      {/* Swatch */}
      <div
        ref={swatchRef}
        onClick={openPicker}
        style={{
          width: 24, height: 24, flexShrink: 0,
          borderRadius: 4, cursor: 'pointer',
          border: '1px solid #e5e5e5',
          background: swatchBg,
          marginRight: 6,
        }}
      />

      {/* Hex / type label */}
      {hexEditing ? (
        <input
          autoFocus
          value={hexDraft}
          onChange={e => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={e => { if (e.key === 'Enter') commitHex() }}
          maxLength={7}
          style={{
            flex: 1, minWidth: 0, border: 'none', padding: '2px 4px',
            fontSize: 12, fontFamily: 'monospace', outline: 'none',
            background: '#f5f5f5', borderRadius: 3,
            color: '#0a0a0a',
          }}
        />
      ) : (
        <span
          onClick={hexEditable ? startHexEdit : openPicker}
          style={{
            flex: 1, minWidth: 0, fontSize: 12, color: '#0a0a0a',
            fontFamily: fill.type === 'solid' ? 'monospace' : 'inherit',
            cursor: hexEditable ? 'text' : 'pointer',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {hexDisplay}
        </span>
      )}

      {/* Opacity */}
      <input
        type="number"
        min={0} max={100} step={1}
        value={Math.round(fill.opacity * 100)}
        onChange={handleOpacity}
        title="Opacity %"
        style={{
          width: 32, padding: '2px 2px', border: 'none',
          fontSize: 12, background: 'transparent',
          outline: 'none', textAlign: 'right',
          color: '#0a0a0a', flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 11, color: '#a3a3a3', flexShrink: 0, marginRight: 4 }}>%</span>

      {/* Eye toggle */}
      <button
        onClick={toggleVisible}
        title={fill.visible ? 'Hide' : 'Show'}
        style={{
          width: 24, height: 24, padding: 0, border: 'none',
          background: 'none', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: fill.visible ? '#666' : '#ccc',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {fill.visible ? (
            <>
              <path d="M8 4C4.5 4 2 8 2 8s2.5 4 6 4 6-4 6-4-2.5-4-6-4z" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
            </>
          ) : (
            <>
              <path d="M8 4C4.5 4 2 8 2 8s2.5 4 6 4 6-4 6-4-2.5-4-6-4z" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <line x1="3" y1="13" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" />
            </>
          )}
        </svg>
      </button>

      {/* Remove */}
      <button
        onClick={onRemove}
        title="Remove fill"
        style={{
          width: 24, height: 24, padding: 0, border: 'none',
          background: 'none', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a3a3a3', fontSize: 18, lineHeight: 1,
        }}
      >
        −
      </button>

      {/* ColorPicker portal */}
      {pickerOpen && anchorRect && fill.type === 'solid' && (
        <ColorPicker
          color={fill.color}
          anchorRect={anchorRect}
          onChange={handleColorChange}
          onClose={closePicker}
        />
      )}
    </div>
  )
})
