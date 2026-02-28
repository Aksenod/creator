import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, EditorMode, Artboard } from '../types'

type EditorState = {
  project: Project | null
  mode: EditorMode
  activeArtboardId: string | null
  selectedElementId: string | null

  // Проект
  createProject: (name: string) => void
  loadProject: (project: Project) => void

  // Навигация
  enterArtboard: (artboardId: string) => void
  exitArtboard: () => void

  // Выделение
  selectElement: (id: string | null) => void

  // Артборды
  addArtboard: (name: string) => void
}

const generateId = () => Math.random().toString(36).slice(2, 10)

const createDefaultArtboard = (name: string, x = 0, y = 0): Artboard => ({
  id: generateId(),
  name,
  width: 1440,
  height: 900,
  x,
  y,
  elements: {},
  rootChildren: [],
})

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      project: null,
      mode: 'birdseye',
      activeArtboardId: null,
      selectedElementId: null,

      createProject: (name) => {
        const artboard = createDefaultArtboard('Home', 100, 100)
        const project: Project = {
          id: generateId(),
          name,
          artboards: { [artboard.id]: artboard },
          artboardOrder: [artboard.id],
        }
        set({ project, mode: 'birdseye', activeArtboardId: null, selectedElementId: null })
      },

      loadProject: (project) => {
        set({ project, mode: 'birdseye', activeArtboardId: null, selectedElementId: null })
      },

      enterArtboard: (artboardId) => {
        set({ mode: 'page', activeArtboardId: artboardId, selectedElementId: null })
      },

      exitArtboard: () => {
        set({ mode: 'birdseye', activeArtboardId: null, selectedElementId: null })
      },

      selectElement: (id) => {
        set({ selectedElementId: id })
      },

      addArtboard: (name) => {
        set((state) => {
          if (!state.project) return state
          const artboard = createDefaultArtboard(name, 100 + state.project.artboardOrder.length * 1600, 100)
          return {
            project: {
              ...state.project,
              artboards: { ...state.project.artboards, [artboard.id]: artboard },
              artboardOrder: [...state.project.artboardOrder, artboard.id],
            },
          }
        })
      },
    }),
    {
      name: 'creator-project',
    }
  )
)
