import { useState, useRef, useEffect } from 'react'
import type { ElementStyles, PositionMode } from '../../types'

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
  { value: 'static',   label: 'Static',   description: 'Стандартный поток',          icon: <IconStatic /> },
  { value: 'relative', label: 'Relative', description: 'Смещение в потоке',           icon: <IconRelative /> },
  { value: 'absolute', label: 'Absolute', description: 'Относительно родителя',       icon: <IconAbsolute /> },
  { value: 'fixed',    label: 'Fixed',    description: 'Относительно экрана',         icon: <IconFixed /> },
  { value: 'sticky',   label: 'Sticky',   description: 'Прилипает при скролле',       icon: <IconSticky /> },
]

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  positionMode: string
  styles: Partial<ElementStyles>
  onUpdateMode: (mode: PositionMode) => void
  onUpdateStyle: (patch: Partial<ElementStyles>) => void
}

// ─── PositionSection ─────────────────────────────────────────────────────────

export function PositionSection({ positionMode, styles, onUpdateMode, onUpdateStyle }: Props) {
  const normalizedMode = normalizePositionMode(positionMode)
  const isOffsetable = normalizedMode !== 'static'
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 10 }}>
        Позиция
      </span>

      {/* Position type — custom dropdown с иконками */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isOffsetable ? 10 : 0 }}>
        <span style={{ fontSize: 11, color: '#999', width: 56, flexShrink: 0 }}>Тип</span>
        <div ref={dropdownRef} style={{ flex: 1, position: 'relative' }}>
          {/* Trigger button */}
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px',
              border: '1px solid #e0e0e0',
              borderRadius: 4,
              background: open ? '#f0f4ff' : '#fafafa',
              cursor: 'pointer',
              fontSize: 12,
              color: '#1a1a1a',
            }}
          >
            <span style={{ color: '#555', display: 'flex', alignItems: 'center' }}>
              {currentOption.icon}
            </span>
            <span style={{ flex: 1, textAlign: 'left' }}>{currentOption.label}</span>
            <span style={{ fontSize: 9, color: '#aaa', marginLeft: 2 }}>▾</span>
          </button>

          {/* Dropdown list */}
          {open && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 2px)',
              left: 0, right: 0,
              zIndex: 100,
              background: '#fff',
              border: '1px solid #e0e0e0',
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
                      background: active ? '#e6f0ff' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: active ? '#0066ff' : '#555', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#0066ff' : '#1a1a1a' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>
                        {opt.description}
                      </div>
                    </div>
                    {active && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#0066ff' }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Offset box + Z-index — только для non-static */}
      {isOffsetable && (
        <>
          {/* Визуальный T/R/B/L box */}
          <div style={{ position: 'relative', height: 80, marginBottom: 8 }}>
            {/* Center reference box */}
            <div style={{
              position: 'absolute',
              top: 20, left: 44, right: 44, bottom: 20,
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: '#bbb',
              userSelect: 'none',
            }}>
              {normalizedMode === 'fixed' ? 'screen' : 'parent'}
            </div>
            {/* Top */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
              <OffsetInput value={styles.top} onChange={(v) => onUpdateStyle({ top: v })} />
            </div>
            {/* Left */}
            <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <OffsetInput value={styles.left} onChange={(v) => onUpdateStyle({ left: v })} />
            </div>
            {/* Right */}
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <OffsetInput value={styles.right} onChange={(v) => onUpdateStyle({ right: v })} />
            </div>
            {/* Bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
              <OffsetInput value={styles.bottom} onChange={(v) => onUpdateStyle({ bottom: v })} />
            </div>
          </div>

          {/* Z-index */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#999', width: 56, flexShrink: 0 }}>Z-index</span>
            <input
              type="number"
              value={styles.zIndex ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                onUpdateStyle({ zIndex: isNaN(v) ? undefined : v })
              }}
              placeholder="auto"
              style={{
                flex: 1, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4,
                fontSize: 12, background: '#fafafa', outline: 'none', width: '100%', minWidth: 0,
                color: '#1a1a1a',
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ─── OffsetInput ─────────────────────────────────────────────────────────────

function OffsetInput({
  value,
  onChange,
}: {
  value?: number
  onChange: (v: number | undefined) => void
}) {
  const hasValue = value !== undefined
  return (
    <input
      type="number"
      value={hasValue ? value : ''}
      onChange={(e) => {
        const v = parseInt(e.target.value)
        onChange(isNaN(v) ? undefined : v)
      }}
      placeholder="Auto"
      style={{
        width: 42,
        padding: '3px 4px',
        border: `1px solid ${hasValue ? '#0066ff' : '#e0e0e0'}`,
        borderRadius: 3,
        fontSize: 11,
        textAlign: 'center',
        background: hasValue ? '#e6f0ff' : '#fafafa',
        color: hasValue ? '#0066ff' : '#bbb',
        outline: 'none',
      }}
    />
  )
}
