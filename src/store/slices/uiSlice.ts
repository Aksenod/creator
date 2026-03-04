import type { StateCreator } from 'zustand'
import type { EditorState, UiSlice } from '../types'
import type { BreakpointId } from '../../constants/breakpoints'

export const createUiSlice: StateCreator<EditorState, [], [], UiSlice> = (set) => ({
  currentView: (() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/'
    if (path === '/backlog') return 'backlog' as const
    if (path === '/team') return 'team' as const
    return 'projects' as const
  })(),
  activeBreakpointId: 'desktop' as BreakpointId,
  expandedLayers: new Set<string>(),
  gridEditElementId: null,
  editingClassId: null,

  setCurrentView: (view) => {
    const urlMap: Record<string, string> = { projects: '/', backlog: '/backlog', team: '/team', editor: '/' }
    const url = urlMap[view] || '/'
    if (window.location.pathname !== url) {
      window.history.pushState(null, '', url)
    }
    set({ currentView: view })
  },

  setActiveBreakpoint: (bpId) => set({ activeBreakpointId: bpId }),

  expandLayers: (ids) => set((state) => {
    const next = new Set(state.expandedLayers)
    ids.forEach(id => next.add(id))
    return { expandedLayers: next }
  }),

  collapseLayers: (ids) => set((state) => {
    const next = new Set(state.expandedLayers)
    ids.forEach(id => next.delete(id))
    return { expandedLayers: next }
  }),

  collapseAllLayers: () => set({ expandedLayers: new Set<string>() }),

  setGridEditElementId: (id) => set({ gridEditElementId: id }),

  setEditingClassId: (id) => set({ editingClassId: id }),
})
