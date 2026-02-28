import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow } from './shared'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
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

// ─── GridLineInput ─────────────────────────────────────────────────────────────

function GridLineInput({ label, value, onChange }: {
  label: string
  value?: string
  onChange: (v: string | undefined) => void
}) {
  const { start, end, isSpan } = parseGridLine(value)

  const handleStart = (v: string) => {
    onChange(serializeGridLine(v, end, isSpan))
  }

  const handleEnd = (v: string) => {
    onChange(serializeGridLine(start, v, isSpan))
  }

  const handleSpanToggle = (span: boolean) => {
    onChange(serializeGridLine(start, end, span))
  }

  return (
    <PropertyRow label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        {/* start */}
        <input
          type="number"
          value={start}
          placeholder="1"
          onChange={(e) => handleStart(e.target.value)}
          style={numInputStyle}
        />
        {/* span toggle */}
        <select
          value={isSpan ? 'span' : 'end'}
          onChange={(e) => handleSpanToggle(e.target.value === 'span')}
          data-testid={`grid-line-span-${label.toLowerCase()}`}
          style={{ ...selectStyle, width: 52 }}
        >
          <option value="end">/</option>
          <option value="span">span</option>
        </select>
        {/* end */}
        <input
          type="number"
          value={end}
          placeholder={isSpan ? '1' : '2'}
          onChange={(e) => handleEnd(e.target.value)}
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
  return (
    <CollapsibleSection label="Grid child" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Column placement */}
        <GridLineInput
          label="Column"
          value={styles.gridColumn}
          onChange={(v) => onUpdate({ gridColumn: v })}
        />

        {/* Row placement */}
        <GridLineInput
          label="Row"
          value={styles.gridRow}
          onChange={(v) => onUpdate({ gridRow: v })}
        />

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
