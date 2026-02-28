import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, ColorInput } from './shared'

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function BackgroundSection({ styles, onUpdate }: Props) {
  return (
    <CollapsibleSection label="Backgrounds" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Color */}
        <PropertyRow label="Color" labelWidth={44}>
          <ColorInput
            value={styles.backgroundColor}
            onChange={v => onUpdate({ backgroundColor: v })}
            placeholder="transparent"
            fallback="#ffffff"
          />
        </PropertyRow>

        {/* Clipping */}
        <PropertyRow label="Clipping" labelWidth={44}>
          <select
            value={styles.backgroundClip ?? ''}
            onChange={e => onUpdate({ backgroundClip: e.target.value as ElementStyles['backgroundClip'] || undefined })}
            style={{ flex: 1, minWidth: 0, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, background: '#fafafa', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">None</option>
            <option value="border-box">Border box</option>
            <option value="padding-box">Padding box</option>
            <option value="content-box">Content box</option>
            <option value="text">Text</option>
          </select>
        </PropertyRow>

      </div>
    </CollapsibleSection>
  )
}
