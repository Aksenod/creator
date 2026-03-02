import { useState, useRef } from 'react'

export function CollapsibleSection({ label, tooltip, children, defaultOpen = true, headerRight }: {
  label: string
  tooltip?: string
  children: React.ReactNode
  defaultOpen?: boolean
  headerRight?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '1px 4px', marginBottom: open ? 6 : 0,
          borderRadius: 3, cursor: 'default',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fafafa' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <span
          title={tooltip}
          style={{ fontSize: 11, fontWeight: 600, color: '#0a0a0a', cursor: 'default', flex: 1, letterSpacing: '0.01em' }}
        >
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
          {headerRight}
          <span
            onClick={() => setOpen(!open)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16,
              color: '#a3a3a3',
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s ease',
              cursor: 'default',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: open ? 2000 : 0,
          opacity: open ? 1 : 0,
          transition: open
            ? 'max-height 0.25s ease, opacity 0.15s ease'
            : 'max-height 0.2s ease, opacity 0.1s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}
