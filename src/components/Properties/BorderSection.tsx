import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, ColorInput, CompactInput } from './shared'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function BorderSection({ styles, onUpdate }: Props) {
  const radius = styles.borderRadius ?? 0

  return (
    <CollapsibleSection label="Borders" tooltip="Borders — border style, width, color and corner radius" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Radius */}
        <PropertyRow label="Radius" labelWidth={44} onReset={() => onUpdate({ borderRadius: undefined })}>
          <div title="Corner radius — higher value = rounder corners. 0 = sharp, 50+ = pill/circle" style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={radius}
              onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
              style={{ flex: 1, minWidth: 0 }}
            />
            <CompactInput
              value={radius} min={0}
              onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
              suffix="PX" style={{ width: 52, flex: 'none' }}
            />
          </div>
        </PropertyRow>

        {/* Border section */}
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Border</span>

          {/* Style */}
          <PropertyRow label="Style" labelWidth={44} onReset={() => onUpdate({ borderStyle: undefined })}>
            <div style={{ display: 'flex', background: '#efefef', borderRadius: 6, padding: 2, gap: 1, flex: 1, minWidth: 0 }}>
              {([
                { value: 'none', label: '×', tooltip: 'No border' },
                { value: 'solid', label: '—', tooltip: 'Solid border' },
                { value: 'dashed', label: '- -', tooltip: 'Dashed border' },
                { value: 'dotted', label: '···', tooltip: 'Dotted border' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  title={opt.tooltip}
                  onClick={() => onUpdate({ borderStyle: opt.value })}
                  style={{
                    flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'default',
                    fontSize: opt.value === 'none' ? 12 : 10,
                    background: (styles.borderStyle ?? 'none') === opt.value ? '#0a0a0a' : 'transparent',
                    color: (styles.borderStyle ?? 'none') === opt.value ? '#fff' : '#737373',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PropertyRow>

          {/* Width */}
          <PropertyRow label="Width" labelWidth={44} onReset={() => onUpdate({ borderWidth: undefined })}>
            <CompactInput
              value={styles.borderWidth ?? 0} min={0}
              onChange={e => onUpdate({ borderWidth: Number(e.target.value) })}
              suffix="PX"
              title="Border width in pixels"
            />
          </PropertyRow>

          {/* Color */}
          <PropertyRow label="Color" labelWidth={44} onReset={() => onUpdate({ borderColor: undefined })}>
            <ColorInput
              value={styles.borderColor}
              onChange={v => onUpdate({ borderColor: v })}
              placeholder="—"
              fallback="#000000"
            />
          </PropertyRow>
        </div>

      </div>
    </CollapsibleSection>
  )
}
