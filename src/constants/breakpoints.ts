// Shared breakpoint definitions (используется в store, Canvas, PageEditor, Properties)

export type BreakpointId = 'desktop' | 'laptop' | 'tablet' | 'mobile'

// Порядок от базового вниз (cascade direction: вниз к меньшим экранам)
export const BREAKPOINT_ORDER: BreakpointId[] = ['desktop', 'laptop', 'tablet', 'mobile']

export const BREAKPOINT_WIDTHS: Record<BreakpointId, number> = {
  desktop: 1440,
  laptop: 1280,
  tablet: 768,
  mobile: 375,
}

export const BREAKPOINT_LABELS: Record<BreakpointId, string> = {
  desktop: 'Desktop',
  laptop: 'Laptop',
  tablet: 'Tablet',
  mobile: 'Mobile',
}

// Cascade chain: от desktop вниз до activeBpId (не включая desktop, т.к. это base)
// Пример: getCascadeChain('tablet') → ['laptop', 'tablet']
// При разрешении стилей: base + laptop overrides + tablet overrides = effective
export function getCascadeChain(activeBpId: BreakpointId): BreakpointId[] {
  const idx = BREAKPOINT_ORDER.indexOf(activeBpId)
  if (idx <= 0) return [] // desktop = base, нет overrides выше
  return BREAKPOINT_ORDER.slice(1, idx + 1) // ['laptop'], ['laptop','tablet'], etc.
}
