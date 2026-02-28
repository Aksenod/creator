import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { ElementStyles } from '../../types'
import { CollapsibleSection } from './shared'

const PRESETS = [0, 10, 20, 40, 60, 100, 140, 220]

type Props = {
  styles: Partial<ElementStyles>
  onUpdate: (patch: Partial<ElementStyles>) => void
}

// ─── SpacingSection ───────────────────────────────────────────────────────────

export function SpacingSection({ styles, onUpdate }: Props) {
  return (
    <CollapsibleSection label="Spacing" defaultOpen>
      {(
        // ─── Outer box: MARGIN (тёплый оранжевый как у Webflow) ──────────────
        <div style={{
          position: 'relative',
          border: '1px solid #e8d8bc',
          borderRadius: 4,
          background: '#fef8ee',
          padding: '24px 46px',
        }}>
          <span style={{
            position: 'absolute', top: 4, left: 7,
            fontSize: 8, color: '#c8a060', letterSpacing: '0.06em',
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

          {/* ─── Inner box: PADDING (синеватый как у Webflow) ──────────────── */}
          <div style={{
            position: 'relative',
            border: '1px solid #b8ccf0',
            borderRadius: 3,
            background: '#eef3ff',
            padding: '22px 38px',
          }}>
            <span style={{
              position: 'absolute', bottom: 4, left: 6,
              fontSize: 8, color: '#7090c8', letterSpacing: '0.06em',
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
              background: '#dce6f8',
              borderRadius: 2,
              minHeight: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 9, color: '#6880b8', userSelect: 'none' }}>element</span>
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

  // Scrubbing state
  const scrubRef = useRef<{ startX: number; startVal: number } | null>(null)

  const hasValue = value !== undefined && value !== 0

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
    if (e.altKey) {
      // Scrubbing mode — no popover
      e.preventDefault()
      const startX = e.clientX
      const startVal = value ?? 0
      scrubRef.current = { startX, startVal }

      const onMove = (me: MouseEvent) => {
        if (!scrubRef.current) return
        const delta = me.clientX - scrubRef.current.startX
        const step = me.shiftKey ? 10 : 1
        const newVal = Math.round((scrubRef.current.startVal + delta * step * 0.5))
        onChange(newVal === 0 ? undefined : newVal)
      }
      const onUp = () => {
        scrubRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'ew-resize'
    }
  }, [value, onChange])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (scrubRef.current) return // was scrubbing
    if (!e.altKey) openPopover()
  }, [openPopover])

  return (
    <div ref={triggerRef} style={{ ...style, zIndex: 1 }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          minWidth: 28,
          height: 18,
          padding: '0 4px',
          border: `1px solid ${
            open ? '#0066ff'
            : hover || hasValue ? (hasValue ? '#0066ff' : '#c8a060')
            : 'transparent'
          }`,
          borderRadius: 3,
          fontSize: 11,
          textAlign: 'center',
          lineHeight: '16px',
          background: open ? '#e6f0ff' : hasValue ? '#e6f0ff' : 'transparent',
          color: open || hasValue ? '#0066ff' : '#a88840',
          cursor: 'text',
          userSelect: 'none',
          transition: 'border-color 0.1s, background 0.1s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Alt+drag to scrub"
        data-spacing-trigger="true"
      >
        {hasValue ? value : '–'}
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
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        padding: '8px',
        zIndex: 99999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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
            border: '1px solid #e0e0e0',
            borderRadius: 4,
            color: '#1a1a1a',
            fontSize: 12,
            padding: '4px 6px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{
          background: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: 4,
          color: '#888',
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
                background: isActive ? '#0066ff' : '#f5f5f5',
                border: `1px solid ${isActive ? '#0066ff' : '#e0e0e0'}`,
                borderRadius: 3,
                color: isActive ? '#fff' : '#555',
                fontSize: 11,
                padding: '2px 7px',
                cursor: 'pointer',
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
      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6, lineHeight: 1.4 }}>
        Shift+click → all · Alt+click → opposite
      </div>

      {/* Reset */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => { onChange(undefined); onClose() }}
        style={{
          width: '100%',
          background: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: 3,
          color: '#888',
          fontSize: 11,
          padding: '4px 0',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'border-color 0.1s, color 0.1s, background 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#d0d0d0'
          e.currentTarget.style.background = '#ebebeb'
          e.currentTarget.style.color = '#333'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0'
          e.currentTarget.style.background = '#f5f5f5'
          e.currentTarget.style.color = '#888'
        }}
      >
        Reset
      </button>
    </div>,
    document.body
  )
}
