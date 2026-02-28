import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, EditorMode, Artboard, CanvasElement, ElementStyles, ElementType } from '../types'
import { type BreakpointId } from '../constants/breakpoints'
import { slugify } from '../utils/slugify'
import {
  generateId,
  CONTAINER_TYPES,
  pushHistory,
  applyStyleUpdate,
} from './helpers'
import { findParentId, collectDescendantIds } from '../utils/treeUtils'

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
  addElement: (artboardId: string, type: ElementType, parentId: string | null) => void
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
          return pushHistory(state.history, state.historyIndex, state.project, newProject)
        })
      },

      addElement: (artboardId, type, parentId) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        const id = generateId()
        const defaults: Record<ElementType, Partial<ElementStyles>> = {
          div:     { width: '100%',  height: '100px', display: 'flex', backgroundColor: '#f9f9f9' },
          section: { width: '100%',  height: '200px', display: 'flex', backgroundColor: '#ffffff' },
          text:    { width: 'auto',  height: 'auto',  fontSize: 16,    color: '#1a1a1a' },
          image:   { width: '200px', height: '150px', backgroundColor: '#e0e0e0' },
          button:  { width: 'auto',  height: 'auto',  backgroundColor: '#0066ff' },
          input:   { width: '200px', height: '40px',  backgroundColor: '#fff' },
        }

        const name = `${type} ${Object.keys(ab.elements).length + 1}`
        const newElement: CanvasElement = {
          id,
          name,
          className: slugify(name),
          type,
          positionMode: 'static',
          styles: defaults[type],
          children: [],
          content: type === 'text' ? 'Текст' : type === 'button' ? 'Кнопка' : undefined,
        }

        const updatedElements = { ...ab.elements, [id]: newElement }
        let updatedRootChildren = ab.rootChildren

        if (parentId && ab.elements[parentId]) {
          const parent = ab.elements[parentId]
          updatedElements[parentId] = { ...parent, children: [...parent.children, id] }
        } else {
          updatedRootChildren = [...ab.rootChildren, id]
        }

        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: updatedElements, rootChildren: updatedRootChildren },
          },
        }
        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
          selectedElementId: id,
          selectedElementIds: [id],
        }
      }),

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
          updated = applyStyleUpdate(el, stylesPatch, activeBpId, { ...nonStylePatch, className: newClassName })
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
        return pushHistory(state.history, state.historyIndex, state.project, newProject)
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
        return pushHistory(state.history, state.historyIndex, state.project, newProject)
      }),

      deleteElement: (artboardId, elementId) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        // Собрать все id для удаления (рекурсивно), включая все выделенные
        const idsToDelete = state.selectedElementIds.length > 0 ? state.selectedElementIds : [elementId]
        const toDelete = new Set<string>()
        idsToDelete.forEach(id => collectDescendantIds(ab.elements, id).forEach(d => toDelete.add(d)))

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
        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
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
            newElements[id] = applyStyleUpdate(el, patch, activeBpId)
          }
        }
        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements },
          },
        }
        return pushHistory(state.history, state.historyIndex, state.project, newProject)
      }),

      moveElement: (artboardId, elementId, newParentId, newIndex) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        const oldParentId = findParentId(ab, elementId)
        const elements = { ...ab.elements }

        const save = (newProject: Project) =>
          pushHistory(state.history, state.historyIndex, state.project!, newProject)

        if (oldParentId === null) {
          const oldArr = ab.rootChildren.filter((id) => id !== elementId)
          if (newParentId === null) {
            const newArr = [...oldArr]
            newArr.splice(newIndex, 0, elementId)
            return save({
              ...state.project,
              artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } },
            })
          } else {
            const parent = elements[newParentId]
            if (!parent) return state
            const newChildren = [...parent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...parent, children: newChildren }
            return save({
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
            return save({
              ...state.project,
              artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } },
            })
          } else {
            const newParent = elements[newParentId]
            if (!newParent) return state
            const newChildren = [...newParent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...newParent, children: newChildren }
            return save({
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

        const descendants: Record<string, CanvasElement> = {}
        collectDescendantIds(ab.elements, id).forEach(eid => {
          descendants[eid] = ab.elements[eid]
        })

        return { clipboard: { element: ab.elements[id], descendants } }
      }),

      pasteElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        if (!ab || !state.clipboard || !state.project) return state

        const idMap: Record<string, string> = {}
        Object.keys(state.clipboard.descendants).forEach(oldId => {
          idMap[oldId] = generateId()
        })

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

        if (selectedEl && CONTAINER_TYPES.includes(selectedEl.type as typeof CONTAINER_TYPES[number])) {
          mergedElements[selectedEl.id] = {
            ...selectedEl,
            children: [...selectedEl.children, newRootId],
          }
          newAb = { ...ab, elements: mergedElements }
        } else if (selectedEl) {
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
          newAb = { ...ab, elements: mergedElements, rootChildren: [...ab.rootChildren, newRootId] }
        }

        const newProject = {
          ...state.project,
          artboards: { ...state.project.artboards, [state.activeArtboardId!]: newAb },
        }

        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
          selectedElementId: newRootId,
          selectedElementIds: [newRootId],
        }
      }),

      duplicateElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        const id = state.selectedElementId
        if (!ab || !id || !ab.elements[id] || !state.project) return state

        const idMap: Record<string, string> = {}
        collectDescendantIds(ab.elements, id).forEach(eid => {
          idMap[eid] = generateId()
        })

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
          const idx = ab.rootChildren.indexOf(id)
          const newRootChildren = [...ab.rootChildren]
          newRootChildren.splice(idx + 1, 0, newRootId)
          newAb = { ...ab, elements: mergedElements, rootChildren: newRootChildren }
        }

        const newProject = {
          ...state.project,
          artboards: { ...state.project.artboards, [state.activeArtboardId!]: newAb },
        }

        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
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
