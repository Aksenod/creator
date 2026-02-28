import { useState } from 'react'
import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, SegmentedControl } from './shared'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const JUSTIFY = ['flex-start', 'center', 'flex-end']
const ALIGN = ['flex-start', 'center', 'flex-end']

const JUSTIFY_OPTIONS = [
  { value: 'flex-start', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'Right' },
  { value: 'space-between', label: 'Space Between' },
  { value: 'space-around', label: 'Space Around' },
]

const ALIGN_OPTIONS = [
  { value: 'flex-start', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'Bottom' },
  { value: 'stretch', label: 'Stretch' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseRepeat(val?: string, fallback = 1): number {
  if (!val) return fallback
  const m = val.match(/repeat\((\d+)/)
  if (m) return parseInt(m[1])
  return val.split(',').length
}

function makeRepeat(n: number): string {
  return `repeat(${n}, 1fr)`
}

// ─── Micro styles ────────────────────────────────────────────────────────────

const microBtnStyle: React.CSSProperties = {
  fontSize: 7, border: 'none', background: 'none', cursor: 'pointer',
  padding: '0 2px', lineHeight: 1, color: '#888',
}

// ─── AlignPicker ─────────────────────────────────────────────────────────────

function AlignPicker({ justifyContent, alignItems, onChangeJustify, onChangeAlign }: {
  justifyContent?: string
  alignItems?: string
  onChangeJustify: (v: string) => void
  onChangeAlign: (v: string) => void
}) {
  const jIdx = Math.max(0, JUSTIFY.indexOf(justifyContent ?? 'flex-start'))
  const aIdx = Math.max(0, ALIGN.indexOf(alignItems ?? 'flex-start'))

  return (
    <div style={{
      width: 72, height: 72,
      border: '1px solid #e0e0e0', borderRadius: 6,
      background: '#f5f5f5',
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {ALIGN.flatMap((alignVal, row) =>
        JUSTIFY.map((justifyVal, col) => {
          const isActive = row === aIdx && col === jIdx
          return (
            <div
              key={`${row}-${col}`}
              onClick={() => { onChangeJustify(justifyVal); onChangeAlign(alignVal) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                background: isActive ? 'rgba(0,102,255,0.08)' : 'transparent',
              }}
            >
              <div style={{
                width: isActive ? 8 : 4, height: isActive ? 8 : 4,
                borderRadius: '50%',
                background: isActive ? '#0066ff' : '#ccc',
                transition: 'all 0.1s',
              }} />
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── AlignSelect ─────────────────────────────────────────────────────────────

function AlignSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: '#999', width: 10, flexShrink: 0 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        flex: 1, minWidth: 0, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4,
        fontSize: 11, background: '#fafafa', outline: 'none', cursor: 'pointer',
        color: '#1a1a1a',
      }}>
        <option value="">—</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="number" min={1} max={12}
          value={value}
          onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
          style={{
            width: '100%', padding: '3px 20px 3px 6px',
            border: '1px solid #e0e0e0', borderRadius: 4,
            fontSize: 12, background: '#fafafa', outline: 'none',
            color: '#1a1a1a',
          }}
        />
        <div style={{ position: 'absolute', right: 2, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <button onClick={() => onChange(value + 1)} style={microBtnStyle}>▲</button>
          <button onClick={() => onChange(Math.max(1, value - 1))} style={microBtnStyle}>▼</button>
        </div>
      </div>
    </div>
  )
}

// ─── GapRow ───────────────────────────────────────────────────────────────────

function GapRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <PropertyRow label="Gap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        <input
          type="range" min={0} max={120} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, minWidth: 0, height: 4, accentColor: '#0066ff' }}
        />
        <input
          type="number" min={0} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: 36, flexShrink: 0, padding: '3px 4px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none', textAlign: 'center', color: '#1a1a1a' }}
        />
        <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>PX</span>
        <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#bbb', padding: 0, flexShrink: 0 }}>🔒</button>
      </div>
    </PropertyRow>
  )
}

// ─── MoreAlignOptions ─────────────────────────────────────────────────────────

function MoreAlignOptions({ styles, onUpdate }: { styles: ElementStyles; onUpdate: (p: Partial<ElementStyles>) => void }) {
  const [open, setOpen] = useState(false)

  const colOptions: Array<{ value: ElementStyles['justifyContent']; icon: string }> = [
    { value: 'flex-start', icon: '⊢' },
    { value: 'center', icon: '⊕' },
    { value: 'flex-end', icon: '⊣' },
    { value: 'space-between', icon: '⊧' },
    { value: 'space-around', icon: '⊨' },
  ]
  const rowOptions: Array<{ value: ElementStyles['alignContent']; icon: string }> = [
    { value: 'flex-start', icon: '⊤' },
    { value: 'center', icon: '⊕' },
    { value: 'flex-end', icon: '⊥' },
    { value: 'space-between', icon: '⊥⊤' },
    { value: 'space-around', icon: '⊵' },
    { value: 'stretch', icon: '↕' },
  ]

  return (
    <div style={{ marginTop: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '5px 10px', border: '1px solid #e0e0e0',
        borderRadius: 4, fontSize: 11, cursor: 'pointer',
        background: '#f5f5f5', color: '#555',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', display: 'inline-block', transition: '0.15s' }}>▼</span>
        More alignment options
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Columns</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {colOptions.map(opt => (
                <button key={opt.value} onClick={() => onUpdate({ justifyContent: opt.value })}
                  style={{
                    flex: 1, padding: '4px 2px', fontSize: 11, border: '1px solid #e0e0e0',
                    borderRadius: 3, cursor: 'pointer',
                    background: styles.justifyContent === opt.value ? '#1a1a1a' : '#f5f5f5',
                    color: styles.justifyContent === opt.value ? '#fff' : '#666',
                  }}>
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Rows</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {rowOptions.map(opt => (
                <button key={opt.value} onClick={() => onUpdate({ alignContent: opt.value })}
                  style={{
                    flex: 1, padding: '4px 2px', fontSize: 11, border: '1px solid #e0e0e0',
                    borderRadius: 3, cursor: 'pointer',
                    background: styles.alignContent === opt.value ? '#1a1a1a' : '#f5f5f5',
                    color: styles.alignContent === opt.value ? '#fff' : '#666',
                  }}>
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FlexControls ─────────────────────────────────────────────────────────────

function FlexControls({ styles, onUpdate }: { styles: ElementStyles; onUpdate: (p: Partial<ElementStyles>) => void }) {
  const dir = styles.flexDirection ?? 'row'
  const gap = styles.gap ?? 0

  const dirOptions = [
    { value: 'row', label: '→' },
    { value: 'column', label: '↓' },
    { value: 'row-reverse', label: '←' },
    { value: 'column-reverse', label: '↑' },
  ]

  return (
    <>
      {/* Direction */}
      <PropertyRow label="Direction">
        <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
          {dirOptions.map(opt => {
            const active = dir === opt.value
            return (
              <button key={opt.value} onClick={() => onUpdate({ flexDirection: opt.value as ElementStyles['flexDirection'] })}
                style={{
                  flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, fontSize: 13,
                  cursor: 'pointer', background: active ? '#1a1a1a' : '#efefef',
                  color: active ? '#fff' : '#888',
                }}>
                {opt.label}
              </button>
            )
          })}
        </div>
      </PropertyRow>

      {/* Align */}
      <PropertyRow label="Align">
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
          <AlignPicker
            justifyContent={styles.justifyContent}
            alignItems={styles.alignItems}
            onChangeJustify={(v) => onUpdate({ justifyContent: v as ElementStyles['justifyContent'] })}
            onChangeAlign={(v) => onUpdate({ alignItems: v as ElementStyles['alignItems'] })}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
            <AlignSelect
              label="X"
              value={styles.justifyContent ?? ''}
              options={JUSTIFY_OPTIONS}
              onChange={(v) => onUpdate({ justifyContent: v as ElementStyles['justifyContent'] })}
            />
            <AlignSelect
              label="Y"
              value={styles.alignItems ?? ''}
              options={ALIGN_OPTIONS}
              onChange={(v) => onUpdate({ alignItems: v as ElementStyles['alignItems'] })}
            />
          </div>
        </div>
      </PropertyRow>

      <GapRow value={gap} onChange={(v) => onUpdate({ gap: v })} />
    </>
  )
}

// ─── GridControls ─────────────────────────────────────────────────────────────

function GridControls({ styles, onUpdate }: { styles: ElementStyles; onUpdate: (p: Partial<ElementStyles>) => void }) {
  const cols = parseRepeat(styles.gridTemplateColumns, 2)
  const rows = parseRepeat(styles.gridTemplateRows, 2)
  const gap = styles.gap ?? 0

  return (
    <>
      {/* Grid columns/rows */}
      <div>
        <PropertyRow label="Grid">
          <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 0 }}>
            <Spinner value={cols} onChange={(v) => onUpdate({ gridTemplateColumns: makeRepeat(v) })} />
            <Spinner value={rows} onChange={(v) => onUpdate({ gridTemplateRows: makeRepeat(v) })} />
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888', fontSize: 14 }}>🔧</button>
          </div>
        </PropertyRow>
        <div style={{ display: 'flex', gap: 6, paddingLeft: 64, marginTop: 2 }}>
          <span style={{ flex: 1, fontSize: 10, color: '#0066ff', textAlign: 'center' }}>Columns</span>
          <span style={{ flex: 1, fontSize: 10, color: '#0066ff', textAlign: 'center' }}>Rows</span>
          <div style={{ width: 22 }} />
        </div>
      </div>

      {/* Direction */}
      <PropertyRow label="Direction">
        <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
          {[{ value: 'row', label: '→' }, { value: 'column', label: '↓' }].map(opt => {
            const active = (styles.flexDirection ?? 'row') === opt.value
            return (
              <button key={opt.value} onClick={() => onUpdate({ flexDirection: opt.value as ElementStyles['flexDirection'] })}
                style={{
                  flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, fontSize: 13,
                  cursor: 'pointer', background: active ? '#1a1a1a' : '#efefef',
                  color: active ? '#fff' : '#888',
                }}>
                {opt.label}
              </button>
            )
          })}
        </div>
      </PropertyRow>

      {/* Align */}
      <PropertyRow label="Align">
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
          <AlignPicker
            justifyContent={styles.justifyContent}
            alignItems={styles.alignItems}
            onChangeJustify={(v) => onUpdate({ justifyContent: v as ElementStyles['justifyContent'] })}
            onChangeAlign={(v) => onUpdate({ alignItems: v as ElementStyles['alignItems'] })}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
            <AlignSelect label="X" value={styles.justifyContent ?? ''} options={JUSTIFY_OPTIONS} onChange={(v) => onUpdate({ justifyContent: v as ElementStyles['justifyContent'] })} />
            <AlignSelect label="Y" value={styles.alignItems ?? ''} options={ALIGN_OPTIONS} onChange={(v) => onUpdate({ alignItems: v as ElementStyles['alignItems'] })} />
          </div>
        </div>
      </PropertyRow>

      <GapRow value={gap} onChange={(v) => onUpdate({ gap: v })} />
      <MoreAlignOptions styles={styles} onUpdate={onUpdate} />
    </>
  )
}

// ─── LayoutSection (main export) ─────────────────────────────────────────────

export function LayoutSection({ styles, onUpdate }: Props) {
  const display = styles.display ?? 'block'

  return (
    <CollapsibleSection label="Layout" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Display */}
        <PropertyRow label="Display">
          <SegmentedControl
            value={display}
            options={[
              { value: 'block', label: 'Block' },
              { value: 'flex', label: 'Flex' },
              { value: 'grid', label: 'Grid' },
              { value: 'none', label: 'None' },
            ]}
            onChange={(v) => onUpdate({ display: v as ElementStyles['display'] })}
          />
        </PropertyRow>

        {display === 'flex' && (
          <FlexControls styles={styles} onUpdate={onUpdate} />
        )}

        {display === 'grid' && (
          <GridControls styles={styles} onUpdate={onUpdate} />
        )}
      </div>
    </CollapsibleSection>
  )
}
