import { useEditorStore } from '../../store'
import type { ElementType, CanvasElement } from '../../types'
import { slugify } from '../../utils/slugify'

const ELEMENTS: { type: ElementType; label: string }[] = [
  { type: 'div', label: 'Div' },
  { type: 'section', label: 'Section' },
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'button', label: 'Button' },
]

const generateId = () => Math.random().toString(36).slice(2, 10)

export function Toolbar() {
  const { project, activeArtboardId, selectedElementId } = useEditorStore()

  const addElement = (type: ElementType) => {
    if (!project || !activeArtboardId) return

    const artboard = project.artboards[activeArtboardId]
    const id = generateId()

    const defaults: Record<ElementType, Partial<CanvasElement['styles']>> = {
      div: { width: '100%', height: '100px', display: 'flex', backgroundColor: '#f9f9f9' },
      section: { width: '100%', height: '200px', display: 'flex', backgroundColor: '#ffffff' },
      text: { width: 'auto', height: 'auto', fontSize: 16, color: '#1a1a1a' },
      image: { width: '200px', height: '150px', backgroundColor: '#e0e0e0' },
      button: { width: 'auto', height: 'auto', backgroundColor: '#0066ff' },
      input: { width: '200px', height: '40px', backgroundColor: '#fff' },
    }

    const name = `${type} ${Object.keys(artboard.elements).length + 1}`
    const newElement: CanvasElement = {
      id,
      name,
      className: slugify(name),
      type,
      positionMode: 'flow',
      styles: defaults[type],
      children: [],
      content: type === 'text' ? 'Текст' : type === 'button' ? 'Кнопка' : undefined,
    }

    // Добавить в выбранный элемент или в корень
    const parentId = selectedElementId && artboard.elements[selectedElementId]
      ? selectedElementId
      : null

    useEditorStore.setState((state) => {
      if (!state.project) return state
      const ab = state.project.artboards[activeArtboardId]
      const updatedElements = { ...ab.elements, [id]: newElement }

      let updatedRootChildren = ab.rootChildren
      let updatedParent = parentId ? ab.elements[parentId] : null

      if (parentId && updatedParent) {
        updatedParent = { ...updatedParent, children: [...updatedParent.children, id] }
        updatedElements[parentId] = updatedParent
      } else {
        updatedRootChildren = [...ab.rootChildren, id]
      }

      return {
        project: {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [activeArtboardId]: {
              ...ab,
              elements: updatedElements,
              rootChildren: updatedRootChildren,
            },
          },
        },
      }
    })
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {ELEMENTS.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => addElement(type)}
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
