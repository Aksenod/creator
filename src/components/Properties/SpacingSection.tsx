import { useState } from 'react'
import type { ElementStyles } from '../../types'

type Props = {
  styles: Partial<ElementStyles>
  onUpdate: (patch: Partial<ElementStyles>) => void
}

// ─── SpacingSection ───────────────────────────────────────────────────────────

export function SpacingSection({ styles, onUpdate }: Props) {
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
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>Spacing</span>
        <span style={{
          fontSize: 9, color: '#aaa',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.15s', display: 'inline-block',
        }}>▼</span>
      </button>

      {open && (
        // ─── Outer box: MARGIN (тёплый оранжевый как у Webflow) ──────────────
        <div style={{
          position: 'relative',
          border: '1px solid #e8d8bc',
          borderRadius: 4,
          background: '#fef8ee',
          padding: '24px 46px',
        }}>
          <span style={{
            position: 'absolute', top: 4, left: 7,
            fontSize: 8, color: '#c8a060', letterSpacing: '0.06em',
            userSelect: 'none', fontWeight: 600,
          }}>
            MARGIN
          </span>

          {/* Margin inputs */}
          <SpacingValue
            value={styles.marginTop}
            onChange={(v) => onUpdate({ marginTop: v })}
            style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)' }}
          />
          <SpacingValue
            value={styles.marginRight}
            onChange={(v) => onUpdate({ marginRight: v })}
            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
          />
          <SpacingValue
            value={styles.marginBottom}
            onChange={(v) => onUpdate({ marginBottom: v })}
            style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)' }}
          />
          <SpacingValue
            value={styles.marginLeft}
            onChange={(v) => onUpdate({ marginLeft: v })}
            style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)' }}
          />

          {/* ─── Inner box: PADDING (синеватый как у Webflow) ──────────────── */}
          <div style={{
            position: 'relative',
            border: '1px solid #b8ccf0',
            borderRadius: 3,
            background: '#eef3ff',
            padding: '22px 38px',
          }}>
            <span style={{
              position: 'absolute', bottom: 4, left: 6,
              fontSize: 8, color: '#7090c8', letterSpacing: '0.06em',
              userSelect: 'none', fontWeight: 600,
              pointerEvents: 'none',
            }}>
              PADDING
            </span>

            {/* Padding inputs */}
            <SpacingValue
              value={styles.paddingTop}
              onChange={(v) => onUpdate({ paddingTop: v })}
              style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)' }}
            />
            <SpacingValue
              value={styles.paddingRight}
              onChange={(v) => onUpdate({ paddingRight: v })}
              style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)' }}
            />
            <SpacingValue
              value={styles.paddingBottom}
              onChange={(v) => onUpdate({ paddingBottom: v })}
              style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)' }}
            />
            <SpacingValue
              value={styles.paddingLeft}
              onChange={(v) => onUpdate({ paddingLeft: v })}
              style={{ position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)' }}
            />

            {/* Центральный прямоугольник — сам элемент */}
            <div style={{
              background: '#dce6f8',
              borderRadius: 2,
              minHeight: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 9, color: '#6880b8', userSelect: 'none' }}>element</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SpacingValue ─────────────────────────────────────────────────────────────

function SpacingValue({
  value,
  onChange,
  style,
}: {
  value?: number
  onChange: (v: number | undefined) => void
  style?: React.CSSProperties
}) {
  const [hover, setHover] = useState(false)
  const hasValue = value !== undefined && value !== 0

  return (
    <div style={{ ...style, zIndex: 1 }}>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = parseInt(e.target.value)
          onChange(isNaN(v) ? undefined : v)
        }}
        placeholder="–"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 32,
          padding: '2px 3px',
          border: `1px solid ${hover || hasValue ? (hasValue ? '#0066ff' : '#c8a060') : 'transparent'}`,
          borderRadius: 3,
          fontSize: 11,
          textAlign: 'center',
          background: hasValue ? '#e6f0ff' : 'transparent',
          color: hasValue ? '#0066ff' : '#a88840',
          outline: 'none',
          cursor: 'text',
          transition: 'border-color 0.1s, background 0.1s',
        }}
      />
    </div>
  )
}
