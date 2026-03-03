import { useState } from 'react'
import { teamMembers, type TeamMember } from './teamData'

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  busy: '#f59e0b',
  offline: '#d4d4d4',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Online',
  busy: 'Busy',
  offline: 'Offline',
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
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 12,
        padding: 20,
        transition: 'box-shadow 0.15s, transform 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Avatar + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {!imgError ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              onError={() => setImgError(true)}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
                background: '#f5f5f5',
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#0a0a0a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {initials}
            </div>
          )}
          {/* Status dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: STATUS_COLORS[member.status],
              border: '2px solid #fff',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a', lineHeight: 1.3 }}>
            {member.name}
          </div>
          <div style={{ fontSize: 12, color: '#525252', lineHeight: 1.3, marginTop: 2 }}>
            {member.role}
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, color: '#737373', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{member.flag}</span>
          <span>{member.location}</span>
        </div>
        <div style={{ fontSize: 11, color: '#a3a3a3' }}>
          {member.specialty}
        </div>
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: STATUS_COLORS[member.status],
          }}
        />
        <span style={{ fontSize: 11, color: '#a3a3a3' }}>
          {STATUS_LABELS[member.status]}
        </span>
      </div>

      {/* Bio */}
      <div
        style={{
          fontSize: 12,
          color: '#525252',
          lineHeight: 1.5,
          paddingTop: 8,
          borderTop: '1px solid #f5f5f5',
        }}
      >
        {member.bio}
      </div>
    </div>
  )
}

export function TeamSection() {
  const activeCount = teamMembers.filter(m => m.status === 'active').length
  const totalCount = teamMembers.length

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      {/* Stats */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 13, color: '#737373' }}>
          {activeCount} / {totalCount} online
        </span>
        <div style={{
          width: 80, height: 4, borderRadius: 2, background: '#f5f5f5',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(activeCount / totalCount) * 100}%`,
            height: '100%',
            background: '#22c55e',
            borderRadius: 2,
          }} />
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {teamMembers.map(member => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
