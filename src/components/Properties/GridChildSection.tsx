import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow } from './shared'
import {
  parseGridLine, serializeGridLine,
  detectGridChildMode, getSpanString, spanVal,
  extractSpanNumber,
} from '../../utils/gridUtils'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
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

const ALIGN_SELF_OPTIONS   = ['auto', 'start', 'end', 'center', 'stretch', 'baseline']
const JUSTIFY_SELF_OPTIONS = ['auto', 'start', 'end', 'center', 'stretch']

export function GridChildSection({ styles, onUpdate }: Props) {
  const mode = detectGridChildMode(styles.gridColumn, styles.gridRow)

  const switchToAuto = () => {
    // Сохраняем span если был в manual ("1 / span 2" → "span 2")
    const { isSpan: colSpan, end: colEnd } = parseGridLine(styles.gridColumn)
    const { isSpan: rowSpan, end: rowEnd } = parseGridLine(styles.gridRow)
    onUpdate({
      gridColumn: colSpan && colEnd ? `span ${colEnd}` : undefined,
      gridRow:    rowSpan && rowEnd ? `span ${rowEnd}` : undefined,
    })
  }

  const switchToManual = () => {
    // Сохраняем span, добавляем start = 1
    const colSpan = extractSpanNumber(styles.gridColumn)
    const rowSpan = extractSpanNumber(styles.gridRow)
    onUpdate({
      gridColumn: colSpan > 1 ? `1 / span ${colSpan}` : '1',
      gridRow:    rowSpan > 1 ? `1 / span ${rowSpan}` : '1',
    })
  }

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '4px 0', fontSize: 11, fontWeight: active ? 600 : 400,
    border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer',
    background: active ? '#0066ff' : '#fafafa',
    color: active ? '#fff' : '#555',
  })

  return (
    <CollapsibleSection label="Grid child" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Auto / Manual */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={switchToAuto}   title="Авто-размещение по DOM-порядку" style={toggleBtnStyle(mode === 'auto')}>Auto</button>
          <button onClick={switchToManual} title="Явная позиция в сетке"          style={toggleBtnStyle(mode === 'manual')}>Manual</button>
        </div>

        {mode === 'auto' ? (
          /* Span-only inputs */
          <>
            <PropertyRow label="Column span">
              <input
                type="number" min={1}
                value={getSpanString(styles.gridColumn) || '1'}
                onChange={(e) => onUpdate({ gridColumn: spanVal(e.target.value) })}
                style={{ ...numInputStyle, width: 60 }}
              />
            </PropertyRow>
            <PropertyRow label="Row span">
              <input
                type="number" min={1}
                value={getSpanString(styles.gridRow) || '1'}
                onChange={(e) => onUpdate({ gridRow: spanVal(e.target.value) })}
                style={{ ...numInputStyle, width: 60 }}
              />
            </PropertyRow>
          </>
        ) : (
          /* Explicit start / end */
          <>
            <GridLineInput label="Column" value={styles.gridColumn} onChange={(v) => onUpdate({ gridColumn: v })} />
            <GridLineInput label="Row"    value={styles.gridRow}    onChange={(v) => onUpdate({ gridRow: v })} />
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
                {ALIGN_SELF_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>Just</span>
              <select
                value={styles.justifySelf ?? 'auto'}
                onChange={(e) => onUpdate({ justifySelf: e.target.value as ElementStyles['justifySelf'] })}
                style={{ ...selectStyle, flex: 1, minWidth: 0 }}
              >
                {JUSTIFY_SELF_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </PropertyRow>
      </div>
    </CollapsibleSection>
  )
}


