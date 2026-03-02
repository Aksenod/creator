import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ElementStyles } from '../../types'
import { CollapsibleSection } from './shared'
import { useAltKey } from './shared/useAltKey'

const PRESETS = [0, 10, 20, 40, 60, 100, 140, 220]

type Props = {
  styles: Partial<ElementStyles>
  onUpdate: (patch: Partial<ElementStyles>) => void
}

// ─── SpacingSection ───────────────────────────────────────────────────────────

export function SpacingSection({ styles, onUpdate }: Props) {
  return (
    <CollapsibleSection label="Spacing" tooltip="Spacing — margin (outer) and padding (inner). Margin = distance from neighbors. Padding = distance from edges to content" defaultOpen>
      {(
        // ─── Outer box: MARGIN ──────────────
        <div style={{
          position: 'relative',
          border: '1px solid #d4d4d4',
          borderRadius: 6,
          background: '#fafafa',
          padding: '24px 46px',
        }}>
          <span style={{
            position: 'absolute', top: 4, left: 7,
            fontSize: 8, color: '#a3a3a3', letterSpacing: '0.06em',
            userSelect: 'none', fontWeight: 600,
          }}>
            MARGIN
          </span>

          {/* Margin inputs */}
          <SpacingValue
            value={styles.marginTop}
            onChange={(v) => onUpdate({ marginTop: v })}
            onChangeAll={(v) => onUpdate({ marginTop: v, marginRight: v, marginBottom: v, marginLeft: v })}
            onChangeOpposite={(v) => onUpdate({ marginBottom: v })}
            style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)' }}
          />
          <SpacingValue
            value={styles.marginRight}
            onChange={(v) => onUpdate({ marginRight: v })}
            onChangeAll={(v) => onUpdate({ marginTop: v, marginRight: v, marginBottom: v, marginLeft: v })}
            onChangeOpposite={(v) => onUpdate({ marginLeft: v })}
            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
          />
          <SpacingValue
            value={styles.marginBottom}
            onChange={(v) => onUpdate({ marginBottom: v })}
            onChangeAll={(v) => onUpdate({ marginTop: v, marginRight: v, marginBottom: v, marginLeft: v })}
            onChangeOpposite={(v) => onUpdate({ marginTop: v })}
            style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)' }}
          />
          <SpacingValue
            value={styles.marginLeft}
            onChange={(v) => onUpdate({ marginLeft: v })}
            onChangeAll={(v) => onUpdate({ marginTop: v, marginRight: v, marginBottom: v, marginLeft: v })}
            onChangeOpposite={(v) => onUpdate({ marginRight: v })}
            style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)' }}
          />

          {/* ─── Inner box: PADDING ──────────────── */}
          <div style={{
            position: 'relative',
            border: '1px solid #d4d4d4',
            borderRadius: 4,
            background: '#f0f0f0',
            padding: '22px 38px',
          }}>
            <span style={{
              position: 'absolute', bottom: 4, left: 6,
              fontSize: 8, color: '#737373', letterSpacing: '0.06em',
              userSelect: 'none', fontWeight: 600,
              pointerEvents: 'none',
            }}>
              PADDING
            </span>

            {/* Padding inputs */}
            <SpacingValue
              value={styles.paddingTop}
              onChange={(v) => onUpdate({ paddingTop: v })}
              onChangeAll={(v) => onUpdate({ paddingTop: v, paddingRight: v, paddingBottom: v, paddingLeft: v })}
              onChangeOpposite={(v) => onUpdate({ paddingBottom: v })}
              style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)' }}
            />
            <SpacingValue
              value={styles.paddingRight}
              onChange={(v) => onUpdate({ paddingRight: v })}
              onChangeAll={(v) => onUpdate({ paddingTop: v, paddingRight: v, paddingBottom: v, paddingLeft: v })}
              onChangeOpposite={(v) => onUpdate({ paddingLeft: v })}
              style={{ position: 'absolute', right: 3, top: '50%', transform: 'translateY(-50%)' }}
            />
            <SpacingValue
              value={styles.paddingBottom}
              onChange={(v) => onUpdate({ paddingBottom: v })}
              onChangeAll={(v) => onUpdate({ paddingTop: v, paddingRight: v, paddingBottom: v, paddingLeft: v })}
              onChangeOpposite={(v) => onUpdate({ paddingTop: v })}
              style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)' }}
            />
            <SpacingValue
              value={styles.paddingLeft}
              onChange={(v) => onUpdate({ paddingLeft: v })}
              onChangeAll={(v) => onUpdate({ paddingTop: v, paddingRight: v, paddingBottom: v, paddingLeft: v })}
              onChangeOpposite={(v) => onUpdate({ paddingRight: v })}
              style={{ position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)' }}
            />

            {/* Центральный прямоугольник — сам элемент */}
            <div style={{
              background: '#e5e5e5',
              borderRadius: 3,
              minHeight: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 9, color: '#737373', userSelect: 'none' }}>element</span>
            </div>
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}

// ─── SpacingValue ─────────────────────────────────────────────────────────────

type SpacingValueProps = {
  value?: number
  onChange: (v: number | undefined) => void
  onChangeAll?: (v: number | undefined) => void
  onChangeOpposite?: (v: number | undefined) => void
  style?: React.CSSProperties
}

function SpacingValue({ value, onChange, onChangeAll, onChangeOpposite, style }: SpacingValueProps) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const altPressed = useAltKey(true)

  const scrubRef = useRef<{ startX: number; startVal: number } | null>(null)
  const didScrub = useRef(false)

  const hasValue = value !== undefined && value !== 0
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startVal = value ?? 0
    scrubRef.current = { startX, startVal }
    didScrub.current = false

    const onMove = (me: MouseEvent) => {
      if (!scrubRef.current) return
      const delta = me.clientX - scrubRef.current.startX
      if (!didScrub.current && Math.abs(delta) < 3) return
      didScrub.current = true
      document.body.style.cursor = 'ew-resize'
      const step = me.shiftKey ? 10 : 1
      const newVal = Math.round(scrubRef.current.startVal + delta * step * 0.5)
      onChange(newVal === 0 ? undefined : newVal)
    }
    const onUp = () => {
      const wasScrub = didScrub.current
      scrubRef.current = null
      didScrub.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      if (!wasScrub) openPopover()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [value, onChange, openPopover])

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
        }}
        title="Click to edit · Drag to scrub · Shift = 10×"
        data-spacing-trigger="true"
      >
        {hasValue ? `${value}px` : '–'}
      </div>

      {open && (
        <SpacingPopover
          value={value}
          anchorPos={popoverPos}
          onChange={onChange}
          onChangeAll={onChangeAll}
          onChangeOpposite={onChangeOpposite}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// ─── SpacingPopover ───────────────────────────────────────────────────────────

type PopoverProps = {
  value?: number
  anchorPos: { top: number; left: number }
  onChange: (v: number | undefined) => void
  onChangeAll?: (v: number | undefined) => void
  onChangeOpposite?: (v: number | undefined) => void
  onClose: () => void
}

function SpacingPopover({ value, anchorPos, onChange, onChangeAll, onChangeOpposite, onClose }: PopoverProps) {
  const [inputVal, setInputVal] = useState(value !== undefined ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // Slight delay so the opening click doesn't immediately close
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

  const commit = (val: string, close = true) => {
    const trimmed = val.trim()
    if (trimmed === '' || trimmed === '–') {
      onChange(undefined)
    } else {
      const n = parseFloat(trimmed)
      if (!isNaN(n)) onChange(n === 0 ? undefined : n)
    }
    if (close) onClose()
  }

  const applyPreset = (p: number, e: React.MouseEvent) => {
    const v = p === 0 ? undefined : p
    if (e.shiftKey && onChangeAll) {
      onChangeAll(v)
      setInputVal(String(p))
      // don't close — let user see multi apply
    } else if (e.altKey && onChangeOpposite) {
      onChangeOpposite(v)
      setInputVal(String(p))
    } else {
      onChange(v)
      setInputVal(String(p))
      onClose()
    }
  }

  return createPortal(
    <div
      ref={popRef}
      data-spacing-popover="true"
      style={{
        position: 'fixed',
        top: anchorPos.top,
        left: anchorPos.left,
        width: 196,
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: '8px',
        zIndex: 99999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      {/* Input + PX label */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value)
            // live update
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(n === 0 ? undefined : n)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit(inputVal)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              const step = e.shiftKey ? 10 : 1
              const n = Math.round((parseFloat(inputVal) || 0) + step)
              setInputVal(String(n))
              onChange(n === 0 ? undefined : n)
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              const step = e.shiftKey ? 10 : 1
              const n = Math.round((parseFloat(inputVal) || 0) - step)
              setInputVal(String(n))
              onChange(n === 0 ? undefined : n)
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
          color: '#737373',
          fontSize: 11,
          padding: '4px 7px',
          userSelect: 'none',
          letterSpacing: '0.04em',
          fontWeight: 600,
        }}>
          PX
        </div>
      </div>

      {/* Preset chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
        {PRESETS.map((p) => {
          const isActive = (p === 0 && !value) || value === p
          return (
            <button
              key={p}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => applyPreset(p, e)}
              title={`${p}px${p === 0 ? '' : ' · Shift: all sides · Alt: opposite'}`}
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
