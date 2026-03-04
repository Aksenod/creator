import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, ColorInput, CompactInput } from './shared'
import { usePropertySource } from '../../hooks/usePropertySource'

type Props = {
  styles: Partial<ElementStyles>
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function BorderSection({ styles, onUpdate }: Props) {
  const getSource = usePropertySource()
  return (
    <CollapsibleSection label="Borders" tooltip="Borders — border style, width and color" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Style */}
          <PropertyRow label="Style" labelWidth={44} onReset={() => onUpdate({ borderStyle: undefined })} source={getSource('borderStyle')}>
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
          <PropertyRow label="Width" labelWidth={44} onReset={() => onUpdate({ borderWidth: undefined })} source={getSource('borderWidth')}>
            <CompactInput
              value={styles.borderWidth ?? 0} min={0}
              onChange={e => onUpdate({ borderWidth: Number(e.target.value) })}
              suffix="PX"
              title="Border width in pixels"
            />
          </PropertyRow>

          {/* Color */}
          <PropertyRow label="Color" labelWidth={44} onReset={() => onUpdate({ borderColor: undefined })} source={getSource('borderColor')}>
            <ColorInput
              value={styles.borderColor}
              onChange={v => onUpdate({ borderColor: v })}
              placeholder="—"
              fallback="#000000"
            />
          </PropertyRow>

      </div>
    </CollapsibleSection>
  )
}
