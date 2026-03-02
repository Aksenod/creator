import { useState } from 'react'
import { useAltKey } from './useAltKey'

export function PropertyRow({ label, children, labelWidth = 52, onReset }: {
  label: string
  children: React.ReactNode
  labelWidth?: number
  onReset?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const altPressed = useAltKey(!!onReset)

  const resetHint = onReset && altPressed && hovered

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
      <span
        title={onReset ? '⌥ Click to reset' : undefined}
        onClick={onReset ? (e) => {
          if (e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            onReset()
          }
        } : undefined}
        style={{
          fontSize: 10, color: resetHint ? '#ef4444' : '#a3a3a3', width: labelWidth, flexShrink: 0,
          cursor: onReset ? 'default' : undefined,
          userSelect: onReset ? 'none' : undefined,
          transition: 'color 0.15s',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
