import { useEditorStore } from '../../store'
import type { Artboard } from '../../types'

type Props = { artboard: Artboard }

function LayerItem({ id, artboard, depth }: { id: string; artboard: Artboard; depth: number }) {
  const { selectElement, selectedElementId } = useEditorStore()
  const el = artboard.elements[id]
  if (!el) return null

  const isSelected = selectedElementId === id

  return (
    <div>
      <div
        onClick={() => selectElement(id)}
        style={{
          display: 'flex', alignItems: 'center',
          padding: `4px 8px 4px ${12 + depth * 16}px`,
          cursor: 'pointer', fontSize: 12,
          background: isSelected ? '#e8f0fe' : 'transparent',
          color: isSelected ? '#0066ff' : '#333',
          userSelect: 'none',
        }}
      >
        <span style={{ marginRight: 6, opacity: 0.4, fontSize: 10 }}>{getIcon(el.type)}</span>
        {el.name}
      </div>
      {el.children.map((childId) => (
        <LayerItem key={childId} id={childId} artboard={artboard} depth={depth + 1} />
      ))}
    </div>
  )
}

function getIcon(type: string) {
  switch (type) {
    case 'text': return 'T'
    case 'image': return '⬜'
    case 'section': return '▭'
    case 'button': return '⬡'
    default: return '▢'
  }
}

export function Layers({ artboard }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 12px', fontSize: 11, fontWeight: 600,
        color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '1px solid #e0e0e0',
      }}>
        Слои
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {artboard.rootChildren.length === 0 ? (
          <div style={{ padding: 16, color: '#aaa', fontSize: 12 }}>Нет элементов</div>
        ) : (
          artboard.rootChildren.map((id) => (
            <LayerItem key={id} id={id} artboard={artboard} depth={0} />
          ))
        )}
      </div>
    </div>
  )
}
