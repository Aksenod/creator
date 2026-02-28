import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, ColorInput } from './shared'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function BorderSection({ styles, onUpdate }: Props) {
  const radius = styles.borderRadius ?? 0

  return (
    <CollapsibleSection label="Borders" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Radius */}
        <PropertyRow label="Radius" labelWidth={44}>
          <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={100}
              value={radius}
              onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
              style={{ flex: 1, minWidth: 0, height: 4, accentColor: '#0066ff' }}
            />
            <input
              type="number"
              min={0}
              value={radius}
              onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
              style={{ width: 36, flexShrink: 0, padding: '3px 4px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none', textAlign: 'center' }}
            />
            <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>PX</span>
          </div>
        </PropertyRow>

        {/* Border section */}
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Border</span>

          {/* Style */}
          <PropertyRow label="Style" labelWidth={44}>
            <div style={{ display: 'flex', background: '#efefef', borderRadius: 6, padding: 2, gap: 1, flex: 1, minWidth: 0 }}>
              {([
                { value: 'none', label: '×' },
                { value: 'solid', label: '—' },
                { value: 'dashed', label: '- -' },
                { value: 'dotted', label: '···' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ borderStyle: opt.value })}
                  style={{
                    flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'pointer',
                    fontSize: opt.value === 'none' ? 12 : 10,
                    background: (styles.borderStyle ?? 'none') === opt.value ? '#1a1a1a' : 'transparent',
                    color: (styles.borderStyle ?? 'none') === opt.value ? '#fff' : '#888',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </PropertyRow>

          {/* Width */}
          <PropertyRow label="Width" labelWidth={44}>
            <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                value={styles.borderWidth ?? 0}
                onChange={e => onUpdate({ borderWidth: Number(e.target.value) })}
                style={{ flex: 1, minWidth: 0, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none' }}
              />
              <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>PX</span>
            </div>
          </PropertyRow>

          {/* Color */}
          <PropertyRow label="Color" labelWidth={44}>
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
