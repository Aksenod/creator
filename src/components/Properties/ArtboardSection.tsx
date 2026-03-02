import { CollapsibleSection, PropertyRow } from './shared'
import type { Artboard } from '../../types'

export function ArtboardSection({
  artboard,
  effectiveWidth,
  breakpointLabel,
  onUpdate,
}: {
  artboard: Artboard
  effectiveWidth: number
  breakpointLabel: string
  onUpdate: (patch: Partial<Pick<Artboard, 'name' | 'height'>>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <CollapsibleSection label="Artboard" tooltip="Artboard — workspace (page). Set name and dimensions" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PropertyRow label="Name">
            <input
              value={artboard.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              style={inputStyle}
            />
          </PropertyRow>
        </div>
      </CollapsibleSection>

      {/* Spacing between sections handled by CollapsibleSection borderTop */}

      <CollapsibleSection label="Size" tooltip="Artboard size — width is set by breakpoint, height is manual" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PropertyRow label="W">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                value={effectiveWidth}
                readOnly
                title={`Ширина задаётся брейкпоинтом (${breakpointLabel})`}
                style={{ ...inputStyle, color: '#a3a3a3', cursor: 'not-allowed', flex: 1 }}
              />
              <span
                title={`Ширина задаётся брейкпоинтом (${breakpointLabel})`}
                style={{ fontSize: 10, color: '#a3a3a3', whiteSpace: 'nowrap', cursor: 'default' }}
              >
                {breakpointLabel}
              </span>
            </div>
          </PropertyRow>
          <PropertyRow label="H">
            <input
              type="number"
              value={artboard.height}
              min={1}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v > 0) onUpdate({ height: v })
              }}
              style={inputStyle}
            />
          </PropertyRow>
        </div>
      </CollapsibleSection>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '3px 6px', border: '1px solid #e5e5e5', borderRadius: 4,
  fontSize: 12, background: '#fafafa', outline: 'none', width: '100%', minWidth: 0,
  color: '#0a0a0a',
}
