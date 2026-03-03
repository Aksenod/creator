import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTaskCard } from './TaskCard'
import { useBacklogStore } from '../../store/backlogStore'
import { colors, statusColors } from '../../styles/tokens'
import type { BacklogTask, TaskStatus } from '../../types/backlog'
import type { ResponsiveMode } from '../../App'

const COLUMN_CONFIG: Record<TaskStatus, { label: string }> = {
  backlog: { label: 'Backlog' },
  todo: { label: 'Todo' },
  in_progress: { label: 'In Progress' },
  design_review: { label: 'Design Review' },
  code_review: { label: 'Code Review' },
  done: { label: 'Done' },
}

type Props = {
  status: TaskStatus
  tasks: BacklogTask[]
  responsiveMode: ResponsiveMode
}

export function KanbanColumn({ status, tasks, responsiveMode }: Props) {
  const { setEditingTaskId } = useBacklogStore()
  const config = COLUMN_CONFIG[status]
  const dotColor = statusColors[status] || colors.textMuted
  const { setNodeRef } = useDroppable({ id: status })

  const isMobile = responsiveMode === 'mobile'
  const isTablet = responsiveMode === 'tablet'

  // Column container style
  const columnStyle: React.CSSProperties = isMobile
    ? {
        display: 'flex', flexDirection: 'column', gap: 8,
        width: '100%',
      }
    : isTablet
    ? {
        display: 'flex', flexDirection: 'column', gap: 8,
        width: 240, minWidth: 240, flexShrink: 0,
        height: '100%',
      }
    : {
        display: 'flex', flexDirection: 'column', gap: 8,
        flex: 1, minWidth: 0,
        height: '100%',
      }

  // Header padding: desktop [10, 12], tablet [8, 10]
  const headerPadding = isTablet ? '8px 10px' : '10px 12px'

  return (
    <div style={columnStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: headerPadding, flexShrink: 0,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: dotColor, flexShrink: 0,
        }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: colors.textSecondary }}>
          {config.label}
        </span>
        <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 400 }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards container — scrollable on desktop/tablet */}
      <div
        ref={setNodeRef}
        className="hide-scrollbar"
        style={{
          flex: isMobile ? undefined : 1,
          display: 'flex', flexDirection: 'column',
          gap: 6,
          overflowY: isMobile ? undefined : 'auto',
          minHeight: isMobile ? undefined : 80,
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
