import { PropertyRow } from './PropertyRow'
import { CompactInput } from './CompactInput'

type Props = {
  value: number | undefined
  onChange: (opacity: number) => void
}

export function OpacityRow({ value, onChange }: Props) {
  const pct = Math.round((value ?? 1) * 100)

  return (
    <PropertyRow label="Opacity">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        <input
          type="range"
          min={0} max={100} step={1}
          value={pct}
          onChange={e => onChange(Number(e.target.value) / 100)}
          style={{ flex: 1, minWidth: 0, height: 4 }}
        />
        <CompactInput
          value={pct}
          onChange={e => {
            const v = Math.max(0, Math.min(100, Number(e.target.value)))
            onChange(v / 100)
          }}
          min={0} max={100} step={1}
          suffix="%"
          style={{ width: 52, flex: 'none' }}
        />
      </div>
    </PropertyRow>
  )
}
