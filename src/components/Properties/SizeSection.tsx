import { useRef, useEffect, useState } from 'react'
import type { ElementStyles } from '../../types'
import { CollapsibleSection } from './shared'

// ─── CSS Unit utilities ──────────────────────────────────────────────────────

const CSS_UNITS = ['px', '%', 'em', 'rem', 'vw', 'vh', 'svw', 'svh', 'ch'] as const
type CssUnit = (typeof CSS_UNITS)[number]

const SPECIAL_VALUES = ['auto', 'none'] as const
type SpecialValue = (typeof SPECIAL_VALUES)[number]

/** Parse "100px" → { num: "100", unit: "px" }, "auto" → { num: "", unit: "auto" } */
function parseCssValue(raw: string | undefined): { num: string; unit: CssUnit | SpecialValue } {
  if (!raw || raw === 'auto') return { num: '', unit: 'auto' }
  if (raw === 'none') return { num: '', unit: 'none' }

  const match = raw.match(/^(-?[\d.]+)\s*(px|%|em|rem|vw|vh|svw|svh|ch)?$/)
  if (match) {
    return { num: match[1], unit: (match[2] as CssUnit) || 'px' }
  }
  // fallback: try to just get a number
  const numOnly = parseFloat(raw)
  if (!isNaN(numOnly)) return { num: String(numOnly), unit: 'px' }

  return { num: '', unit: 'px' }
}

/** Compose "100" + "px" → "100px", "" + "auto" → "auto" */
function composeCssValue(num: string, unit: CssUnit | SpecialValue): string {
  if (unit === 'auto') return 'auto'
  if (unit === 'none') return 'none'
  if (!num && num !== '0') return ''
  return `${num}${unit}`
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function SizeSection({ styles, onUpdate }: Props) {
  return (
    <CollapsibleSection label="Size" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Width + Height */}
        <div style={{ display: 'flex', gap: 8, minWidth: 0 }}>
          <SizeInput
            label="Width"
            value={styles.width ?? ''}
            placeholder="Auto"
            allowAuto
            onReset={() => onUpdate({ width: 'auto' })}
            onChange={(v) => onUpdate({ width: v || undefined })}
          />
          <SizeInput
            label="Height"
            value={styles.height ?? ''}
            placeholder="Auto"
            allowAuto
            onReset={() => onUpdate({ height: 'auto' })}
            onChange={(v) => onUpdate({ height: v || undefined })}
          />
        </div>

        {/* Min W + Min H */}
        <div style={{ display: 'flex', gap: 8, minWidth: 0 }}>
          <SizeInput
            label="Min W"
            value={styles.minWidth ?? ''}
            placeholder="0"
            onChange={(v) => onUpdate({ minWidth: v || undefined })}
          />
          <SizeInput
            label="Min H"
            value={styles.minHeight ?? ''}
            placeholder="0"
            onChange={(v) => onUpdate({ minHeight: v || undefined })}
          />
        </div>

        {/* Max W + Max H */}
        <div style={{ display: 'flex', gap: 8, minWidth: 0 }}>
          <SizeInput
            label="Max W"
            value={styles.maxWidth ?? ''}
            placeholder="None"
            allowNone
            onReset={() => onUpdate({ maxWidth: undefined })}
            onChange={(v) => onUpdate({ maxWidth: v || undefined })}
          />
          <SizeInput
            label="Max H"
            value={styles.maxHeight ?? ''}
            placeholder="None"
            allowNone
            onReset={() => onUpdate({ maxHeight: undefined })}
            onChange={(v) => onUpdate({ maxHeight: v || undefined })}
          />
        </div>

        {/* Overflow */}
        <OverflowRow
          value={styles.overflow}
          onChange={(v) => onUpdate({ overflow: v })}
        />

      </div>
    </CollapsibleSection>
  )
}

// ─── SizeInput: unified input with unit dropdown ─────────────────────────────

function SizeInput({ label, value, placeholder, allowAuto, allowNone, onChange, onReset }: {
  label: string
  value: string
  placeholder: string
  allowAuto?: boolean
  allowNone?: boolean
  onChange: (v: string) => void
  onReset?: () => void
}) {
  const parsed = parseCssValue(value)
  const isSpecial = parsed.unit === 'auto' || parsed.unit === 'none'

  const handleNumChange = (newNum: string) => {
    if (isSpecial) return
    onChange(composeCssValue(newNum, parsed.unit))
  }

  const handleUnitChange = (newUnit: CssUnit | SpecialValue) => {
    if (newUnit === 'auto') {
      onChange('auto')
    } else if (newUnit === 'none') {
      onChange('none')
    } else {
      const num = parsed.num || ''
      onChange(composeCssValue(num, newUnit))
    }
  }

  // Build available units for this field
  const units: (CssUnit | SpecialValue)[] = [...CSS_UNITS]
  if (allowAuto) units.push('auto')
  if (allowNone) units.push('none')

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 3 }}>{label}</div>
      <div style={{
        display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4,
        overflow: 'visible', background: '#fafafa', position: 'relative',
      }}>
        <input
          type={isSpecial ? 'text' : 'number'}
          value={isSpecial ? '' : parsed.num}
          onChange={(e) => handleNumChange(e.target.value)}
          placeholder={isSpecial ? (parsed.unit === 'auto' ? 'Auto' : 'None') : placeholder}
          disabled={isSpecial}
          style={{
            flex: 1, border: 'none', padding: '4px 6px',
            fontSize: 12, background: 'transparent', outline: 'none',
            color: isSpecial ? '#bbb' : '#1a1a1a', minWidth: 0,
            cursor: isSpecial ? 'default' : undefined,
          }}
        />
        <UnitDropdown
          value={isSpecial ? parsed.unit : parsed.unit}
          options={units}
          onChange={handleUnitChange}
        />
        {onReset && (
          <button
            onClick={onReset}
            title="Сбросить"
            style={{
              padding: '0 7px', border: 'none', borderLeft: '1px solid #e0e0e0',
              background: '#f0f0f0', cursor: 'pointer', color: '#bbb',
              fontSize: 13, lineHeight: 1, flexShrink: 0,
            }}
          >
            –
          </button>
        )}
      </div>
    </div>
  )
}

// ─── UnitDropdown ────────────────────────────────────────────────────────────

function UnitDropdown({ value, options, onChange }: {
  value: CssUnit | SpecialValue
  options: (CssUnit | SpecialValue)[]
  onChange: (unit: CssUnit | SpecialValue) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayLabel = value.toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '0 6px', height: '100%',
          borderLeft: '1px solid #e0e0e0', borderTop: 'none', borderBottom: 'none', borderRight: 'none',
          background: open ? '#e0e0e0' : '#efefef',
          fontSize: 10, color: open ? '#1a1a1a' : '#999',
          display: 'flex', alignItems: 'center', gap: 2,
          cursor: 'pointer', fontWeight: 500,
          transition: 'background 0.1s',
        }}
      >
        {displayLabel}
        <span style={{
          fontSize: 7, marginLeft: 1,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          zIndex: 200, background: '#fff',
          border: '1px solid #e0e0e0', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: 56, maxHeight: 200, overflowY: 'auto',
          padding: 3,
        }}>
          {options.map((unit) => {
            const active = unit === value
            return (
              <button
                key={unit}
                onClick={() => { onChange(unit); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '4px 8px',
                  border: 'none', borderRadius: 4,
                  background: active ? '#1a1a1a' : 'transparent',
                  color: active ? '#fff' : '#555',
                  fontSize: 11, fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {unit.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── OverflowRow ─────────────────────────────────────────────────────────────

type OverflowValue = ElementStyles['overflow']

const OVERFLOW_OPTIONS: { value: NonNullable<OverflowValue>; icon: React.ReactNode }[] = [
  {
    value: 'visible',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'hidden',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'scroll',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2L7 12M4 5L7 2L10 5M4 9L7 12L10 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'auto',
    icon: <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '-0.02em' }}>Auto</span>,
  },
]

function OverflowRow({ value, onChange }: {
  value: OverflowValue
  onChange: (v: OverflowValue) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
      <span style={{ fontSize: 10, color: '#aaa', width: 52, flexShrink: 0 }}>Overflow</span>
      <div style={{
        display: 'flex', background: '#efefef', borderRadius: 6,
        padding: 2, gap: 2, flex: 1,
      }}>
        {OVERFLOW_OPTIONS.map((opt) => {
          const active = (value ?? 'visible') === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.value}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'pointer',
                background: active ? '#1a1a1a' : 'transparent',
                color: active ? '#fff' : '#888',
                transition: 'all 0.1s',
              }}
            >
              {opt.icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
