// Nothing Phone Design Tokens — монохромная палитра

export const colors = {
  text: '#0a0a0a',
  textSecondary: '#737373',
  textMuted: '#a3a3a3',
  textHint: '#a3a3a3',
  textDisabled: '#d4d4d4',

  accent: '#0a0a0a',
  accentHover: '#262626',
  accentSubtle: '#e5e5e5',

  // Accent colors (from design mockup)
  accentRed: '#D71921',
  accentRedLight: '#FEF2F2',
  accentGreen: '#16A34A',
  accentGreenLight: '#F0FDF4',
  accentAmber: '#D97706',
  accentAmberLight: '#FFFBEB',
  accentBlue: '#2563EB',
  accentBlueLight: '#EFF6FF',
  accentPurple: '#7C3AED',
  accentPurpleLight: '#F5F3FF',

  bg: '#ffffff',
  bgControl: '#f5f5f5',
  bgActive: '#0a0a0a',
  bgPage: '#FFFFFF',
  bgSurface: '#F5F5F5',
  bgCard: '#FFFFFF',
  bgHover: '#FAFAFA',

  border: '#e5e5e5',
  borderStrong: '#D4D4D4',
  borderFocus: '#0a0a0a',
} as const

export const statusColors: Record<string, string> = {
  backlog: '#A3A3A3',
  todo: '#0A0A0A',
  in_progress: '#D71921',
  design_review: '#7C3AED',
  code_review: '#2563EB',
  done: '#16A34A',
}

export const priorityColors: Record<string, string> = {
  critical: '#D71921',
  high: '#D97706',
  medium: '#2563EB',
  low: '#A3A3A3',
}

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  pill: 9999,
} as const
