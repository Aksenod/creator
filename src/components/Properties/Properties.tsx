import { useState } from 'react'
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

  const display = element?.styles.display ?? 'block'

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

            {/* Имя + Класс */}
            <CollapsibleSection label="Слой" defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label="Имя">
                  <input
                    value={element.name}
                    onChange={(e) => updateField({ name: e.target.value })}
                    style={inputStyle}
                  />
                </Row>
                <Row label="Класс">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <span style={{ color: '#aaa', fontSize: 11 }}>.</span>
                    <input
                      value={element.className ?? ''}
                      onChange={(e) => updateField({ className: e.target.value })}
                      placeholder="auto"
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                    />
                  </div>
                </Row>
                <Row label="Позиция">
                  <SegmentedControl
                    value={element.positionMode}
                    options={[
                      { value: 'flow', label: 'В потоке' },
                      { value: 'pinned', label: 'Закреплён' },
                    ]}
                    onChange={(v) => updateField({ positionMode: v as 'flow' | 'pinned' })}
                  />
                </Row>
              </div>
            </CollapsibleSection>

            <Divider />

            {/* Layout */}
            <CollapsibleSection label="Layout" defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label="Display">
                  <SegmentedControl
                    value={display}
                    options={[
                      { value: 'block', label: 'Block' },
                      { value: 'flex', label: 'Flex' },
                      { value: 'grid', label: 'Grid' },
                      { value: 'none', label: 'None' },
                    ]}
                    onChange={(v) => updateStyle({ display: v as ElementStyles['display'] })}
                  />
                </Row>

                {/* Flex-контролы */}
                {display === 'flex' && (
                  <>
                    <Row label="Direction">
                      <SegmentedControl
                        value={element.styles.flexDirection ?? 'row'}
                        options={[
                          { value: 'row', label: '→' },
                          { value: 'column', label: '↓' },
                          { value: 'row-reverse', label: '←' },
                          { value: 'column-reverse', label: '↑' },
                        ]}
                        onChange={(v) => updateStyle({ flexDirection: v as ElementStyles['flexDirection'] })}
                      />
                    </Row>
                    <Row label="Justify">
                      <select
                        value={element.styles.justifyContent ?? ''}
                        onChange={(e) => updateStyle({ justifyContent: e.target.value as ElementStyles['justifyContent'] })}
                        style={selectStyle}
                      >
                        <option value="">—</option>
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                        <option value="space-between">Space Between</option>
                        <option value="space-around">Space Around</option>
                      </select>
                    </Row>
                    <Row label="Align">
                      <select
                        value={element.styles.alignItems ?? ''}
                        onChange={(e) => updateStyle({ alignItems: e.target.value as ElementStyles['alignItems'] })}
                        style={selectStyle}
                      >
                        <option value="">—</option>
                        <option value="flex-start">Start</option>
                        <option value="center">Center</option>
                        <option value="flex-end">End</option>
                        <option value="stretch">Stretch</option>
                      </select>
                    </Row>
                    <Row label="Gap">
                      <input
                        type="number"
                        value={element.styles.gap ?? ''}
                        onChange={(e) => updateStyle({ gap: e.target.value ? Number(e.target.value) : undefined })}
                        style={inputStyle}
                      />
                    </Row>
                  </>
                )}

                {/* Grid-контролы */}
                {display === 'grid' && (
                  <Row label="Columns">
                    <input
                      value={element.styles.gridTemplateColumns ?? ''}
                      onChange={(e) => updateStyle({ gridTemplateColumns: e.target.value })}
                      placeholder="1fr 1fr"
                      style={inputStyle}
                    />
                  </Row>
                )}
              </div>
            </CollapsibleSection>

            <Divider />

            {/* Размеры */}
            <CollapsibleSection label="Размеры" defaultOpen>
              <div style={{ display: 'flex', gap: 8 }}>
                <NumField label="W" value={element.styles.width ?? ''} onChange={(v) => updateStyle({ width: v })} />
                <NumField label="H" value={element.styles.height ?? ''} onChange={(v) => updateStyle({ height: v })} />
              </div>
            </CollapsibleSection>

            <Divider />

            {/* Заливка */}
            <CollapsibleSection label="Заливка" defaultOpen>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={element.styles.backgroundColor ?? '#ffffff'}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  style={{ width: 28, height: 28, padding: 2, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                />
                <input
                  value={element.styles.backgroundColor ?? ''}
                  onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                  placeholder="—"
                  style={inputStyle}
                />
              </div>
            </CollapsibleSection>

            {/* Текст */}
            {(element.type === 'text' || element.type === 'button') && (
              <>
                <Divider />
                <CollapsibleSection label="Текст" defaultOpen>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <NumField label="Цвет" value={element.styles.color ?? ''} onChange={(v) => updateStyle({ color: v })} />
                      <NumField label="px" value={element.styles.fontSize !== undefined ? String(element.styles.fontSize) : ''} onChange={(v) => updateStyle({ fontSize: v ? Number(v) : undefined })} />
                    </div>
                    <Row label="Жирность">
                      <select
                        value={element.styles.fontWeight ?? ''}
                        onChange={(e) => updateStyle({ fontWeight: e.target.value })}
                        style={selectStyle}
                      >
                        <option value="">—</option>
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">SemiBold</option>
                        <option value="700">Bold</option>
                      </select>
                    </Row>
                  </div>
                </CollapsibleSection>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ─── Базовые стили ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4,
  fontSize: 12, background: '#fafafa', outline: 'none', width: '100%',
  color: '#1a1a1a',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'auto',
}

// ─── Компоненты ────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />
}

function CollapsibleSection({ label, children, defaultOpen = true }: {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ padding: '8px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 0, border: 'none', background: 'none',
          cursor: 'pointer', marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{label}</span>
        <span style={{
          fontSize: 9, color: '#aaa',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.15s',
          display: 'inline-block',
        }}>▼</span>
      </button>
      {open && children}
    </div>
  )
}

function SegmentedControl({ value, options, onChange }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{
      display: 'flex', background: '#efefef', borderRadius: 6,
      padding: 2, gap: 1, flex: 1,
    }}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: '3px 4px', fontSize: 11, border: 'none',
              borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s',
              background: active ? '#1a1a1a' : 'transparent',
              color: active ? '#fff' : '#888',
              fontWeight: active ? 500 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#999', width: 56, flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  )
}

function NumField({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}
