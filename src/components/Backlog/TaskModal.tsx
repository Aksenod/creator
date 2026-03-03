import { useState, useEffect } from 'react'
import { useBacklogStore } from '../../store/backlogStore'
import { SegmentedControl } from '../Properties/shared/SegmentedControl'
import { ScreenshotUpload } from './ScreenshotUpload'
import type { TaskType, TaskPriority, TaskStatus } from '../../types/backlog'

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
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export function TaskModal() {
  const { editingTaskId, tasks, setEditingTaskId, addTask, updateTask, deleteTask } = useBacklogStore()
  const existing = tasks.find(t => t.id === editingTaskId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('feature')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('backlog')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [labels, setLabels] = useState('')

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setDescription(existing.description)
      setType(existing.type)
      setPriority(existing.priority)
      setStatus(existing.status)
      setScreenshots(existing.screenshots)
      setLabels(existing.labels.join(', '))
    } else {
      setTitle('')
      setDescription('')
      setType('feature')
      setPriority('medium')
      setStatus('backlog')
      setScreenshots([])
      setLabels('')
    }
  }, [existing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingTaskId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setEditingTaskId])

  const handleSave = () => {
    if (!title.trim()) return
    const parsedLabels = labels.split(',').map(l => l.trim()).filter(Boolean)

    if (existing) {
      updateTask(existing.id, { title, description, type, priority, status, screenshots, labels: parsedLabels })
    } else {
      addTask({ title, description, type, priority, labels: parsedLabels, screenshots })
    }
    setEditingTaskId(null)
  }

  const handleDelete = () => {
    if (existing) deleteTask(existing.id)
  }

  return (
    <div
      onClick={() => setEditingTaskId(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12,
          width: '100%', maxWidth: 560, maxHeight: '90vh',
          overflow: 'auto', padding: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0a0a0a' }}>
            {existing ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={() => setEditingTaskId(null)}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#737373', padding: 4 }}
          >
            &times;
          </button>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            style={{
              padding: '8px 10px', fontSize: 13, border: '1px solid #e5e5e5',
              borderRadius: 6, outline: 'none', color: '#0a0a0a',
            }}
            onFocus={e => e.target.style.borderColor = '#0a0a0a'}
            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
          />
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the task..."
            rows={4}
            style={{
              padding: '8px 10px', fontSize: 13, border: '1px solid #e5e5e5',
              borderRadius: 6, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              color: '#0a0a0a',
            }}
            onFocus={e => e.target.style.borderColor = '#0a0a0a'}
            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
          />
        </div>

        {/* Type & Priority */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Type</label>
            <SegmentedControl value={type} options={TYPE_OPTIONS} onChange={v => setType(v as TaskType)} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Priority</label>
            <SegmentedControl value={priority} options={PRIORITY_OPTIONS} onChange={v => setPriority(v as TaskPriority)} />
          </div>
        </div>

        {/* Status (only for edit mode) */}
        {existing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Status</label>
            <SegmentedControl value={status} options={STATUS_OPTIONS} onChange={v => setStatus(v as TaskStatus)} />
          </div>
        )}

        {/* Labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Labels (comma separated)</label>
          <input
            value={labels}
            onChange={e => setLabels(e.target.value)}
            placeholder="ui, performance, ..."
            style={{
              padding: '8px 10px', fontSize: 13, border: '1px solid #e5e5e5',
              borderRadius: 6, outline: 'none', color: '#0a0a0a',
            }}
            onFocus={e => e.target.style.borderColor = '#0a0a0a'}
            onBlur={e => e.target.style.borderColor = '#e5e5e5'}
          />
        </div>

        {/* Screenshots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#525252' }}>Screenshots</label>
          <ScreenshotUpload screenshots={screenshots} onChange={setScreenshots} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          {existing && (
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 16px', fontSize: 13, border: '1px solid #fee2e2',
                borderRadius: 6, cursor: 'pointer', background: '#fff',
                color: '#dc2626', fontWeight: 500, marginRight: 'auto',
              }}
            >
              Delete
            </button>
          )}
          <button
            onClick={() => setEditingTaskId(null)}
            style={{
              padding: '8px 16px', fontSize: 13, border: '1px solid #e5e5e5',
              borderRadius: 6, cursor: 'pointer', background: '#fff',
              color: '#525252', fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px', fontSize: 13, border: 'none',
              borderRadius: 6, cursor: 'pointer', background: '#0a0a0a',
              color: '#fff', fontWeight: 500,
            }}
          >
            {existing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
