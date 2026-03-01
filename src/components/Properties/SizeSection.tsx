import { useRef, useEffect, useState } from 'react'
import type { ElementStyles } from '../../types'
import { CollapsibleSection } from './shared'

// ─── CSS Unit utilities ──────────────────────────────────────────────────────

const CSS_UNITS = ['px', '%', 'vw', 'vh'] as const
type CssUnit = (typeof CSS_UNITS)[number]

const SPECIAL_VALUES = ['auto', 'none'] as const
type SpecialValue = (typeof SPECIAL_VALUES)[number]

function parseCssValue(raw: string | undefined): { num: string; unit: CssUnit | SpecialValue } {
  if (!raw || raw === 'auto') return { num: '', unit: 'auto' }
  if (raw === 'none') return { num: '', unit: 'none' }
  const match = raw.match(/^(-?[\d.]+)\s*(px|%|em|rem|vw|vh|svw|svh|ch)?$/)
  if (match) return { num: match[1], unit: (match[2] as CssUnit) || 'px' }
  const numOnly = parseFloat(raw)
  if (!isNaN(numOnly)) return { num: String(numOnly), unit: 'px' }
  return { num: '', unit: 'px' }
}

function composeCssValue(num: string, unit: CssUnit | SpecialValue): string {
  if (unit === 'auto') return 'auto'
  if (unit === 'none') return 'none'
  if (!num && num !== '0') return ''
  return `${num}${unit}`
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const MinWidthIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="2" y1="7" x2="6.5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="4.5,5.5 6.5,7 4.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="7" x2="7.5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="9.5,5.5 7.5,7 9.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MinHeightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7" y1="2" x2="7" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,4.5 7,6.5 8.5,4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="7" y1="12" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,9.5 7,7.5 8.5,9.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MaxWidthIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="2" y1="3.5" x2="2" y2="10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="12" y1="3.5" x2="12" y2="10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="2.5" y1="7" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="4.5,5.5 2.5,7 4.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="11.5" y1="7" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="9.5,5.5 11.5,7 9.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MaxHeightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="3.5" y1="2" x2="10.5" y2="2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="3.5" y1="12" x2="10.5" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7" y1="2.5" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,4.5 7,2.5 8.5,4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="7" y1="11.5" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,9.5 7,11.5 8.5,9.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function SizeSection({ styles, onUpdate }: Props) {
  return (
    <CollapsibleSection label="Size" tooltip="Size — габариты элемента: ширина, высота, минимальные/максимальные ограничения и поведение переполнения (overflow)" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Dimensions */}
        <div>
          <div style={{ fontSize: 10, color: '#aaa', marginBottom: 5 }}>Dimensions</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div title="Width — ширина элемента. Auto = подстраивается под содержимое или родителя. Можно задать в px, %, vw" style={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <FigmaInput
                prefix="W"
                value={styles.width ?? ''}
                placeholder="Auto"
                allowAuto
                testId="size-width"
                onChange={(v) => onUpdate({ width: v || undefined })}
              />
            </div>
            <div title="Height — высота элемента. Auto = подстраивается под содержимое. Обычно оставляют Auto, задают явно для hero-секций и баннеров" style={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <FigmaInput
                prefix="H"
                value={styles.height ?? ''}
                placeholder="Auto"
                allowAuto
                testId="size-height"
                onChange={(v) => onUpdate({ height: v || undefined })}
              />
            </div>
          </div>
        </div>

        {/* Min */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }} title="Min width — элемент не сожмётся уже этого значения. Полезно для кнопок и карточек, чтобы не ломался макет на узких экранах">
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 5 }}>Min width</div>
            <FigmaInput
              prefix={<MinWidthIcon />}
              value={styles.minWidth ?? ''}
              placeholder="Min W"
              onChange={(v) => onUpdate({ minWidth: v || undefined })}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }} title="Min height — элемент не сожмётся ниже этого значения. Используй для секций, чтобы гарантировать минимальную высоту даже без контента">
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 5 }}>Min height</div>
            <FigmaInput
              prefix={<MinHeightIcon />}
              value={styles.minHeight ?? ''}
              placeholder="Min H"
              onChange={(v) => onUpdate({ minHeight: v || undefined })}
            />
          </div>
        </div>

        {/* Max */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }} title="Max width — элемент не растянется шире этого значения. Классика: max-width 1200px для контейнера, чтобы текст не растягивался на всю ширину экрана">
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 5 }}>Max width</div>
            <FigmaInput
              prefix={<MaxWidthIcon />}
              value={styles.maxWidth ?? ''}
              placeholder="Max W"
              allowNone
              onChange={(v) => onUpdate({ maxWidth: v || undefined })}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }} title="Max height — элемент не растянется выше этого значения. Используй для ограничения высоты изображений или модальных окон">
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 5 }}>Max height</div>
            <FigmaInput
              prefix={<MaxHeightIcon />}
              value={styles.maxHeight ?? ''}
              placeholder="Max H"
              allowNone
              onChange={(v) => onUpdate({ maxHeight: v || undefined })}
            />
          </div>
        </div>

        {/* Overflow */}
        <OverflowRow
          value={styles.overflow}
          onChange={(v) => onUpdate({ overflow: v })}
        />

      </div>
    </CollapsibleSection>
  )
}

// ─── FigmaInput ───────────────────────────────────────────────────────────────

function FigmaInput({ prefix, value, placeholder, allowAuto, allowNone, onChange, testId }: {
  prefix: React.ReactNode
  value: string
  placeholder?: string
  allowAuto?: boolean
  allowNone?: boolean
  onChange: (v: string) => void
  testId?: string
}) {
  const [focused, setFocused] = useState(false)
  const parsed = parseCssValue(value)
  const isSpecial = parsed.unit === 'auto' || parsed.unit === 'none'

  // Локальный state для отображаемого числа — чтобы можно было печатать в «auto» поле
  const [localNum, setLocalNum] = useState(parsed.num)
  useEffect(() => {
    if (!focused) setLocalNum(parsed.num)
  }, [value, focused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNum = e.target.value
    setLocalNum(newNum)
    if (newNum === '') {
      // пустое поле → вернуть дефолт
      if (allowNone) onChange('none')
      else onChange('auto')
    } else {
      // если было auto/none — переключиться на px
      const unit = isSpecial ? 'px' : (parsed.unit as CssUnit)
      onChange(composeCssValue(newNum, unit))
    }
  }

  const handleBlur = () => {
    setFocused(false)
    // нормализовать: если localNum невалидное — сбросить
    if (localNum !== '' && isNaN(parseFloat(localNum))) {
      setLocalNum(parsed.num)
    }
  }

  const handleUnitChange = (newUnit: CssUnit | SpecialValue) => {
    if (newUnit === 'auto') onChange('auto')
    else if (newUnit === 'none') onChange('none')
    else onChange(composeCssValue(parsed.num || localNum || '0', newUnit))
  }

  const units: (CssUnit | SpecialValue)[] = [...CSS_UNITS]
  if (allowAuto) units.push('auto')
  if (allowNone) units.push('none')

  return (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', alignItems: 'center',
      height: 30,
      background: focused ? '#fff' : '#f0f0f0',
      borderRadius: 6,
      border: focused ? '1.5px solid #0066ff' : '1.5px solid transparent',
      padding: '0 4px 0 8px',
      gap: 5,
      boxSizing: 'border-box',
      transition: 'background 0.1s, border-color 0.1s',
    }}>
      {/* Prefix */}
      <span style={{
        fontSize: 11, color: '#888', flexShrink: 0,
        display: 'flex', alignItems: 'center',
        userSelect: 'none', fontWeight: 500,
      }}>
        {prefix}
      </span>

      {/* Number input — никогда не disabled */}
      <input
        type="text"
        value={localNum}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        data-testid={testId}
        style={{
          flex: 1, border: 'none', background: 'transparent',
          fontSize: 12, color: '#1a1a1a',
          outline: 'none', minWidth: 0, padding: 0,
        }}
      />

      {/* Unit dropdown */}
      <UnitDropdown value={parsed.unit} options={units} onChange={handleUnitChange} />
    </div>
  )
}

// ─── UnitDropdown ─────────────────────────────────────────────────────────────

function UnitDropdown({ value, options, onChange }: {
  value: CssUnit | SpecialValue
  options: (CssUnit | SpecialValue)[]
  onChange: (unit: CssUnit | SpecialValue) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        title="Единица измерения — px (пиксели), % (от родителя), vw/vh (от размера экрана), auto или none"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18,
          border: 'none', background: open ? '#e0e0e0' : 'transparent',
          borderRadius: 3, cursor: 'pointer', padding: 0,
          color: '#888',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = '#e8e8e8' }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 2.5L4 5L6.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          zIndex: 200, background: '#fff',
          border: '1px solid #e0e0e0', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: 64, maxHeight: 220, overflowY: 'auto',
          padding: 3,
        }}>
          {options.map((unit) => {
            const active = unit === value
            return (
              <button
                key={unit}
                onClick={() => { onChange(unit); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '4px 8px',
                  border: 'none', borderRadius: 4, textAlign: 'left',
                  background: active ? '#1a1a1a' : 'transparent',
                  color: active ? '#fff' : '#555',
                  fontSize: 11, fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {unit === 'auto' ? 'Auto' : unit === 'none' ? 'None' : unit.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── OverflowRow ──────────────────────────────────────────────────────────────

type OverflowValue = ElementStyles['overflow']

const OVERFLOW_OPTIONS: { value: NonNullable<OverflowValue>; icon: React.ReactNode; tooltip: string }[] = [
  {
    value: 'visible',
    tooltip: 'Visible — содержимое свободно выходит за границы элемента (поведение по умолчанию)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'hidden',
    tooltip: 'Hidden — обрезать содержимое по границам элемента, скрыть всё что выступает',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'scroll',
    tooltip: 'Scroll — всегда показывать полосу прокрутки, даже если содержимое вмещается',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2L7 12M4 5L7 2L10 5M4 9L7 12L10 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'auto',
    tooltip: 'Auto — полоса прокрутки появляется только когда содержимое не вмещается в элемент',
    icon: <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '-0.02em' }}>Auto</span>,
  },
]

function OverflowRow({ value, onChange }: {
  value: OverflowValue
  onChange: (v: OverflowValue) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
      <span title="Overflow — что происходит с содержимым, которое не вмещается в элемент" style={{ fontSize: 10, color: '#aaa', width: 52, flexShrink: 0 }}>Overflow</span>
      <div style={{
        display: 'flex', background: '#efefef', borderRadius: 6,
        padding: 2, gap: 2, flex: 1,
      }}>
        {OVERFLOW_OPTIONS.map((opt) => {
          const active = (value ?? 'visible') === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.tooltip}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'pointer',
                background: active ? '#1a1a1a' : 'transparent',
                color: active ? '#fff' : '#888',
                transition: 'all 0.1s',
              }}
            >
              {opt.icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
