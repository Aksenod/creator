import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useBacklogStore } from '../../store/backlogStore'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { shadows } from '../../styles/tokens'
import type { BacklogTask, TaskStatus } from '../../types/backlog'
import type { ResponsiveMode } from '../../App'

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'design_review', 'code_review', 'done']

type Props = {
  responsiveMode: ResponsiveMode
  mobileFilterStatuses?: TaskStatus[]
}

export function KanbanBoard({ responsiveMode, mobileFilterStatuses }: Props) {
  const { tasks: rawTasks, moveTask, isUnlocked } = useBacklogStore()
  const tasks = rawTasks ?? []
  const [activeTask, setActiveTask] = useState<BacklogTask | null>(null)

  const isMobile = responsiveMode === 'mobile'
  const isTablet = responsiveMode === 'tablet'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: isUnlocked ? 5 : 99999 } })
  )

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order)

  const handleDragStart = (event: DragStartEvent) => {
    if (!isUnlocked) return
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    let targetStatus: TaskStatus
    if (COLUMNS.includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatus
    } else {
      const overTask = tasks.find(t => t.id === over.id)
      if (!overTask) return
      targetStatus = overTask.status
    }

    const targetTasks = tasksByStatus(targetStatus).filter(t => t.id !== taskId)
    const overIndex = targetTasks.findIndex(t => t.id === over.id)
    const newOrder = overIndex >= 0 ? overIndex : targetTasks.length

    if (isUnlocked) moveTask(taskId, targetStatus, newOrder)
  }

  // Mobile: show only filtered columns
  const visibleColumns = isMobile && mobileFilterStatuses
    ? COLUMNS.filter(s => mobileFilterStatuses.includes(s))
    : COLUMNS

  // Board container styles per responsive mode
  const boardStyle: React.CSSProperties = isMobile
    ? {
        display: 'flex', flexDirection: 'column',
        gap: 8, padding: 12,
        flex: 1, overflowY: 'auto',
      }
    : isTablet
    ? {
        display: 'flex', gap: 8,
        padding: 12, flex: 1,
        overflowX: 'auto', overflowY: 'hidden',
      }
    : {
        display: 'flex', gap: 8,
        padding: '16px 12px', flex: 1,
        overflowY: 'hidden',
      }

  return (
    <div className="hide-scrollbar" style={boardStyle}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {visibleColumns.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus(status)}
            responsiveMode={responsiveMode}
          />
        ))}
        <DragOverlay>
          {activeTask && (
            <div style={{
              opacity: 0.92,
              transform: 'rotate(2deg)',
              boxShadow: shadows.lg,
              borderRadius: 10,
            }}>
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
