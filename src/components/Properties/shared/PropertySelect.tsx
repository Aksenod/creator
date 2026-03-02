import { useState, useRef, useEffect } from 'react'

type Option = { value: string; label: string }

export function PropertySelect({ value, options, onChange, placeholder = '—', title, style }: {
  value: string
  options: Option[]
  onChange: (v: string) => void
  placeholder?: string
  title?: string
  style?: React.CSSProperties
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

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0, ...style }}>
      <button
        onClick={() => setOpen(!open)}
        title={title}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 4,
          padding: '3px 6px',
          height: 28,
          border: '1px solid #e5e5e5',
          borderRadius: 6,
          background: open ? '#fff' : '#fafafa',
          cursor: 'default',
          fontSize: 12,
          color: value ? '#0a0a0a' : '#a3a3a3',
          outline: 'none',
          transition: 'border-color 0.1s',
        }}
      >
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1, textAlign: 'left',
        }}>
          {selectedLabel}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, color: '#a3a3a3' }}>
          <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 2px)',
          left: 0, right: 0,
          zIndex: 200,
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          maxHeight: 240,
          overflowY: 'auto',
          padding: 3,
        }}>
          {placeholder && (
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              style={{
                display: 'block', width: '100%', padding: '5px 8px',
                border: 'none', borderRadius: 5, textAlign: 'left',
                background: !value ? '#f5f5f5' : 'transparent',
                color: '#a3a3a3',
                fontSize: 12, cursor: 'default',
              }}
            >
              {placeholder}
            </button>
          )}
          {options.map(opt => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '5px 8px',
                  border: 'none', borderRadius: 5, textAlign: 'left',
                  background: active ? '#0a0a0a' : 'transparent',
                  color: active ? '#fff' : '#0a0a0a',
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  cursor: 'default',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = '#f5f5f5'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
