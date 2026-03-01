import { CollapsibleSection, PropertyRow, ColorInput } from './shared'
import type { CanvasPattern } from '../../types'

// Единое место хранения превью — использует те же паттерны что и CanvasEditor
const PATTERN_PREVIEW: Record<CanvasPattern, string> = {
  none: 'none',
  dots: 'radial-gradient(circle, #aaa 1px, transparent 1px)',
  grid: 'linear-gradient(#bbb 1px, transparent 1px), linear-gradient(90deg, #bbb 1px, transparent 1px)',
  cross: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cline x1='10' y1='2' x2='10' y2='18' stroke='%23aaa' stroke-width='1'/%3E%3Cline x1='2' y1='10' x2='18' y2='10' stroke='%23aaa' stroke-width='1'/%3E%3C/svg%3E")`,
  hearts: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M10 15 C10 15 3 10 3 6.5 C3 4.5 4.5 3 6.5 3 C8 3 9.5 4 10 5.5 C10.5 4 12 3 13.5 3 C15.5 3 17 4.5 17 6.5 C17 10 10 15 10 15Z' fill='%23bbb'/%3E%3C/svg%3E")`,
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
  onUpdate,
}: {
  canvasBackground: string
  canvasPattern: CanvasPattern
  canvasPatternSize: number
  onUpdate: (patch: { canvasBackground?: string; canvasPattern?: CanvasPattern; canvasPatternSize?: number }) => void
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

      <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />

      <CollapsibleSection label="Pattern" defaultOpen>
        {/* 5 кнопок-превью */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: canvasPattern !== 'none' ? 10 : 0 }}>
          {PATTERNS.map((p) => {
            const isActive = canvasPattern === p.id
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
                  border: `2px solid ${isActive ? '#0066ff' : '#e0e0e0'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.1s',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    // Фон — текущий цвет канваса
                    background: canvasBackground,
                    backgroundImage: PATTERN_PREVIEW[p.id],
                    backgroundSize: '10px 10px',
                    backgroundRepeat: 'repeat',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                />
                <span style={{ fontSize: 9, color: isActive ? '#0066ff' : '#888', lineHeight: 1 }}>
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Контрол размера — только когда паттерн выбран */}
        {canvasPattern !== 'none' && (
          <PropertyRow label="Size">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <button
                onClick={() => onUpdate({ canvasPatternSize: Math.max(MIN_SIZE, canvasPatternSize - STEP) })}
                disabled={canvasPatternSize <= MIN_SIZE}
                style={stepBtnStyle}
                title="Уменьшить"
              >−</button>
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={STEP}
                value={canvasPatternSize}
                onChange={(e) => onUpdate({ canvasPatternSize: Number(e.target.value) })}
                style={{ flex: 1, cursor: 'pointer', accentColor: '#0066ff' }}
              />
              <button
                onClick={() => onUpdate({ canvasPatternSize: Math.min(MAX_SIZE, canvasPatternSize + STEP) })}
                disabled={canvasPatternSize >= MAX_SIZE}
                style={stepBtnStyle}
                title="Увеличить"
              >+</button>
              <span style={{ fontSize: 11, color: '#555', minWidth: 26, textAlign: 'right' }}>
                {canvasPatternSize}px
              </span>
            </div>
          </PropertyRow>
        )}
      </CollapsibleSection>
    </div>
  )
}

const stepBtnStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  lineHeight: 1,
  border: '1px solid #e0e0e0',
  borderRadius: 4,
  background: '#fafafa',
  cursor: 'pointer',
  color: '#555',
  flexShrink: 0,
  padding: 0,
}
