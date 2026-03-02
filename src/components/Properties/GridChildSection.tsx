import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, CompactInput } from './shared'
import { PropertySelect } from './shared/PropertySelect'
import {
  parseGridLine, serializeGridLine,
  detectGridChildMode, getSpanString, spanVal,
  extractSpanNumber,
} from '../../utils/gridUtils'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

// ─── GridLineInput (Manual mode) ──────────────────────────────────────────────

function GridLineInput({ label, value, onChange }: {
  label: string
  value?: string
  onChange: (v: string | undefined) => void
}) {
  const { start, end, isSpan } = parseGridLine(value)

  return (
    <PropertyRow label={label} onReset={() => onChange(undefined)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        <CompactInput
          value={start}
          placeholder="1"
          onChange={(e) => onChange(serializeGridLine(e.target.value, end, isSpan))}
          style={{ width: 40 }}
        />
        <PropertySelect
          value={isSpan ? 'span' : 'end'}
          options={[
            { value: 'end', label: '/' },
            { value: 'span', label: 'span' },
          ]}
          onChange={(v) => onChange(serializeGridLine(start, end, v === 'span'))}
          placeholder=""
          style={{ width: 58, flex: 'none' }}
        />
        <CompactInput
          value={end}
          placeholder={isSpan ? '1' : '2'}
          onChange={(e) => onChange(serializeGridLine(start, e.target.value, isSpan))}
          style={{ width: 40 }}
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
    border: '1px solid #e5e5e5', borderRadius: 4, cursor: 'default',
    background: active ? '#0a0a0a' : '#fafafa',
    color: active ? '#fff' : '#525252',
  })

  return (
    <CollapsibleSection label="Grid child" tooltip="Grid child — position and size within parent grid. Span = columns/rows occupied" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Auto / Manual */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={switchToAuto}   title="Auto — placed automatically in next available cell" style={toggleBtnStyle(mode === 'auto')}>Auto</button>
          <button onClick={switchToManual} title="Manual — set explicit start/end grid lines" style={toggleBtnStyle(mode === 'manual')}>Manual</button>
        </div>

        {mode === 'auto' ? (
          /* Span-only inputs */
          <>
            <PropertyRow label="Column span" onReset={() => onUpdate({ gridColumn: undefined })}>
              <CompactInput
                value={getSpanString(styles.gridColumn) || '1'} min={1}
                onChange={(e) => onUpdate({ gridColumn: spanVal(e.target.value) })}
                style={{ width: 60 }}
              />
            </PropertyRow>
            <PropertyRow label="Row span" onReset={() => onUpdate({ gridRow: undefined })}>
              <CompactInput
                value={getSpanString(styles.gridRow) || '1'} min={1}
                onChange={(e) => onUpdate({ gridRow: spanVal(e.target.value) })}
                style={{ width: 60 }}
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
        <PropertyRow label="Align" onReset={() => onUpdate({ alignSelf: undefined, justifySelf: undefined })}>
          <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: '#a3a3a3', flexShrink: 0 }}>Self</span>
              <PropertySelect
                value={styles.alignSelf ?? 'auto'}
                options={ALIGN_SELF_OPTIONS.map(v => ({ value: v, label: v }))}
                onChange={(v) => onUpdate({ alignSelf: v as ElementStyles['alignSelf'] })}
                title="Align self — vertical alignment"
                placeholder=""
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: '#a3a3a3', flexShrink: 0 }}>Just</span>
              <PropertySelect
                value={styles.justifySelf ?? 'auto'}
                options={JUSTIFY_SELF_OPTIONS.map(v => ({ value: v, label: v }))}
                onChange={(v) => onUpdate({ justifySelf: v as ElementStyles['justifySelf'] })}
                title="Justify self — horizontal alignment"
                placeholder=""
              />
            </div>
          </div>
        </PropertyRow>
      </div>
    </CollapsibleSection>
  )
}


