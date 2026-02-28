import { useEditorStore } from '../../store'

export function Properties() {
  const { selectedElementId, project, activeArtboardId } = useEditorStore()

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null
  const element = artboard && selectedElementId ? artboard.elements[selectedElementId] : null

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
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Имя</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{element.name}</div>
            </div>

            {/* Тип */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Тип</div>
              <div style={{ fontSize: 13 }}>{element.type}</div>
            </div>

            {/* Позиционирование */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Позиция</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['flow', 'pinned'] as const).map((mode) => (
                  <div key={mode} style={{
                    padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                    background: element.positionMode === mode ? '#0066ff' : '#f0f0f0',
                    color: element.positionMode === mode ? '#fff' : '#333',
                  }}>
                    {mode === 'flow' ? 'В потоке' : 'Закреплён'}
                  </div>
                ))}
              </div>
            </div>

            {/* Размеры */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Размеры</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <PropField label="W" value={element.styles.width ?? ''} />
                <PropField label="H" value={element.styles.height ?? ''} />
              </div>
            </div>

            {/* Фон */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Фон</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 4, border: '1px solid #ddd',
                  background: element.styles.backgroundColor ?? 'transparent',
                }} />
                <span style={{ fontSize: 12 }}>{element.styles.backgroundColor ?? '—'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PropField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 11, color: '#888', width: 14 }}>{label}</span>
      <div style={{
        flex: 1, padding: '3px 6px', border: '1px solid #ddd', borderRadius: 4,
        fontSize: 12, background: '#fafafa',
      }}>
        {value || '—'}
      </div>
    </div>
  )
}
