import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { hexToHsv, hsvToHex, hsvToRgb, isValidHex, clamp, type HSV } from '../../../utils/colorUtils'

const POPUP_W = 240
const POPUP_PAD = 12
const CANVAS_W = POPUP_W - POPUP_PAD * 2 // 216
const CANVAS_H = 160
const HUE_H = 12

interface ColorPickerProps {
  color: string
  anchorRect: DOMRect
  onChange: (hex: string) => void
  onClose: () => void
}

export function ColorPicker({ color, anchorRect, onChange, onClose }: ColorPickerProps) {
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(color))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Sync from external color change
  const lastExternal = useRef(color)
  useEffect(() => {
    if (color !== lastExternal.current) {
      lastExternal.current = color
      setHsv(hexToHsv(color))
    }
  }, [color])

  // Emit onChange
  const emit = useCallback((next: HSV) => {
    setHsv(next)
    const hex = hsvToHex(next)
    lastExternal.current = hex
    onChange(hex)
  }, [onChange])

  // Draw SB canvas
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const w = CANVAS_W, h = CANVAS_H
    const img = ctx.createImageData(w, h)
    const { h: hue } = hsv
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = x / (w - 1)
        const v = 1 - y / (h - 1)
        const rgb = hsvToRgb({ h: hue, s, v })
        const i = (y * w + x) * 4
        img.data[i] = rgb.r
        img.data[i + 1] = rgb.g
        img.data[i + 2] = rgb.b
        img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [hsv.h]) // redraw only on hue change

  // --- SB drag ---
  const handleSBDrag = useCallback((e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clamp(e.clientX - rect.left, 0, CANVAS_W - 1)
    const y = clamp(e.clientY - rect.top, 0, CANVAS_H - 1)
    const s = x / (CANVAS_W - 1)
    const v = 1 - y / (CANVAS_H - 1)
    emit({ ...hsv, s, v })
  }, [hsv, emit])

  const sbDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleSBDrag(e)
    const hsvSnap = { ...hsv }
    const onMove = (ev: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = clamp(ev.clientX - rect.left, 0, CANVAS_W - 1)
      const y = clamp(ev.clientY - rect.top, 0, CANVAS_H - 1)
      const s = x / (CANVAS_W - 1)
      const v = 1 - y / (CANVAS_H - 1)
      hsvSnap.s = s
      hsvSnap.v = v
      emit({ ...hsvSnap })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [hsv, emit])

  // --- Hue drag ---
  const hueDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const hueEl = e.currentTarget as HTMLElement
    const rect = hueEl.getBoundingClientRect()
    const w = rect.width
    const xInit = clamp(e.clientX - rect.left, 0, w)
    const hInit = (xInit / w) * 360
    const hsvSnap = { ...hsv, h: hInit }
    emit({ ...hsvSnap })
    const onMove = (ev: MouseEvent) => {
      const x = clamp(ev.clientX - rect.left, 0, w)
      hsvSnap.h = (x / w) * 360
      emit({ ...hsvSnap })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [hsv, emit])

  // --- Hex input ---
  const [hexInput, setHexInput] = useState('')
  const [hexFocused, setHexFocused] = useState(false)
  const hexDisplay = hexFocused ? hexInput : hsvToHex(hsv).slice(1).toUpperCase()

  const hexFocus = useCallback(() => {
    setHexInput(hsvToHex(hsv).slice(1).toUpperCase())
    setHexFocused(true)
  }, [hsv])

  const hexBlur = useCallback(() => {
    setHexFocused(false)
    const candidate = hexInput.startsWith('#') ? hexInput : `#${hexInput}`
    if (isValidHex(candidate)) {
      emit(hexToHsv(candidate))
    }
  }, [hexInput, emit])

  const hexKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur()
    }
  }, [])

  // --- Eyedropper ---
  const eyedropper = useCallback(async () => {
    if (!('EyeDropper' in window)) return
    try {
      // @ts-expect-error EyeDropper API not yet in lib.dom
      const dropper = new window.EyeDropper()
      const result = await dropper.open()
      const hex = result.sRGBHex as string
      emit(hexToHsv(hex))
    } catch { /* user cancelled */ }
  }, [emit])

  // --- Click-outside & Escape & Eyedropper hotkey ---
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'i' || e.key === 'I') {
        if (hexFocused) return // don't trigger while typing hex
        e.preventDefault()
        eyedropper()
      }
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
  }, [onClose, hexFocused, eyedropper])

  // --- Position: left of anchor, fallback down ---
  const popH = CANVAS_H + HUE_H + 40 + POPUP_PAD * 2 + 16 // approximate
  let left = anchorRect.left - POPUP_W - 8
  let top = anchorRect.top
  if (left < 8) left = anchorRect.right + 8
  if (top + popH > window.innerHeight - 8) top = window.innerHeight - 8 - popH
  if (top < 8) top = 8

  // SB indicator position
  const indX = hsv.s * (CANVAS_W - 1)
  const indY = (1 - hsv.v) * (CANVAS_H - 1)

  return createPortal(
    <div
      ref={popRef}
      style={{
        position: 'fixed',
        top,
        left,
        width: POPUP_W,
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 12,
        padding: POPUP_PAD,
        zIndex: 99999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        userSelect: 'none',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* SB Canvas */}
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, cursor: 'crosshair', borderRadius: 4, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', width: CANVAS_W, height: CANVAS_H }}
          onMouseDown={sbDown}
        />
        {/* Crosshair indicator */}
        <div style={{
          position: 'absolute',
          left: indX - 6,
          top: indY - 6,
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '2px solid #fff',
          boxShadow: '0 0 2px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Eyedropper + Hue slider row */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, gap: 8 }}>
        {'EyeDropper' in window && (
          <button
            onClick={eyedropper}
            title="Пипетка (I)"
            style={{
              width: 16,
              height: 16,
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              color: '#333',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.354 3.354l-.708-.708L14 1.293 14.707 2l-1.353 1.354zM11.5 2.5l2 2-1.146 1.146-2-2L11.5 2.5zM9.646 4.354l2 2-5.5 5.5H4.5v-.646l-.854.853L2.94 11.354l.853-.854H3.146l-.5-.5v-1.646l5.5-5.5 1.5 1.5zM3.146 9.854L2.5 10.5v1l.5.5h1l.646-.646-1.5-1.5z" fill="currentColor"/>
            </svg>
          </button>
        )}
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: HUE_H,
            borderRadius: 6,
            cursor: 'pointer',
            background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
          }}
          onMouseDown={hueDown}
        >
          {/* Hue indicator */}
          <div style={{
            position: 'absolute',
            left: `calc(${(hsv.h / 360) * 100}% - 6px)`,
            top: -2,
            width: 12,
            height: HUE_H + 4,
            borderRadius: 6,
            border: '2px solid #fff',
            boxShadow: '0 0 2px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }} />
        </div>
      </div>

      {/* Hex input row */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, gap: 4 }}>
        <span style={{ fontSize: 12, color: '#737373', flexShrink: 0 }}>#</span>
        <input
          value={hexDisplay}
          onChange={e => setHexInput(e.target.value)}
          onFocus={hexFocus}
          onBlur={hexBlur}
          onKeyDown={hexKeyDown}
          maxLength={7}
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid #e5e5e5',
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 12,
            fontFamily: 'monospace',
            outline: 'none',
          }}
        />
      </div>
    </div>,
    document.body
  )
}
