import { useEffect } from 'react'
import { useEditorStore } from '../../store'
import { useBacklogStore } from '../../store/backlogStore'
import { KanbanBoard } from './KanbanBoard'
import { TaskModal } from './TaskModal'

export function BacklogPage() {
  const setCurrentView = useEditorStore(s => s.setCurrentView)
  const { editingTaskId, setEditingTaskId, loadTasks, loaded } = useBacklogStore()

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleNewTask = () => {
    setEditingTaskId('__new__')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#fafafa' }}>
      {/* Header */}
      <div style={{
        height: 56, background: '#fff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', padding: '0 32px',
        flexShrink: 0, gap: 16,
      }}>
        <button
          onClick={() => setCurrentView('projects')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#525252', padding: '4px 0',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          &larr; Projects
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>
          Backlog
        </span>
        <button
          onClick={handleNewTask}
          style={{
            marginLeft: 'auto',
            padding: '7px 16px',
            background: '#0a0a0a', color: '#fff',
            border: 'none', borderRadius: 6,
            fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}
        >
          + New Task
        </button>
      </div>

      {/* Board */}
      {loaded ? (
        <KanbanBoard />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3' }}>
          Loading...
        </div>
      )}

      {/* Modal */}
      {editingTaskId !== null && <TaskModal />}
    </div>
  )
}
