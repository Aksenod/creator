import { useState } from 'react'
import type { ElementStyles } from '../../types'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
  'Poppins', 'Nunito', 'Manrope', 'Playfair Display',
  'Arial', 'Georgia', 'Times New Roman', 'Helvetica',
]

export function TypographySection({ styles, onUpdate }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <CollapsibleSection label="Typography" open={open} onToggle={() => setOpen(!open)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Font */}
        <TypoRow label="Font">
          <select
            value={styles.fontFamily ?? ''}
            onChange={e => onUpdate({ fontFamily: e.target.value || undefined })}
            style={selectStyle}
          >
            <option value="">—</option>
            {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </TypoRow>

        {/* Weight */}
        <TypoRow label="Weight">
          <select
            value={styles.fontWeight ?? ''}
            onChange={e => onUpdate({ fontWeight: e.target.value || undefined })}
            style={selectStyle}
          >
            <option value="">—</option>
            <option value="100">100 – Thin</option>
            <option value="200">200 – ExtraLight</option>
            <option value="300">300 – Light</option>
            <option value="400">400 – Normal</option>
            <option value="500">500 – Medium</option>
            <option value="600">600 – SemiBold</option>
            <option value="700">700 – Bold</option>
            <option value="800">800 – ExtraBold</option>
            <option value="900">900 – Black</option>
          </select>
        </TypoRow>

        {/* Size + Line Height */}
        <TypoRow label="Size">
          <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, alignItems: 'center' }}>
            <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <input
                type="number"
                min={0}
                value={styles.fontSize ?? ''}
                onChange={e => onUpdate({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
                style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
              />
              <span style={{ padding: '0 6px', borderLeft: '1px solid #e0e0e0', background: '#efefef', fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', flexShrink: 0 }}>PX</span>
            </div>
            <span style={{ fontSize: 11, color: '#999', flexShrink: 0 }}>H</span>
            <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <input
                type="number"
                min={0}
                step={0.1}
                value={styles.lineHeight ?? ''}
                onChange={e => onUpdate({ lineHeight: e.target.value ? Number(e.target.value) : undefined })}
                style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
              />
              <button
                onClick={() => onUpdate({ lineHeight: undefined })}
                style={{ padding: '0 6px', borderLeft: '1px solid #e0e0e0', background: '#f0f0f0', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 12, flexShrink: 0 }}
              >
                –
              </button>
            </div>
          </div>
        </TypoRow>

        {/* Color */}
        <TypoRow label="Color">
          <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0, alignItems: 'center' }}>
            <input
              type="color"
              value={styles.color ?? '#000000'}
              onChange={e => onUpdate({ color: e.target.value })}
              style={{ width: 28, height: 28, padding: 2, border: 'none', borderRight: '1px solid #e0e0e0', cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              value={styles.color ?? ''}
              onChange={e => onUpdate({ color: e.target.value })}
              placeholder="—"
              style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
            />
          </div>
        </TypoRow>

        {/* Align */}
        <TypoRow label="Align">
          <div style={{ display: 'flex', background: '#efefef', borderRadius: 6, padding: 2, gap: 1, flex: 1, minWidth: 0 }}>
            {(['left', 'center', 'right', 'justify'] as const).map(align => {
              const icons: Record<typeof align, string> = { left: '⊜', center: '≡', right: '⊝', justify: '☰' }
              const labels: Record<typeof align, string> = { left: '≡ left', center: '≡ center', right: '≡ right', justify: '≡ justify' }
              return (
                <button
                  key={align}
                  title={labels[align]}
                  onClick={() => onUpdate({ textAlign: align })}
                  style={{
                    flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'pointer',
                    fontSize: 12, background: styles.textAlign === align ? '#1a1a1a' : 'transparent',
                    color: styles.textAlign === align ? '#fff' : '#888',
                  }}
                >
                  {icons[align]}
                </button>
              )
            })}
          </div>
        </TypoRow>

        {/* Decor */}
        <TypoRow label="Decor">
          <div style={{ display: 'flex', background: '#efefef', borderRadius: 6, padding: 2, gap: 1, flex: 1, minWidth: 0 }}>
            {([
              { value: 'none', label: '×' },
              { value: 'line-through', label: 'S\u0336' },
              { value: 'underline', label: 'U\u0332' },
              { value: 'overline', label: 'O\u0305' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ textDecoration: opt.value })}
                style={{
                  flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'pointer',
                  fontSize: 12, background: (styles.textDecoration ?? 'none') === opt.value ? '#1a1a1a' : 'transparent',
                  color: (styles.textDecoration ?? 'none') === opt.value ? '#fff' : '#888',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </TypoRow>

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

function TypoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: '#999', width: 44, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, padding: '3px 6px', border: '1px solid #e0e0e0',
  borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none', cursor: 'pointer',
}
