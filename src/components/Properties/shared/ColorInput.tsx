import { useState, useRef, useCallback } from 'react'
import { ColorPicker } from './ColorPicker'
import { isValidHex } from '../../../utils/colorUtils'

export function ColorInput({ value, onChange, placeholder = '—', fallback = '#000000' }: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  fallback?: string
}) {
  const colorValue = value && value !== 'transparent' ? value : fallback
  const [pickerOpen, setPickerOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const swatchRef = useRef<HTMLDivElement>(null)

  const openPicker = useCallback(() => {
    if (!swatchRef.current) return
    setAnchorRect(swatchRef.current.getBoundingClientRect())
    setPickerOpen(true)
  }, [])

  const closePicker = useCallback(() => {
    setPickerOpen(false)
  }, [])

  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
  }, [onChange])

  const handleHexBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v && !v.startsWith('#')) {
      const candidate = `#${v}`
      if (isValidHex(candidate)) onChange(candidate)
    }
  }, [onChange])

  return (
    <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0, alignItems: 'center' }}>
      {/* Color swatch */}
      <div
        ref={swatchRef}
        onClick={openPicker}
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          cursor: 'pointer',
          borderRight: '1px solid #e5e5e5',
          background: colorValue,
        }}
      />
      <input
        value={value ?? ''}
        onChange={handleHexInput}
        onBlur={handleHexBlur}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
      />
      {pickerOpen && anchorRect && (
        <ColorPicker
          color={colorValue}
          anchorRect={anchorRect}
          onChange={onChange}
          onClose={closePicker}
        />
      )}
    </div>
  )
}
