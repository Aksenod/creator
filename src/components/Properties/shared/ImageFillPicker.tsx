import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ImageFill, ScaleMode } from '../../../types/fills'

const POPUP_W = 260

interface ImageFillPickerProps {
  fill: ImageFill
  anchorRect: DOMRect
  onChange: (fill: ImageFill) => void
  onClose: () => void
}

export function ImageFillPicker({ fill, anchorRect, onChange, onClose }: ImageFillPickerProps) {
  const popRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState(fill.url.startsWith('data:') ? '' : fill.url)

  // Click-outside & Escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const tid = setTimeout(() => {
      document.addEventListener('mousedown', handleDown)
      document.addEventListener('keydown', handleKey)
    }, 50)
    return () => {
      clearTimeout(tid)
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ ...fill, url: reader.result })
      }
    }
    reader.readAsDataURL(file)
  }, [fill, onChange])

  const handleUrlBlur = useCallback(() => {
    if (urlInput && urlInput !== fill.url) {
      onChange({ ...fill, url: urlInput })
    }
  }, [urlInput, fill, onChange])

  const handleUrlKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur()
    }
  }, [])

  const handleScaleMode = useCallback((mode: ScaleMode) => {
    onChange({ ...fill, scaleMode: mode })
  }, [fill, onChange])

  // Position popup
  let left = anchorRect.left - POPUP_W - 8
  let top = anchorRect.top
  if (left < 8) left = anchorRect.right + 8
  if (top + 280 > window.innerHeight - 8) top = window.innerHeight - 288
  if (top < 8) top = 8

  return createPortal(
    <div
      ref={popRef}
      style={{
        position: 'fixed', top, left,
        width: POPUP_W, background: '#fff', border: '1px solid #e0e0e0',
        borderRadius: 8, padding: 12, zIndex: 99999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)', userSelect: 'none',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Preview */}
      <div style={{
        width: '100%', height: 120, borderRadius: 6,
        border: '1px solid #e0e0e0', marginBottom: 10,
        background: fill.url
          ? `url(${fill.url}) center/${fill.scaleMode === 'fill' ? 'cover' : fill.scaleMode === 'fit' ? 'contain' : 'auto'} ${fill.scaleMode === 'tile' ? 'repeat' : 'no-repeat'}`
          : '#f5f5f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {!fill.url && (
          <span style={{ fontSize: 11, color: '#aaa' }}>Нет изображения</span>
        )}
      </div>

      {/* Upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          width: '100%', padding: '6px 0', marginBottom: 8,
          border: '1px solid #e0e0e0', borderRadius: 4,
          background: '#fafafa', cursor: 'pointer',
          fontSize: 12, color: '#333',
        }}
      >
        Загрузить файл
      </button>

      {/* URL input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>URL</span>
        <input
          type="text"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onBlur={handleUrlBlur}
          onKeyDown={handleUrlKeyDown}
          placeholder="https://..."
          style={{
            flex: 1, minWidth: 0, padding: '4px 6px',
            border: '1px solid #e0e0e0', borderRadius: 4,
            fontSize: 11, outline: 'none',
          }}
        />
      </div>

      {/* Scale mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>Scale</span>
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {([
            { mode: 'fill' as const, label: 'Fill' },
            { mode: 'fit' as const, label: 'Fit' },
            { mode: 'tile' as const, label: 'Tile' },
          ]).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => handleScaleMode(mode)}
              style={{
                flex: 1, padding: '4px 0',
                border: '1px solid #e0e0e0', borderRadius: 4,
                fontSize: 11, cursor: 'pointer',
                background: fill.scaleMode === mode ? '#e8ecff' : '#fafafa',
                color: fill.scaleMode === mode ? '#3355aa' : '#666',
                fontWeight: fill.scaleMode === mode ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
