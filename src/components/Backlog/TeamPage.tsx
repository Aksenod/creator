import { useEditorStore } from '../../store'
import { TeamSection } from './TeamSection'
import { colors, shadows } from '../../styles/tokens'
import { ArrowLeft } from '@phosphor-icons/react'
import type { ResponsiveMode } from '../../types/responsive'

export function TeamPage({ responsiveMode }: { responsiveMode: ResponsiveMode }) {
  const setCurrentView = useEditorStore(s => s.setCurrentView)

  const isMobile = responsiveMode === 'mobile'
  const isTablet = responsiveMode === 'tablet'
  const isDesktop = responsiveMode === 'desktop'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100vh',
      background: colors.bgSurface,
    }}>
      {/* Header */}
      {isMobile ? (
        <>
          {/* Mobile header */}
          <div style={{
            height: 48, background: colors.bg,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center',
            padding: '0 16px', flexShrink: 0,
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                onClick={() => setCurrentView('projects')}
                style={{ cursor: 'pointer', color: colors.textSecondary, display: 'flex', alignItems: 'center' }}
              >
                <ArrowLeft size={18} weight="thin" />
              </span>
              <span style={{ fontWeight: 600, fontSize: 15, color: colors.text }}>Team</span>
            </div>
          </div>
          {/* Mobile tabs bar */}
          <div style={{
            height: 40, background: colors.bg,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center',
            padding: '0 12px', flexShrink: 0,
          }}>
            <MobileTabButton active={false} label="Board" onClick={() => setCurrentView('backlog')} />
            <MobileTabButton active label="Team" onClick={() => setCurrentView('team')} />
          </div>
        </>
      ) : (
        /* Desktop / Tablet header */
        <div style={{
          height: isTablet ? 52 : 56,
          background: colors.bg,
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
              <ArrowLeft size={isTablet ? 18 : 14} weight="thin" />
              {isDesktop && <span>Projects</span>}
            </div>
            {isDesktop && <span style={{ color: colors.textMuted, fontSize: 13 }}>/</span>}
            <span style={{ fontWeight: 600, fontSize: isTablet ? 15 : 14, color: colors.text }}>
              Team
            </span>
          </div>

          {/* Center: Segmented pill tabs — absolute center */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <SegmentedTabs
              active="team"
              onTabChange={(tab) => setCurrentView(tab === 'board' ? 'backlog' : 'team')}
            />
          </div>

          {/* Right spacer */}
          <div style={{ width: 120 }} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TeamSection />
      </div>
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
            background: active === tab ? colors.bg : 'transparent',
            border: 'none', borderRadius: 6,
            padding: '6px 16px', cursor: 'pointer',
            fontSize: 12,
            fontWeight: active === tab ? 600 : 400,
            color: active === tab ? colors.text : colors.textMuted,
            boxShadow: active === tab ? shadows.xs : 'none',
            transition: 'all 0.15s',
          }}
        >
          {tab === 'board' ? 'Board' : 'Team'}
        </button>
      ))}
    </div>
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
