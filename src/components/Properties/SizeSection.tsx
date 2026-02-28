import { useState } from 'react'
import type { ElementStyles } from '../../types'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function SizeSection({ styles, onUpdate }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ padding: '8px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 0, border: 'none', background: 'none',
          cursor: 'pointer', marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>Size</span>
        <span style={{
          fontSize: 9, color: '#aaa',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.15s', display: 'inline-block',
        }}>▼</span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Width + Height */}
          <div style={{ display: 'flex', gap: 8 }}>
            <SizeField
              label="Width"
              value={styles.width ?? ''}
              placeholder="Auto"
              onReset={() => onUpdate({ width: 'auto' })}
              onChange={(v) => onUpdate({ width: v })}
            />
            <SizeField
              label="Height"
              value={styles.height ?? ''}
              placeholder="Auto"
              onReset={() => onUpdate({ height: 'auto' })}
              onChange={(v) => onUpdate({ height: v })}
            />
          </div>

          {/* Min W + Min H */}
          <div style={{ display: 'flex', gap: 8 }}>
            <MinMaxField
              label="Min W"
              value={styles.minWidth ?? ''}
              unit="PX"
              onChange={(v) => onUpdate({ minWidth: v ? v : undefined })}
            />
            <MinMaxField
              label="Min H"
              value={styles.minHeight ?? ''}
              unit="PX"
              onChange={(v) => onUpdate({ minHeight: v ? v : undefined })}
            />
          </div>

          {/* Max W + Max H */}
          <div style={{ display: 'flex', gap: 8 }}>
            <SizeField
              label="Max W"
              value={styles.maxWidth ?? ''}
              placeholder="None"
              onReset={() => onUpdate({ maxWidth: undefined })}
              onChange={(v) => onUpdate({ maxWidth: v })}
            />
            <SizeField
              label="Max H"
              value={styles.maxHeight ?? ''}
              placeholder="None"
              onReset={() => onUpdate({ maxHeight: undefined })}
              onChange={(v) => onUpdate({ maxHeight: v })}
            />
          </div>

          {/* Overflow */}
          <OverflowRow
            value={styles.overflow}
            onChange={(v) => onUpdate({ overflow: v })}
          />

        </div>
      )}
    </div>
  )
}

// ─── SizeField: input + "-" reset button ──────────────────────────────────────

function SizeField({ label, value, placeholder, onChange, onReset }: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  onReset: () => void
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 3 }}>{label}</div>
      <div style={{
        display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4,
        overflow: 'hidden', background: '#fafafa',
      }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', padding: '4px 6px',
            fontSize: 12, background: 'transparent', outline: 'none',
            color: '#1a1a1a', minWidth: 0,
          }}
        />
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
      </div>
    </div>
  )
}

// ─── MinMaxField: number input + PX badge ────────────────────────────────────

function MinMaxField({ label, value, unit, onChange }: {
  label: string
  value: string
  unit: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 3 }}>{label}</div>
      <div style={{
        display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4,
        overflow: 'hidden', background: '#fafafa',
      }}>
        <input
          type="number"
          min={0}
          value={value === '' ? '' : parseFloat(value) || 0}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          style={{
            flex: 1, border: 'none', padding: '4px 6px',
            fontSize: 12, background: 'transparent', outline: 'none',
            color: '#1a1a1a', minWidth: 0,
          }}
        />
        <span style={{
          padding: '0 6px', borderLeft: '1px solid #e0e0e0',
          background: '#efefef', fontSize: 10, color: '#999',
          display: 'flex', alignItems: 'center', flexShrink: 0,
          fontWeight: 500,
        }}>
          {unit}
        </span>
      </div>
    </div>
  )
}

// ─── OverflowRow ──────────────────────────────────────────────────────────────

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
