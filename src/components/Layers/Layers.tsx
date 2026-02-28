import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import { CONTAINER_TYPES } from '../../store/helpers'
import type { Artboard } from '../../types'
import { findParentId, isDescendantOf, collectDescendantIds } from '../../utils/treeUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { artboard: Artboard }

type DropIndicator = {
  targetId: string
  position: 'above' | 'below' | 'into'
} | null

type LayerItemProps = {
  id: string
  artboard: Artboard
  depth: number
  expandedLayers: Set<string>
  onToggleExpand: (id: string, altKey: boolean) => void
  dropIndicator: DropIndicator
}

// ─── Drop line indicator ──────────────────────────────────────────────────────

function DropLine({ depth }: { depth: number }) {
  return (
    <div
      style={{
        height: 2,
        marginLeft: 8 + depth * 16,
        background: '#0066ff',
        borderRadius: 1,
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Layer item ───────────────────────────────────────────────────────────────

function LayerItem({ id, artboard, depth, expandedLayers, onToggleExpand, dropIndicator }: LayerItemProps) {
  const { selectElement, selectedElementId, selectedElementIds, toggleSelectElement } = useEditorStore()
  const el = artboard.elements[id]

  const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDraggable({ id })
  const { setNodeRef: setDropRef } = useDroppable({ id })

  // Merge refs onto the row element (NOT the outer wrapper, so nested droppables don't overlap)
  const setRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node)
      setDropRef(node)
    },
    [setDragRef, setDropRef],
  )

  if (!el) return null

  const isSelected = selectedElementIds.includes(id) || selectedElementId === id
  const hasChildren = el.children.length > 0
  const isExpanded = expandedLayers.has(id)

  const isDropAbove = dropIndicator?.targetId === id && dropIndicator.position === 'above'
  const isDropBelow = dropIndicator?.targetId === id && dropIndicator.position === 'below'
  const isDropInto = dropIndicator?.targetId === id && dropIndicator.position === 'into'

  return (
    <div style={{ opacity: isDragging ? 0.35 : 1 }}>
      {/* Синяя линия ВЫШЕ */}
      {isDropAbove && <DropLine depth={depth} />}

      {/* Строка слоя — единственная droppable-зона */}
      <div
        ref={setRowRef}
        {...listeners}
        {...attributes}
        onClick={(e) => {
          if (e.shiftKey) toggleSelectElement(id)
          else selectElement(id)
        }}
        style={{
          display: 'flex', alignItems: 'center',
          padding: `4px 8px 4px ${8 + depth * 16}px`,
          cursor: 'grab', fontSize: 12,
          borderRadius: 3,
          background: isDropInto
            ? 'rgba(0,102,255,0.06)'
            : isSelected ? '#e8f0fe' : 'transparent',
          color: isSelected ? '#0066ff' : '#333',
          userSelect: 'none',
          outline: isDropInto ? '1.5px solid rgba(0,102,255,0.35)' : 'none',
          outlineOffset: -1,
        }}
      >
        {/* Шеврон */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggleExpand(id, e.altKey)
          }}
          style={{
            width: 16, height: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 2, flexShrink: 0,
            fontSize: 9,
            color: hasChildren ? '#999' : 'transparent',
            cursor: hasChildren ? 'pointer' : 'default',
            transform: hasChildren && isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          ▶
        </span>

        <span style={{ marginRight: 6, opacity: 0.4, fontSize: 10 }}>{getIcon(el.type)}</span>
        {el.name}
        {el.className && (
          <span style={{ fontSize: 10, color: '#bbb', marginLeft: 4, fontFamily: 'monospace' }}>
            .{el.className}
          </span>
        )}
      </div>

      {/* Синяя линия НИЖЕ */}
      {isDropBelow && <DropLine depth={depth} />}

      {/* Дочерние слои — вне droppable-зоны родителя */}
      {hasChildren && isExpanded &&
        el.children.map((childId) => (
          <LayerItem
            key={childId}
            id={childId}
            artboard={artboard}
            depth={depth + 1}
            expandedLayers={expandedLayers}
            onToggleExpand={onToggleExpand}
            dropIndicator={dropIndicator}
          />
        ))
      }
    </div>
  )
}

// ─── Drag ghost ───────────────────────────────────────────────────────────────

function DragGhost({ id, artboard }: { id: string; artboard: Artboard }) {
  const el = artboard.elements[id]
  if (!el) return null
  return (
    <div style={{
      padding: '4px 12px', fontSize: 12, background: '#fff',
      border: '1px solid #0066ff', borderRadius: 4,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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

// ─── Layers panel ─────────────────────────────────────────────────────────────

export function Layers({ artboard }: Props) {
  const { activeArtboardId, moveElement } = useEditorStore()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null)
  const mouseYRef = useRef(0)
  const expandTimerRef = useRef<{ timer: ReturnType<typeof setTimeout>; targetId: string } | null>(null)

  // Все контейнеры развёрнуты по умолчанию
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(() => {
    const expanded = new Set<string>()
    Object.entries(artboard.elements).forEach(([id, el]) => {
      if (el.children.length > 0) expanded.add(id)
    })
    return expanded
  })

  // Авто-раскрытие новых контейнеров (paste/duplicate добавляют элементы)
  useEffect(() => {
    setExpandedLayers((prev) => {
      let changed = false
      const next = new Set(prev)
      Object.entries(artboard.elements).forEach(([id, el]) => {
        if (el.children.length > 0 && !next.has(id)) {
          next.add(id)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [artboard.elements])

  const toggleExpand = (id: string, altKey: boolean) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev)
      if (altKey) {
        const ids = [...collectDescendantIds(artboard.elements, id)]
        const isCurrentlyExpanded = prev.has(id)
        ids.forEach((descId) => {
          if (isCurrentlyExpanded) next.delete(descId)
          else next.add(descId)
        })
      } else {
        if (next.has(id)) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  const collapseAll = () => setExpandedLayers(new Set())

  // Отслеживать Y курсора глобально для вычисления above/into/below
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseYRef.current = e.clientY }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const clearExpandTimer = () => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current.timer)
      expandTimerRef.current = null
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id))
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const { over, active } = event
    if (!over) {
      setDropIndicator(null)
      clearExpandTimer()
      return
    }

    const targetId = String(over.id)
    const activeDragId = String(active.id)

    // Нельзя дропнуть на себя или собственного потомка
    if (targetId === activeDragId || isDescendantOf(artboard.elements, targetId, activeDragId)) {
      setDropIndicator(null)
      clearExpandTimer()
      return
    }

    // Позиция курсора относительно строки (0..1)
    const rect = over.rect
    const relY = mouseYRef.current - rect.top
    const fraction = Math.min(1, Math.max(0, relY / rect.height))

    const targetEl = artboard.elements[targetId]
    const isContainer = targetEl != null && CONTAINER_TYPES.includes(targetEl.type)

    let position: 'above' | 'below' | 'into'
    if (fraction < 0.3) {
      position = 'above'
    } else if (fraction > 0.7) {
      position = 'below'
    } else {
      position = isContainer ? 'into' : (fraction < 0.5 ? 'above' : 'below')
    }

    setDropIndicator({ targetId, position })

    // Авто-раскрытие свёрнутого контейнера через 600мс
    if (position === 'into' && isContainer && !expandedLayers.has(targetId)) {
      if (expandTimerRef.current?.targetId !== targetId) {
        clearExpandTimer()
        const timer = setTimeout(() => {
          setExpandedLayers((prev) => new Set([...prev, targetId]))
        }, 600)
        expandTimerRef.current = { timer, targetId }
      }
    } else {
      clearExpandTimer()
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedId = String(event.active.id)
    const indicator = dropIndicator

    setDraggingId(null)
    setDropIndicator(null)
    clearExpandTimer()

    if (!indicator || !activeArtboardId) return
    const { targetId, position } = indicator

    if (targetId === draggedId) return
    if (isDescendantOf(artboard.elements, targetId, draggedId)) return

    if (position === 'into') {
      // Вставить как последнего ребёнка контейнера
      const target = artboard.elements[targetId]
      moveElement(activeArtboardId, draggedId, targetId, target?.children.length ?? 0)
    } else {
      // Найти родителя targetId и вставить до/после него
      const parentId = findParentId(artboard, targetId)
      const siblings = parentId
        ? (artboard.elements[parentId]?.children ?? [])
        : artboard.rootChildren
      const idx = siblings.indexOf(targetId)
      if (idx === -1) return

      moveElement(
        activeArtboardId,
        draggedId,
        parentId,
        position === 'above' ? idx : idx + 1,
      )
    }
  }

  const handleDragCancel = () => {
    setDraggingId(null)
    setDropIndicator(null)
    clearExpandTimer()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 12px', fontSize: 11, fontWeight: 600,
        color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Слои</span>
        {expandedLayers.size > 0 && (
          <button
            onClick={collapseAll}
            title="Свернуть все слои"
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: '#aaa', fontSize: 10, padding: '0 2px', lineHeight: 1,
            }}
          >
            ⊟
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {artboard.rootChildren.length === 0 ? (
          <div style={{ padding: 16, color: '#aaa', fontSize: 12 }}>Нет элементов</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {artboard.rootChildren.map((id) => (
              <LayerItem
                key={id}
                id={id}
                artboard={artboard}
                depth={0}
                expandedLayers={expandedLayers}
                onToggleExpand={toggleExpand}
                dropIndicator={dropIndicator}
              />
            ))}
            <DragOverlay>
              {draggingId ? <DragGhost id={draggingId} artboard={artboard} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}
