import type { StateCreator } from 'zustand'
import type { EditorState, ArtboardSlice } from '../types'
import type { Project } from '../../types'
import { pushHistory } from '../helpers'
import { createDefaultArtboard } from './projectSlice'

export const createArtboardSlice: StateCreator<EditorState, [], [], ArtboardSlice> = (set) => ({
  activeArtboardId: null,

  enterArtboard: (artboardId) => {
    set({ activeArtboardId: artboardId, selectedElementId: null, selectedElementIds: [] })
  },

  setActiveArtboard: (id) => set((state) => {
    if (state.activeArtboardId === id) return {}
    return { activeArtboardId: id, selectedElementId: null, selectedElementIds: [], selectedArtboardIds: [] }
  }),

  addArtboard: (name) => set((state) => {
    if (!state.project) return state
    const order = state.project.artboardOrder
    const lastId = order[order.length - 1]
    const lastAb = lastId ? state.project.artboards[lastId] : null
    const x = lastAb ? lastAb.x + lastAb.width + 100 : 100
    const y = lastAb ? lastAb.y : 100
    const artboard = createDefaultArtboard(name, x, y)
    const newProject: Project = {
      ...state.project,
      artboards: { ...state.project.artboards, [artboard.id]: artboard },
      artboardOrder: [...state.project.artboardOrder, artboard.id],
      updatedAt: Date.now(),
    }
    return pushHistory(state.history, state.historyIndex, state.project, newProject)
  }),

  deleteArtboard: (id) => set((state) => {
    if (!state.project) return state
    const order = state.project.artboardOrder
    if (order.length <= 1) return state

    const { [id]: _, ...remainingArtboards } = state.project.artboards
    const newOrder = order.filter(aid => aid !== id)
    const newActiveId = state.activeArtboardId === id ? newOrder[0] : state.activeArtboardId

    const newProject: Project = {
      ...state.project,
      artboards: remainingArtboards,
      artboardOrder: newOrder,
      updatedAt: Date.now(),
    }
    return {
      ...pushHistory(state.history, state.historyIndex, state.project, newProject),
      activeArtboardId: newActiveId,
      selectedElementId: null,
      selectedElementIds: [],
    }
  }),

  moveArtboard: (id, x, y) => set((state) => {
    const ab = state.project?.artboards[id]
    if (!ab || !state.project) return state
    const newProject: Project = {
      ...state.project,
      artboards: { ...state.project.artboards, [id]: { ...ab, x, y } },
      updatedAt: Date.now(),
    }
    return pushHistory(state.history, state.historyIndex, state.project, newProject)
  }),

  moveArtboardTemp: (id, x, y) => set((state) => {
    const ab = state.project?.artboards[id]
    if (!ab || !state.project) return state
    return {
      project: {
        ...state.project,
        artboards: { ...state.project.artboards, [id]: { ...ab, x, y } },
      },
    }
  }),

  updateArtboard: (id, patch) => set((state) => {
    const ab = state.project?.artboards[id]
    if (!ab || !state.project) return state
    const newProject: Project = {
      ...state.project,
      artboards: { ...state.project.artboards, [id]: { ...ab, ...patch } },
      updatedAt: Date.now(),
    }
    return pushHistory(state.history, state.historyIndex, state.project, newProject)
  }),

  updateCanvasSettings: (patch) => set((state) => {
    if (!state.project) return state
    const newProject: Project = {
      ...state.project,
      ...patch,
      updatedAt: Date.now(),
    }
    return pushHistory(state.history, state.historyIndex, state.project, newProject)
  }),
})
