import { useState } from 'react'

export function PropertyRow({ label, children, labelWidth = 52 }: {
  label: string
  children: React.ReactNode
  labelWidth?: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden',
        padding: '1px 4px', borderRadius: 3,
        background: hovered ? '#fafafa' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: 10, color: '#a3a3a3', width: labelWidth, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
