import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { ElementStyles, PositionMode } from '../../types'
import { parseCssValue, composeCssValue, CSS_UNITS, type CssUnit, type SpecialValue, UnitDropdown } from './shared'
import { useAltKey } from './shared/useAltKey'
import { convertCssUnit, getParentPixelSize, type ConvertRef } from '../../utils/unitConversion'

// Нормализуем legacy значения 'flow'/'pinned' в новые
export function normalizePositionMode(mode: string): PositionMode {
  if (mode === 'flow') return 'static'
  if (mode === 'pinned') return 'absolute'
  return mode as PositionMode
}

// ─── SVG-иконки для типов позиции ────────────────────────────────────────────

function IconStatic() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="4" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.1"/>
      <line x1="4" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  )
}

function IconRelative() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="4" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 1.5"/>
      <rect x="4" y="6" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function IconAbsolute() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 1.5"/>
      <rect x="2.5" y="2.5" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function IconFixed() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="1" y1="5.5" x2="15" y2="5.5" stroke="currentColor" strokeWidth="1"/>
      <rect x="4" y="8" width="8" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function IconSticky() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <line x1="0" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="4" width="10" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="6" y1="4" x2="6" y2="0" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1"/>
      <line x1="10" y1="4" x2="10" y2="0" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1"/>
    </svg>
  )
}

const POS_OPTIONS: {
  value: PositionMode
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  { value: 'static',   label: 'Static',   description: 'Normal document flow, elements stack one after another',            icon: <IconStatic /> },
  { value: 'relative', label: 'Relative', description: 'Offset via top/left, but keeps its place in the flow',           icon: <IconRelative /> },
  { value: 'absolute', label: 'Absolute', description: 'Free placement inside nearest relative/absolute parent',          icon: <IconAbsolute /> },
  { value: 'fixed',    label: 'Fixed',    description: 'Pinned to browser window, does not scroll (headers, buttons)',    icon: <IconFixed /> },
  { value: 'sticky',   label: 'Sticky',   description: 'Sticks to edge on scroll (navbars, sidebars)',                   icon: <IconSticky /> },
]

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  positionMode: PositionMode
  styles: Partial<ElementStyles>
  onUpdateMode: (mode: PositionMode) => void
  onUpdateStyle: (patch: Partial<ElementStyles>) => void
  elementId?: string
  artboardWidth?: number
  artboardHeight?: number
}

// ─── PositionSection ─────────────────────────────────────────────────────────

export function PositionSection({ positionMode, styles, onUpdateMode, onUpdateStyle, elementId, artboardWidth, artboardHeight }: Props) {
  const normalizedMode = normalizePositionMode(positionMode)
  const isOffsetable = normalizedMode !== 'static'
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const parentSize = useMemo(() => {
    if (!elementId || !artboardWidth) return null
    return getParentPixelSize(elementId, artboardWidth)
  }, [elementId, artboardWidth])

  const horizontalRef: ConvertRef | undefined = parentSize && artboardWidth && artboardHeight
    ? { percentBase: parentSize.width, vwBase: artboardWidth, vhBase: artboardHeight }
    : undefined

  const verticalRef: ConvertRef | undefined = parentSize && artboardWidth && artboardHeight
    ? { percentBase: parentSize.height, vwBase: artboardWidth, vhBase: artboardHeight }
    : undefined

  const currentOption = POS_OPTIONS.find(o => o.value === normalizedMode) ?? POS_OPTIONS[0]

  // Закрываем dropdown при клике вне
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ padding: '8px 0' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#0a0a0a', display: 'block', marginBottom: 10 }}>
        Position
      </span>

      {/* Position type — custom dropdown с иконками */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isOffsetable ? 10 : 0 }}>
        <span style={{ fontSize: 11, color: '#a3a3a3', width: 56, flexShrink: 0 }}>Type</span>
        <div ref={dropdownRef} style={{ flex: 1, position: 'relative' }}>
          {/* Trigger button */}
          <button
            onClick={() => setOpen(v => !v)}
            title="Position type — how the element is placed: in flow (Static), offset (Relative), free inside parent (Absolute), fixed to viewport (Fixed), or sticky on scroll (Sticky)"
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px',
              border: '1px solid #e5e5e5',
              borderRadius: 4,
              background: open ? '#f5f5f5' : '#fafafa',
              cursor: 'default',
              fontSize: 12,
              color: '#0a0a0a',
            }}
          >
            <span style={{ color: '#525252', display: 'flex', alignItems: 'center' }}>
              {currentOption.icon}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>{currentOption.label}</span>
            <span style={{ fontSize: 9, color: '#a3a3a3', marginLeft: 2 }}>▾</span>
          </button>

          {/* Dropdown list */}
          {open && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 2px)',
              left: 0, right: 0,
              zIndex: 100,
              background: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}>
              {POS_OPTIONS.map(opt => {
                const active = normalizedMode === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { onUpdateMode(opt.value); setOpen(false) }}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px',
                      border: 'none',
                      background: active ? '#f5f5f5' : 'transparent',
                      cursor: 'default',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: active ? '#0a0a0a' : '#525252', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#0a0a0a' : '#0a0a0a' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 10, color: '#a3a3a3', marginTop: 1 }}>
                        {opt.description}
                      </div>
                    </div>
                    {active && (
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: '#0a0a0a' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Offsets + Z-index — только для non-static */}
      {isOffsetable && (
        <>
          {/* Визуальный бокс: parent → element */}
          <div style={{
            position: 'relative',
            border: '1px solid #d4d4d4',
            borderRadius: 6,
            background: '#fafafa',
            padding: '22px 42px',
            marginBottom: 8,
          }}>
            <span style={{
              position: 'absolute', top: 4, left: 7,
              fontSize: 8, color: '#a3a3a3', letterSpacing: '0.06em',
              userSelect: 'none', fontWeight: 600,
            }}>
              INSETS
            </span>

            {/* Top */}
            <OffsetValue
              value={styles.top}
              onChange={(v) => onUpdateStyle({ top: v })}
              onChangeAll={(v) => onUpdateStyle({ top: v, right: v, bottom: v, left: v })}
              onChangeOpposite={(v) => onUpdateStyle({ bottom: v })}
              style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)' }}
              convertRef={verticalRef}
            />
            {/* Right */}
            <OffsetValue
              value={styles.right}
              onChange={(v) => onUpdateStyle({ right: v })}
              onChangeAll={(v) => onUpdateStyle({ top: v, right: v, bottom: v, left: v })}
              onChangeOpposite={(v) => onUpdateStyle({ left: v })}
              style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
              convertRef={horizontalRef}
            />
            {/* Bottom */}
            <OffsetValue
              value={styles.bottom}
              onChange={(v) => onUpdateStyle({ bottom: v })}
              onChangeAll={(v) => onUpdateStyle({ top: v, right: v, bottom: v, left: v })}
              onChangeOpposite={(v) => onUpdateStyle({ top: v })}
              style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)' }}
              convertRef={verticalRef}
            />
            {/* Left */}
            <OffsetValue
              value={styles.left}
              onChange={(v) => onUpdateStyle({ left: v })}
              onChangeAll={(v) => onUpdateStyle({ top: v, right: v, bottom: v, left: v })}
              onChangeOpposite={(v) => onUpdateStyle({ right: v })}
              style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)' }}
              convertRef={horizontalRef}
            />

            {/* Центральный прямоугольник — element */}
            <div style={{
              background: '#e5e5e5',
              borderRadius: 3,
              border: '1px solid #d4d4d4',
              minHeight: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 9, color: '#737373', userSelect: 'none' }}>
                {normalizedMode === 'fixed' ? 'viewport' : 'parent'}
              </span>
            </div>
          </div>

          {/* Z-index */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#a3a3a3', width: 56, flexShrink: 0 }}>Z-index</span>
            <input
              type="number"
              value={styles.zIndex ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                onUpdateStyle({ zIndex: isNaN(v) ? undefined : v })
              }}
              title="Z-index — stacking order. Higher = closer to user"
              placeholder="auto"
              style={{
                flex: 1, padding: '3px 6px', border: '1px solid #e5e5e5', borderRadius: 4,
                fontSize: 12, background: '#fafafa', outline: 'none', width: '100%', minWidth: 0,
                color: '#0a0a0a',
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ─── OffsetValue (аналог SpacingValue, но для CSS-строк с единицами) ──────────

type OffsetValueProps = {
  value?: string
  onChange: (v: string | undefined) => void
  onChangeAll?: (v: string | undefined) => void
  onChangeOpposite?: (v: string | undefined) => void
  style?: React.CSSProperties
  convertRef?: ConvertRef
}

function OffsetValue({ value, onChange, onChangeAll, onChangeOpposite, style, convertRef }: OffsetValueProps) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const scrubRef = useRef<{ startX: number; startVal: number } | null>(null)
  const altPressed = useAltKey(true)

  const hasValue = !!value
  const resetHint = altPressed && hover && hasValue

  const openPopover = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popW = 196
    let left = rect.left + rect.width / 2 - popW / 2
    let top = rect.bottom + 6
    if (left < 6) left = 6
    if (left + popW > window.innerWidth - 6) left = window.innerWidth - 6 - popW
    if (top + 180 > window.innerHeight) top = rect.top - 180 - 6
    setPopoverPos({ top, left })
    setOpen(true)
  }, [])

  const didScrub = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const parsed = parseCssValue(value)
    const startX = e.clientX
    const startVal = parsed.num ? parseFloat(parsed.num) : 0
    const unit = (parsed.unit === 'auto' || parsed.unit === 'none') ? 'px' : parsed.unit as CssUnit
    scrubRef.current = { startX, startVal }
    didScrub.current = false

    const onMove = (me: MouseEvent) => {
      if (!scrubRef.current) return
      const delta = me.clientX - scrubRef.current.startX
      if (!didScrub.current && Math.abs(delta) < 3) return // dead zone — отличаем клик от drag
      didScrub.current = true
      document.body.style.cursor = 'ew-resize'
      const step = me.shiftKey ? 10 : 1
      const newVal = Math.round(scrubRef.current.startVal + delta * step * 0.5)
      onChange(composeCssValue(String(newVal), unit))
    }
    const onUp = () => {
      const wasScrub = didScrub.current
      scrubRef.current = null
      didScrub.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      if (!wasScrub) openPopover() // клик без движения → popover
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [value, onChange, openPopover])

  // Отображаемый текст
  const displayText = hasValue ? value : '–'

  return (
    <div ref={triggerRef} style={{ ...style, zIndex: 1 }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseDown={handleMouseDown}
        style={{
          minWidth: 28,
          height: 18,
          padding: '0 4px',
          border: `1px solid ${
            resetHint ? '#ef4444'
            : open ? '#0a0a0a'
            : hover || hasValue ? (hasValue ? '#0a0a0a' : '#a3a3a3')
            : 'transparent'
          }`,
          borderRadius: 4,
          fontSize: 11,
          textAlign: 'center',
          lineHeight: '16px',
          background: open ? '#f0f0f0' : hasValue ? '#f0f0f0' : 'transparent',
          color: resetHint ? '#ef4444' : open || hasValue ? '#0a0a0a' : '#a3a3a3',
          cursor: 'ew-resize',
          userSelect: 'none',
          transition: 'border-color 0.1s, background 0.1s, color 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
        }}
        title="Click to edit · Drag to scrub · Shift = 10×"
      >
        {displayText}
      </div>

      {open && (
        <OffsetPopover
          value={value}
          anchorPos={popoverPos}
          onChange={onChange}
          onChangeAll={onChangeAll}
          onChangeOpposite={onChangeOpposite}
          onClose={() => setOpen(false)}
          convertRef={convertRef}
        />
      )}
    </div>
  )
}

// ─── OffsetPopover ────────────────────────────────────────────────────────────

const OFFSET_PRESETS = ['0', '50%', '100%']

type OffsetPopoverProps = {
  value?: string
  anchorPos: { top: number; left: number }
  onChange: (v: string | undefined) => void
  onChangeAll?: (v: string | undefined) => void
  onChangeOpposite?: (v: string | undefined) => void
  onClose: () => void
  convertRef?: ConvertRef
}

function OffsetPopover({ value, anchorPos, onChange, onChangeAll, onChangeOpposite, onClose, convertRef }: OffsetPopoverProps) {
  const parsed = parseCssValue(value)
  const [inputVal, setInputVal] = useState(parsed.num)
  const [unit, setUnit] = useState<CssUnit | SpecialValue>(parsed.unit === 'auto' || parsed.unit === 'none' ? 'px' : parsed.unit)
  const inputRef = useRef<HTMLInputElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    const tid = setTimeout(() => {
      document.addEventListener('mousedown', handleDown)
      document.addEventListener('keydown', handleKey)
    }, 50)
    return () => {
      clearTimeout(tid)
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const commit = (num: string, u: CssUnit | SpecialValue, close = true) => {
    const trimmed = num.trim()
    if (trimmed === '' || trimmed === '–') {
      onChange(undefined)
    } else {
      onChange(composeCssValue(trimmed, u))
    }
    if (close) onClose()
  }

  const handleInput = (newVal: string) => {
    setInputVal(newVal)
    if (newVal === '') {
      onChange(undefined)
    } else {
      const n = parseFloat(newVal)
      if (!isNaN(n)) onChange(composeCssValue(newVal, unit))
    }
  }

  const handleUnitChange = (newUnit: CssUnit | SpecialValue) => {
    const oldUnit = unit
    const num = parseFloat(inputVal)
    if (convertRef && !isNaN(num) && oldUnit !== 'auto' && oldUnit !== 'none' && newUnit !== 'auto' && newUnit !== 'none') {
      const converted = convertCssUnit(num, oldUnit as CssUnit, newUnit as CssUnit, convertRef)
      const convertedStr = String(converted)
      setUnit(newUnit as CssUnit)
      setInputVal(convertedStr)
      onChange(composeCssValue(convertedStr, newUnit))
    } else {
      setUnit(newUnit as CssUnit)
      if (inputVal) onChange(composeCssValue(inputVal, newUnit))
    }
  }

  const applyPreset = (preset: string, e: React.MouseEvent) => {
    const parsed = parseCssValue(preset)
    const v = preset === '0' ? undefined : preset
    if (e.shiftKey && onChangeAll) {
      onChangeAll(v)
      setInputVal(parsed.num)
      setUnit(parsed.unit === 'auto' || parsed.unit === 'none' ? 'px' : parsed.unit)
    } else if (e.altKey && onChangeOpposite) {
      onChangeOpposite(v)
      setInputVal(parsed.num)
      setUnit(parsed.unit === 'auto' || parsed.unit === 'none' ? 'px' : parsed.unit)
    } else {
      onChange(v)
      setInputVal(parsed.num)
      setUnit(parsed.unit === 'auto' || parsed.unit === 'none' ? 'px' : parsed.unit)
      onClose()
    }
  }

  const units: (CssUnit | SpecialValue)[] = [...CSS_UNITS]

  return createPortal(
    <div
      ref={popRef}
      style={{
        position: 'fixed',
        top: anchorPos.top,
        left: anchorPos.left,
        width: 196,
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: 8,
        zIndex: 99999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      {/* Input + Unit dropdown */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit(inputVal, unit)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              const step = e.shiftKey ? 10 : 1
              const n = Math.round((parseFloat(inputVal) || 0) + step)
              setInputVal(String(n))
              onChange(composeCssValue(String(n), unit))
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              const step = e.shiftKey ? 10 : 1
              const n = Math.round((parseFloat(inputVal) || 0) - step)
              setInputVal(String(n))
              onChange(composeCssValue(String(n), unit))
            }
          }}
          placeholder="–"
          style={{
            flex: 1,
            background: '#fafafa',
            border: '1px solid #e5e5e5',
            borderRadius: 6,
            color: '#0a0a0a',
            fontSize: 12,
            padding: '4px 6px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{
          background: '#f5f5f5',
          border: '1px solid #e5e5e5',
          borderRadius: 6,
          padding: '2px 0',
        }}>
          <UnitDropdown value={unit} options={units} onChange={handleUnitChange} />
        </div>
      </div>

      {/* Preset chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
        {OFFSET_PRESETS.map((p) => {
          const isActive = value === p || (p === '0' && !value)
          return (
            <button
              key={p}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => applyPreset(p, e)}
              title={`${p}${!p.includes('%') ? 'px' : ''} · Shift: all sides · Alt: opposite`}
              style={{
                background: isActive ? '#0a0a0a' : '#f5f5f5',
                border: `1px solid ${isActive ? '#0a0a0a' : '#e5e5e5'}`,
                borderRadius: 4,
                color: isActive ? '#fff' : '#525252',
                fontSize: 11,
                padding: '2px 7px',
                cursor: 'default',
                fontFamily: 'inherit',
                lineHeight: '16px',
                transition: 'background 0.1s',
              }}
            >
              {p}
            </button>
          )
        })}
      </div>

      {/* Hint */}
      <div style={{ fontSize: 10, color: '#a3a3a3', marginBottom: 6, lineHeight: 1.4 }}>
        Shift+click → all · Alt+click → opposite
      </div>

      {/* Reset */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => { onChange(undefined); onClose() }}
        title="Reset value"
        style={{
          width: '100%',
          background: '#f5f5f5',
          border: '1px solid #e5e5e5',
          borderRadius: 4,
          color: '#737373',
          fontSize: 11,
          padding: '4px 0',
          cursor: 'default',
          fontFamily: 'inherit',
          transition: 'border-color 0.1s, color 0.1s, background 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#d4d4d4'
          e.currentTarget.style.background = '#ebebeb'
          e.currentTarget.style.color = '#333'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e5e5e5'
          e.currentTarget.style.background = '#f5f5f5'
          e.currentTarget.style.color = '#737373'
        }}
      >
        Reset
      </button>
    </div>,
    document.body
  )
}
