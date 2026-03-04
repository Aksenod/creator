import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, ColorInput, SegmentedControl, CompactInput } from './shared'
import { PropertySelect } from './shared/PropertySelect'
import { usePropertySource } from '../../hooks/usePropertySource'

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const AlignLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
  </svg>
)
const AlignCenterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
  </svg>
)
const AlignRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" />
  </svg>
)
const AlignJustifyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
const StrikethroughIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="12" x2="20" y2="12" />
    <path d="M15 4H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H8" />
  </svg>
)
const UnderlineIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
  </svg>
)
const OverlineIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="4" x2="20" y2="4" /><path d="M6 20v-6a6 6 0 0 1 12 0v6" />
  </svg>
)

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
  'Poppins', 'Nunito', 'Manrope', 'Playfair Display',
  'Arial', 'Georgia', 'Times New Roman', 'Helvetica',
]

export function TypographySection({ styles, onUpdate }: Props) {
  const getSource = usePropertySource()
  return (
    <CollapsibleSection label="Typography" tooltip="Typography — font, size, weight, color, alignment and decorations" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Font */}
        <PropertyRow label="Font" labelWidth={44} onReset={() => onUpdate({ fontFamily: undefined })} source={getSource('fontFamily')}>
          <PropertySelect
            value={styles.fontFamily ?? ''}
            options={FONT_FAMILIES.map(f => ({ value: f, label: f }))}
            onChange={v => onUpdate({ fontFamily: v || undefined })}
            title="Font family"
          />
        </PropertyRow>

        {/* Weight */}
        <PropertyRow label="Weight" labelWidth={44} onReset={() => onUpdate({ fontWeight: undefined })} source={getSource('fontWeight')}>
          <PropertySelect
            value={styles.fontWeight ?? ''}
            options={[
              { value: '100', label: '100 – Thin' },
              { value: '200', label: '200 – ExtraLight' },
              { value: '300', label: '300 – Light' },
              { value: '400', label: '400 – Normal' },
              { value: '500', label: '500 – Medium' },
              { value: '600', label: '600 – SemiBold' },
              { value: '700', label: '700 – Bold' },
              { value: '800', label: '800 – ExtraBold' },
              { value: '900', label: '900 – Black' },
            ]}
            onChange={v => onUpdate({ fontWeight: v || undefined })}
            title="Font weight"
          />
        </PropertyRow>

        {/* Size + Line Height */}
        <PropertyRow label="Size" labelWidth={44} onReset={() => onUpdate({ fontSize: undefined, lineHeight: undefined })} source={getSource('fontSize')}>
          <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, alignItems: 'center' }}>
            <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <input
                type="number"
                min={0}
                value={styles.fontSize ?? ''}
                onChange={e => onUpdate({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
                title="Font size in pixels. Typical: 14–16 for body, 24–48 for headings"
                style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
              />
              <span style={{ padding: '0 6px', borderLeft: '1px solid #e5e5e5', background: '#efefef', fontSize: 10, color: '#737373', display: 'flex', alignItems: 'center', flexShrink: 0 }}>PX</span>
            </div>
            <span title="Line height — space between lines. 1.0 = tight, 1.5 = comfortable" style={{ fontSize: 11, color: '#a3a3a3', flexShrink: 0 }}>H</span>
            <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: 4, overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <input
                type="number"
                min={0}
                step={0.1}
                value={styles.lineHeight ?? ''}
                onChange={e => onUpdate({ lineHeight: e.target.value ? Number(e.target.value) : undefined })}
                style={{ flex: 1, minWidth: 0, border: 'none', padding: '3px 6px', fontSize: 12, background: 'transparent', outline: 'none' }}
              />
              <button
                onClick={() => onUpdate({ lineHeight: undefined })}
                title="Reset line height — browser will auto-calculate based on font size"
                style={{ padding: '0 6px', borderLeft: '1px solid #e5e5e5', background: '#f0f0f0', border: 'none', cursor: 'default', color: '#d4d4d4', fontSize: 12, flexShrink: 0 }}
              >
                –
              </button>
            </div>
          </div>
        </PropertyRow>

        {/* Color */}
        <PropertyRow label="Color" labelWidth={44} onReset={() => onUpdate({ color: undefined })} source={getSource('color')}>
          <ColorInput
            value={styles.color}
            onChange={v => onUpdate({ color: v })}
            placeholder="—"
            fallback="#000000"
          />
        </PropertyRow>

        {/* Align */}
        <PropertyRow label="Align" labelWidth={44} onReset={() => onUpdate({ textAlign: undefined })} source={getSource('textAlign')}>
          <div style={{ display: 'flex', background: '#efefef', borderRadius: 6, padding: 2, gap: 1, flex: 1, minWidth: 0 }}>
            {([
              { value: 'left' as const, icon: <AlignLeftIcon />, tooltip: 'Align left' },
              { value: 'center' as const, icon: <AlignCenterIcon />, tooltip: 'Align center' },
              { value: 'right' as const, icon: <AlignRightIcon />, tooltip: 'Align right' },
              { value: 'justify' as const, icon: <AlignJustifyIcon />, tooltip: 'Justify — stretch text edge to edge' },
            ]).map(opt => (
              <button
                key={opt.value}
                title={opt.tooltip}
                onClick={() => onUpdate({ textAlign: opt.value })}
                style={{
                  flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: styles.textAlign === opt.value ? '#0a0a0a' : 'transparent',
                  color: styles.textAlign === opt.value ? '#fff' : '#737373',
                }}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </PropertyRow>

        {/* Decor */}
        <PropertyRow label="Decor" labelWidth={44} onReset={() => onUpdate({ textDecoration: undefined })} source={getSource('textDecoration')}>
          <div style={{ display: 'flex', background: '#efefef', borderRadius: 6, padding: 2, gap: 1, flex: 1, minWidth: 0 }}>
            {([
              { value: 'none' as const, icon: <span style={{ fontSize: 12 }}>×</span>, tooltip: 'No decoration' },
              { value: 'line-through' as const, icon: <StrikethroughIcon />, tooltip: 'Strikethrough' },
              { value: 'underline' as const, icon: <UnderlineIcon />, tooltip: 'Underline' },
              { value: 'overline' as const, icon: <OverlineIcon />, tooltip: 'Overline' },
            ]).map(opt => (
              <button
                key={opt.value}
                title={opt.tooltip}
                onClick={() => onUpdate({ textDecoration: opt.value })}
                style={{
                  flex: 1, minWidth: 0, padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: (styles.textDecoration ?? 'none') === opt.value ? '#0a0a0a' : 'transparent',
                  color: (styles.textDecoration ?? 'none') === opt.value ? '#fff' : '#737373',
                }}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </PropertyRow>

        {/* Letter Spacing */}
        <PropertyRow label="Spacing" labelWidth={44} onReset={() => onUpdate({ letterSpacing: undefined })} source={getSource('letterSpacing')}>
          <CompactInput
            value={styles.letterSpacing ?? 0}
            onChange={e => onUpdate({ letterSpacing: e.target.value ? Number(e.target.value) : undefined })}
            step={0.1}
            suffix="PX"
            title="Letter spacing — space between characters. 0 = normal, negative = tighter, positive = wider"
          />
        </PropertyRow>

        {/* Text Transform */}
        <PropertyRow label="Case" labelWidth={44} onReset={() => onUpdate({ textTransform: undefined })} source={getSource('textTransform')}>
          <SegmentedControl
            value={styles.textTransform ?? 'none'}
            options={[
              { value: 'none', label: 'None', tooltip: 'No transformation' },
              { value: 'uppercase', label: 'AA', tooltip: 'UPPERCASE — all caps' },
              { value: 'lowercase', label: 'aa', tooltip: 'lowercase — all lowercase' },
              { value: 'capitalize', label: 'Aa', tooltip: 'Capitalize — first letter of each word' },
            ]}
            onChange={(v) => onUpdate({ textTransform: v as ElementStyles['textTransform'] })}
          />
        </PropertyRow>

      </div>
    </CollapsibleSection>
  )
}
