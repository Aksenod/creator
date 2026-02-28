import { useEditorStore } from '../../store'
import type { ElementStyles } from '../../types'

export function Properties() {
  const { selectedElementId, project, activeArtboardId, updateElement } = useEditorStore()

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null
  const element = artboard && selectedElementId ? artboard.elements[selectedElementId] : null

  const updateStyle = (patch: Partial<ElementStyles>) => {
    if (!activeArtboardId || !selectedElementId) return
    updateElement(activeArtboardId, selectedElementId, { styles: patch })
  }

  const updateField = (patch: Parameters<typeof updateElement>[2]) => {
    if (!activeArtboardId || !selectedElementId) return
    updateElement(activeArtboardId, selectedElementId, patch)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 12px', fontSize: 11, fontWeight: 600,
        color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '1px solid #e0e0e0',
      }}>
        Свойства
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {!element ? (
          <div style={{ color: '#aaa', fontSize: 12 }}>Выбери элемент</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Имя */}
            <Section label="Имя">
              <input
                value={element.name}
                onChange={(e) => updateField({ name: e.target.value })}
                style={inputStyle}
              />
            </Section>

            {/* Класс */}
            <Section label="Класс CSS">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#888', fontSize: 11 }}>.</span>
                <input
                  value={element.className ?? ''}
                  onChange={(e) => updateField({ className: e.target.value })}
                  placeholder="auto"
                  style={{ ...inputStyle, fontFamily: 'monospace', flex: 1 }}
                />
              </div>
            </Section>

            {/* Тип */}
            <Section label="Тип">
              <div style={{ fontSize: 12, color: '#555', padding: '3px 0' }}>{element.type}</div>
            </Section>

            {/* Позиция */}
            <Section label="Позиция">
              <div style={{ display: 'flex', gap: 4 }}>
                {(['flow', 'pinned'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateField({ positionMode: mode })}
                    style={{
                      padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                      border: 'none',
                      background: element.positionMode === mode ? '#0066ff' : '#f0f0f0',
                      color: element.positionMode === mode ? '#fff' : '#333',
                    }}
                  >
                    {mode === 'flow' ? 'В потоке' : 'Закреплён'}
                  </button>
                ))}
              </div>
            </Section>

            {/* Размеры */}
            <Section label="Размеры">
              <div style={{ display: 'flex', gap: 8 }}>
                <EditableField
                  label="W"
                  value={element.styles.width ?? ''}
                  onChange={(v) => updateStyle({ width: v })}
                />
                <EditableField
                  label="H"
                  value={element.styles.height ?? ''}
                  onChange={(v) => updateStyle({ height: v })}
                />
              </div>
            </Section>

            {/* Фон */}
            <Section label="Фон">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={element.styles.backgroundColor ?? '#ffffff'}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  style={{ width: 28, height: 28, padding: 2, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                />
                <input
                  value={element.styles.backgroundColor ?? ''}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  placeholder="—"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </Section>

            {/* Текст */}
            {(element.type === 'text' || element.type === 'button') && (
              <Section label="Текст">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <EditableField
                      label="Цвет"
                      value={element.styles.color ?? ''}
                      onChange={(v) => updateStyle({ color: v })}
                    />
                    <EditableField
                      label="px"
                      value={element.styles.fontSize !== undefined ? String(element.styles.fontSize) : ''}
                      onChange={(v) => updateStyle({ fontSize: v ? Number(v) : undefined })}
                      type="number"
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>Жирность</span>
                    <select
                      value={element.styles.fontWeight ?? ''}
                      onChange={(e) => updateStyle({ fontWeight: e.target.value })}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="">—</option>
                      <option value="300">Light</option>
                      <option value="400">Regular</option>
                      <option value="500">Medium</option>
                      <option value="600">SemiBold</option>
                      <option value="700">Bold</option>
                    </select>
                  </div>
                </div>
              </Section>
            )}

            {/* Flex */}
            {element.styles.display === 'flex' && (
              <Section label="Flex">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', width: 60 }}>Direction</span>
                    <select
                      value={element.styles.flexDirection ?? ''}
                      onChange={(e) => updateStyle({ flexDirection: e.target.value as ElementStyles['flexDirection'] })}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="">—</option>
                      <option value="row">row</option>
                      <option value="column">column</option>
                      <option value="row-reverse">row-reverse</option>
                      <option value="column-reverse">column-reverse</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', width: 60 }}>Justify</span>
                    <select
                      value={element.styles.justifyContent ?? ''}
                      onChange={(e) => updateStyle({ justifyContent: e.target.value as ElementStyles['justifyContent'] })}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="">—</option>
                      <option value="flex-start">flex-start</option>
                      <option value="center">center</option>
                      <option value="flex-end">flex-end</option>
                      <option value="space-between">space-between</option>
                      <option value="space-around">space-around</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', width: 60 }}>Align</span>
                    <select
                      value={element.styles.alignItems ?? ''}
                      onChange={(e) => updateStyle({ alignItems: e.target.value as ElementStyles['alignItems'] })}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option value="">—</option>
                      <option value="flex-start">flex-start</option>
                      <option value="center">center</option>
                      <option value="flex-end">flex-end</option>
                      <option value="stretch">stretch</option>
                    </select>
                  </div>
                  <EditableField
                    label="Gap"
                    value={element.styles.gap !== undefined ? String(element.styles.gap) : ''}
                    onChange={(v) => updateStyle({ gap: v ? Number(v) : undefined })}
                    type="number"
                  />
                </div>
              </Section>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '3px 6px', border: '1px solid #ddd', borderRadius: 4,
  fontSize: 12, background: '#fafafa', outline: 'none', width: '100%',
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function EditableField({
  label, value, onChange, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'number'
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 11, color: '#888', width: 14, flexShrink: 0 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle }}
      />
    </div>
  )
}
