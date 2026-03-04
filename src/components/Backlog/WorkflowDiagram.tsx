import { colors, radius } from '../../styles/tokens'

interface Phase {
  number: number
  name: string
  agents: string[]
  description: string
  isGate?: boolean
  gateLabel?: string
}

const PHASES: Phase[] = [
  {
    number: 0,
    name: 'Benchmark',
    agents: ['Competitor Analyst'],
    description: 'Исследование конкурентов: Figma, Webflow, Framer',
  },
  {
    number: 1,
    name: 'Research',
    agents: ['Researcher'],
    description: 'Анализ кодовой базы, поиск паттернов и компонентов',
  },
  {
    number: 2,
    name: 'Architecture',
    agents: ['Architect', 'Layout Engineer'],
    description: 'План реализации, layout-стратегия, edge cases',
    isGate: true,
    gateLabel: 'Одобрение плана',
  },
  {
    number: 3,
    name: 'Design',
    agents: ['Designer'],
    description: 'Мокап .pen → скриншот → согласование',
    isGate: true,
    gateLabel: 'Design Review',
  },
  {
    number: 4,
    name: 'Implementation',
    agents: ['PM', 'Layout Engineer'],
    description: 'Код в worktree, layout-first подход',
  },
  {
    number: 5,
    name: 'Unit Tests',
    agents: ['Unit Test Engineer'],
    description: 'Извлечение логики, vitest, edge cases',
  },
  {
    number: 6,
    name: 'Code Review',
    agents: ['Code Reviewer', 'Layout Engineer'],
    description: 'Качество, DRY, паттерны, null safety',
  },
  {
    number: 7,
    name: 'Testing',
    agents: ['Tester'],
    description: 'tsc → vitest → Playwright → E2E',
    isGate: true,
    gateLabel: 'Code Review',
  },
  {
    number: 8,
    name: 'User Review',
    agents: ['PM'],
    description: 'Проверка пользователем в браузере',
    isGate: true,
    gateLabel: 'Одобрение пользователя',
  },
  {
    number: 9,
    name: 'Merge & Deploy',
    agents: ['PM'],
    description: 'Мерж → build → vercel --prod → memory',
  },
]

const AGENT_COLORS: Record<string, string> = {
  PM: '#0a0a0a',
  Researcher: '#525252',
  'Competitor Analyst': '#737373',
  Architect: '#D71921',
  Designer: '#A3A3A3',
  'Layout Engineer': '#404040',
  'Code Reviewer': '#8C8C8C',
  'Unit Test Engineer': '#595959',
  Tester: '#6B6B6B',
}

export function WorkflowDiagram() {
  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors.accentRed,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: colors.text,
            letterSpacing: '0.02em',
          }}
        >
          Pipeline
        </span>
        <span style={{ fontSize: 11, color: colors.textMuted }}>
          10 phases · 4 gates
        </span>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {PHASES.map((phase, i) => (
          <div key={phase.number}>
            {/* Gate separator */}
            {phase.isGate && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '2px 0 2px 13px',
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 2,
                    background: colors.accentRed,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(to right, ${colors.accentRed}40, transparent)`,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: colors.accentRed,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.03em',
                  }}
                >
                  {phase.gateLabel}
                </span>
              </div>
            )}

            {/* Phase row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                position: 'relative',
                paddingBottom: i < PHASES.length - 1 ? 0 : 0,
              }}
            >
              {/* Timeline column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  width: 32,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: phase.number <= 3 ? colors.text : colors.textSecondary,
                    border: `2px solid ${colors.bg}`,
                    boxShadow: `0 0 0 1px ${phase.number <= 3 ? colors.text : colors.borderStrong}`,
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                />
                {/* Line */}
                {i < PHASES.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 24,
                      background: colors.border,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  paddingBottom: i < PHASES.length - 1 ? 12 : 0,
                  minWidth: 0,
                }}
              >
                {/* Phase header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginTop: -2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: colors.textMuted,
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {phase.number}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: colors.text,
                    }}
                  >
                    {phase.name}
                  </span>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {phase.description}
                </div>

                {/* Agent badges */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    marginTop: 6,
                  }}
                >
                  {phase.agents.map(agent => (
                    <span
                      key={agent}
                      style={{
                        fontSize: 10,
                        color: colors.bg,
                        background: AGENT_COLORS[agent] || colors.textSecondary,
                        borderRadius: radius.pill,
                        padding: '2px 8px',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 20,
          padding: 12,
          background: colors.bgSurface,
          borderRadius: radius.lg,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: colors.textMuted,
            fontWeight: 500,
            marginRight: 4,
          }}
        >
          Agents:
        </span>
        {Object.entries(AGENT_COLORS).map(([name, color]) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
              }}
            />
            <span style={{ fontSize: 10, color: colors.textSecondary }}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
