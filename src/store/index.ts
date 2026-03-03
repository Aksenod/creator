import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Artboard, CanvasElement, ElementStyles, ElementType, CanvasPattern } from '../types'
type ArtboardPatch = Partial<Pick<Artboard, 'name' | 'height'>>
import { type BreakpointId } from '../constants/breakpoints'
import { slugify } from '../utils/slugify'
import {
  generateId,
  CONTAINER_TYPES,
  isContainerType,
  pushHistory,
  applyStyleUpdate,
} from './helpers'
import { findParentId, collectDescendantIds, getCommonParentId } from '../utils/treeUtils'

type EditorState = {
  allProjects: Project[]
  project: Project | null
  activeProjectId: string | null
  activeArtboardId: string | null
  selectedElementId: string | null
  selectedElementIds: string[]
  activeBreakpointId: BreakpointId
  history: Project[]
  historyIndex: number
  future: Project[]
  gridEditElementId: string | null
  expandedLayers: Set<string>
  currentView: 'projects' | 'editor' | 'backlog' | 'team'

  setCurrentView: (view: 'projects' | 'editor' | 'backlog' | 'team') => void
  createProject: (name: string) => void
  openProject: (id: string) => void
  closeProject: () => void
  deleteProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  duplicateProject: (id: string) => void
  loadProject: (project: Project) => void

  enterArtboard: (artboardId: string) => void
  setActiveArtboard: (id: string | null) => void
  addArtboard: (name: string) => void
  deleteArtboard: (id: string) => void
  moveArtboard: (id: string, x: number, y: number) => void
  moveArtboardTemp: (id: string, x: number, y: number) => void

  selectElement: (id: string | null) => void
  selectElements: (ids: string[]) => void
  toggleSelectElement: (id: string) => void
  setActiveBreakpoint: (bpId: BreakpointId) => void

  addElement: (artboardId: string, type: ElementType, parentId: string | null) => void
  updateElement: (artboardId: string, elementId: string, patch: Partial<CanvasElement>) => void
  moveElement: (artboardId: string, elementId: string, newParentId: string | null, newIndex: number) => void
  deleteElement: (artboardId: string, elementId: string) => void
  updateSelectedElements: (artboardId: string, patch: Partial<ElementStyles>) => void
  clearBreakpointStyle: (artboardId: string, elementId: string, bpId: BreakpointId) => void

  undo: () => void
  redo: () => void
  copyElement: () => void
  pasteElement: () => void
  duplicateElement: () => void
  expandLayers: (ids: string[]) => void
  collapseLayers: (ids: string[]) => void
  collapseAllLayers: () => void
  setGridEditElementId: (id: string | null) => void
  updateArtboard: (id: string, patch: ArtboardPatch) => void
  updateCanvasSettings: (patch: { canvasBackground?: string; canvasPattern?: CanvasPattern; canvasPatternSize?: number; canvasPatternColor?: string }) => void
  toggleElementVisibility: (artboardId: string, elementId: string) => void
  renameElements: (artboardId: string, renames: Array<{ id: string; name: string }>) => void
  wrapElementsInDiv: (artboardId: string, elementIds: string[]) => void
}

const createDefaultArtboard = (name: string, x = 0, y = 0): Artboard => {
  const bodyId = generateId()
  const bodyElement: CanvasElement = {
    id: bodyId,
    name: 'Body',
    className: 'body',
    type: 'body',
    positionMode: 'static',
    styles: { width: '100%', display: 'block' },
    children: [],
  }
  return {
    id: generateId(),
    name,
    width: 1440,
    height: 900,
    x,
    y,
    elements: { [bodyId]: bodyElement },
    rootChildren: [bodyId],
  }
}

function syncProjectToAll(allProjects: Project[], project: Project): Project[] {
  const exists = allProjects.some(p => p.id === project.id)
  if (exists) return allProjects.map(p => p.id === project.id ? project : p)
  return [...allProjects, project]
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      allProjects: [],
      project: null,
      activeProjectId: null,
      activeArtboardId: null,
      selectedElementId: null,
      selectedElementIds: [],
      activeBreakpointId: 'desktop' as BreakpointId,
      history: [],
      historyIndex: -1,
      future: [],
      gridEditElementId: null,
      expandedLayers: new Set<string>(),
      currentView: (() => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '/'
        if (path === '/backlog') return 'backlog' as const
        if (path === '/team') return 'team' as const
        return 'projects' as const
      })(),

      setCurrentView: (view) => {
        const urlMap: Record<string, string> = { projects: '/', backlog: '/backlog', team: '/team', editor: '/' }
        const url = urlMap[view] || '/'
        if (window.location.pathname !== url) {
          window.history.pushState(null, '', url)
        }
        set({ currentView: view })
      },

      createProject: (name) => {
        const artboard = createDefaultArtboard('Home', 100, 100)
        const project: Project = {
          id: generateId(),
          name,
          artboards: { [artboard.id]: artboard },
          artboardOrder: [artboard.id],
          updatedAt: Date.now(),
        }
        set((state) => ({
          allProjects: [...state.allProjects, project],
          project,
          activeProjectId: project.id,
          activeArtboardId: artboard.id,
          selectedElementId: null,
          selectedElementIds: [],
          history: [],
          historyIndex: -1,
          future: [],
        }))
      },

      openProject: (id) => set((state) => {
        const updatedAll = state.project
          ? syncProjectToAll(state.allProjects, state.project)
          : state.allProjects
        const found = updatedAll.find(p => p.id === id)
        if (!found) return state
        return {
          allProjects: updatedAll,
          project: found,
          activeProjectId: id,
          activeArtboardId: found.artboardOrder[0] ?? null,
          selectedElementId: null,
          selectedElementIds: [],
          history: [],
          historyIndex: -1,
          future: [],
        }
      }),

      closeProject: () => set((state) => {
        const updatedAll = state.project
          ? syncProjectToAll(state.allProjects, state.project)
          : state.allProjects
        return {
          allProjects: updatedAll,
          project: null,
          activeProjectId: null,
          activeArtboardId: null,
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),

      deleteProject: (id) => set((state) => {
        const updatedAll = state.allProjects.filter(p => p.id !== id)
        if (state.activeProjectId === id) {
          return {
            allProjects: updatedAll,
            project: null,
            activeProjectId: null,
            activeArtboardId: null,
            selectedElementId: null,
            selectedElementIds: [],
          }
        }
        return { allProjects: updatedAll }
      }),

      renameProject: (id, name) => set((state) => {
        const updatedAll = state.allProjects.map(p =>
          p.id === id ? { ...p, name, updatedAt: Date.now() } : p
        )
        const updatedProject = state.project?.id === id
          ? { ...state.project, name, updatedAt: Date.now() }
          : state.project
        return { allProjects: updatedAll, project: updatedProject }
      }),

      duplicateProject: (id) => set((state) => {
        const source = state.allProjects.find(p => p.id === id)
        if (!source) return state
        const newProject: Project = {
          ...source,
          id: generateId(),
          name: source.name + ' (copy)',
          updatedAt: Date.now(),
        }
        return { allProjects: [...state.allProjects, newProject] }
      }),

      loadProject: (project) => set((state) => ({
        allProjects: syncProjectToAll(state.allProjects, project),
        project,
        activeProjectId: project.id,
        activeArtboardId: project.artboardOrder[0] ?? null,
        selectedElementId: null,
        selectedElementIds: [],
        history: [],
        historyIndex: -1,
        future: [],
      })),

      enterArtboard: (artboardId) => {
        set({ activeArtboardId: artboardId, selectedElementId: null, selectedElementIds: [] })
      },

      setActiveArtboard: (id) => set((state) => {
        if (state.activeArtboardId === id) return {}
        return { activeArtboardId: id, selectedElementId: null, selectedElementIds: [] }
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

      selectElement: (id) => {
        set({ selectedElementId: id, selectedElementIds: id ? [id] : [] })
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

      setActiveBreakpoint: (bpId) => set({ activeBreakpointId: bpId }),

      addElement: (artboardId, type, parentId) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        const id = generateId()
        const defaults: Record<ElementType, Partial<ElementStyles>> = {
          div:     { width: '100%',  height: '100px', display: 'flex', backgroundColor: '#f9f9f9' },
          section: { width: '100%',  height: '200px', display: 'flex', backgroundColor: '#ffffff' },
          text:    { width: 'auto',  height: 'auto',  fontSize: 16,    color: '#1a1a1a' },
          image:   { width: '200px', height: '150px', backgroundColor: '#e0e0e0', objectFit: 'cover', overflow: 'hidden' },
          button:  { width: 'auto',  height: 'auto',  backgroundColor: '#0066ff' },
          input:   { width: '200px', height: '40px',  backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderStyle: 'solid', borderRadius: 4, paddingLeft: 8, paddingRight: 8 },
          body:    { width: '100%',  display: 'block' },
        }

        const nonBodyCount = Object.values(ab.elements).filter(e => e.type !== 'body').length
        const name = `${type} ${nonBodyCount + 1}`
        const newElement: CanvasElement = {
          id,
          name,
          className: slugify(name),
          type,
          positionMode: 'static',
          styles: defaults[type],
          children: [],
          content: type === 'text' ? 'Текст' : type === 'button' ? 'Кнопка' : type === 'input' ? 'Введите текст...' : undefined,
          ...(type === 'image' ? { src: '', alt: '' } : {}),
        }

        const updatedElements = { ...ab.elements, [id]: newElement }
        let updatedRootChildren = ab.rootChildren

        let effectiveParentId = (parentId && ab.elements[parentId])
          ? parentId
          : (ab.rootChildren.find(cid => ab.elements[cid]?.type === 'body') ?? null)

        // Если выбранный родитель — не-контейнер (text, image, button, input),
        // поднимаемся к ближайшему контейнеру-предку и вставляем рядом
        let insertAfterSiblingId: string | null = null
        if (effectiveParentId && !isContainerType(ab.elements[effectiveParentId].type)) {
          insertAfterSiblingId = effectiveParentId
          effectiveParentId = findParentId(ab, effectiveParentId)
        }

        if (effectiveParentId) {
          const parent = ab.elements[effectiveParentId]
          const children = [...parent.children]
          if (insertAfterSiblingId) {
            const idx = children.indexOf(insertAfterSiblingId)
            children.splice(idx + 1, 0, id)
          } else {
            children.push(id)
          }
          updatedElements[effectiveParentId] = { ...parent, children }
        } else {
          updatedRootChildren = [...ab.rootChildren, id]
        }

        const newProject: Project = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: updatedElements, rootChildren: updatedRootChildren },
          },
          updatedAt: Date.now(),
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

        const newClassName = el.type === 'body'
          ? 'body'
          : patch.name && !patch.className
            ? slugify(patch.name)
            : (patch.className ?? el.className)

        const activeBpId = state.activeBreakpointId

        let updated: CanvasElement
        if (patch.styles && activeBpId !== 'desktop') {
          const { styles: stylesPatch, ...nonStylePatch } = patch
          updated = applyStyleUpdate(el, stylesPatch, activeBpId, { ...nonStylePatch, className: newClassName })
        } else {
          updated = {
            ...el,
            ...patch,
            className: newClassName,
            styles: patch.styles ? { ...el.styles, ...patch.styles } : el.styles,
          }
        }

        const newProject: Project = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: { ...ab.elements, [elementId]: updated } },
          },
          updatedAt: Date.now(),
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
        const newProject: Project = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: { ...ab.elements, [elementId]: updated } },
          },
          updatedAt: Date.now(),
        }
        return pushHistory(state.history, state.historyIndex, state.project, newProject)
      }),

      deleteElement: (artboardId, elementId) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        const rawIds = state.selectedElementIds.length > 0 ? state.selectedElementIds : [elementId]
        const idsToDelete = rawIds.filter(id => ab.elements[id]?.type !== 'body')
        if (idsToDelete.length === 0) return state
        const toDelete = new Set<string>()
        idsToDelete.forEach(id => collectDescendantIds(ab.elements, id).forEach(d => toDelete.add(d)))

        const newElements: typeof ab.elements = {}
        for (const [id, el] of Object.entries(ab.elements)) {
          if (!toDelete.has(id)) {
            newElements[id] = { ...el, children: el.children.filter(c => !toDelete.has(c)) }
          }
        }

        const newRootChildren = ab.rootChildren.filter(id => !toDelete.has(id))

        const newProject: Project = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements, rootChildren: newRootChildren },
          },
          updatedAt: Date.now(),
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
          if (el) newElements[id] = applyStyleUpdate(el, patch, activeBpId)
        }
        const newProject: Project = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements },
          },
          updatedAt: Date.now(),
        }
        return pushHistory(state.history, state.historyIndex, state.project, newProject)
      }),

      moveElement: (artboardId, elementId, newParentId, newIndex) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        // Guard: нельзя перемещать элемент внутрь не-контейнера (text, image, button, input)
        if (newParentId !== null && ab.elements[newParentId] && !isContainerType(ab.elements[newParentId].type)) return state

        // Guard: только уже корневые элементы могут оставаться в rootChildren
        if (newParentId === null && !ab.rootChildren.includes(elementId)) return state

        const oldParentId = findParentId(ab, elementId)
        const elements = { ...ab.elements }

        const save = (proj: Project) =>
          pushHistory(state.history, state.historyIndex, state.project!, proj)

        const ts = { updatedAt: Date.now() }

        if (oldParentId === null) {
          const oldArr = ab.rootChildren.filter((id) => id !== elementId)
          if (newParentId === null) {
            const newArr = [...oldArr]
            newArr.splice(newIndex, 0, elementId)
            return save({ ...state.project, artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } }, ...ts })
          } else {
            const parent = elements[newParentId]
            if (!parent) return state
            const newChildren = [...parent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...parent, children: newChildren }
            return save({ ...state.project, artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: oldArr } }, ...ts })
          }
        } else {
          const oldParent = elements[oldParentId]
          if (!oldParent) return state
          elements[oldParentId] = { ...oldParent, children: oldParent.children.filter(id => id !== elementId) }

          if (newParentId === null) {
            const newArr = [...ab.rootChildren]
            newArr.splice(newIndex, 0, elementId)
            return save({ ...state.project, artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: newArr } }, ...ts })
          } else {
            const newParent = elements[newParentId]
            if (!newParent) return state
            const newChildren = [...newParent.children]
            newChildren.splice(newIndex, 0, elementId)
            elements[newParentId] = { ...newParent, children: newChildren }
            return save({ ...state.project, artboards: { ...state.project.artboards, [artboardId]: { ...ab, elements, rootChildren: ab.rootChildren } }, ...ts })
          }
        }
      }),

      undo: () => set((state) => {
        if (state.historyIndex < 0 || state.history.length === 0) return state
        const project = state.history[state.historyIndex]
        return {
          project,
          historyIndex: state.historyIndex - 1,
          future: [state.project!, ...state.future],
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),

      redo: () => set((state) => {
        if (state.future.length === 0) return state
        const [nextProject, ...remainingFuture] = state.future
        const newHistory = [...state.history.slice(0, state.historyIndex + 1), state.project!]
        return {
          project: nextProject,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          future: remainingFuture,
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),

      copyElement: () => {
        const state = get()
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        const id = state.selectedElementId
        if (!ab || !id || !ab.elements[id]) return

        const descendants: Record<string, CanvasElement> = {}
        collectDescendantIds(ab.elements, id).forEach(eid => {
          descendants[eid] = ab.elements[eid]
        })

        try {
          localStorage.setItem('creator-clipboard', JSON.stringify({ element: ab.elements[id], descendants }))
        } catch { /* quota exceeded */ }
      },

      pasteElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        if (!ab || !state.project) return state

        let clipboard: { element: CanvasElement; descendants: Record<string, CanvasElement> } | null = null
        try {
          const raw = localStorage.getItem('creator-clipboard')
          if (raw) clipboard = JSON.parse(raw)
        } catch { return state }
        if (!clipboard) return state

        const idMap: Record<string, string> = {}
        Object.keys(clipboard.descendants).forEach(oldId => { idMap[oldId] = generateId() })

        const newElements: Record<string, CanvasElement> = {}
        Object.entries(clipboard.descendants).forEach(([oldId, el]) => {
          const newId = idMap[oldId]
          newElements[newId] = {
            ...el,
            id: newId,
            name: el.id === clipboard!.element.id ? el.name + ' (copy)' : el.name,
            children: el.children.map(c => idMap[c] ?? c),
          }
        })

        const newRootId = idMap[clipboard.element.id]
        const mergedElements = { ...ab.elements, ...newElements }

        const selectedEl = state.selectedElementId ? ab.elements[state.selectedElementId] : null
        let newAb: Artboard

        if (selectedEl && CONTAINER_TYPES.includes(selectedEl.type as typeof CONTAINER_TYPES[number])) {
          mergedElements[selectedEl.id] = { ...selectedEl, children: [...selectedEl.children, newRootId] }
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
          const bodyId = ab.rootChildren.find(cid => ab.elements[cid]?.type === 'body')
          if (bodyId) {
            mergedElements[bodyId] = { ...mergedElements[bodyId], children: [...mergedElements[bodyId].children, newRootId] }
            newAb = { ...ab, elements: mergedElements }
          } else {
            newAb = { ...ab, elements: mergedElements, rootChildren: [...ab.rootChildren, newRootId] }
          }
        }

        const newProject: Project = {
          ...state.project,
          artboards: { ...state.project.artboards, [state.activeArtboardId!]: newAb },
          updatedAt: Date.now(),
        }

        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
          selectedElementId: newRootId,
          selectedElementIds: [newRootId],
        }
      }),

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

      toggleElementVisibility: (artboardId, elementId) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        const el = ab?.elements[elementId]
        if (!ab || !el || !state.project) return state
        if (el.type === 'body') return state

        const newHidden = !el.hidden
        const updated: CanvasElement = { ...el, hidden: newHidden }
        const newElements = { ...ab.elements, [elementId]: updated }

        const newProject: Project = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements },
          },
          updatedAt: Date.now(),
        }

        const deselect = newHidden && (state.selectedElementIds.includes(elementId) || state.selectedElementId === elementId)
        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
          ...(deselect ? {
            selectedElementId: null,
            selectedElementIds: state.selectedElementIds.filter(id => id !== elementId),
          } : {}),
        }
      }),

      renameElements: (artboardId, renames) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project || renames.length === 0) return state

        const newElements = { ...ab.elements }
        for (const { id, name } of renames) {
          const el = newElements[id]
          if (!el || el.type === 'body') continue
          newElements[id] = { ...el, name, className: slugify(name) }
        }

        const newProject: Project = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements },
          },
          updatedAt: Date.now(),
        }
        return pushHistory(state.history, state.historyIndex, state.project, newProject)
      }),

      duplicateElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        const id = state.selectedElementId
        if (!ab || !id || !ab.elements[id] || !state.project) return state
        if (ab.elements[id].type === 'body') return state

        const idMap: Record<string, string> = {}
        collectDescendantIds(ab.elements, id).forEach(eid => { idMap[eid] = generateId() })

        const newElements: Record<string, CanvasElement> = {}
        Object.entries(idMap).forEach(([oldId, newId]) => {
          const el = ab.elements[oldId]
          if (!el) return
          newElements[newId] = {
            ...el, id: newId,
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

        const newProject: Project = {
          ...state.project,
          artboards: { ...state.project.artboards, [state.activeArtboardId!]: newAb },
          updatedAt: Date.now(),
        }

        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
          selectedElementId: newRootId,
          selectedElementIds: [newRootId],
        }
      }),

      wrapElementsInDiv: (artboardId, elementIds) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || elementIds.length === 0) return state

        // Проверяем что все элементы одного уровня
        const { parentId: commonParentId, valid } = getCommonParentId(ab, elementIds)
        if (!valid) {
          // Элементы из разных родителей — нельзя объединить
          return state
        }

        // Получаем список siblings и индекс первого элемента
        const parent = commonParentId ? ab.elements[commonParentId] : null
        const siblings = parent ? parent.children : ab.rootChildren
        const firstIndex = siblings.findIndex(id => elementIds.includes(id))
        if (firstIndex === -1) return state

        // Считаем сколько div-ов уже есть для нумерации
        const divCount = Object.values(ab.elements).filter(e => e.type === 'div').length
        const newDivName = `Div ${divCount + 1}`
        const newDivId = generateId()

        // Создаём новый div
        const newDiv: CanvasElement = {
          id: newDivId,
          name: newDivName,
          className: slugify(newDivName),
          type: 'div',
          positionMode: 'static',
          styles: { display: 'flex', flexDirection: 'column' },
          children: [...elementIds],
        }

        // Копируем элементы
        const newElements = { ...ab.elements, [newDivId]: newDiv }

        // Удаляем элементы из родителя
        if (parent && commonParentId) {
          newElements[commonParentId] = {
            ...parent,
            children: parent.children.filter(id => !elementIds.includes(id)),
          }
        }

        // Вставляем div на место первого элемента
        const newSiblings = siblings.filter(id => !elementIds.includes(id))
        newSiblings.splice(firstIndex, 0, newDivId)

        const newProject: Project = {
          ...state.project!,
          artboards: {
            ...state.project!.artboards,
            [artboardId]: {
              ...ab,
              elements: newElements,
            },
          },
          updatedAt: Date.now(),
        }

        // Обновляем rootChildren или children родителя
        if (!commonParentId) {
          newProject.artboards[artboardId].rootChildren = newSiblings
        } else {
          const updatedParent = newProject.artboards[artboardId].elements[commonParentId]
          if (updatedParent) {
            updatedParent.children = newSiblings
          }
        }

        if (!state.project) return state

        return {
          ...pushHistory(state.history, state.historyIndex, state.project, newProject),
          selectedElementId: newDivId,
          selectedElementIds: [newDivId],
        }
      }),
    }),
    {
      name: 'creator-project',
      partialize: (state) => ({
        allProjects: state.allProjects,
        project: state.project,
        activeProjectId: state.activeProjectId,
        activeArtboardId: state.activeArtboardId,
        selectedElementId: state.selectedElementId,
        selectedElementIds: state.selectedElementIds,
        activeBreakpointId: state.activeBreakpointId,
      }),
    }
  )
)
