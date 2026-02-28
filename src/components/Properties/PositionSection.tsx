import type { ElementStyles, PositionMode } from '../../types'

// Нормализуем legacy значения 'flow'/'pinned' в новые
export function normalizePositionMode(mode: string): PositionMode {
  if (mode === 'flow') return 'static'
  if (mode === 'pinned') return 'absolute'
  return mode as PositionMode
}

const POS_OPTIONS: { value: PositionMode; label: string; title: string }[] = [
  { value: 'static',   label: '–', title: 'Static — стандартный поток' },
  { value: 'relative', label: 'R', title: 'Relative — смещение в потоке' },
  { value: 'absolute', label: 'A', title: 'Absolute — относительно родителя' },
  { value: 'fixed',    label: 'F', title: 'Fixed — относительно viewport' },
  { value: 'sticky',   label: 'S', title: 'Sticky — прилипает при скролле' },
]

type Props = {
  positionMode: string
  styles: Partial<ElementStyles>
  onUpdateMode: (mode: PositionMode) => void
  onUpdateStyle: (patch: Partial<ElementStyles>) => void
}

export function PositionSection({ positionMode, styles, onUpdateMode, onUpdateStyle }: Props) {
  const normalizedMode = normalizePositionMode(positionMode)
  const isOffsetable = normalizedMode !== 'static'

  return (
    <div style={{ padding: '8px 0' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 10 }}>
        Позиция
      </span>

      {/* Position type selector */}
      <div style={{ display: 'flex', gap: 2, marginBottom: isOffsetable ? 10 : 0 }}>
        {POS_OPTIONS.map(opt => {
          const active = normalizedMode === opt.value
          return (
            <button
              key={opt.value}
              title={opt.title}
              onClick={() => onUpdateMode(opt.value)}
              style={{
                flex: 1,
                padding: '5px 0',
                fontSize: 11,
                border: '1px solid',
                borderColor: active ? '#0066ff' : '#e0e0e0',
                borderRadius: 4,
                background: active ? '#e6f0ff' : '#fafafa',
                color: active ? '#0066ff' : '#666',
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Offset box — визуальный виджет как в Webflow */}
      {isOffsetable && (
        <>
          <div style={{ position: 'relative', height: 80, marginBottom: 8 }}>
            {/* Center reference box */}
            <div style={{
              position: 'absolute',
              top: 20, left: 44, right: 44, bottom: 20,
              background: '#f0f4ff',
              border: '1px solid #c8d8ff',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: '#90a8e0',
              letterSpacing: '0.03em',
              userSelect: 'none',
            }}>
              {normalizedMode === 'fixed' ? 'screen' : 'parent'}
            </div>

            {/* Top */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
              <OffsetInput
                value={styles.top}
                onChange={(v) => onUpdateStyle({ top: v })}
                placeholder="T"
              />
            </div>

            {/* Left */}
            <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <OffsetInput
                value={styles.left}
                onChange={(v) => onUpdateStyle({ left: v })}
                placeholder="L"
              />
            </div>

            {/* Right */}
            <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <OffsetInput
                value={styles.right}
                onChange={(v) => onUpdateStyle({ right: v })}
                placeholder="R"
              />
            </div>

            {/* Bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
              <OffsetInput
                value={styles.bottom}
                onChange={(v) => onUpdateStyle({ bottom: v })}
                placeholder="B"
              />
            </div>
          </div>

          {/* Z-index */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#999', width: 56, flexShrink: 0 }}>Z-index</span>
            <input
              type="number"
              value={styles.zIndex ?? ''}
              onChange={(e) => {
                const v = parseInt(e.target.value)
                onUpdateStyle({ zIndex: isNaN(v) ? undefined : v })
              }}
              placeholder="auto"
              style={{
                flex: 1, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4,
                fontSize: 12, background: '#fafafa', outline: 'none', width: '100%', minWidth: 0,
                color: '#1a1a1a',
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ─── OffsetInput ─────────────────────────────────────────────────────────────

function OffsetInput({
  value,
  onChange,
  placeholder,
}: {
  value?: number
  onChange: (v: number | undefined) => void
  placeholder: string
}) {
  const hasValue = value !== undefined

  return (
    <input
      type="number"
      value={hasValue ? value : ''}
      onChange={(e) => {
        const v = parseInt(e.target.value)
        onChange(isNaN(v) ? undefined : v)
      }}
      placeholder={placeholder}
      style={{
        width: 38,
        padding: '3px 4px',
        border: `1px solid ${hasValue ? '#0066ff' : '#e0e0e0'}`,
        borderRadius: 3,
        fontSize: 11,
        textAlign: 'center',
        background: hasValue ? '#e6f0ff' : '#fafafa',
        color: hasValue ? '#0066ff' : '#aaa',
        outline: 'none',
      }}
    />
  )
}
