import { useState } from 'react'
import { teamMembers, type TeamMember } from './teamData'
import { colors, shadows } from '../../styles/tokens'
import { WorkflowDiagram } from './WorkflowDiagram'

const STATUS_COLORS: Record<string, string> = {
  active: colors.text,
  busy: colors.textSecondary,
  offline: colors.textDisabled,
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [imgError, setImgError] = useState(false)

  const initials = member.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = colors.borderStrong
        e.currentTarget.style.boxShadow = shadows.sm
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = colors.border
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top row: avatar + name/role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0, width: 40, height: 40 }}>
          {!imgError ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              onError={() => setImgError(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                objectFit: 'cover',
                background: colors.bgSurface,
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: colors.bgSurface,
                color: colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {initials}
            </div>
          )}
          {/* Status dot — top-right */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: STATUS_COLORS[member.status],
              border: `2px solid ${colors.bg}`,
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, lineHeight: 1.3 }}>
            {member.name}
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.3, marginTop: 2 }}>
            {member.role}
          </div>
        </div>
      </div>

      {/* Info row: location · specialty */}
      <div style={{ fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{member.location}</span>
        <span>·</span>
        <span>{member.specialty}</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: colors.bgSurface }} />

      {/* Bio */}
      <div
        style={{
          fontSize: 11,
          color: colors.textMuted,
          lineHeight: 1.4,
        }}
      >
        {member.bio}
      </div>
    </div>
  )
}

export function TeamSection() {
  const activeCount = teamMembers.filter(m => m.status !== 'offline').length
  const totalCount = teamMembers.length

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      {/* Stats row */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.text }} />
        <span style={{ fontSize: 12, color: colors.textSecondary }}>
          {activeCount} / {totalCount} online
        </span>
        <div style={{
          width: 80, height: 4, borderRadius: 2, background: colors.bgSurface,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(activeCount / totalCount) * 100}%`,
            height: '100%',
            background: colors.text,
            borderRadius: 2,
          }} />
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {teamMembers.map(member => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: colors.border, margin: '24px 0' }} />

      {/* Workflow Diagram */}
      <WorkflowDiagram />
    </div>
  )
}
