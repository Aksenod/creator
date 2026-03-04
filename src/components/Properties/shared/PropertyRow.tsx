import { useState } from 'react'
import { useAltKey } from './useAltKey'

export type PropertySource = 'class' | 'local' | 'none'

const SOURCE_COLORS: Record<PropertySource, string | undefined> = {
  class: '#ff9800',  // оранжевый — от класса
  local: '#2196f3',  // синий — local override
  none: undefined,
}

export function PropertyRow({ label, children, labelWidth = 52, onReset, source }: {
  label: string
  children: React.ReactNode
  labelWidth?: number
  onReset?: () => void
  /** Visual indicator: 'class' = orange dot, 'local' = blue dot */
  source?: PropertySource
}) {
  const [hovered, setHovered] = useState(false)
  const altPressed = useAltKey(!!onReset)

  const resetHint = onReset && altPressed && hovered
  const dotColor = source ? SOURCE_COLORS[source] : undefined

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
        title={onReset ? '⌥ Click to reset' : source === 'class' ? 'From class' : source === 'local' ? 'Local override' : undefined}
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
          display: 'flex', alignItems: 'center', gap: 3,
        }}
      >
        {dotColor && (
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: dotColor, flexShrink: 0,
          }} />
        )}
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</div>
    </div>
  )
}
