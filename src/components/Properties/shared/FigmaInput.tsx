import { useRef, useEffect, useState, useCallback } from 'react'
import { useAltKey } from './useAltKey'

// ─── CSS Unit utilities ──────────────────────────────────────────────────────

export const CSS_UNITS = ['px', '%', 'vw', 'vh'] as const
export type CssUnit = (typeof CSS_UNITS)[number]

export const SPECIAL_VALUES = ['auto', 'none'] as const
export type SpecialValue = (typeof SPECIAL_VALUES)[number]

export function parseCssValue(raw: string | undefined): { num: string; unit: CssUnit | SpecialValue } {
  if (!raw || raw === 'auto') return { num: '', unit: 'auto' }
  if (raw === 'none') return { num: '', unit: 'none' }
  const match = raw.match(/^(-?[\d.]+)\s*(px|%|em|rem|vw|vh|svw|svh|ch)?$/)
  if (match) return { num: match[1], unit: (match[2] as CssUnit) || 'px' }
  const numOnly = parseFloat(raw)
  if (!isNaN(numOnly)) return { num: String(numOnly), unit: 'px' }
  return { num: '', unit: 'px' }
}

export function composeCssValue(num: string, unit: CssUnit | SpecialValue): string {
  if (unit === 'auto') return 'auto'
  if (unit === 'none') return 'none'
  if (!num && num !== '0') return ''
  return `${num}${unit}`
}

// ─── FigmaInput ───────────────────────────────────────────────────────────────

export function FigmaInput({ prefix, value, placeholder, allowAuto, allowNone, onChange, onReset, testId }: {
  prefix: React.ReactNode
  value: string
  placeholder?: string
  allowAuto?: boolean
  allowNone?: boolean
  onChange: (v: string) => void
  onReset?: () => void
  testId?: string
}) {
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const altPressed = useAltKey(!!onReset)
  const resetHint = onReset && altPressed && hovered
  const parsed = parseCssValue(value)
  const isSpecial = parsed.unit === 'auto' || parsed.unit === 'none'

  // Локальный state для отображаемого числа — чтобы можно было печатать в «auto» поле
  const [localNum, setLocalNum] = useState(parsed.num)
  useEffect(() => {
    if (!focused) setLocalNum(parsed.num)
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNum = e.target.value
    setLocalNum(newNum)
    if (newNum === '') {
      // пустое поле → вернуть дефолт
      if (allowNone) onChange('none')
      else onChange('auto')
    } else {
      // если было auto/none — переключиться на px
      const unit = isSpecial ? 'px' : (parsed.unit as CssUnit)
      onChange(composeCssValue(newNum, unit))
    }
  }

  const handleBlur = () => {
    setFocused(false)
    // нормализовать: если localNum невалидное — сбросить
    if (localNum !== '' && isNaN(parseFloat(localNum))) {
      setLocalNum(parsed.num)
    }
  }

  const handleUnitChange = (newUnit: CssUnit | SpecialValue) => {
    if (newUnit === 'auto') onChange('auto')
    else if (newUnit === 'none') onChange('none')
    else onChange(composeCssValue(parsed.num || localNum || '0', newUnit))
  }

  const units: (CssUnit | SpecialValue)[] = [...CSS_UNITS]
  if (allowAuto) units.push('auto')
  if (allowNone) units.push('none')

  // ─── Drag-to-scrub on prefix label ──────────────────────────────────
  const scrubRef = useRef<{ startX: number; startVal: number } | null>(null)

  const handlePrefixMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startVal = parsed.num ? parseFloat(parsed.num) : 0
    const unit = isSpecial ? 'px' : (parsed.unit as CssUnit)
    scrubRef.current = { startX, startVal }

    const onMove = (me: MouseEvent) => {
      if (!scrubRef.current) return
      const delta = me.clientX - scrubRef.current.startX
      const step = me.shiftKey ? 10 : 1
      const newVal = Math.round(scrubRef.current.startVal + delta * step * 0.5)
      onChange(composeCssValue(String(newVal), unit))
    }
    const onUp = () => {
      scrubRef.current = null
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.body.style.cursor = 'ew-resize'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [parsed, isSpecial, onChange])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onReset ? (e) => {
        if (e.altKey) { e.preventDefault(); e.stopPropagation(); onReset() }
      } : undefined}
      title={onReset ? '⌥ Click to reset' : undefined}
      style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center',
        height: 30,
        background: focused ? '#fff' : '#f0f0f0',
        borderRadius: 6,
        border: focused ? '1.5px solid #0a0a0a' : '1.5px solid transparent',
        padding: '0 3px 0 6px',
        gap: 4,
        boxSizing: 'border-box',
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      {/* Prefix — drag to scrub */}
      <span
        onMouseDown={handlePrefixMouseDown}
        style={{
          fontSize: 11, color: resetHint ? '#ef4444' : '#737373', flexShrink: 0,
          display: 'flex', alignItems: 'center',
          userSelect: 'none', fontWeight: 500,
          cursor: 'ew-resize',
          transition: 'color 0.15s',
        }}
      >
        {prefix}
      </span>

      {/* Number input — никогда не disabled */}
      <input
        type="text"
        value={localNum}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        data-testid={testId}
        style={{
          flex: 1, border: 'none', background: 'transparent',
          fontSize: 12, color: '#0a0a0a',
          outline: 'none', minWidth: 0, padding: 0,
        }}
      />

      {/* Unit dropdown */}
      <UnitDropdown value={parsed.unit} options={units} onChange={handleUnitChange} />
    </div>
  )
}

// ─── UnitDropdown ─────────────────────────────────────────────────────────────

export function UnitDropdown({ value, options, onChange }: {
  value: CssUnit | SpecialValue
  options: (CssUnit | SpecialValue)[]
  onChange: (unit: CssUnit | SpecialValue) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        title="Unit — px, % (of parent), vw/vh (of viewport), auto or none"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
          height: 18, padding: '0 3px',
          border: 'none', background: open ? '#e5e5e5' : 'transparent',
          borderRadius: 3, cursor: 'default',
          color: '#737373', fontSize: 10, fontWeight: 500,
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = '#e8e8e8' }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <span>{value === 'auto' ? 'A' : value === 'none' ? 'N' : value.toUpperCase()}</span>
        <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 2.5L4 5L6.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          zIndex: 200, background: '#fff',
          border: '1px solid #e0e0e0', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: 64, maxHeight: 220, overflowY: 'auto',
          padding: 3,
        }}>
          {options.map((unit) => {
            const active = unit === value
            return (
              <button
                key={unit}
                onClick={() => { onChange(unit); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '4px 8px',
                  border: 'none', borderRadius: 4, textAlign: 'left',
                  background: active ? '#0a0a0a' : 'transparent',
                  color: active ? '#fff' : '#525252',
                  fontSize: 11, fontWeight: active ? 600 : 400,
                  cursor: 'default',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {unit === 'auto' ? 'Auto' : unit === 'none' ? 'None' : unit.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
