import { CollapsibleSection, PropertyRow, ColorInput } from './shared'
import type { CanvasPattern } from '../../types'

function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return true
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function getPatternPreview(pattern: CanvasPattern, bg: string, patternColor?: string): string {
  let c: string
  let ce: string
  let ca: string
  if (patternColor) {
    c = patternColor
    ce = encodeURIComponent(patternColor)
    ca = '1'
  } else {
    const light = isLightColor(bg)
    c = light ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.2)'
    ce = light ? '%23000000' : '%23ffffff'
    ca = light ? '0.18' : '0.2'
  }
  switch (pattern) {
    case 'none': return 'none'
    case 'dots': return `radial-gradient(circle, ${c} 1px, transparent 1px)`
    case 'grid': return `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`
    case 'cross': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cline x1='10' y1='2' x2='10' y2='18' stroke='${ce}' stroke-width='1' stroke-opacity='${ca}'/%3E%3Cline x1='2' y1='10' x2='18' y2='10' stroke='${ce}' stroke-width='1' stroke-opacity='${ca}'/%3E%3C/svg%3E")`
    case 'hearts': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M10 15 C10 15 3 10 3 6.5 C3 4.5 4.5 3 6.5 3 C8 3 9.5 4 10 5.5 C10.5 4 12 3 13.5 3 C15.5 3 17 4.5 17 6.5 C17 10 10 15 10 15Z' fill='${ce}' fill-opacity='${ca}'/%3E%3C/svg%3E")`
    default: return 'none'
  }
}

const PATTERNS: { id: CanvasPattern; label: string }[] = [
  { id: 'none',   label: 'None'   },
  { id: 'dots',   label: 'Dots'   },
  { id: 'grid',   label: 'Grid'   },
  { id: 'cross',  label: 'Cross'  },
  { id: 'hearts', label: 'Hearts' },
]

const MIN_SIZE = 8
const MAX_SIZE = 80
const STEP = 4

export function CanvasSection({
  canvasBackground,
  canvasPattern,
  canvasPatternSize,
  canvasPatternColor,
  onUpdate,
}: {
  canvasBackground: string
  canvasPattern: CanvasPattern
  canvasPatternSize: number
  canvasPatternColor?: string
  onUpdate: (patch: { canvasBackground?: string; canvasPattern?: CanvasPattern; canvasPatternSize?: number; canvasPatternColor?: string }) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <CollapsibleSection label="Background" defaultOpen>
        <PropertyRow label="Color">
          <ColorInput
            value={canvasBackground}
            onChange={(v) => onUpdate({ canvasBackground: v })}
            fallback="#e8e8e8"
          />
        </PropertyRow>
      </CollapsibleSection>

      {/* Spacing handled by CollapsibleSection borderTop */}

      <CollapsibleSection label="Pattern" defaultOpen>
        {/* 5 кнопок-превью — grid 5 колонок, все в одну строку */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: canvasPattern !== 'none' ? 10 : 0 }}>
          {PATTERNS.map((p) => {
            const isActive = canvasPattern === p.id
            const previewSize = canvasPatternSize / 4
            return (
              <button
                key={p.id}
                title={p.label}
                onClick={() => onUpdate({ canvasPattern: p.id })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: 4,
                  border: `2px solid ${isActive ? '#0a0a0a' : '#e5e5e5'}`,
                  borderRadius: 6,
                  cursor: 'default',
                  background: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.1s',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 4,
                    background: canvasBackground,
                    backgroundImage: getPatternPreview(p.id, canvasBackground, canvasPatternColor),
                    backgroundSize: `${previewSize}px ${previewSize}px`,
                    backgroundRepeat: 'repeat',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                />
                <span style={{ fontSize: 9, color: isActive ? '#0a0a0a' : '#737373', lineHeight: 1 }}>
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>

        {canvasPattern !== 'none' && (
          <>
            <PropertyRow label="Color">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <ColorInput
                  value={canvasPatternColor}
                  onChange={(v) => onUpdate({ canvasPatternColor: v })}
                  placeholder="Auto"
                  fallback={isLightColor(canvasBackground) ? '#000000' : '#ffffff'}
                />
                {canvasPatternColor && (
                  <button
                    onClick={() => onUpdate({ canvasPatternColor: '' })}
                    title="Reset to auto"
                    style={{ flexShrink: 0, fontSize: 10, color: '#737373', background: 'none', border: '1px solid #e5e5e5', borderRadius: 3, padding: '2px 5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >Auto</button>
                )}
              </div>
            </PropertyRow>

            <PropertyRow label="Size">
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={STEP}
                value={canvasPatternSize}
                onChange={(e) => onUpdate({ canvasPatternSize: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
            </PropertyRow>

          </>
        )}
      </CollapsibleSection>
    </div>
  )
}
