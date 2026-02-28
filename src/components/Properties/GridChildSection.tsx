import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow } from './shared'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// "span N" → "N"; иначе ""
function getSpan(val?: string): string {
  if (!val) return ''
  const m = val.match(/^span\s*(\d+)$/)
  return m ? m[1] : ''
}

// N → "span N" (если N>1), иначе undefined
function spanVal(n: string): string | undefined {
  const num = parseInt(n, 10)
  if (!n || isNaN(num) || num <= 1) return undefined
  return `span ${num}`
}

// Определить режим: auto = нет значения ИЛИ только "span N"; manual = есть явная стартовая линия
function detectMode(gridColumn?: string, gridRow?: string): 'auto' | 'manual' {
  const isAuto = (v?: string) => !v || /^span\s*\d+$/.test(v.trim())
  return isAuto(gridColumn) && isAuto(gridRow) ? 'auto' : 'manual'
}

// Parse "start / end" or "start / span N" → { start, end, isSpan }
function parseGridLine(val?: string): { start: string; end: string; isSpan: boolean } {
  if (!val) return { start: '', end: '', isSpan: false }
  const parts = val.split('/').map(s => s.trim())
  if (parts.length === 1) return { start: parts[0], end: '', isSpan: false }
  const end = parts[1]
  const isSpan = end.startsWith('span')
  const endVal = isSpan ? end.replace(/^span\s*/, '') : end
  return { start: parts[0], end: endVal, isSpan }
}

function serializeGridLine(start: string, end: string, isSpan: boolean): string | undefined {
  if (!start) return undefined
  if (!isSpan && !end) return start
  const endVal = end || '1'
  return `${start} / ${isSpan ? `span ${endVal}` : endVal}`
}

// ─── Стили ───────────────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  padding: '3px 5px', border: '1px solid #e0e0e0', borderRadius: 4,
  fontSize: 11, background: '#fafafa', outline: 'none',
  cursor: 'pointer', color: '#1a1a1a',
}

const numInputStyle: React.CSSProperties = {
  width: 40, padding: '3px 5px', border: '1px solid #e0e0e0',
  borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none',
  color: '#1a1a1a', textAlign: 'center',
}

// ─── GridLineInput (Manual mode) ──────────────────────────────────────────────

function GridLineInput({ label, value, onChange }: {
  label: string
  value?: string
  onChange: (v: string | undefined) => void
}) {
  const { start, end, isSpan } = parseGridLine(value)

  return (
    <PropertyRow label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        <input
          type="number"
          value={start}
          placeholder="1"
          onChange={(e) => onChange(serializeGridLine(e.target.value, end, isSpan))}
          style={numInputStyle}
        />
        <select
          value={isSpan ? 'span' : 'end'}
          onChange={(e) => onChange(serializeGridLine(start, end, e.target.value === 'span'))}
          data-testid={`grid-line-span-${label.toLowerCase()}`}
          style={{ ...selectStyle, width: 52 }}
        >
          <option value="end">/</option>
          <option value="span">span</option>
        </select>
        <input
          type="number"
          value={end}
          placeholder={isSpan ? '1' : '2'}
          onChange={(e) => onChange(serializeGridLine(start, e.target.value, isSpan))}
          style={numInputStyle}
        />
      </div>
    </PropertyRow>
  )
}

// ─── GridChildSection ─────────────────────────────────────────────────────────

const ALIGN_SELF_OPTIONS = ['auto', 'start', 'end', 'center', 'stretch', 'baseline']
const JUSTIFY_SELF_OPTIONS = ['auto', 'start', 'end', 'center', 'stretch']

export function GridChildSection({ styles, onUpdate }: Props) {
  const mode = detectMode(styles.gridColumn, styles.gridRow)

  const switchToAuto = () => {
    // Сохраняем span если был в manual ("1 / span 2" → "span 2")
    const { isSpan: colSpan, end: colEnd } = parseGridLine(styles.gridColumn)
    const { isSpan: rowSpan, end: rowEnd } = parseGridLine(styles.gridRow)
    onUpdate({
      gridColumn: colSpan && colEnd ? `span ${colEnd}` : undefined,
      gridRow: rowSpan && rowEnd ? `span ${rowEnd}` : undefined,
    })
  }

  const switchToManual = () => {
    // Сохраняем span, добавляем start = 1
    const colSpan = getSpan(styles.gridColumn)
    const rowSpan = getSpan(styles.gridRow)
    onUpdate({
      gridColumn: colSpan && parseInt(colSpan) > 1 ? `1 / span ${colSpan}` : '1',
      gridRow: rowSpan && parseInt(rowSpan) > 1 ? `1 / span ${rowSpan}` : '1',
    })
  }

  return (
    <CollapsibleSection label="Grid child" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Auto / Manual toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={switchToAuto}
            title="Автоматическое размещение по DOM-порядку"
            style={{
              flex: 1, padding: '4px 0', fontSize: 11, fontWeight: mode === 'auto' ? 600 : 400,
              border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer',
              background: mode === 'auto' ? '#0066ff' : '#fafafa',
              color: mode === 'auto' ? '#fff' : '#555',
            }}
          >
            Auto
          </button>
          <button
            onClick={switchToManual}
            title="Явное задание позиции в сетке"
            style={{
              flex: 1, padding: '4px 0', fontSize: 11, fontWeight: mode === 'manual' ? 600 : 400,
              border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer',
              background: mode === 'manual' ? '#0066ff' : '#fafafa',
              color: mode === 'manual' ? '#fff' : '#555',
            }}
          >
            Manual
          </button>
        </div>

        {mode === 'auto' ? (
          /* Auto mode: только span */
          <>
            <PropertyRow label="Column span">
              <input
                type="number"
                min={1}
                value={getSpan(styles.gridColumn) || '1'}
                onChange={(e) => onUpdate({ gridColumn: spanVal(e.target.value) })}
                style={{ ...numInputStyle, width: 60 }}
              />
            </PropertyRow>
            <PropertyRow label="Row span">
              <input
                type="number"
                min={1}
                value={getSpan(styles.gridRow) || '1'}
                onChange={(e) => onUpdate({ gridRow: spanVal(e.target.value) })}
                style={{ ...numInputStyle, width: 60 }}
              />
            </PropertyRow>
          </>
        ) : (
          /* Manual mode: явные start / end */
          <>
            <GridLineInput
              label="Column"
              value={styles.gridColumn}
              onChange={(v) => onUpdate({ gridColumn: v })}
            />
            <GridLineInput
              label="Row"
              value={styles.gridRow}
              onChange={(v) => onUpdate({ gridRow: v })}
            />
          </>
        )}

        {/* Align self / Justify self */}
        <PropertyRow label="Align">
          <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>Self</span>
              <select
                value={styles.alignSelf ?? 'auto'}
                onChange={(e) => onUpdate({ alignSelf: e.target.value as ElementStyles['alignSelf'] })}
                style={{ ...selectStyle, flex: 1, minWidth: 0 }}
              >
                {ALIGN_SELF_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>Just</span>
              <select
                value={styles.justifySelf ?? 'auto'}
                onChange={(e) => onUpdate({ justifySelf: e.target.value as ElementStyles['justifySelf'] })}
                style={{ ...selectStyle, flex: 1, minWidth: 0 }}
              >
                {JUSTIFY_SELF_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </PropertyRow>
      </div>
    </CollapsibleSection>
  )
}
