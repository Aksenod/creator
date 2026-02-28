import { useEffect } from 'react'
import { useEditorStore } from '../store'
import type { BreakpointId } from '../constants/breakpoints'

type Breakpoint = {
  id: string
  width: number
}

type Options = {
  isPreview: boolean
  showCanvasSettings: boolean
  selectedElementId: string | null
  activeArtboardId: string | null
  BREAKPOINTS: Breakpoint[]
  onExitArtboard: () => void
  onClosePreview: () => void
  onCloseSettings: () => void
  onSetViewportWidth: (w: number) => void
  onClearCustomWidth: () => void
}

export function usePageEditorKeyboard({
  isPreview,
  showCanvasSettings,
  selectedElementId,
  activeArtboardId,
  BREAKPOINTS,
  onExitArtboard,
  onClosePreview,
  onCloseSettings,
  onSetViewportWidth,
  onClearCustomWidth,
}: Options) {
  const { deleteElement, undo, copyElement, pasteElement, duplicateElement, setActiveBreakpoint } = useEditorStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCanvasSettings) { onCloseSettings(); return }
        if (isPreview) onClosePreview()
        else onExitArtboard()
      }

      // Keyboard shortcuts для брейкпоинтов (1-4), только если не в input
      const tag = (e.target as HTMLElement).tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        const idx = parseInt(e.key) - 1
        if (idx >= 0 && idx < BREAKPOINTS.length) {
          const bp = BREAKPOINTS[idx]
          onSetViewportWidth(bp.width)
          onClearCustomWidth()
          setActiveBreakpoint(bp.id as BreakpointId)
          return
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && activeArtboardId) {
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          deleteElement(activeArtboardId, selectedElementId)
        }
      }

      const isMac = navigator.platform.includes('Mac')
      const mod = isMac ? e.metaKey : e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && e.key === 'c') { e.preventDefault(); copyElement() }
      if (mod && e.key === 'v') { e.preventDefault(); pasteElement() }
      if (mod && e.key === 'd') { e.preventDefault(); e.stopPropagation(); duplicateElement() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    isPreview, showCanvasSettings, selectedElementId, activeArtboardId, BREAKPOINTS,
    onExitArtboard, onClosePreview, onCloseSettings, onSetViewportWidth, onClearCustomWidth,
    deleteElement, undo, copyElement, pasteElement, duplicateElement, setActiveBreakpoint,
  ])
}
