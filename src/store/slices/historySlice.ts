import type { StateCreator } from 'zustand'
import type { EditorState, HistorySlice } from '../types'

export const createHistorySlice: StateCreator<EditorState, [], [], HistorySlice> = (set) => ({
  history: [],
  historyIndex: -1,
  future: [],

  undo: () => set((state) => {
    if (state.historyIndex < 0 || state.history.length === 0) return state
    const project = state.history[state.historyIndex]
    const ab = project.artboards[state.activeArtboardId ?? '']
    const elExists = (id: string | null) => id != null && ab?.elements[id] != null
    return {
      project,
      historyIndex: state.historyIndex - 1,
      future: [state.project!, ...state.future],
      selectedElementId: elExists(state.selectedElementId) ? state.selectedElementId : null,
      selectedElementIds: state.selectedElementIds.filter(id => elExists(id)),
    }
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state
    const [nextProject, ...remainingFuture] = state.future
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project!]
    const ab = nextProject.artboards[state.activeArtboardId ?? '']
    const elExists = (id: string | null) => id != null && ab?.elements[id] != null
    return {
      project: nextProject,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      future: remainingFuture,
      selectedElementId: elExists(state.selectedElementId) ? state.selectedElementId : null,
      selectedElementIds: state.selectedElementIds.filter(id => elExists(id)),
    }
  }),
})
