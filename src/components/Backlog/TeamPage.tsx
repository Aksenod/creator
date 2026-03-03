import { useEditorStore } from '../../store'
import { TeamSection } from './TeamSection'

export function TeamPage({ isMobile = false }: { isMobile?: boolean }) {
  const setCurrentView = useEditorStore(s => s.setCurrentView)

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
          Team
        </span>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 16, marginLeft: isMobile ? 'auto' : 24 }}>
          <TabButton active={false} label="Board" onClick={() => setCurrentView('backlog')} />
          <TabButton active label="Team" onClick={() => setCurrentView('team')} />
        </div>
      </div>

      {/* Content */}
      <TeamSection />
    </div>
  )
}

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
