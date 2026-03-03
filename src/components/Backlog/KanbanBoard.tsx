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
import type { BacklogTask, TaskStatus } from '../../types/backlog'

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'design_review', 'code_review', 'done']

export function KanbanBoard() {
  const { tasks, moveTask, isUnlocked } = useBacklogStore()
  const [activeTask, setActiveTask] = useState<BacklogTask | null>(null)

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

    // Determine target status: either the column itself or the status of the task we dropped over
    let targetStatus: TaskStatus
    if (COLUMNS.includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatus
    } else {
      const overTask = tasks.find(t => t.id === over.id)
      if (!overTask) return
      targetStatus = overTask.status
    }

    // Calculate new order
    const targetTasks = tasksByStatus(targetStatus).filter(t => t.id !== taskId)
    const overIndex = targetTasks.findIndex(t => t.id === over.id)
    const newOrder = overIndex >= 0 ? overIndex : targetTasks.length

    if (isUnlocked) moveTask(taskId, targetStatus, newOrder)
  }

  return (
    <div style={{
      display: 'flex', gap: 24, padding: 24,
      flex: 1, overflow: 'auto', alignItems: 'flex-start',
    }}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {COLUMNS.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus(status)}
          />
        ))}
        <DragOverlay>
          {activeTask && (
            <div style={{ opacity: 0.85, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', borderRadius: 8 }}>
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
