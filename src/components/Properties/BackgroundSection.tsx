import { useState } from 'react'
import type { ElementStyles } from '../../types'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function BackgroundSection({ styles, onUpdate }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <CollapsibleSection label="Backgrounds" open={open} onToggle={() => setOpen(!open)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Color */}
        <BgRow label="Color">
          <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0, alignItems: 'center' }}>
            <input
              type="color"
              value={
                styles.backgroundColor && styles.backgroundColor !== 'transparent'
                  ? styles.backgroundColor
                  : '#ffffff'
              }
              onChange={e => onUpdate({ backgroundColor: e.target.value })}
              style={{ width: 28, height: 28, padding: 2, border: 'none', borderRight: '1px solid #e0e0e0', cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              value={styles.backgroundColor ?? ''}
              onChange={e => onUpdate({ backgroundColor: e.target.value })}
              placeholder="transparent"
              style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
            />
          </div>
        </BgRow>

        {/* Clipping */}
        <BgRow label="Clipping">
          <select
            value={styles.backgroundClip ?? ''}
            onChange={e => onUpdate({ backgroundClip: e.target.value as ElementStyles['backgroundClip'] || undefined })}
            style={{ flex: 1, minWidth: 0, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">None</option>
            <option value="border-box">Border box</option>
            <option value="padding-box">Padding box</option>
            <option value="content-box">Content box</option>
            <option value="text">Text</option>
          </select>
        </BgRow>

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

function BgRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: '#999', width: 44, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
