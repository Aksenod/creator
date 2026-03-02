import { useState } from 'react'

type Props = {
  value: number | string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
  style?: React.CSSProperties
  title?: string
  placeholder?: string
}

export function CompactInput({ value, onChange, suffix, min, max, step, style, title, placeholder }: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 26,
      background: focused ? '#fff' : '#f0f0f0',
      borderRadius: 6,
      border: focused ? '1.5px solid #0a0a0a' : '1.5px solid transparent',
      padding: '0 6px',
      gap: 2,
      boxSizing: 'border-box',
      transition: 'background 0.1s, border-color 0.1s',
      ...style,
    }}>
      <input
        type="number"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        min={min}
        max={max}
        step={step}
        title={title}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, border: 'none', background: 'transparent',
          fontSize: 12, color: '#0a0a0a', outline: 'none', padding: 0,
          textAlign: suffix ? 'right' : 'center',
        }}
      />
      {suffix && (
        <span style={{ fontSize: 10, color: '#a3a3a3', flexShrink: 0, userSelect: 'none' }}>
          {suffix}
        </span>
      )}
    </div>
  )
}
