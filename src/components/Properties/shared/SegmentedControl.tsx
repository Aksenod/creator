export function SegmentedControl({ value, options, onChange }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{
      display: 'flex', background: '#efefef', borderRadius: 6,
      padding: 2, gap: 1, flex: 1, minWidth: 0,
    }}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, minWidth: 0, padding: '3px 4px', fontSize: 11, border: 'none',
              borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s',
              background: active ? '#1a1a1a' : 'transparent',
              color: active ? '#fff' : '#888',
              fontWeight: active ? 500 : 400,
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
