export function PropertyRow({ label, children, labelWidth = 56 }: {
  label: string
  children: React.ReactNode
  labelWidth?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
      <span style={{ fontSize: 11, color: '#999', width: labelWidth, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
