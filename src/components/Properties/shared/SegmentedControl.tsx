export function SegmentedControl({ value, options, onChange }: {
  value: string
  options: { value: string; label: string; tooltip?: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{
      display: 'flex', background: '#f0f0f0', borderRadius: 5,
      padding: 2, gap: 1, flex: 1, minWidth: 0,
    }}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            title={opt.tooltip ?? opt.label}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, minWidth: 0, padding: '2px 4px', fontSize: 10, border: 'none',
              borderRadius: 4, cursor: 'default', lineHeight: '16px',
              transition: 'all 0.15s ease',
              background: active ? '#0a0a0a' : 'transparent',
              color: active ? '#fff' : '#737373',
              fontWeight: active ? 500 : 400,
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
