import { useState } from 'react'

export function CollapsibleSection({ label, tooltip, children, defaultOpen = true, headerRight }: {
  label: string
  tooltip?: string
  children: React.ReactNode
  defaultOpen?: boolean
  headerRight?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ padding: '8px 0' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 0, marginBottom: open ? 10 : 0,
        }}
      >
        <span
          onClick={() => setOpen(!open)}
          title={tooltip}
          style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', cursor: 'default', flex: 1 }}
        >
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {headerRight}
          <span
            onClick={() => setOpen(!open)}
            style={{
              fontSize: 9, color: '#aaa',
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s',
              display: 'inline-block',
              cursor: 'default',
            }}
          >▼</span>
        </div>
      </div>
      {open && children}
    </div>
  )
}
