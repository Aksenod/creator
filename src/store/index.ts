import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, EditorMode, Artboard, CanvasElement, ElementStyles } from '../types'
import { slugify } from '../utils/slugify'

type EditorState = {
  project: Project | null
  mode: EditorMode
  activeArtboardId: string | null
  selectedElementId: string | null
  selectedElementIds: string[]

  // Проект
  createProject: (name: string) => void
  loadProject: (project: Project) => void

  // Навигация
  enterArtboard: (artboardId: string) => void
  exitArtboard: () => void

  // Выделение
  selectElement: (id: string | null) => void
  toggleSelectElement: (id: string) => void

  // Артборды
  addArtboard: (name: string) => void

  // Элементы
  updateElement: (artboardId: string, elementId: string, patch: Partial<CanvasElement>) => void
  moveElement: (artboardId: string, elementId: string, newParentId: string | null, newIndex: number) => void
  deleteElement: (artboardId: string, elementId: string) => void
  updateSelectedElements: (artboardId: string, patch: Partial<ElementStyles>) => void
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
      selectedElementIds: [],

      createProject: (name) => {
        const artboard = createDefaultArtboard('Home', 100, 100)
        const project: Project = {
          id: generateId(),
          name,
          artboards: { [artboard.id]: artboard },
          artboardOrder: [artboard.id],
        }
        set({ project, mode: 'birdseye', activeArtboardId: null, selectedElementId: null, selectedElementIds: [] })
      },

      loadProject: (project) => {
        set({ project, mode: 'birdseye', activeArtboardId: null, selectedElementId: null, selectedElementIds: [] })
      },

      enterArtboard: (artboardId) => {
        set({ mode: 'page', activeArtboardId: artboardId, selectedElementId: null, selectedElementIds: [] })
      },

      exitArtboard: () => {
        set({ mode: 'birdseye', activeArtboardId: null, selectedElementId: null, selectedElementIds: [] })
      },

      selectElement: (id) => {
        set({ selectedElementId: id, selectedElementIds: id ? [id] : [] })
      },

      toggleSelectElement: (id) => set((state) => {
        const ids = state.selectedElementIds
        const next = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
        return {
          selectedElementIds: next,
          selectedElementId: next.length > 0 ? next[next.length - 1] : null,
        }
      }),

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

      updateElement: (artboardId, elementId, patch) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        const el = ab?.elements[elementId]
        if (!ab || !el || !state.project) return state
        // Если меняется имя и className не переопределён вручную — авто-обновить slug
        const newClassName = patch.name && !patch.className
          ? slugify(patch.name)
          : (patch.className ?? el.className)
        const updated: CanvasElement = {
          ...el,
          ...patch,
          className: newClassName,
          styles: patch.styles ? { ...el.styles, ...patch.styles } : el.styles,
        }
        return {
          project: {
            ...state.project,
            artboards: {
              ...state.project.artboards,
              [artboardId]: { ...ab, elements: { ...ab.elements, [elementId]: updated } },
            },
          },
        }
      }),

      deleteElement: (artboardId, elementId) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        // Собрать все id для удаления (рекурсивно), включая все выделенные
        const toDelete = new Set<string>()
        const collect = (id: string) => {
          toDelete.add(id)
          ab.elements[id]?.children.forEach(collect)
        }
        const idsToDelete = state.selectedElementIds.length > 0 ? state.selectedElementIds : [elementId]
        idsToDelete.forEach(collect)

        // Новый elements без удалённых
        const newElements: typeof ab.elements = {}
        for (const [id, el] of Object.entries(ab.elements)) {
          if (!toDelete.has(id)) {
            newElements[id] = { ...el, children: el.children.filter(c => !toDelete.has(c)) }
          }
        }

        // Убрать из rootChildren
        const newRootChildren = ab.rootChildren.filter(id => !toDelete.has(id))

        return {
          project: {
            ...state.project,
            artboards: {
              ...state.project.artboards,
              [artboardId]: { ...ab, elements: newElements, rootChildren: newRootChildren },
            },
          },
          selectedElementId: toDelete.has(state.selectedElementId ?? '') ? null : state.selectedElementId,
          selectedElementIds: state.selectedElementIds.filter(id => !toDelete.has(id)),
        }
      }),

      updateSelectedElements: (artboardId, patch) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state
        const ids = state.selectedElementIds.length > 0 ? state.selectedElementIds : (state.selectedElementId ? [state.selectedElementId] : [])

        const newElements = { ...ab.elements }
        for (const id of ids) {
          const el = newElements[id]
          if (el) {
            newElements[id] = { ...el, styles: { ...el.styles, ...patch } }
          }
        }
        return {
          project: {
            ...state.project,
            artboards: {
              ...state.project.artboards,
              [artboardId]: { ...ab, elements: newElements },
            },
          },
        }
      }),

      moveElement: (artboardId, elementId, newParentId, newIndex) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        // Найти старого родителя
        let oldParentId: string | null = null
        if (ab.rootChildren.includes(elementId)) {
          oldParentId = null
        } else {
          for (const [pid, pel] of Object.entries(ab.elements)) {
            if (pel.children.includes(elementId)) {
              oldParentId = pid
              break
            }
          }
        }

        const elements = { ...ab.elements }

        // Удалить из старого места
        if (oldParentId === null) {
          const oldArr = ab.rootChildren.filter((id) => id !== elementId)
          // Вставить в новое место
          if (newParentId === null) {
            const newArr = [...oldArr]
            newArr.splice(newIndex, 0, elementId)
            return {
              project: {
                ...state.project,
                artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } },
              },
            }
          } else {
            const parent = elements[newParentId]
            if (!parent) return state
            const newChildren = [...parent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...parent, children: newChildren }
            return {
              project: {
                ...state.project,
                artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: oldArr } },
              },
            }
          }
        } else {
          const oldParent = elements[oldParentId]
          if (!oldParent) return state
          const oldChildren = oldParent.children.filter((id) => id !== elementId)
          elements[oldParentId] = { ...oldParent, children: oldChildren }

          if (newParentId === null) {
            const newArr = [...ab.rootChildren]
            newArr.splice(newIndex, 0, elementId)
            return {
              project: {
                ...state.project,
                artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } },
              },
            }
          } else {
            const newParent = elements[newParentId]
            if (!newParent) return state
            const newChildren = [...newParent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...newParent, children: newChildren }
            return {
              project: {
                ...state.project,
                artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: ab.rootChildren } },
              },
            }
          }
        }
      }),
    }),
    {
      name: 'creator-project',
    }
  )
)
