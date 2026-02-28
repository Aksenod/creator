import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, EditorMode, Artboard, CanvasElement, ElementStyles } from '../types'
import { type BreakpointId } from '../constants/breakpoints'
import { slugify } from '../utils/slugify'

type EditorState = {
  project: Project | null
  mode: EditorMode
  activeArtboardId: string | null
  selectedElementId: string | null
  selectedElementIds: string[]
  activeBreakpointId: BreakpointId  // Текущий редактируемый брейкпоинт

  // История для undo/redo (не персистируется)
  history: Project[]
  historyIndex: number

  // Clipboard (не персистируется)
  clipboard: { element: CanvasElement; descendants: Record<string, CanvasElement> } | null

  // Проект
  createProject: (name: string) => void
  loadProject: (project: Project) => void

  // Навигация
  enterArtboard: (artboardId: string) => void
  exitArtboard: () => void

  // Выделение
  selectElement: (id: string | null) => void
  toggleSelectElement: (id: string) => void

  // Брейкпоинты
  setActiveBreakpoint: (bpId: BreakpointId) => void

  // Артборды
  addArtboard: (name: string) => void

  // Элементы
  updateElement: (artboardId: string, elementId: string, patch: Partial<CanvasElement>) => void
  moveElement: (artboardId: string, elementId: string, newParentId: string | null, newIndex: number) => void
  deleteElement: (artboardId: string, elementId: string) => void
  updateSelectedElements: (artboardId: string, patch: Partial<ElementStyles>) => void
  // Удалить все BP-переопределения элемента для конкретного BP
  clearBreakpointStyle: (artboardId: string, elementId: string, bpId: BreakpointId) => void

  // Undo/Redo
  undo: () => void
  redo: () => void

  // Clipboard
  copyElement: () => void
  pasteElement: () => void
  duplicateElement: () => void
}

const generateId = () => Math.random().toString(36).slice(2, 10)

// Найти родителя элемента (null = корень артборда)
const findParentId = (ab: Artboard, id: string): string | null => {
  if (ab.rootChildren.includes(id)) return null
  for (const [pid, pel] of Object.entries(ab.elements)) {
    if (pel.children.includes(id)) return pid
  }
  return null
}

// Типы-контейнеры, которые принимают дочерние элементы
const CONTAINER_TYPES = ['div', 'section']

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
      activeBreakpointId: 'desktop' as BreakpointId,
      history: [],
      historyIndex: -1,
      clipboard: null,

      createProject: (name) => {
        const artboard = createDefaultArtboard('Home', 100, 100)
        const project: Project = {
          id: generateId(),
          name,
          artboards: { [artboard.id]: artboard },
          artboardOrder: [artboard.id],
        }
        set({ project, mode: 'birdseye', activeArtboardId: null, selectedElementId: null, selectedElementIds: [], history: [], historyIndex: -1 })
      },

      loadProject: (project) => {
        set({ project, mode: 'birdseye', activeArtboardId: null, selectedElementId: null, selectedElementIds: [], history: [], historyIndex: -1 })
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

      setActiveBreakpoint: (bpId) => set({ activeBreakpointId: bpId }),

      addArtboard: (name) => {
        set((state) => {
          if (!state.project) return state
          const artboard = createDefaultArtboard(name, 100 + state.project.artboardOrder.length * 1600, 100)
          const newProject = {
            ...state.project,
            artboards: { ...state.project.artboards, [artboard.id]: artboard },
            artboardOrder: [...state.project.artboardOrder, artboard.id],
          }
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project].slice(-50)
          return {
            project: newProject,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          }
        })
      },

      updateElement: (artboardId, elementId, patch) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        const el = ab?.elements[elementId]
        if (!ab || !el || !state.project) return state

        const newClassName = patch.name && !patch.className
          ? slugify(patch.name)
          : (patch.className ?? el.className)

        const activeBpId = state.activeBreakpointId

        let updated: CanvasElement
        if (patch.styles && activeBpId !== 'desktop') {
          // На не-базовом BP: стили пишем в breakpointStyles[bpId], не в base
          // Не-стилевые поля (name, className, positionMode) всегда в base
          const { styles: stylesPatch, ...nonStylePatch } = patch
          updated = {
            ...el,
            ...nonStylePatch,
            className: newClassName,
            breakpointStyles: {
              ...el.breakpointStyles,
              [activeBpId]: {
                ...el.breakpointStyles?.[activeBpId],
                ...stylesPatch,
              },
            },
          }
        } else {
          // Desktop (base) или не-стилевые изменения: пишем в base styles
          updated = {
            ...el,
            ...patch,
            className: newClassName,
            styles: patch.styles ? { ...el.styles, ...patch.styles } : el.styles,
          }
        }

        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: { ...ab.elements, [elementId]: updated } },
          },
        }
        const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project].slice(-50)
        return {
          project: newProject,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        }
      }),

      clearBreakpointStyle: (artboardId, elementId, bpId) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        const el = ab?.elements[elementId]
        if (!ab || !el || !state.project) return state

        const newBpStyles = { ...el.breakpointStyles }
        delete newBpStyles[bpId]

        const updated: CanvasElement = { ...el, breakpointStyles: newBpStyles }
        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: { ...ab.elements, [elementId]: updated } },
          },
        }
        const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project].slice(-50)
        return { project: newProject, history: newHistory, historyIndex: newHistory.length - 1 }
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

        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements, rootChildren: newRootChildren },
          },
        }
        const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project].slice(-50)
        return {
          project: newProject,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          selectedElementId: toDelete.has(state.selectedElementId ?? '') ? null : state.selectedElementId,
          selectedElementIds: state.selectedElementIds.filter(id => !toDelete.has(id)),
        }
      }),

      updateSelectedElements: (artboardId, patch) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state
        const ids = state.selectedElementIds.length > 0 ? state.selectedElementIds : (state.selectedElementId ? [state.selectedElementId] : [])
        const activeBpId = state.activeBreakpointId

        const newElements = { ...ab.elements }
        for (const id of ids) {
          const el = newElements[id]
          if (el) {
            if (activeBpId !== 'desktop') {
              newElements[id] = {
                ...el,
                breakpointStyles: {
                  ...el.breakpointStyles,
                  [activeBpId]: { ...el.breakpointStyles?.[activeBpId], ...patch },
                },
              }
            } else {
              newElements[id] = { ...el, styles: { ...el.styles, ...patch } }
            }
          }
        }
        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements },
          },
        }
        const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project].slice(-50)
        return {
          project: newProject,
          history: newHistory,
          historyIndex: newHistory.length - 1,
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

        const saveHistory = (newProject: Project) => {
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project!].slice(-50)
          return { project: newProject, history: newHistory, historyIndex: newHistory.length - 1 }
        }

        // Удалить из старого места
        if (oldParentId === null) {
          const oldArr = ab.rootChildren.filter((id) => id !== elementId)
          // Вставить в новое место
          if (newParentId === null) {
            const newArr = [...oldArr]
            newArr.splice(newIndex, 0, elementId)
            return saveHistory({
              ...state.project,
              artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } },
            })
          } else {
            const parent = elements[newParentId]
            if (!parent) return state
            const newChildren = [...parent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...parent, children: newChildren }
            return saveHistory({
              ...state.project,
              artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: oldArr } },
            })
          }
        } else {
          const oldParent = elements[oldParentId]
          if (!oldParent) return state
          const oldChildren = oldParent.children.filter((id) => id !== elementId)
          elements[oldParentId] = { ...oldParent, children: oldChildren }

          if (newParentId === null) {
            const newArr = [...ab.rootChildren]
            newArr.splice(newIndex, 0, elementId)
            return saveHistory({
              ...state.project,
              artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } },
            })
          } else {
            const newParent = elements[newParentId]
            if (!newParent) return state
            const newChildren = [...newParent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...newParent, children: newChildren }
            return saveHistory({
              ...state.project,
              artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: ab.rootChildren } },
            })
          }
        }
      }),

      undo: () => set((state) => {
        if (state.historyIndex < 0 || state.history.length === 0) return state
        const project = state.history[state.historyIndex]
        return {
          project,
          historyIndex: state.historyIndex - 1,
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),

      redo: () => set((state) => {
        // Redo не реализован полноценно (нужен future stack), заглушка
        return state
      }),

      copyElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        const id = state.selectedElementId
        if (!ab || !id || !ab.elements[id]) return state

        // Собрать элемент и всех потомков
        const descendants: Record<string, CanvasElement> = {}
        const collect = (eid: string) => {
          const el = ab.elements[eid]
          if (!el) return
          descendants[eid] = el
          el.children.forEach(collect)
        }
        collect(id)

        return { clipboard: { element: ab.elements[id], descendants } }
      }),

      pasteElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        if (!ab || !state.clipboard || !state.project) return state

        // Создать новые ID для всех элементов
        const idMap: Record<string, string> = {}
        const genId = () => Math.random().toString(36).slice(2, 10)

        Object.keys(state.clipboard.descendants).forEach(oldId => {
          idMap[oldId] = genId()
        })

        // Клонировать с новыми ID
        const newElements: Record<string, CanvasElement> = {}
        Object.entries(state.clipboard.descendants).forEach(([oldId, el]) => {
          const newId = idMap[oldId]
          newElements[newId] = {
            ...el,
            id: newId,
            name: el.id === state.clipboard!.element.id ? el.name + ' (copy)' : el.name,
            children: el.children.map(c => idMap[c] ?? c),
          }
        })

        const newRootId = idMap[state.clipboard.element.id]
        const mergedElements = { ...ab.elements, ...newElements }

        const selectedEl = state.selectedElementId ? ab.elements[state.selectedElementId] : null
        let newAb: Artboard

        if (selectedEl && CONTAINER_TYPES.includes(selectedEl.type)) {
          // Вставить внутрь выбранного контейнера
          mergedElements[selectedEl.id] = {
            ...selectedEl,
            children: [...selectedEl.children, newRootId],
          }
          newAb = { ...ab, elements: mergedElements }
        } else if (selectedEl) {
          // Вставить рядом с выбранным элементом (тот же родитель)
          const parentId = findParentId(ab, selectedEl.id)
          if (parentId) {
            const parent = mergedElements[parentId]
            const idx = parent.children.indexOf(selectedEl.id)
            const newChildren = [...parent.children]
            newChildren.splice(idx + 1, 0, newRootId)
            mergedElements[parentId] = { ...parent, children: newChildren }
            newAb = { ...ab, elements: mergedElements }
          } else {
            const idx = ab.rootChildren.indexOf(selectedEl.id)
            const newRoot = [...ab.rootChildren]
            newRoot.splice(idx + 1, 0, newRootId)
            newAb = { ...ab, elements: mergedElements, rootChildren: newRoot }
          }
        } else {
          // Ничего не выбрано — вставить в корень
          newAb = { ...ab, elements: mergedElements, rootChildren: [...ab.rootChildren, newRootId] }
        }

        const newProject = {
          ...state.project,
          artboards: { ...state.project.artboards, [state.activeArtboardId!]: newAb },
        }

        const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project].slice(-50)
        return {
          project: newProject,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          selectedElementId: newRootId,
          selectedElementIds: [newRootId],
        }
      }),

      duplicateElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        const id = state.selectedElementId
        if (!ab || !id || !ab.elements[id] || !state.project) return state

        const genId = () => Math.random().toString(36).slice(2, 10)
        const idMap: Record<string, string> = {}

        const collectIds = (eid: string) => {
          idMap[eid] = genId()
          ab.elements[eid]?.children.forEach(collectIds)
        }
        collectIds(id)

        const newElements: Record<string, CanvasElement> = {}
        Object.entries(idMap).forEach(([oldId, newId]) => {
          const el = ab.elements[oldId]
          if (!el) return
          newElements[newId] = {
            ...el,
            id: newId,
            name: oldId === id ? el.name + ' copy' : el.name,
            children: el.children.map(c => idMap[c] ?? c),
          }
        })

        const newRootId = idMap[id]
        const mergedElements = { ...ab.elements, ...newElements }

        // Вставить дубликат сразу после оригинала в том же родителе
        const parentId = findParentId(ab, id)
        let newAb: Artboard

        if (parentId) {
          const parent = mergedElements[parentId]
          const idx = parent.children.indexOf(id)
          const newChildren = [...parent.children]
          newChildren.splice(idx + 1, 0, newRootId)
          mergedElements[parentId] = { ...parent, children: newChildren }
          newAb = { ...ab, elements: mergedElements }
        } else {
          // Корневой элемент — вставить после оригинала в rootChildren
          const idx = ab.rootChildren.indexOf(id)
          const newRootChildren = [...ab.rootChildren]
          newRootChildren.splice(idx + 1, 0, newRootId)
          newAb = { ...ab, elements: mergedElements, rootChildren: newRootChildren }
        }

        const newProject = {
          ...state.project,
          artboards: { ...state.project.artboards, [state.activeArtboardId!]: newAb },
        }

        const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project].slice(-50)
        return {
          project: newProject,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          selectedElementId: newRootId,
          selectedElementIds: [newRootId],
        }
      }),
    }),
    {
      name: 'creator-project',
      partialize: (state) => ({
        project: state.project,
        mode: state.mode,
        activeArtboardId: state.activeArtboardId,
        selectedElementId: state.selectedElementId,
        selectedElementIds: state.selectedElementIds,
        activeBreakpointId: state.activeBreakpointId,
      }),
    }
  )
)
