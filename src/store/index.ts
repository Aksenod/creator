import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, EditorMode, Artboard, CanvasElement, ElementStyles, ElementType } from '../types'
import { type BreakpointId } from '../constants/breakpoints'
import { slugify } from '../utils/slugify'
import {
  generateId,
  CONTAINER_TYPES,
  applyStyleUpdate,
} from './helpers'
import { findParentId, collectDescendantIds } from '../utils/treeUtils'

const HISTORY_MAX = 50

type EditorState = {
  allProjects: Project[]
  activeProjectId: string | null
  // Mirror of allProjects.find(p => p.id === activeProjectId) — for backward-compat with existing components
  project: Project | null
  mode: EditorMode
  activeArtboardId: string | null
  selectedElementId: string | null
  selectedElementIds: string[]
  activeBreakpointId: BreakpointId

  // История (не персистируется)
  history: Project[]
  historyIndex: number
  future: Project[]

  // Clipboard (не персистируется)
  clipboard: { element: CanvasElement; descendants: Record<string, CanvasElement> } | null

  // Grid Edit Mode
  gridEditElementId: string | null

  // Проекты
  createProject: (name: string) => void
  openProject: (id: string) => void
  closeProject: () => void
  deleteProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  duplicateProject: (id: string) => void

  // Артборды
  setActiveArtboard: (artboardId: string | null) => void
  addArtboard: (name: string) => void
  renameArtboard: (artboardId: string, name: string) => void
  deleteArtboard: (artboardId: string) => void

  // Выделение
  selectElement: (id: string | null) => void
  toggleSelectElement: (id: string) => void

  // Брейкпоинты
  setActiveBreakpoint: (bpId: BreakpointId) => void

  // Элементы
  addElement: (artboardId: string, type: ElementType, parentId: string | null) => void
  updateElement: (artboardId: string, elementId: string, patch: Partial<CanvasElement>) => void
  moveElement: (artboardId: string, elementId: string, newParentId: string | null, newIndex: number) => void
  deleteElement: (artboardId: string, elementId: string) => void
  updateSelectedElements: (artboardId: string, patch: Partial<ElementStyles>) => void
  clearBreakpointStyle: (artboardId: string, elementId: string, bpId: BreakpointId) => void

  // Undo/Redo
  undo: () => void
  redo: () => void

  // Clipboard
  copyElement: () => void
  pasteElement: () => void
  duplicateElement: () => void

  // Grid Edit Mode
  setGridEditElementId: (id: string | null) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Обновить активный проект в allProjects + в project + добавить в историю */
function pushAndSync(
  state: Pick<EditorState, 'history' | 'historyIndex' | 'allProjects' | 'project'>,
  currentProject: Project,
  newProject: Project,
) {
  const updated = { ...newProject, updatedAt: Date.now() }
  const hist = [...state.history.slice(0, state.historyIndex + 1), currentProject].slice(-HISTORY_MAX)
  return {
    project: updated,
    allProjects: state.allProjects.map(p => p.id === updated.id ? updated : p),
    history: hist,
    historyIndex: hist.length - 1,
    future: [] as Project[],
  }
}

/** Обновить проект без добавления в историю */
function syncProject(allProjects: Project[], newProject: Project) {
  return {
    project: newProject,
    allProjects: allProjects.map(p => p.id === newProject.id ? newProject : p),
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      allProjects: [],
      activeProjectId: null,
      project: null,
      mode: 'dashboard' as EditorMode,
      activeArtboardId: null,
      selectedElementId: null,
      selectedElementIds: [],
      activeBreakpointId: 'desktop' as BreakpointId,
      history: [],
      historyIndex: -1,
      future: [],
      clipboard: null,
      gridEditElementId: null,

      // ─── Projects ───────────────────────────────────────────────────────────

      createProject: (name) => set((state) => {
        const artboard = createDefaultArtboard('Home', 100, 100)
        const project: Project = {
          id: generateId(),
          name,
          artboards: { [artboard.id]: artboard },
          artboardOrder: [artboard.id],
          updatedAt: Date.now(),
        }
        return {
          allProjects: [...state.allProjects, project],
          activeProjectId: project.id,
          project,
          mode: 'canvas' as EditorMode,
          activeArtboardId: artboard.id,
          selectedElementId: null,
          selectedElementIds: [],
          history: [],
          historyIndex: -1,
          future: [],
        }
      }),

      openProject: (id) => set((state) => {
        const proj = state.allProjects.find(p => p.id === id)
        if (!proj) return state
        const firstArtboardId = proj.artboardOrder[0] ?? null
        return {
          activeProjectId: id,
          project: proj,
          mode: 'canvas',
          activeArtboardId: firstArtboardId,
          selectedElementId: null,
          selectedElementIds: [],
          history: [],
          historyIndex: -1,
          future: [],
        }
      }),

      closeProject: () => set({
        mode: 'dashboard',
        activeProjectId: null,
        project: null,
        activeArtboardId: null,
        selectedElementId: null,
        selectedElementIds: [],
        history: [],
        historyIndex: -1,
        future: [],
      }),

      deleteProject: (id) => set((state) => {
        const newProjects = state.allProjects.filter(p => p.id !== id)
        const isActive = state.activeProjectId === id
        return {
          allProjects: newProjects,
          ...(isActive ? {
            activeProjectId: null,
            project: null,
            mode: 'dashboard' as EditorMode,
            activeArtboardId: null,
            selectedElementId: null,
            selectedElementIds: [],
          } : {}),
        }
      }),

      renameProject: (id, name) => set((state) => {
        const proj = state.allProjects.find(p => p.id === id)
        if (!proj) return state
        const updated = { ...proj, name, updatedAt: Date.now() }
        return syncProject(state.allProjects, updated)
      }),

      duplicateProject: (id) => set((state) => {
        const proj = state.allProjects.find(p => p.id === id)
        if (!proj) return state
        const newId = generateId()
        // Deep-copy artboards with new ids
        const artboardMap: Record<string, string> = {}
        for (const abId of proj.artboardOrder) {
          artboardMap[abId] = generateId()
        }
        const newArtboards: Record<string, Artboard> = {}
        for (const [abId, ab] of Object.entries(proj.artboards)) {
          const newAbId = artboardMap[abId]
          if (!newAbId) continue
          newArtboards[newAbId] = { ...ab, id: newAbId }
        }
        const newProject: Project = {
          ...proj,
          id: newId,
          name: proj.name + ' (copy)',
          artboards: newArtboards,
          artboardOrder: proj.artboardOrder.map(id => artboardMap[id]!).filter(Boolean),
          updatedAt: Date.now(),
        }
        return { allProjects: [...state.allProjects, newProject] }
      }),

      // ─── Artboards ────────────────────────────────────────────────────────────

      setActiveArtboard: (artboardId) => set({ activeArtboardId: artboardId }),

      addArtboard: (name) => set((state) => {
        const proj = state.project
        if (!proj) return state
        const lastArtboardId = proj.artboardOrder[proj.artboardOrder.length - 1]
        const lastAb = lastArtboardId ? proj.artboards[lastArtboardId] : null
        const x = lastAb ? lastAb.x + lastAb.width + 100 : 100
        const artboard = createDefaultArtboard(name, x, 100)
        const newProject = {
          ...proj,
          artboards: { ...proj.artboards, [artboard.id]: artboard },
          artboardOrder: [...proj.artboardOrder, artboard.id],
        }
        return pushAndSync(state, proj, newProject)
      }),

      renameArtboard: (artboardId, name) => set((state) => {
        const proj = state.project
        if (!proj) return state
        const ab = proj.artboards[artboardId]
        if (!ab) return state
        const updated = { ...proj, artboards: { ...proj.artboards, [artboardId]: { ...ab, name } }, updatedAt: Date.now() }
        return syncProject(state.allProjects, updated)
      }),

      deleteArtboard: (artboardId) => set((state) => {
        const proj = state.project
        if (!proj || proj.artboardOrder.length <= 1) return state
        const newArtboards = { ...proj.artboards }
        delete newArtboards[artboardId]
        const newOrder = proj.artboardOrder.filter(id => id !== artboardId)
        const updated = { ...proj, artboards: newArtboards, artboardOrder: newOrder, updatedAt: Date.now() }
        const newActiveId = state.activeArtboardId === artboardId ? (newOrder[0] ?? null) : state.activeArtboardId
        return {
          ...syncProject(state.allProjects, updated),
          activeArtboardId: newActiveId,
        }
      }),

      // ─── Selection ────────────────────────────────────────────────────────────

      selectElement: (id) => set({ selectedElementId: id, selectedElementIds: id ? [id] : [] }),

      toggleSelectElement: (id) => set((state) => {
        const ids = state.selectedElementIds
        const next = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
        return {
          selectedElementIds: next,
          selectedElementId: next.length > 0 ? next[next.length - 1] : null,
        }
      }),

      setActiveBreakpoint: (bpId) => set({ activeBreakpointId: bpId }),

      // ─── Elements ────────────────────────────────────────────────────────────

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
          content: type === 'text' ? 'Текст' : type === 'button' ? 'Кнопка' : undefined,
        }

        const updatedElements = { ...ab.elements, [id]: newElement }
        let updatedRootChildren = ab.rootChildren

        const effectiveParentId = (parentId && ab.elements[parentId])
          ? parentId
          : (ab.rootChildren.find(cid => ab.elements[cid]?.type === 'body') ?? null)

        if (effectiveParentId) {
          const parent = ab.elements[effectiveParentId]
          updatedElements[effectiveParentId] = { ...parent, children: [...parent.children, id] }
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
          ...pushAndSync(state, state.project, newProject),
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

        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: { ...ab.elements, [elementId]: updated } },
          },
        }
        return pushAndSync(state, state.project, newProject)
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
        return pushAndSync(state, state.project, newProject)
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

        const newProject = {
          ...state.project,
          artboards: {
            ...state.project.artboards,
            [artboardId]: { ...ab, elements: newElements, rootChildren: newRootChildren },
          },
        }
        return {
          ...pushAndSync(state, state.project, newProject),
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
        return pushAndSync(state, state.project, newProject)
      }),

      moveElement: (artboardId, elementId, newParentId, newIndex) => set((state) => {
        const ab = state.project?.artboards[artboardId]
        if (!ab || !state.project) return state

        const oldParentId = findParentId(ab, elementId)
        const elements = { ...ab.elements }

        const save = (newProject: Project) =>
          pushAndSync(state, state.project!, newProject)

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

      // ─── Undo/Redo ────────────────────────────────────────────────────────────

      undo: () => set((state) => {
        if (state.historyIndex < 0 || state.history.length === 0) return state
        const restoredProject = state.history[state.historyIndex]
        const currentProject = state.project!
        return {
          project: restoredProject,
          allProjects: state.allProjects.map(p => p.id === restoredProject.id ? restoredProject : p),
          historyIndex: state.historyIndex - 1,
          future: [currentProject, ...state.future],
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),

      redo: () => set((state) => {
        if (state.future.length === 0) return state
        const [nextProject, ...remainingFuture] = state.future
        const hist = [...state.history.slice(0, state.historyIndex + 1), state.project!]
        return {
          project: nextProject,
          allProjects: state.allProjects.map(p => p.id === nextProject.id ? nextProject : p),
          history: hist,
          historyIndex: hist.length - 1,
          future: remainingFuture,
          selectedElementId: null,
          selectedElementIds: [],
        }
      }),

      // ─── Clipboard ────────────────────────────────────────────────────────────

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
          const bodyId = ab.rootChildren.find(cid => ab.elements[cid]?.type === 'body')
          if (bodyId) {
            const body = mergedElements[bodyId]
            mergedElements[bodyId] = { ...body, children: [...body.children, newRootId] }
            newAb = { ...ab, elements: mergedElements }
          } else {
            newAb = { ...ab, elements: mergedElements, rootChildren: [...ab.rootChildren, newRootId] }
          }
        }

        const newProject = {
          ...state.project,
          artboards: { ...state.project.artboards, [state.activeArtboardId!]: newAb },
        }

        return {
          ...pushAndSync(state, state.project, newProject),
          selectedElementId: newRootId,
          selectedElementIds: [newRootId],
        }
      }),

      duplicateElement: () => set((state) => {
        const ab = state.activeArtboardId ? state.project?.artboards[state.activeArtboardId] : null
        const id = state.selectedElementId
        if (!ab || !id || !ab.elements[id] || !state.project) return state
        if (ab.elements[id].type === 'body') return state

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
          ...pushAndSync(state, state.project, newProject),
          selectedElementId: newRootId,
          selectedElementIds: [newRootId],
        }
      }),

      setGridEditElementId: (id) => set({ gridEditElementId: id }),
    }),
    {
      name: 'creator-v2',
      partialize: (state) => ({
        allProjects: state.allProjects,
        activeProjectId: state.activeProjectId,
        project: state.project,
        mode: state.mode,
        activeArtboardId: state.activeArtboardId,
        selectedElementId: state.selectedElementId,
        selectedElementIds: state.selectedElementIds,
        activeBreakpointId: state.activeBreakpointId,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<EditorState> | null
        if (!p) return current
        const allProjects = p.allProjects ?? []
        const activeProjectId = p.activeProjectId ?? null
        const project = activeProjectId
          ? allProjects.find(proj => proj.id === activeProjectId) ?? null
          : null
        return { ...current, ...p, project, allProjects }
      },
      onRehydrateStorage: () => (state) => {
        // Миграция со старого ключа creator-project
        if (state && state.allProjects.length === 0) {
          try {
            const raw = localStorage.getItem('creator-project')
            if (raw) {
              const parsed = JSON.parse(raw) as { state?: { project?: Project } }
              const oldProject = parsed.state?.project
              if (oldProject) {
                state.allProjects = [{ ...oldProject, updatedAt: Date.now() }]
                state.mode = 'dashboard'
                state.project = null
                state.activeProjectId = null
              }
            }
          } catch { /* ignore */ }
        }
      },
    }
  )
)
