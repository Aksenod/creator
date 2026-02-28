import type React from 'react'

export const getCSSPosition = (mode: string): React.CSSProperties['position'] => {
  if (mode === 'static' || mode === 'flow') return 'static'
  if (mode === 'relative') return 'relative'
  if (mode === 'absolute' || mode === 'pinned') return 'absolute'
  if (mode === 'fixed') return 'fixed'
  if (mode === 'sticky') return 'sticky'
  return 'static'
}
