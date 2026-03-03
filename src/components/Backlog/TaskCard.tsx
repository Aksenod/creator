import { useState } from 'react'
import type { BacklogTask } from '../../types/backlog'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { colors, priorityColors } from '../../styles/tokens'

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  feature: { bg: colors.bgSurface, color: colors.textSecondary },
  bug: { bg: colors.accentRedLight, color: colors.accentRed },
}

export function TaskCard({ task, onClick }: { task: BacklogTask; onClick: () => void }) {
  const badge = TYPE_BADGE[task.type] ?? TYPE_BADGE.feature
  const thumb = task.screenshots[0]
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isDone = task.status === 'done'
  const priColor = priorityColors[task.priority] ?? colors.textMuted

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `[backlog:${task.id}] ${task.title}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const hasReview = task.reviewComments && task.reviewComments.length > 0
  const lastComment = hasReview ? task.reviewComments![task.reviewComments!.length - 1].text : ''

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.bgCard,
        border: `1px solid ${hovered ? colors.borderStrong : colors.border}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: isDone ? 0.5 : 1,
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Top row: badge + priority dot */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 500,
          padding: '2px 7px', borderRadius: 4,
          background: badge.bg, color: badge.color,
        }}>
          {task.type}
        </span>
        <span style={{
          width: 6, height: 6, borderRadius: 3,
          background: priColor, flexShrink: 0,
        }} />
      </div>

      {/* Title */}
      <div style={{
        fontSize: 13, fontWeight: 500,
        color: colors.text, lineHeight: 1.35,
      }}>
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div style={{
          fontSize: 11, color: colors.textMuted, lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {task.description}
        </div>
      )}

      {/* Screenshot thumbnail */}
      {thumb && (
        <img
          src={`/api/backlog/screenshot/${thumb.split('/').pop()}`}
          alt=""
          style={{
            width: '100%', height: 48,
            objectFit: 'cover', borderRadius: 4,
            background: colors.bgSurface,
          }}
        />
      )}

      {/* Footer: labels + link button */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {task.labels.map(l => (
            <span key={l} style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
            }}>
              {l}
            </span>
          ))}
        </div>
        <button
          onClick={handleCopyLink}
          title="Copy task link"
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 4px',
            borderRadius: 4, fontSize: 12, lineHeight: 1,
            color: copied ? colors.accentGreen : colors.textMuted,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (!copied) (e.currentTarget.style.color = colors.textSecondary) }}
          onMouseLeave={e => { if (!copied) (e.currentTarget.style.color = colors.textMuted) }}
        >
          {copied ? '\u2713' : '\uD83D\uDD17'}
        </button>
      </div>

      {/* Review comment */}
      {hasReview && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 6,
          background: colors.accentPurpleLight,
          borderRadius: 6, padding: '5px 8px',
        }}>
          <span style={{
            fontSize: 11, color: colors.accentPurple,
            lineHeight: 1, flexShrink: 0, marginTop: 1,
          }}>
            &#x1F4AC;
          </span>
          <span style={{
            fontSize: 10, color: colors.accentPurple,
            lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {lastComment}
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
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}
