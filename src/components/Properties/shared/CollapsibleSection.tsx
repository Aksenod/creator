import { useState } from 'react'

export function CollapsibleSection({ label, tooltip, children, defaultOpen = true }: {
  label: string
  tooltip?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ padding: '8px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 0, border: 'none', background: 'none',
          cursor: 'default', marginBottom: open ? 10 : 0,
        }}
      >
        <span title={tooltip} style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{label}</span>
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
