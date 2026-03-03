import { Toolbar } from '../Toolbar/Toolbar'
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
import {
  Eye,
  EyeSlash,
  CaretRight,
  Image,
  TextT,
  Rectangle,
  HandTap,
  Textbox,
  FrameCorners,
  ArrowsInSimple,
} from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import { CONTAINER_TYPES, isContainerType } from '../../store/helpers'
import type { Artboard } from '../../types'
import { findParentId, isDescendantOf, collectDescendantIds, getVisibleLayerIds } from '../../utils/treeUtils'
import { colors, shadows } from '../../styles/tokens'

// ─── Eye Icon ─────────────────────────────────────────────────────────────────

function EyeIcon({ hidden, size = 14 }: { hidden?: boolean; size?: number }) {
  if (hidden) return <EyeSlash size={size} weight="thin" />
  return <Eye size={size} weight="thin" />
}

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
  renamingId: string | null
  onStartRename: (id: string) => void
  onFinishRename: (id: string, newName: string) => void
  onCancelRename: () => void
  onTabRename: (id: string, direction: 'next' | 'prev') => void
}

// ─── Drop line indicator ──────────────────────────────────────────────────────

function DropLine({ depth }: { depth: number }) {
  return (
    <div
      style={{
        height: 2,
        marginLeft: 8 + depth * 16,
        background: colors.text,
        borderRadius: 1,
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Layer item ───────────────────────────────────────────────────────────────

function LayerItem({ id, artboard, depth, expandedLayers, onToggleExpand, dropIndicator, renamingId, onStartRename, onFinishRename, onCancelRename, onTabRename }: LayerItemProps) {
  const { selectElement, selectedElementId, selectedElementIds, toggleSelectElement, activeArtboardId, toggleElementVisibility } = useEditorStore()
  const el = artboard.elements[id]
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [localName, setLocalName] = useState('')
  const isRenaming = renamingId === id
  const commitRef = useRef(false)

  const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDraggable({ id, disabled: el?.type === 'body' || isRenaming })
  const { setNodeRef: setDropRef } = useDroppable({ id })

  const setRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node)
      setDropRef(node)
    },
    [setDragRef, setDropRef],
  )

  useEffect(() => {
    if (isRenaming && el) {
      setLocalName(el.name)
      commitRef.current = false
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isRenaming]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!el) return null

  const isSelected = selectedElementIds.includes(id) || selectedElementId === id
  const hasChildren = el.children.length > 0
  const isBody = el.type === 'body'
  const isExpanded = isBody || expandedLayers.has(id)
  const isHidden = !!el.hidden

  const isDropAbove = dropIndicator?.targetId === id && dropIndicator.position === 'above'
  const isDropBelow = dropIndicator?.targetId === id && dropIndicator.position === 'below'
  const isDropInto = dropIndicator?.targetId === id && dropIndicator.position === 'into'

  const showEyeIcon = isHidden || isHovered

  const commitRename = () => {
    if (commitRef.current) return
    commitRef.current = true
    const trimmed = localName.trim()
    if (trimmed && trimmed !== el.name) {
      onFinishRename(id, trimmed)
    } else {
      onCancelRename()
    }
  }

  return (
    <div style={{ opacity: isDragging ? 0.35 : 1 }} data-layer-id={id}>
      {isDropAbove && <DropLine depth={depth} />}

      <div
        ref={setRowRef}
        {...(isRenaming ? {} : listeners)}
        {...(isRenaming ? {} : attributes)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          if (isRenaming) return
          if (e.shiftKey) toggleSelectElement(id)
          else selectElement(id)
        }}
        style={{
          display: 'flex', alignItems: 'center',
          padding: `4px 8px 4px ${8 + depth * 16}px`,
          cursor: 'default', fontSize: 12,
          borderRadius: 3,
          background: isDropInto
            ? 'rgba(10,10,10,0.04)'
            : isSelected ? colors.bgSurface : 'transparent',
          color: isSelected ? colors.text : el.type === 'body' ? colors.textSecondary : colors.text,
          userSelect: 'none',
          outline: isDropInto ? '1.5px solid rgba(10,10,10,0.2)' : 'none',
          outlineOffset: -1,
          opacity: isHidden ? 0.4 : 1,
        }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren && !isBody) onToggleExpand(id, e.altKey)
          }}
          title={hasChildren && !isBody ? (isExpanded ? 'Collapse (Alt+click = recursive)' : 'Expand (Alt+click = recursive)') : undefined}
          style={{
            width: 16, height: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 2, flexShrink: 0,
            fontSize: 9,
            color: hasChildren && !isBody ? colors.textMuted : 'transparent',
            cursor: hasChildren && !isBody ? 'pointer' : 'default',
            transform: hasChildren && isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          <CaretRight size={10} weight="thin" style={{ pointerEvents: 'none' }} />
        </span>

        <span style={{ marginRight: 6, opacity: 0.4, display: 'inline-flex' }}>{getIcon(el.type)}</span>

        {isRenaming ? (
          <input
            ref={inputRef}
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitRename()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                commitRef.current = true
                onCancelRename()
              } else if (e.key === 'Tab') {
                e.preventDefault()
                const trimmed = localName.trim()
                if (trimmed && trimmed !== el.name) {
                  onFinishRename(id, trimmed)
                }
                onTabRename(id, e.shiftKey ? 'prev' : 'next')
              }
            }}
            onBlur={commitRename}
            style={{
              flex: 1, minWidth: 0,
              fontSize: 12, fontFamily: 'inherit',
              border: `1px solid ${colors.borderFocus}`,
              borderRadius: 2, padding: '0 3px',
              outline: 'none', background: colors.bg,
              color: colors.text,
            }}
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation()
              if (el.type !== 'body') onStartRename(id)
            }}
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {el.name}
          </span>
        )}

        {!isRenaming && el.className && (
          <span style={{ fontSize: 10, color: colors.textDisabled, marginLeft: 4, fontFamily: 'monospace' }}>
            .{el.className}
          </span>
        )}

        {/* Eye toggle — видимость слоя (всегда в DOM, чтобы не дёргался layout) */}
        {!isBody && (
          <span
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (activeArtboardId) toggleElementVisibility(activeArtboardId, id)
            }}
            title={isHidden ? 'Show element' : 'Hide element'}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20,
              flexShrink: 0,
              cursor: 'pointer',
              color: isHidden ? colors.textMuted : colors.textMuted,
              borderRadius: 3,
              opacity: showEyeIcon ? 1 : 0,
              transition: 'opacity 0.1s',
            }}
          >
            <EyeIcon hidden={isHidden} size={14} />
          </span>
        )}
      </div>

      {isDropBelow && <DropLine depth={depth} />}

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
            renamingId={renamingId}
            onStartRename={onStartRename}
            onFinishRename={onFinishRename}
            onCancelRename={onCancelRename}
            onTabRename={onTabRename}
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
      padding: '4px 12px', fontSize: 12, background: colors.bg,
      border: `1px solid ${colors.borderFocus}`, borderRadius: 4,
      boxShadow: shadows.sm,
      display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none',
    }}>
      <span style={{ opacity: 0.5, display: 'inline-flex' }}>{getIcon(el.type)}</span>
      {el.name}
    </div>
  )
}

function getIcon(type: string): React.ReactNode {
  switch (type) {
    case 'body': return <FrameCorners size={12} weight="thin" />
    case 'text': return <TextT size={12} weight="thin" />
    case 'image': return <Image size={12} weight="thin" />
    case 'section': return <Rectangle size={12} weight="thin" />
    case 'button': return <HandTap size={12} weight="thin" />
    case 'input': return <Textbox size={12} weight="thin" />
    default: return <FrameCorners size={12} weight="thin" />
  }
}

// ─── Layers panel ─────────────────────────────────────────────────────────────

export function Layers({ artboard }: Props) {
  const {
    activeArtboardId, moveElement, selectedElementId, updateElement,
    expandedLayers, expandLayers, collapseLayers,
  } = useEditorStore()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const mouseYRef = useRef(0)
  const expandTimerRef = useRef<{ timer: ReturnType<typeof setTimeout>; targetId: string } | null>(null)
  const layersScrollRef = useRef<HTMLDivElement>(null)

  // Авто-раскрытие только НОВЫХ контейнеров (paste/duplicate добавляют элементы)
  // Не переоткрывать вручную свёрнутые при любом изменении elements
  const prevElementIdsRef = useRef<Set<string>>(new Set(Object.keys(artboard.elements)))
  useEffect(() => {
    const currentIds = new Set(Object.keys(artboard.elements))
    const prevIds = prevElementIdsRef.current
    const toExpand: string[] = []
    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        const el = artboard.elements[id]
        if (el && el.children.length > 0) toExpand.push(id)
      }
    }
    prevElementIdsRef.current = currentIds
    if (toExpand.length > 0) expandLayers(toExpand)
  }, [artboard.elements]) // eslint-disable-line react-hooks/exhaustive-deps

  // Авто-раскрытие родительской цепочки + scroll-into-view при выборе элемента
  useEffect(() => {
    if (!selectedElementId) return
    // Раскрываем все свёрнутые родители, чтобы элемент стал видимым в дереве
    const toExpand: string[] = []
    let current = selectedElementId
    while (true) {
      const parentId = findParentId(artboard, current)
      if (!parentId) break
      if (!expandedLayers.has(parentId)) toExpand.push(parentId)
      current = parentId
    }
    if (toExpand.length > 0) expandLayers(toExpand)
    // Scroll-into-view (setTimeout чтобы DOM успел обновиться после expand)
    setTimeout(() => {
      if (!layersScrollRef.current) return
      const el = layersScrollRef.current.querySelector(`[data-layer-id="${selectedElementId}"]`)
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 0)
  }, [selectedElementId]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpand = (id: string, altKey: boolean) => {
    if (altKey) {
      const ids = [...collectDescendantIds(artboard.elements, id)]
      const isCurrentlyExpanded = expandedLayers.has(id)
      if (isCurrentlyExpanded) collapseLayers(ids)
      else expandLayers(ids)
    } else {
      if (expandedLayers.has(id)) collapseLayers([id])
      else expandLayers([id])
    }
  }

  const collapseAll = () => {
    const bodyIds = Object.entries(artboard.elements)
      .filter(([, el]) => el.type === 'body')
      .map(([id]) => id)
    const toCollapse = [...expandedLayers].filter(id => !bodyIds.includes(id))
    collapseLayers(toCollapse)
  }

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
    const isContainer = targetEl != null && CONTAINER_TYPES.includes(targetEl.type as typeof CONTAINER_TYPES[number])
    const isRootLevel = artboard.rootChildren.includes(targetId)

    let position: 'above' | 'below' | 'into'
    if (isRootLevel) {
      // Корневые элементы (Body) — только "into", нельзя ставить рядом
      position = 'into'
    } else if (fraction < 0.3) {
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
          expandLayers([targetId])
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
      // Guard: нельзя вложить в не-контейнер
      const target = artboard.elements[targetId]
      if (!target || !isContainerType(target.type)) return
      moveElement(activeArtboardId, draggedId, targetId, target.children.length)
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

  const handleStartRename = (id: string) => {
    setRenamingId(id)
  }

  const handleFinishRename = (id: string, newName: string) => {
    if (activeArtboardId) {
      updateElement(activeArtboardId, id, { name: newName })
    }
    setRenamingId(null)
  }

  const handleCancelRename = () => {
    setRenamingId(null)
  }

  const handleTabRename = (id: string, direction: 'next' | 'prev') => {
    const visible = getVisibleLayerIds(artboard, expandedLayers)
    const filtered = visible.filter(vid => artboard.elements[vid]?.type !== 'body')
    const idx = filtered.indexOf(id)
    if (idx === -1) { setRenamingId(null); return }
    const nextIdx = direction === 'next' ? idx + 1 : idx - 1
    if (nextIdx >= 0 && nextIdx < filtered.length) {
      setRenamingId(filtered[nextIdx])
    } else {
      setRenamingId(null)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '0 8px 0 12px', height: 36, fontSize: 11, fontWeight: 600,
        color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span>Layers</span>
        {expandedLayers.size > 0 && (
          <button
            onClick={collapseAll}
            title="Collapse all layers"
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: colors.textMuted, fontSize: 10, padding: '0 2px', lineHeight: 1,
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            <ArrowsInSimple size={12} weight="thin" />
          </button>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <Toolbar />
        </div>
      </div>

      <div ref={layersScrollRef} style={{ flex: 1, overflow: 'auto' }}>
        {artboard.rootChildren.length === 0 ? (
          <div style={{ padding: 16, color: colors.textMuted, fontSize: 12 }}>No elements</div>
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
                renamingId={renamingId}
                onStartRename={handleStartRename}
                onFinishRename={handleFinishRename}
                onCancelRename={handleCancelRename}
                onTabRename={handleTabRename}
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
