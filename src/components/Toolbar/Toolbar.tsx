import { useEditorStore } from '../../store'
import type { ElementType } from '../../types'

const ELEMENTS: { type: ElementType; label: string }[] = [
  { type: 'div', label: 'Div' },
  { type: 'section', label: 'Section' },
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'button', label: 'Button' },
]

export function Toolbar() {
  const { project, activeArtboardId, selectedElementId, addElement } = useEditorStore()

  const handleAdd = (type: ElementType) => {
    if (!project || !activeArtboardId) return
    const artboard = project.artboards[activeArtboardId]
    const parentId = selectedElementId && artboard.elements[selectedElementId]
      ? selectedElementId
      : null
    addElement(activeArtboardId, type, parentId)
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {ELEMENTS.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => handleAdd(type)}
          style={{
            padding: '5px 10px', border: '1px solid #ddd', borderRadius: 4,
            cursor: 'pointer', background: '#fff', fontSize: 12,
          }}
        >
          + {label}
        </button>
      ))}
    </div>
  )
}
