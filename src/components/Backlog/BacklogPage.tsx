import { useEffect } from 'react'
import { useEditorStore } from '../../store'
import { useBacklogStore } from '../../store/backlogStore'
import { KanbanBoard } from './KanbanBoard'
import { TaskModal } from './TaskModal'

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? '#0a0a0a' : '#a3a3a3',
        padding: '4px 0',
        borderBottom: active ? '2px solid #0a0a0a' : '2px solid transparent',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

export function BacklogPage({ isMobile = false }: { isMobile?: boolean }) {
  const setCurrentView = useEditorStore(s => s.setCurrentView)
  const { editingTaskId, setEditingTaskId, loadTasks, loaded } = useBacklogStore()

  useEffect(() => {
    // Wait for persist rehydration, then fetch from API
    const unsub = useBacklogStore.persist.onFinishHydration(() => {
      loadTasks()
    })
    // If already hydrated (e.g. navigating back), load immediately
    if (useBacklogStore.persist.hasHydrated()) {
      loadTasks()
    }
    return unsub
  }, [loadTasks])

  const handleNewTask = () => {
    setEditingTaskId('__new__')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#fafafa' }}>
      {/* Mobile banner */}
      {isMobile && (
        <div style={{
          background: '#f0f4ff', borderBottom: '1px solid #d0d8f0',
          padding: '10px 16px', fontSize: 12, color: '#4a5568',
          textAlign: 'center', flexShrink: 0,
        }}>
          💻 Для работы в редакторе откройте ссылку с компьютера
        </div>
      )}

      {/* Header */}
      <div style={{
        height: 56, background: '#fff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', padding: isMobile ? '0 12px' : '0 32px',
        flexShrink: 0, gap: isMobile ? 8 : 16,
      }}>
        {!isMobile && (
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
        )}
        <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>
          Backlog
        </span>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, marginLeft: isMobile ? 'auto' : 24 }}>
          <TabButton active label="Board" onClick={() => setCurrentView('backlog')} />
          <TabButton active={false} label="Team" onClick={() => setCurrentView('team')} />
        </div>

        <button
          onClick={handleNewTask}
          style={{
            marginLeft: isMobile ? 8 : 'auto',
            padding: isMobile ? '7px 12px' : '7px 16px',
            background: '#0a0a0a', color: '#fff',
            border: 'none', borderRadius: 6,
            fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}
        >
          {isMobile ? '+' : '+ New Task'}
        </button>
      </div>

      {/* Content */}
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
