import { useState } from 'react'
import type { ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, CompactInput } from './shared'
import { usePropertySource } from '../../hooks/usePropertySource'

type Props = {
  styles: Partial<ElementStyles>
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function AppearanceSection({ styles, onUpdate }: Props) {
  const getSource = usePropertySource()
  const [manualExpanded, setManualExpanded] = useState(false)

  const opacityPct = Math.round((styles.opacity ?? 1) * 100)

  const hasPerCorner = styles.borderTopLeftRadius != null
    || styles.borderTopRightRadius != null
    || styles.borderBottomRightRadius != null
    || styles.borderBottomLeftRadius != null

  const tl = styles.borderTopLeftRadius ?? styles.borderRadius ?? 0
  const tr = styles.borderTopRightRadius ?? styles.borderRadius ?? 0
  const br = styles.borderBottomRightRadius ?? styles.borderRadius ?? 0
  const bl = styles.borderBottomLeftRadius ?? styles.borderRadius ?? 0
  const allSame = tl === tr && tr === br && br === bl
  const expanded = manualExpanded || hasPerCorner
  const unifiedValue = allSame ? tl : ''

  const handleOpacity = (v: number) => {
    onUpdate({ opacity: Math.max(0, Math.min(100, v)) / 100 })
  }

  const handleUnifiedRadius = (v: number) => {
    onUpdate({
      borderRadius: v,
      borderTopLeftRadius: undefined,
      borderTopRightRadius: undefined,
      borderBottomRightRadius: undefined,
      borderBottomLeftRadius: undefined,
    })
  }

  const handleCorner = (key: keyof ElementStyles, v: number) => {
    onUpdate({ [key]: Math.max(0, v) })
  }

  return (
    <CollapsibleSection label="Appearance" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Row 1: Opacity + Corner radius */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Opacity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <PropertyRow label="Opacity" labelWidth={48}
              onReset={() => onUpdate({ opacity: undefined })}
              source={getSource('opacity')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                <input
                  type="range"
                  min={0} max={100} step={1}
                  value={opacityPct}
                  onChange={e => handleOpacity(Number(e.target.value))}
                  style={{ flex: 1, minWidth: 0, height: 4 }}
                />
                <CompactInput
                  value={opacityPct}
                  onChange={e => handleOpacity(Number(e.target.value))}
                  min={0} max={100} step={1}
                  suffix="%"
                  style={{ width: 48, flex: 'none' }}
                />
              </div>
            </PropertyRow>
          </div>
        </div>

        {/* Row 2: Corner radius unified */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PropertyRow label="Radius" labelWidth={48}
              source={getSource('borderRadius')}
              onReset={() => onUpdate({
                borderRadius: undefined,
                borderTopLeftRadius: undefined,
                borderTopRightRadius: undefined,
                borderBottomRightRadius: undefined,
                borderBottomLeftRadius: undefined,
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                <CompactInput
                  value={unifiedValue}
                  onChange={e => handleUnifiedRadius(Math.max(0, Number(e.target.value)))}
                  min={0}
                  suffix="PX"
                  placeholder="—"
                  style={{ flex: 1, minWidth: 0 }}
                />
              </div>
            </PropertyRow>
          </div>

          {/* Toggle per-corner */}
          <button
            onClick={() => setManualExpanded(v => !v)}
            title={expanded ? 'Collapse to single radius' : 'Edit per-corner radius'}
            style={{
              width: 26, height: 26, flex: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: expanded ? '#0a0a0a' : '#f0f0f0',
              color: expanded ? '#fff' : '#737373',
              border: 'none', borderRadius: 6, cursor: 'default',
              fontSize: 12, lineHeight: 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 5V3.5C2 2.67 2.67 2 3.5 2H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 2H10.5C11.33 2 12 2.67 12 3.5V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9V10.5C12 11.33 11.33 12 10.5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12H3.5C2.67 12 2 11.33 2 10.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Per-corner inputs (expanded) */}
        {expanded && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, overflow: 'hidden' }}>
            <CompactInput
              value={tl} min={0}
              onChange={e => handleCorner('borderTopLeftRadius', Number(e.target.value))}
              suffix="⌜"
              title="Top-left radius"
              style={{ minWidth: 0 }}
            />
            <CompactInput
              value={tr} min={0}
              onChange={e => handleCorner('borderTopRightRadius', Number(e.target.value))}
              suffix="⌝"
              title="Top-right radius"
              style={{ minWidth: 0 }}
            />
            <CompactInput
              value={bl} min={0}
              onChange={e => handleCorner('borderBottomLeftRadius', Number(e.target.value))}
              suffix="⌞"
              title="Bottom-left radius"
              style={{ minWidth: 0 }}
            />
            <CompactInput
              value={br} min={0}
              onChange={e => handleCorner('borderBottomRightRadius', Number(e.target.value))}
              suffix="⌟"
              title="Bottom-right radius"
              style={{ minWidth: 0 }}
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
