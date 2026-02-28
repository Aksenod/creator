import { useEditorStore } from '../../store'

export function BirdsEye() {
  const { project, enterArtboard, addArtboard } = useEditorStore()
  if (!project) return null

  return (
    <div style={{ width: '100%', height: '100%', background: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>
      {/* Временная шапка */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 48, background: '#fff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        gap: 16, zIndex: 10,
      }}>
        <span style={{ fontWeight: 600 }}>{project.name}</span>
        <button
          onClick={() => addArtboard('Page ' + (project.artboardOrder.length + 1))}
          style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
        >
          + Артборд
        </button>
      </div>

      {/* Артборды */}
      <div style={{ paddingTop: 48, padding: '80px 60px', display: 'flex', gap: 60, flexWrap: 'wrap' }}>
        {project.artboardOrder.map((id) => {
          const artboard = project.artboards[id]
          return (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div
                onDoubleClick={() => enterArtboard(id)}
                style={{
                  width: 288, height: 180,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#aaa', fontSize: 12,
                }}
              >
                {artboard.rootChildren.length === 0 ? 'Пусто' : `${artboard.rootChildren.length} элементов`}
              </div>
              <span style={{ fontSize: 12, color: '#555' }}>{artboard.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
