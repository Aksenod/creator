import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store'
import { useBacklogStore } from '../../store/backlogStore'
import { KanbanBoard } from './KanbanBoard'
import { TaskModal } from './TaskModal'
import { PinModal } from './PinModal'
import { colors, statusColors } from '../../styles/tokens'
import type { ResponsiveMode } from '../../App'
import type { TaskStatus } from '../../types/backlog'

// Mobile groups 6 statuses into 4 filters
type MobileFilter = 'backlog' | 'todo' | 'active' | 'done'
const MOBILE_FILTERS: { key: MobileFilter; label: string; dotColor: string; statuses: TaskStatus[] }[] = [
  { key: 'backlog', label: 'Backlog', dotColor: statusColors.backlog, statuses: ['backlog'] },
  { key: 'todo', label: 'Todo', dotColor: statusColors.todo, statuses: ['todo'] },
  { key: 'active', label: 'Active', dotColor: statusColors.in_progress, statuses: ['in_progress', 'design_review', 'code_review'] },
  { key: 'done', label: 'Done', dotColor: statusColors.done, statuses: ['done'] },
]

export function BacklogPage({ responsiveMode }: { responsiveMode: ResponsiveMode }) {
  const setCurrentView = useEditorStore(s => s.setCurrentView)
  const { tasks, editingTaskId, setEditingTaskId, loadTasks, loaded, isUnlocked, saving } = useBacklogStore()
  const [showPin, setShowPin] = useState(false)
  const [mobileFilter, setMobileFilter] = useState<MobileFilter>('backlog')

  const isMobile = responsiveMode === 'mobile'
  const isTablet = responsiveMode === 'tablet'
  const isDesktop = responsiveMode === 'desktop'

  useEffect(() => {
    const unsub = useBacklogStore.persist.onFinishHydration(() => {
      loadTasks()
    })
    if (useBacklogStore.persist.hasHydrated()) {
      loadTasks()
    }
    return unsub
  }, [loadTasks])

  const handleNewTask = () => {
    setEditingTaskId('__new__')
  }

  // Count tasks per mobile filter
  const filterCounts = MOBILE_FILTERS.map(f => ({
    ...f,
    count: tasks.filter(t => f.statuses.includes(t.status)).length,
  }))

  // Active mobile filter statuses
  const activeFilterStatuses = MOBILE_FILTERS.find(f => f.key === mobileFilter)?.statuses ?? []

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100vh',
      background: colors.bgSurface,
    }}>
      {/* Header */}
      {isMobile ? (
        /* Mobile header: 48px */
        <div style={{
          height: 48, background: colors.bgCard,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 16px', flexShrink: 0,
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              onClick={() => setCurrentView('projects')}
              style={{ cursor: 'pointer', fontSize: 18, color: colors.textSecondary, lineHeight: 1 }}
            >
              &#8592;
            </span>
            <span style={{ fontWeight: 600, fontSize: 15, color: colors.text }}>Backlog</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isUnlocked && (
              <span
                onClick={() => setShowPin(true)}
                style={{ cursor: 'pointer', color: colors.textSecondary, display: 'flex', alignItems: 'center' }}
              >
                <LockIcon size={16} />
              </span>
            )}
            <button
              onClick={isUnlocked ? handleNewTask : () => setShowPin(true)}
              style={{
                background: colors.text, color: colors.bgCard,
                border: 'none', borderRadius: 6,
                padding: '4px 10px', fontSize: 16,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                fontWeight: 500,
              }}
            >
              +
            </button>
          </div>
        </div>
      ) : (
        /* Desktop / Tablet header */
        <div style={{
          height: isTablet ? 52 : 56,
          background: colors.bgCard,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center',
          padding: isTablet ? '0 16px' : '0 24px',
          flexShrink: 0, justifyContent: 'space-between',
          position: 'relative',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isTablet ? 10 : 12 }}>
            <div
              onClick={() => setCurrentView('projects')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                cursor: 'pointer', color: colors.textSecondary, fontSize: 13,
              }}
            >
              <span style={{ fontSize: isTablet ? 18 : 13 }}>&#8592;</span>
              {isDesktop && <span>Projects</span>}
            </div>
            {isDesktop && <span style={{ color: colors.textMuted, fontSize: 13 }}>/</span>}
            <span style={{ fontWeight: 600, fontSize: isTablet ? 15 : 14, color: colors.text }}>
              Backlog
            </span>
          </div>

          {/* Center: Segmented pill tabs — absolute center */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <SegmentedTabs
              active="board"
              onTabChange={(tab) => setCurrentView(tab === 'board' ? 'backlog' : 'team')}
            />
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving && (
              <span style={{
                fontSize: 11, color: colors.textMuted, fontWeight: 400,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 3,
                  background: colors.accentGreen,
                }} />
                Saved
              </span>
            )}

            {!isUnlocked && (
              <button
                onClick={() => setShowPin(true)}
                style={{
                  background: 'none', border: `1px solid ${colors.border}`,
                  borderRadius: 6, padding: isTablet ? '5px 10px' : '6px 12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 500, color: colors.textSecondary,
                }}
              >
                <LockIcon size={14} />
                {!isTablet && <span>Unlock</span>}
              </button>
            )}

            <button
              onClick={isUnlocked ? handleNewTask : () => setShowPin(true)}
              style={{
                background: colors.text, color: colors.bgCard,
                border: 'none', borderRadius: 6,
                padding: isTablet ? '5px 12px' : '6px 14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 13 }}>+</span>
              {!isTablet && <span>New Task</span>}
            </button>
          </div>
        </div>
      )}

      {/* Mobile: Tabs bar */}
      {isMobile && (
        <div style={{
          height: 40, background: colors.bgCard,
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 12px', flexShrink: 0,
        }}>
          <MobileTabButton active label="Board" onClick={() => setCurrentView('backlog')} />
          <MobileTabButton active={false} label="Team" onClick={() => setCurrentView('team')} />
        </div>
      )}

      {/* Mobile: Status filter pills */}
      {isMobile && (
        <div
          className="hide-scrollbar"
          style={{
            background: colors.bgCard,
            display: 'flex', gap: 6,
            padding: '8px 12px', flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {filterCounts.map(f => (
            <button
              key={f.key}
              onClick={() => setMobileFilter(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 16,
                border: mobileFilter === f.key ? 'none' : `1px solid ${colors.border}`,
                background: mobileFilter === f.key ? colors.text : 'transparent',
                color: mobileFilter === f.key ? colors.bgCard : colors.textMuted,
                cursor: 'pointer', fontSize: 11, fontWeight: mobileFilter === f.key ? 500 : 400,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: 3,
                background: mobileFilter === f.key ? colors.bgCard : f.dotColor,
              }} />
              {f.label}
              <span style={{
                fontSize: 10, fontWeight: 400,
                color: mobileFilter === f.key ? colors.textMuted : colors.textMuted,
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loaded ? (
        <KanbanBoard
          responsiveMode={responsiveMode}
          mobileFilterStatuses={isMobile ? activeFilterStatuses : undefined}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
          Loading...
        </div>
      )}

      {/* Modal */}
      {editingTaskId !== null && <TaskModal />}

      {/* Pin Modal */}
      {showPin && (
        <PinModal
          onSuccess={() => setShowPin(false)}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  )
}

/* Segmented pill tabs: Board / Team */
function SegmentedTabs({ active, onTabChange }: {
  active: 'board' | 'team'
  onTabChange: (tab: 'board' | 'team') => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: colors.bgSurface,
      borderRadius: 8, padding: 3,
    }}>
      {(['board', 'team'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            background: active === tab ? colors.bgCard : 'transparent',
            border: 'none', borderRadius: 6,
            padding: '6px 16px', cursor: 'pointer',
            fontSize: 12,
            fontWeight: active === tab ? 600 : 400,
            color: active === tab ? colors.text : colors.textMuted,
            boxShadow: active === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {tab === 'board' ? 'Board' : 'Team'}
        </button>
      ))}
    </div>
  )
}

/* Lock icon — flat line style */
function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

/* Mobile underline tab button */
function MobileTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none',
        borderBottom: active ? `2px solid ${colors.text}` : '2px solid transparent',
        cursor: 'pointer', padding: '0 14px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: active ? 600 : 400,
        color: active ? colors.text : colors.textMuted,
      }}
    >
      {label}
    </button>
  )
}
