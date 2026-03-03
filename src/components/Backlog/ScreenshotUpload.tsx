import { useRef } from 'react'
import { colors } from '../../styles/tokens'

type Props = {
  screenshots: string[]
  onChange: (screenshots: string[]) => void
}

export function ScreenshotUpload({ screenshots, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const name = `${Date.now()}-${file.name}`
    try {
      const res = await fetch(`/api/backlog/screenshot?name=${encodeURIComponent(name)}`, {
        method: 'POST',
        body: file,
      })
      const data = await res.json()
      if (data.path) {
        onChange([...screenshots, data.path])
      }
    } catch { /* ignore */ }

    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (index: number) => {
    onChange(screenshots.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {screenshots.map((path, i) => {
        const fileName = path.split('/').pop() || ''
        return (
          <div key={i} style={{ position: 'relative', width: 64, height: 48 }}>
            <img
              src={`/api/backlog/screenshot/${fileName}`}
              alt=""
              style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 4, border: `1px solid ${colors.border}` }}
            />
            <button
              onClick={() => handleRemove(i)}
              style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: 8,
                background: colors.accentRed, color: colors.bg,
                border: 'none', fontSize: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>
        )
      })}
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          width: 64, height: 48, borderRadius: 4,
          border: `2px dashed ${colors.borderStrong}`, background: 'transparent',
          cursor: 'pointer', fontSize: 20, color: colors.textMuted,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        +
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}
