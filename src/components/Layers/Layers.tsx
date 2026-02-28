import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { useEditorStore } from '../../store'
import type { Artboard } from '../../types'

type Props = { artboard: Artboard }

function SortableLayerItem({ id, artboard, depth }: { id: string; artboard: Artboard; depth: number }) {
  const { selectElement, selectedElementId } = useEditorStore()
  const el = artboard.elements[id]

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  if (!el) return null

  const isSelected = selectedElementId === id

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
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
        {/* Хэндл для drag */}
        <span
          {...listeners}
          style={{
            marginRight: 4, opacity: 0.3, fontSize: 10,
            cursor: 'grab', padding: '0 2px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </span>
        <span style={{ marginRight: 6, opacity: 0.4, fontSize: 10 }}>{getIcon(el.type)}</span>
        {el.name}
        {el.className && (
          <span style={{ fontSize: 10, color: '#bbb', marginLeft: 4, fontFamily: 'monospace' }}>
            .{el.className}
          </span>
        )}
      </div>
      {el.children.length > 0 && (
        <SortableContext items={el.children} strategy={verticalListSortingStrategy}>
          {el.children.map((childId) => (
            <SortableLayerItem key={childId} id={childId} artboard={artboard} depth={depth + 1} />
          ))}
        </SortableContext>
      )}
    </div>
  )
}

function DragGhost({ id, artboard }: { id: string; artboard: Artboard }) {
  const el = artboard.elements[id]
  if (!el) return null
  return (
    <div style={{
      padding: '4px 12px', fontSize: 12, background: '#fff',
      border: '1px solid #0066ff', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none',
    }}>
      <span style={{ opacity: 0.5, fontSize: 10 }}>{getIcon(el.type)}</span>
      {el.name}
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
  const { activeArtboardId, moveElement } = useEditorStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id || !activeArtboardId) return

    const draggedId = String(active.id)
    const overId = String(over.id)

    // Определить новый родитель и индекс
    // Проверяем — dropped на корневой элемент
    const newRootIndex = artboard.rootChildren.indexOf(overId)
    if (newRootIndex !== -1) {
      // Перетащили в корень
      moveElement(activeArtboardId, draggedId, null, newRootIndex)
    } else {
      // Ищем внутри дочерних элементов
      for (const [parentId, el] of Object.entries(artboard.elements)) {
        const idx = el.children.indexOf(overId)
        if (idx !== -1) {
          moveElement(activeArtboardId, draggedId, parentId, idx)
          return
        }
      }
    }
  }

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
          <DndContext
            sensors={sensors}
            onDragStart={(e) => setActiveId(String(e.active.id))}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={artboard.rootChildren} strategy={verticalListSortingStrategy}>
              {artboard.rootChildren.map((id) => (
                <SortableLayerItem key={id} id={id} artboard={artboard} depth={0} />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeId ? <DragGhost id={activeId} artboard={artboard} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}
