import { useState } from 'react'
import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, SegmentedControl } from './shared'
import { useEditorStore } from '../../store'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

// ─── Track helpers ────────────────────────────────────────────────────────────

export type TrackUnit = 'fr' | 'px' | 'auto'
export type GridTrack = { value: number; unit: TrackUnit }

export function parseTracks(css?: string): GridTrack[] {
  if (!css) return []
  // Expand repeat(N, X) → N copies of X
  const expanded = css.replace(/repeat\((\d+),\s*([^)]+)\)/g, (_, n, track) => {
    return Array(parseInt(n)).fill(track.trim()).join(' ')
  })
  return expanded.split(/\s+/).filter(Boolean).map(t => {
    if (t === 'auto') return { value: 0, unit: 'auto' as TrackUnit }
    const frM = t.match(/^([\d.]+)fr$/)
    if (frM) return { value: parseFloat(frM[1]), unit: 'fr' as TrackUnit }
    const pxM = t.match(/^([\d.]+)px$/)
    if (pxM) return { value: parseFloat(pxM[1]), unit: 'px' as TrackUnit }
    const numM = t.match(/^([\d.]+)$/)
    if (numM) return { value: parseFloat(numM[1]), unit: 'px' as TrackUnit }
    return { value: 0, unit: 'auto' as TrackUnit }
  })
}

export function serializeTracks(tracks: GridTrack[]): string {
  return tracks.map(t => {
    if (t.unit === 'auto') return 'auto'
    if (t.unit === 'fr') return `${t.value}fr`
    return `${t.value}px`
  }).join(' ')
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

// ─── AlignPicker ─────────────────────────────────────────────────────────────

function AlignPicker({ justifyContent, alignItems, onChangeJustify, onChangeAlign }: {
  justifyContent?: string
  alignItems?: string
  onChangeJustify: (v: string) => void
  onChangeAlign: (v: string) => void
}) {
  const jIdx = JUSTIFY.indexOf(justifyContent ?? 'flex-start')
  const aIdx = ALIGN.indexOf(alignItems ?? 'flex-start')

  const handleClick = (e: React.MouseEvent, justifyVal: string, alignVal: string) => {
    if (e.altKey) {
      // Alt+click → align-items: stretch (justify не трогаем)
      onChangeAlign('stretch')
      return
    }
    if (e.metaKey || e.ctrlKey || e.detail === 2) {
      // Cmd/Ctrl+click или double-click → justify-content: space-between (align не трогаем)
      onChangeJustify('space-between')
      return
    }
    // Single click → устанавливаем оба
    onChangeJustify(justifyVal)
    onChangeAlign(alignVal)
  }

  return (
    <div
      title="Click — set align&#10;Double-click / ⌘ — space-between&#10;Alt — stretch"
      style={{
        width: 72, height: 72,
        border: '1px solid #e0e0e0', borderRadius: 6,
        background: '#f5f5f5',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        overflow: 'hidden', flexShrink: 0,
      }}
    >
      {ALIGN.flatMap((alignVal, row) =>
        JUSTIFY.map((justifyVal, col) => {
          const isActive = row === aIdx && col === jIdx
          const isSpaceBetween = justifyContent === 'space-between'
          const isStretch = alignItems === 'stretch'
          return (
            <div
              key={`${row}-${col}`}
              onClick={(e) => handleClick(e, justifyVal, alignVal)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                background: isActive ? 'rgba(0,102,255,0.08)' : 'transparent',
              }}
            >
              <div style={{
                width: isActive ? 8 : 4,
                height: isActive ? 8 : 4,
                borderRadius: isSpaceBetween && !isActive ? '1px' : '50%',
                background: isActive ? '#0066ff' : isStretch && !isActive ? 'rgba(0,102,255,0.3)' : '#ccc',
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

      <PropertyRow label="Gap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
          <input
            type="range" min={0} max={120} value={gap}
            onChange={(e) => onUpdate({ gap: Number(e.target.value) })}
            style={{ flex: 1, minWidth: 0, height: 4, accentColor: '#0066ff' }}
          />
          <input
            type="number" min={0} value={gap}
            onChange={(e) => onUpdate({ gap: Number(e.target.value) })}
            style={{ width: 36, flexShrink: 0, padding: '3px 4px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none', textAlign: 'center', color: '#1a1a1a' }}
          />
          <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>PX</span>
        </div>
      </PropertyRow>
    </>
  )
}

// ─── TrackList ────────────────────────────────────────────────────────────────

function TrackList({ label, tracks, onChange, onAddTrack }: {
  label: string
  tracks: GridTrack[]
  onChange: (tracks: GridTrack[]) => void
  onAddTrack: () => void
}) {
  const updateTrack = (i: number, patch: Partial<GridTrack>) => {
    const next = tracks.map((t, idx) => idx === i ? { ...t, ...patch } : t)
    onChange(next)
  }

  const removeTrack = (i: number) => {
    onChange(tracks.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{label}</span>
        <button
          onClick={onAddTrack}
          title={`Add ${label.toLowerCase()}`}
          style={{
            fontSize: 11, border: '1px solid #d0d0d0', borderRadius: 3, padding: '2px 6px',
            background: '#f5f5f5', cursor: 'pointer', color: '#555',
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          + Add
        </button>
      </div>
      {tracks.length === 0 ? (
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', padding: '4px 0' }}>—</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {tracks.map((track, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Value input — hidden when auto */}
              {track.unit !== 'auto' ? (
                <input
                  type="number"
                  min={0}
                  value={track.value}
                  onChange={(e) => updateTrack(i, { value: Number(e.target.value) })}
                  style={{
                    flex: 1, minWidth: 0, padding: '3px 5px',
                    border: '1px solid #e0e0e0', borderRadius: 4,
                    fontSize: 12, background: '#fafafa', outline: 'none', color: '#1a1a1a',
                  }}
                />
              ) : (
                <div style={{ flex: 1 }} />
              )}
              {/* Unit dropdown */}
              <select
                value={track.unit}
                onChange={(e) => updateTrack(i, { unit: e.target.value as TrackUnit })}
                style={{
                  width: 46, padding: '3px 4px', border: '1px solid #e0e0e0',
                  borderRadius: 4, fontSize: 11, background: '#fafafa',
                  outline: 'none', cursor: 'pointer', color: '#1a1a1a',
                }}
              >
                <option value="fr">fr</option>
                <option value="px">px</option>
                <option value="auto">auto</option>
              </select>
              {/* Remove */}
              <button
                onClick={() => removeTrack(i)}
                title="Remove track"
                data-testid="track-remove"
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: '#bbb', fontSize: 14, padding: '0 2px',
                  lineHeight: 1, flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── GridGapRow ──────────────────────────────────────────────────────────────

function GridGapRow({ styles, onUpdate }: { styles: ElementStyles; onUpdate: (p: Partial<ElementStyles>) => void }) {
  const [locked, setLocked] = useState(true)
  const colGap = styles.columnGap ?? styles.gap ?? 0
  const rowGap = styles.rowGap ?? styles.gap ?? 0

  const handleLocked = (v: number) => {
    onUpdate({ columnGap: v, rowGap: v })
  }

  const numInputStyle: React.CSSProperties = {
    width: 36, padding: '3px 4px', border: '1px solid #e0e0e0',
    borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none',
    textAlign: 'center', color: '#1a1a1a',
  }

  return (
    <PropertyRow label="Gap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        {locked ? (
          <>
            <input
              type="range" min={0} max={120} value={colGap}
              onChange={(e) => handleLocked(Number(e.target.value))}
              style={{ flex: 1, minWidth: 0, height: 4, accentColor: '#0066ff' }}
            />
            <input
              type="number" min={0} value={colGap}
              onChange={(e) => handleLocked(Number(e.target.value))}
              style={numInputStyle}
            />
            <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>PX</span>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#aaa', width: 20, flexShrink: 0 }}>Col</span>
                <input
                  type="number" min={0} value={colGap}
                  onChange={(e) => onUpdate({ columnGap: Number(e.target.value) })}
                  style={{ ...numInputStyle, flex: 1, width: 'auto' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: '#aaa', width: 20, flexShrink: 0 }}>Row</span>
                <input
                  type="number" min={0} value={rowGap}
                  onChange={(e) => onUpdate({ rowGap: Number(e.target.value) })}
                  style={{ ...numInputStyle, flex: 1, width: 'auto' }}
                />
              </div>
            </div>
          </>
        )}
        {/* Lock/Unlock toggle */}
        <button
          onClick={() => setLocked(!locked)}
          title={locked ? 'Unlock gap' : 'Lock gap'}
          style={{
            border: '1px solid #e0e0e0', background: locked ? '#f5f5f5' : '#e8f0ff',
            borderRadius: 4, cursor: 'pointer', padding: '3px 5px',
            fontSize: 12, color: locked ? '#888' : '#0066ff', flexShrink: 0,
          }}
        >
          {locked ? '🔒' : '🔓'}
        </button>
      </div>
    </PropertyRow>
  )
}

// ─── GridControls (new Webflow-style) ────────────────────────────────────────

function GridControls({ styles, onUpdate, elementId }: {
  styles: ElementStyles
  onUpdate: (p: Partial<ElementStyles>) => void
  elementId?: string | null
}) {
  const { gridEditElementId, setGridEditElementId } = useEditorStore()
  const colTracks = parseTracks(styles.gridTemplateColumns)
  const rowTracks = parseTracks(styles.gridTemplateRows)
  const autoFlow = styles.gridAutoFlow ?? 'row'
  const isEditMode = !!(elementId && gridEditElementId === elementId)

  const updateCols = (tracks: GridTrack[]) => {
    onUpdate({ gridTemplateColumns: serializeTracks(tracks) || undefined })
  }
  const updateRows = (tracks: GridTrack[]) => {
    onUpdate({ gridTemplateRows: serializeTracks(tracks) || undefined })
  }

  return (
    <>
      {/* Columns */}
      <TrackList
        label="Columns"
        tracks={colTracks}
        onChange={updateCols}
        onAddTrack={() => updateCols([...colTracks, { value: 1, unit: 'fr' }])}
      />

      {/* Rows */}
      <TrackList
        label="Rows"
        tracks={rowTracks}
        onChange={updateRows}
        onAddTrack={() => updateRows([...rowTracks, { value: 1, unit: 'fr' }])}
      />

      {/* Gap */}
      <GridGapRow styles={styles} onUpdate={onUpdate} />

      {/* Auto-flow direction */}
      <PropertyRow label="Direction">
        <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
          {[{ value: 'row', label: '→ Row' }, { value: 'column', label: '↓ Column' }].map(opt => {
            const active = autoFlow === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onUpdate({ gridAutoFlow: opt.value as ElementStyles['gridAutoFlow'] })}
                style={{
                  flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4,
                  fontSize: 11, cursor: 'pointer',
                  background: active ? '#1a1a1a' : '#efefef',
                  color: active ? '#fff' : '#888',
                }}
              >
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

      <MoreAlignOptions styles={styles} onUpdate={onUpdate} />

      {/* Grid Edit Mode button */}
      {elementId && (
        <button
          onClick={() => setGridEditElementId(isEditMode ? null : elementId)}
          title="Открыть Grid Edit Mode"
          style={{
            width: '100%', marginTop: 6, padding: '6px 10px',
            border: `1px solid ${isEditMode ? '#0066ff' : '#d0d0d0'}`,
            borderRadius: 4, fontSize: 11, cursor: 'pointer',
            background: isEditMode ? '#e8f0ff' : '#f5f5f5',
            color: isEditMode ? '#0066ff' : '#555',
            fontWeight: isEditMode ? 600 : 400,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          ⊞ {isEditMode ? 'Exit Edit Mode' : 'Edit Grid'}
        </button>
      )}
    </>
  )
}

// ─── LayoutSection (main export) ─────────────────────────────────────────────

export function LayoutSection({ styles, onUpdate, elementId }: Props & { elementId?: string | null }) {
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
          <GridControls styles={styles} onUpdate={onUpdate} elementId={elementId} />
        )}
      </div>
    </CollapsibleSection>
  )
}
