import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTaskCard } from './TaskCard'
import { useBacklogStore } from '../../store/backlogStore'
import type { BacklogTask, TaskStatus } from '../../types/backlog'

const COLUMN_CONFIG: Record<TaskStatus, { label: string; dot: string }> = {
  backlog: { label: 'Backlog', dot: '#a3a3a3' },
  todo: { label: 'Todo', dot: '#f59e0b' },
  in_progress: { label: 'In Progress', dot: '#0a0a0a' },
  design_review: { label: 'Design Review', dot: '#8b5cf6' },
  code_review: { label: 'Code Review', dot: '#3b82f6' },
  done: { label: 'Done', dot: '#22c55e' },
}

type Props = {
  status: TaskStatus
  tasks: BacklogTask[]
}

export function KanbanColumn({ status, tasks }: Props) {
  const { setEditingTaskId } = useBacklogStore()
  const config = COLUMN_CONFIG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 4px 12px',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: 4,
          background: config.dot, flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>
          {config.label}
        </span>
        <span style={{ fontSize: 12, color: '#a3a3a3', fontWeight: 500 }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
          padding: 4, borderRadius: 8, minHeight: 100,
          background: isOver ? '#f5f5f5' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => setEditingTaskId(task.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
