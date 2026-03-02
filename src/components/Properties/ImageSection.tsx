import { useRef } from 'react'
import type { CanvasElement, ElementStyles } from '../../types'
import { CollapsibleSection, PropertyRow, SegmentedControl } from './shared'

type Props = {
  element: CanvasElement
  styles: Partial<ElementStyles>
  onUpdateField: (patch: Partial<CanvasElement>) => void
  onUpdateStyle: (patch: Partial<ElementStyles>) => void
}

const OBJECT_FIT_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Fill' },
  { value: 'none', label: 'None' },
]

const POSITION_PRESETS = [
  'center', 'top', 'bottom', 'left', 'right',
  'top left', 'top right', 'bottom left', 'bottom right',
]

export function ImageSection({ element, styles, onUpdateField, onUpdateStyle }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        onUpdateField({ src: dataUrl, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })
      }
      img.onerror = () => {
        onUpdateField({ src: dataUrl })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <CollapsibleSection label="Image" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Preview thumbnail */}
        {element.src && (
          <div style={{
            width: '100%', height: 80, borderRadius: 4, overflow: 'hidden',
            border: '1px solid #e5e5e5', background: '#f5f5f5',
          }}>
            <img
              src={element.src}
              alt={element.alt || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Src URL + Upload */}
        <PropertyRow label="Src">
          <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0 }}>
            <input
              value={element.src || ''}
              onChange={(e) => onUpdateField({ src: e.target.value })}
              placeholder="Image URL"
              style={inputStyle}
            />
            <button
              onClick={() => fileRef.current?.click()}
              title="Upload file"
              style={btnStyle}
            >
              ↑
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </PropertyRow>

        {/* Alt */}
        <PropertyRow label="Alt">
          <input
            value={element.alt || ''}
            onChange={(e) => onUpdateField({ alt: e.target.value })}
            placeholder="Description"
            style={inputStyle}
          />
        </PropertyRow>

        {/* Object Fit */}
        <PropertyRow label="Fit">
          <SegmentedControl
            value={styles.objectFit ?? 'cover'}
            options={OBJECT_FIT_OPTIONS}
            onChange={(v) => onUpdateStyle({ objectFit: v as ElementStyles['objectFit'] })}
          />
        </PropertyRow>

        {/* Object Position */}
        <PropertyRow label="Position">
          <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <select
              value={POSITION_PRESETS.includes(styles.objectPosition ?? 'center') ? (styles.objectPosition ?? 'center') : '__custom'}
              onChange={(e) => {
                if (e.target.value !== '__custom') {
                  onUpdateStyle({ objectPosition: e.target.value })
                }
              }}
              style={{ ...inputStyle, flex: 1 }}
            >
              {POSITION_PRESETS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              {!POSITION_PRESETS.includes(styles.objectPosition ?? 'center') && (
                <option value="__custom">custom</option>
              )}
            </select>
          </div>
        </PropertyRow>
      </div>
    </CollapsibleSection>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '3px 6px', border: '1px solid #e5e5e5', borderRadius: 4,
  fontSize: 12, background: '#fafafa', outline: 'none', width: '100%', minWidth: 0,
  color: '#0a0a0a',
}

const btnStyle: React.CSSProperties = {
  padding: '3px 8px', border: '1px solid #e5e5e5', borderRadius: 4,
  fontSize: 12, background: '#fafafa', cursor: 'default', color: '#525252',
  flexShrink: 0,
}
