import { useState } from 'react'
import type { BacklogTask } from '../../types/backlog'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#d4d4d4',
}

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  feature: { bg: '#dbeafe', color: '#1d4ed8' },
  bug: { bg: '#fee2e2', color: '#dc2626' },
}

export function TaskCard({ task, onClick }: { task: BacklogTask; onClick: () => void }) {
  const badge = TYPE_BADGE[task.type]
  const thumb = task.screenshots[0]
  const [copied, setCopied] = useState(false)

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `[backlog:${task.id}] ${task.title}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: 12,
        cursor: 'pointer',
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 600,
          padding: '1px 6px', borderRadius: 4,
          background: badge.bg, color: badge.color,
        }}>
          {task.type}
        </span>
        {task.labels.map(l => (
          <span key={l} style={{
            fontSize: 10, padding: '1px 5px', borderRadius: 4,
            background: '#f5f5f5', color: '#737373',
          }}>
            {l}
          </span>
        ))}
        <button
          onClick={handleCopyLink}
          title="Скопировать ссылку на задачу"
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: 12,
            color: copied ? '#16a34a' : '#a3a3a3',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (!copied) (e.currentTarget.style.color = '#525252') }}
          onMouseLeave={e => { if (!copied) (e.currentTarget.style.color = '#a3a3a3') }}
        >
          {copied ? '✓' : '🔗'}
        </button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a', lineHeight: 1.3 }}>
        {task.title}
      </div>
      {task.description && (
        <div style={{
          fontSize: 12, color: '#737373', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {task.description}
        </div>
      )}
      {thumb && (
        <img
          src={`/api/backlog/screenshot/${thumb.split('/').pop()}`}
          alt=""
          style={{ width: '100%', height: 48, objectFit: 'cover', borderRadius: 4, background: '#f5f5f5' }}
        />
      )}
      {task.reviewComments && task.reviewComments.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: '#6b7280',
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: 7,
            background: task.status === 'design_review' ? '#ede9fe' : task.status === 'code_review' ? '#dbeafe' : '#f3f4f6',
            color: task.status === 'design_review' ? '#7c3aed' : task.status === 'code_review' ? '#1d4ed8' : '#6b7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, flexShrink: 0,
          }}>
            {task.reviewComments.length}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.reviewComments[task.reviewComments.length - 1].text}
          </span>
        </div>
      )}
    </div>
  )
}

export function SortableTaskCard({ task, onClick }: { task: BacklogTask; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}
