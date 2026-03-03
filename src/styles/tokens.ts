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

export const typography = {
  xs:    { fontSize: 10, lineHeight: 1.4, fontWeight: '400' },
  sm:    { fontSize: 11, lineHeight: 1.4, fontWeight: '400' },
  base:  { fontSize: 12, lineHeight: 1.5, fontWeight: '400' },
  md:    { fontSize: 13, lineHeight: 1.5, fontWeight: '500' },
  lg:    { fontSize: 14, lineHeight: 1.5, fontWeight: '400' },
  xl:    { fontSize: 16, lineHeight: 1.4, fontWeight: '600' },
  '2xl': { fontSize: 22, lineHeight: 1.3, fontWeight: '700' },
  '3xl': { fontSize: 28, lineHeight: 1.2, fontWeight: '700' },
} as const

export const spacing = {
  xxs: 2, xs: 4, sm: 6, md: 8, lg: 12,
  xl: 16, '2xl': 24, '3xl': 32, '4xl': 48,
} as const

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0,0,0,0.05)',
  sm: '0 2px 8px rgba(0,0,0,0.06)',
  md: '0 4px 16px rgba(0,0,0,0.10)',
  lg: '0 8px 24px -2px rgba(0,0,0,0.09)',
  xl: '0 8px 32px rgba(0,0,0,0.15)',
} as const

export const transitions = {
  fast: '0.1s', normal: '0.15s', slow: '0.25s',
  easing: 'ease', easingOut: 'ease-out',
} as const

export const zIndex = {
  base: 1, dropdown: 100, popover: 200,
  overlay: 1000, modal: 2000, toast: 9999, top: 10000,
} as const
