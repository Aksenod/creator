import type { BreakpointId } from '../../../constants/breakpoints'

// --- SVG icons ---

function DesktopIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function LaptopIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 13h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function TabletIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="13" r="0.8" fill="currentColor" />
    </svg>
  )
}

function MobileIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="4.5" y="1" width="7" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="13" r="0.7" fill="currentColor" />
    </svg>
  )
}

// --- Types ---

type BreakpointIcon = (props: { active: boolean }) => JSX.Element

export type Breakpoint = {
  id: string
  label: string
  width: number
  icon: BreakpointIcon
  isBase?: boolean
  cascade: 'up' | 'down' | 'both'
  tooltip: string
}

export const BREAKPOINTS: Breakpoint[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    width: 1440,
    icon: DesktopIcon,
    isBase: true,
    cascade: 'both',
    tooltip: 'Desktop: ✳ Base breakpoint\nСтили Desktop применяются на всех брейкпоинтах, если не переопределены на другом. Начинай дизайн здесь.',
  },
  {
    id: 'laptop',
    label: 'Laptop',
    width: 1280,
    icon: LaptopIcon,
    cascade: 'down',
    tooltip: 'Laptop — 1280px\nСтили каскадируют вниз от Desktop.',
  },
  {
    id: 'tablet',
    label: 'Tablet',
    width: 768,
    icon: TabletIcon,
    cascade: 'down',
    tooltip: 'Tablet — 768px\nПереопредели стили Desktop для планшетов.',
  },
  {
    id: 'mobile',
    label: 'Mobile',
    width: 375,
    icon: MobileIcon,
    cascade: 'down',
    tooltip: 'Mobile — 375px\nПереопредели стили для мобильных устройств.',
  },
]

// Определяем по реальному разрешению экрана пользователя
export const detectBreakpoint = (): number => {
  const w = window.screen.width
  if (w >= 1440) return 1440
  if (w >= 1280) return 1280
  if (w >= 768) return 768
  return 375
}

type Props = {
  activeBreakpointId: BreakpointId
  detectedWidth: number
  onSelect: (bp: Breakpoint) => void
}

export function BreakpointBar({ activeBreakpointId, detectedWidth, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f0f0f0', borderRadius: 8, padding: 3 }}>
      {BREAKPOINTS.map((bp, idx) => {
        const isActive = activeBreakpointId === bp.id
        const isDetected = bp.width === detectedWidth
        return (
          <button
            key={bp.id}
            title={bp.tooltip + (isDetected ? '\n· Твой экран' : '') + `\nShortcut: ${idx + 1}`}
            onClick={() => onSelect(bp)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer',
              background: isActive ? '#1a1a1a' : 'transparent',
              color: isActive ? '#fff' : '#888',
              transition: 'all 0.1s',
              gap: 2, position: 'relative',
            }}
          >
            {bp.isBase ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <bp.icon active={isActive} />
                <span style={{ fontSize: 8, lineHeight: 1, color: isActive ? '#aaa' : '#bbb', fontWeight: 700 }}>✳</span>
              </div>
            ) : (
              <bp.icon active={isActive} />
            )}
            <span style={{
              width: 3, height: 3, borderRadius: '50%',
              background: isDetected ? (isActive ? '#fff' : '#1a1a1a') : 'transparent',
              flexShrink: 0,
            }} />
          </button>
        )
      })}
    </div>
  )
}
