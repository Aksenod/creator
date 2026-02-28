export function ColorInput({ value, onChange, placeholder = '—', fallback = '#000000' }: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  fallback?: string
}) {
  const colorValue = value && value !== 'transparent' ? value : fallback
  return (
    <div style={{ display: 'flex', border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0, alignItems: 'center' }}>
      <input
        type="color"
        value={colorValue}
        onChange={e => onChange(e.target.value)}
        style={{ width: 28, height: 28, padding: 2, border: 'none', borderRight: '1px solid #e0e0e0', cursor: 'pointer', flexShrink: 0 }}
      />
      <input
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
      />
    </div>
  )
}
