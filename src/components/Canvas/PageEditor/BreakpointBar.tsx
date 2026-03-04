import { Desktop, Laptop, DeviceTablet, DeviceMobile } from '@phosphor-icons/react'
import { colors } from '../../../styles/tokens'
import type { BreakpointId } from '../../../constants/breakpoints'

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

function DesktopIcon({ active }: { active: boolean }) {
  void active
  return <Desktop size={16} weight="thin" />
}

function LaptopIcon({ active }: { active: boolean }) {
  void active
  return <Laptop size={16} weight="thin" />
}

function TabletIcon({ active }: { active: boolean }) {
  void active
  return <DeviceTablet size={16} weight="thin" />
}

function MobileIcon({ active }: { active: boolean }) {
  void active
  return <DeviceMobile size={16} weight="thin" />
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: colors.bgSurface, borderRadius: 8, padding: 3 }}>
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
              background: isActive ? colors.bgActive : 'transparent',
              color: isActive ? colors.bg : colors.textMuted,
              transition: 'all 0.1s',
              gap: 2, position: 'relative',
            }}
          >
            <bp.icon active={isActive} />
            <span style={{
              width: 3, height: 3, borderRadius: '50%',
              background: isDetected ? (isActive ? colors.bg : colors.text) : 'transparent',
              flexShrink: 0,
            }} />
          </button>
        )
      })}
    </div>
  )
}
