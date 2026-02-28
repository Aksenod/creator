import { useState } from 'react'
import type { ElementStyles } from '../../types'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function BorderSection({ styles, onUpdate }: Props) {
  const [open, setOpen] = useState(true)
  const radius = styles.borderRadius ?? 0

  return (
    <CollapsibleSection label="Borders" open={open} onToggle={() => setOpen(!open)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Radius */}
        <BRow label="Radius">
          <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={radius}
              onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
              style={{ flex: 1, minWidth: 0, height: 4, accentColor: '#0066ff' }}
            />
            <input
              type="number"
              min={0}
              value={radius}
              onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
              style={{ width: 36, flexShrink: 0, padding: '3px 4px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none', textAlign: 'center' }}
            />
            <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>PX</span>
          </div>
        </BRow>

        {/* Border section */}
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Border</span>

          {/* Style */}
          <BRow label="Style">
            <div style={{ display: 'flex', background: '#efefef', borderRadius: 6, padding: 2, gap: 1, flex: 1, minWidth: 0 }}>
              {([
                { value: 'none', label: '×' },
                { value: 'solid', label: '—' },
                { value: 'dashed', label: '- -' },
                { value: 'dotted', label: '···' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ borderStyle: opt.value })}
                  style={{
                    flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'pointer',
                    fontSize: opt.value === 'none' ? 12 : 10,
                    background: (styles.borderStyle ?? 'none') === opt.value ? '#1a1a1a' : 'transparent',
                    color: (styles.borderStyle ?? 'none') === opt.value ? '#fff' : '#888',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </BRow>

          {/* Width */}
          <BRow label="Width">
            <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                value={styles.borderWidth ?? 0}
                onChange={e => onUpdate({ borderWidth: Number(e.target.value) })}
                style={{ flex: 1, minWidth: 0, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none' }}
              />
              <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>PX</span>
            </div>
          </BRow>

          {/* Color */}
          <BRow label="Color">
            <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0, alignItems: 'center' }}>
              <input
                type="color"
                value={styles.borderColor ?? '#000000'}
                onChange={e => onUpdate({ borderColor: e.target.value })}
                style={{ width: 28, height: 28, padding: 2, border: 'none', borderRight: '1px solid #e0e0e0', cursor: 'pointer', flexShrink: 0 }}
              />
              <input
                value={styles.borderColor ?? ''}
                onChange={e => onUpdate({ borderColor: e.target.value })}
                placeholder="—"
                style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
              />
            </div>
          </BRow>
        </div>

      </div>
    </CollapsibleSection>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CollapsibleSection({ label, open, onToggle, children }: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ padding: '8px 0' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 0, border: 'none', background: 'none',
          cursor: 'pointer', marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{label}</span>
        <span style={{
          fontSize: 9, color: '#aaa',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.15s',
          display: 'inline-block',
        }}>▼</span>
      </button>
      {open && children}
    </div>
  )
}

function BRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: '#999', width: 44, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
