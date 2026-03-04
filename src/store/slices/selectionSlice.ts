import type { StateCreator } from 'zustand'
import type { EditorState, SelectionSlice } from '../types'

export const createSelectionSlice: StateCreator<EditorState, [], [], SelectionSlice> = (set) => ({
  selectedElementId: null,
  selectedElementIds: [],
  selectedArtboardIds: [],

  selectElement: (id) => {
    set({ selectedElementId: id, selectedElementIds: id ? [id] : [], selectedArtboardIds: [] })
  },

  selectElements: (ids) => {
    set({ selectedElementIds: ids, selectedElementId: ids[0] ?? null })
  },

  toggleSelectElement: (id) => set((state) => {
    const ids = state.selectedElementIds
    const next = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    return {
      selectedElementIds: next,
      selectedElementId: next.length > 0 ? next[next.length - 1] : null,
    }
  }),

  selectArtboards: (ids) => {
    set({ selectedArtboardIds: ids, selectedElementId: null, selectedElementIds: [] })
  },
})
