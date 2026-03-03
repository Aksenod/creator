import { useState, useEffect } from 'react'
import { useBacklogStore } from '../../store/backlogStore'
import { SegmentedControl } from '../Properties/shared/SegmentedControl'
import { ScreenshotUpload } from './ScreenshotUpload'
import { colors, shadows, radius, priorityColors as globalPriorityColors } from '../../styles/tokens'
import { X } from '@phosphor-icons/react'
import type { TaskType, TaskPriority, TaskStatus, ReviewComment } from '../../types/backlog'

const TYPE_OPTIONS = [
  { value: 'feature', label: 'Feature' },
  { value: 'bug', label: 'Bug' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'design_review', label: 'Design Review' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'done', label: 'Done' },
]

export function TaskModal() {
  const { editingTaskId, tasks, setEditingTaskId, addTask, updateTask, deleteTask, isUnlocked } = useBacklogStore()
  const existing = tasks.find(t => t.id === editingTaskId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('feature')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('backlog')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [labels, setLabels] = useState('')
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description)
      setType(existing.type)
      setPriority(existing.priority)
      setStatus(existing.status)
      setScreenshots(existing.screenshots)
      setLabels(existing.labels.join(', '))
      setReviewComments(existing.reviewComments ?? [])
      setNewComment('')
    } else {
      setTitle('')
      setDescription('')
      setType('feature')
      setPriority('medium')
      setStatus('backlog')
      setScreenshots([])
      setLabels('')
      setReviewComments([])
      setNewComment('')
    }
  }, [existing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingTaskId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setEditingTaskId])

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comment: ReviewComment = {
      author: 'PM',
      text: newComment.trim(),
      createdAt: Date.now(),
    }
    setReviewComments([...reviewComments, comment])
    setNewComment('')
  }

  const handleDeleteComment = (index: number) => {
    setReviewComments(reviewComments.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!title.trim()) return
    const parsedLabels = labels.split(',').map(l => l.trim()).filter(Boolean)

    if (existing) {
      updateTask(existing.id, { title, description, type, priority, status, screenshots, labels: parsedLabels, reviewComments })
    } else {
      addTask({ title, description, type, priority, labels: parsedLabels, screenshots })
    }
    setEditingTaskId(null)
  }

  const handleDelete = () => {
    if (existing) deleteTask(existing.id)
  }

  const statusLabel = STATUS_OPTIONS.find(o => o.value === (existing?.status ?? status))?.label ?? status
  const typeLabel = TYPE_OPTIONS.find(o => o.value === (existing?.type ?? type))?.label ?? type
  const priorityLabel = PRIORITY_OPTIONS.find(o => o.value === (existing?.priority ?? priority))?.label ?? priority

  // View-only mode for unauthenticated users
  if (!isUnlocked && existing) {
    const priColor = globalPriorityColors[existing.priority] ?? colors.textMuted
    return (
      <div
        onClick={() => setEditingTaskId(null)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: colors.overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: colors.bg, borderRadius: 12,
            width: '100%', maxWidth: 560, maxHeight: '90vh',
            overflow: 'auto', padding: 24,
            boxShadow: shadows.xl,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text, flex: 1 }}>
              {existing.title}
            </h2>
            <button
              onClick={() => setEditingTaskId(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}
            >
              <X size={20} weight="thin" />
            </button>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: colors.bgSurface, color: colors.textSecondary,
            }}>
              {typeLabel}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: colors.bgSurface, color: priColor,
            }}>
              {priorityLabel}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: colors.bgSurface, color: colors.textSecondary,
            }}>
              {statusLabel}
            </span>
            {existing.labels.map(l => (
              <span key={l} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                background: colors.bgSurface, color: colors.textSecondary,
              }}>
                {l}
              </span>
            ))}
          </div>

          {/* Description */}
          {existing.description && (
            <div style={{
              fontSize: 13, lineHeight: 1.6, color: colors.text,
              whiteSpace: 'pre-wrap',
            }}>
              {existing.description}
            </div>
          )}

          {/* Screenshots */}
          {existing.screenshots.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {existing.screenshots.map((src, i) => (
                <img key={i} src={src} alt="" style={{
                  maxWidth: '100%', maxHeight: 200, borderRadius: radius.sm,
                  border: `1px solid ${colors.border}`, objectFit: 'cover',
                }} />
              ))}
            </div>
          )}

          {/* Review Comments (read-only) */}
          {existing.reviewComments && existing.reviewComments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Review Comments</label>
              {existing.reviewComments.map((c, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: radius.sm,
                  background: colors.bgSurface,
                  border: `1px solid ${colors.border}`,
                  fontSize: 12, lineHeight: 1.5,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      fontWeight: 600, fontSize: 11,
                      color: colors.text,
                    }}>{c.author}</span>
                    <span style={{ color: colors.textMuted, fontSize: 10 }}>
                      {new Date(c.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>{c.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Date */}
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            Created {new Date(existing.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setEditingTaskId(null)}
              style={{
                padding: '8px 16px', fontSize: 13, border: `1px solid ${colors.border}`,
                borderRadius: radius.sm, cursor: 'pointer', background: colors.bg,
                color: colors.textSecondary, fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setEditingTaskId(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: colors.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.bg, borderRadius: 12,
          width: '100%', maxWidth: 560, maxHeight: '90vh',
          overflow: 'auto', padding: 24,
          boxShadow: shadows.xl,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
            {existing ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={() => setEditingTaskId(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <X size={20} weight="thin" />
          </button>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            style={{
              padding: '8px 10px', fontSize: 13, border: `1px solid ${colors.border}`,
              borderRadius: radius.sm, outline: 'none', color: colors.text,
            }}
            onFocus={e => e.target.style.borderColor = colors.borderFocus}
            onBlur={e => e.target.style.borderColor = colors.border}
          />
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the task..."
            rows={4}
            style={{
              padding: '8px 10px', fontSize: 13, border: `1px solid ${colors.border}`,
              borderRadius: radius.sm, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              color: colors.text,
            }}
            onFocus={e => e.target.style.borderColor = colors.borderFocus}
            onBlur={e => e.target.style.borderColor = colors.border}
          />
        </div>

        {/* Type & Priority */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Type</label>
            <SegmentedControl value={type} options={TYPE_OPTIONS} onChange={v => setType(v as TaskType)} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Priority</label>
            <SegmentedControl value={priority} options={PRIORITY_OPTIONS} onChange={v => setPriority(v as TaskPriority)} />
          </div>
        </div>

        {/* Status (only for edit mode) */}
        {existing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TaskStatus)}
              style={{
                padding: '8px 10px', fontSize: 13, border: `1px solid ${colors.border}`,
                borderRadius: radius.sm, outline: 'none', color: colors.text,
                background: colors.bg, cursor: 'pointer',
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Labels (comma separated)</label>
          <input
            value={labels}
            onChange={e => setLabels(e.target.value)}
            placeholder="ui, performance, ..."
            style={{
              padding: '8px 10px', fontSize: 13, border: `1px solid ${colors.border}`,
              borderRadius: radius.sm, outline: 'none', color: colors.text,
            }}
            onFocus={e => e.target.style.borderColor = colors.borderFocus}
            onBlur={e => e.target.style.borderColor = colors.border}
          />
        </div>

        {/* Screenshots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Screenshots</label>
          <ScreenshotUpload screenshots={screenshots} onChange={setScreenshots} />
        </div>

        {/* Review Comments */}
        {existing && (status === 'design_review' || status === 'code_review' || reviewComments.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>
              Review Comments
            </label>
            {reviewComments.map((c, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: radius.sm,
                background: colors.bgSurface,
                border: `1px solid ${colors.border}`,
                fontSize: 12, lineHeight: 1.5,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{
                    fontWeight: 600,
                    color: colors.text,
                    fontSize: 11,
                  }}>
                    {c.author}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: colors.textMuted, fontSize: 10 }}>
                      {new Date(c.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleDeleteComment(i)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: colors.textMuted, fontSize: 12, padding: '0 2px', lineHeight: 1,
                      }}
                      title="Delete comment"
                    >
                      <X size={14} weight="thin" />
                    </button>
                  </div>
                </div>
                <div style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>{c.text}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add review comment..."
                rows={2}
                style={{
                  flex: 1, padding: '8px 10px', fontSize: 12, border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                  color: colors.text,
                }}
                onFocus={e => e.target.style.borderColor = colors.borderFocus}
                onBlur={e => e.target.style.borderColor = colors.border}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                style={{
                  padding: '8px 12px', fontSize: 12, border: 'none',
                  borderRadius: radius.sm, cursor: newComment.trim() ? 'pointer' : 'default',
                  background: newComment.trim() ? colors.accent : colors.border,
                  color: newComment.trim() ? colors.bg : colors.textMuted,
                  fontWeight: 500, alignSelf: 'flex-end',
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          {existing && isUnlocked && (
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 16px', fontSize: 13, border: `1px solid ${colors.border}`,
                borderRadius: radius.sm, cursor: 'pointer', background: colors.bg,
                color: colors.accentRed, fontWeight: 500, marginRight: 'auto',
              }}
            >
              Delete
            </button>
          )}
          <button
            onClick={() => setEditingTaskId(null)}
            style={{
              padding: '8px 16px', fontSize: 13, border: `1px solid ${colors.border}`,
              borderRadius: radius.sm, cursor: 'pointer', background: colors.bg,
              color: colors.textSecondary, fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px', fontSize: 13, border: 'none',
              borderRadius: radius.sm, cursor: 'pointer', background: colors.accent,
              color: colors.bg, fontWeight: 500,
            }}
          >
            {existing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
