import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { GradientFill, GradientStop } from '../../../types/fills'
import { ColorPicker } from './ColorPicker'
import { clamp } from '../../../utils/colorUtils'

const POPUP_W = 260
const BAR_H = 24
const STOP_SIZE = 14

interface GradientPickerProps {
  fill: GradientFill
  anchorRect: DOMRect
  onChange: (fill: GradientFill) => void
  onClose: () => void
}

export function GradientPicker({ fill, anchorRect, onChange, onClose }: GradientPickerProps) {
  const popRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [selectedStop, setSelectedStop] = useState(0)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [colorAnchor, setColorAnchor] = useState<DOMRect | null>(null)

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

  const updateStops = useCallback((stops: GradientStop[]) => {
    onChange({ ...fill, stops })
  }, [fill, onChange])

  const updateStopAt = useCallback((index: number, patch: Partial<GradientStop>) => {
    const stops = fill.stops.map((s, i) => i === index ? { ...s, ...patch } : s)
    updateStops(stops)
  }, [fill.stops, updateStops])

  // Drag stop
  const startStopDrag = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedStop(index)
    const bar = barRef.current
    if (!bar) return
    const barRect = bar.getBoundingClientRect()
    const w = barRect.width

    const onMove = (ev: MouseEvent) => {
      const x = clamp(ev.clientX - barRect.left, 0, w)
      const pos = Math.round((x / w) * 100) / 100
      updateStopAt(index, { position: pos })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [updateStopAt])

  // Add stop on bar click
  const handleBarClick = useCallback((e: React.MouseEvent) => {
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pos = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    // Interpolate color from neighbours
    const sorted = [...fill.stops].sort((a, b) => a.position - b.position)
    let color = '#888888'
    for (let i = 0; i < sorted.length - 1; i++) {
      if (pos >= sorted[i].position && pos <= sorted[i + 1].position) {
        color = sorted[i].color
        break
      }
    }
    const newStops = [...fill.stops, { color, position: Math.round(pos * 100) / 100 }]
    updateStops(newStops)
    setSelectedStop(newStops.length - 1)
  }, [fill.stops, updateStops])

  const removeStop = useCallback((index: number) => {
    if (fill.stops.length <= 2) return
    const stops = fill.stops.filter((_, i) => i !== index)
    updateStops(stops)
    setSelectedStop(Math.min(selectedStop, stops.length - 1))
  }, [fill.stops, updateStops, selectedStop])

  const openStopColor = useCallback((index: number, el: HTMLElement) => {
    setSelectedStop(index)
    setColorAnchor(el.getBoundingClientRect())
    setColorPickerOpen(true)
  }, [])

  // Gradient CSS for preview
  const gradientCSS = fill.gradientType === 'radial'
    ? `radial-gradient(circle, ${fill.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')})`
    : `linear-gradient(90deg, ${fill.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')})`

  // Position popup
  let left = anchorRect.left - POPUP_W - 8
  let top = anchorRect.top
  if (left < 8) left = anchorRect.right + 8
  if (top + 300 > window.innerHeight - 8) top = window.innerHeight - 308
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
      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['linear', 'radial'] as const).map(t => (
          <button
            key={t}
            onClick={() => onChange({ ...fill, gradientType: t })}
            style={{
              flex: 1, padding: '4px 0', border: '1px solid #e0e0e0',
              borderRadius: 4, fontSize: 11, cursor: 'pointer',
              background: fill.gradientType === t ? '#e8ecff' : '#fafafa',
              color: fill.gradientType === t ? '#3355aa' : '#666',
              fontWeight: fill.gradientType === t ? 600 : 400,
            }}
          >
            {t === 'linear' ? 'Linear' : 'Radial'}
          </button>
        ))}
      </div>

      {/* Gradient preview bar with draggable stops */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div
          ref={barRef}
          onClick={handleBarClick}
          style={{
            height: BAR_H, borderRadius: 6, cursor: 'pointer',
            background: gradientCSS,
            border: '1px solid #e0e0e0',
          }}
        />
        {/* Stop markers */}
        {fill.stops.map((stop, i) => (
          <div
            key={i}
            onMouseDown={e => startStopDrag(e, i)}
            onDoubleClick={(e) => openStopColor(i, e.currentTarget)}
            style={{
              position: 'absolute',
              left: `calc(${stop.position * 100}% - ${STOP_SIZE / 2}px)`,
              top: BAR_H - STOP_SIZE / 2 + 1,
              width: STOP_SIZE, height: STOP_SIZE,
              borderRadius: '50%',
              background: stop.color,
              border: selectedStop === i ? '2px solid #0066ff' : '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              zIndex: selectedStop === i ? 2 : 1,
            }}
          />
        ))}
      </div>

      {/* Selected stop info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>Stop {selectedStop + 1}</span>
        <div
          onClick={e => openStopColor(selectedStop, e.currentTarget)}
          style={{
            width: 22, height: 22, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #e0e0e0',
            background: fill.stops[selectedStop]?.color ?? '#000',
          }}
        />
        <input
          type="text"
          value={fill.stops[selectedStop]?.color ?? ''}
          onChange={e => updateStopAt(selectedStop, { color: e.target.value })}
          style={{
            flex: 1, minWidth: 0, padding: '3px 6px',
            border: '1px solid #e0e0e0', borderRadius: 4,
            fontSize: 11, fontFamily: 'monospace', outline: 'none',
          }}
        />
        <input
          type="number"
          min={0} max={100} step={1}
          value={Math.round((fill.stops[selectedStop]?.position ?? 0) * 100)}
          onChange={e => updateStopAt(selectedStop, { position: Number(e.target.value) / 100 })}
          style={{
            width: 38, padding: '3px 4px',
            border: '1px solid #e0e0e0', borderRadius: 4,
            fontSize: 11, textAlign: 'right', outline: 'none',
          }}
        />
        <span style={{ fontSize: 10, color: '#999' }}>%</span>
        {fill.stops.length > 2 && (
          <button
            onClick={() => removeStop(selectedStop)}
            title="Удалить стоп"
            style={{
              width: 18, height: 18, padding: 0, border: 'none',
              background: 'none', cursor: 'pointer', color: '#999',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Angle (for linear) */}
      {fill.gradientType === 'linear' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>Angle</span>
          <input
            type="range"
            min={0} max={360} step={1}
            value={fill.angle}
            onChange={e => onChange({ ...fill, angle: Number(e.target.value) })}
            style={{ flex: 1, minWidth: 0 }}
          />
          <input
            type="number"
            min={0} max={360} step={1}
            value={fill.angle}
            onChange={e => onChange({ ...fill, angle: Number(e.target.value) })}
            style={{
              width: 38, padding: '3px 4px',
              border: '1px solid #e0e0e0', borderRadius: 4,
              fontSize: 11, textAlign: 'right', outline: 'none',
            }}
          />
          <span style={{ fontSize: 10, color: '#999' }}>°</span>
        </div>
      )}

      {/* Color picker for selected stop */}
      {colorPickerOpen && colorAnchor && fill.stops[selectedStop] && (
        <ColorPicker
          color={fill.stops[selectedStop].color}
          anchorRect={colorAnchor}
          onChange={hex => updateStopAt(selectedStop, { color: hex })}
          onClose={() => setColorPickerOpen(false)}
        />
      )}
    </div>,
    document.body,
  )
}
