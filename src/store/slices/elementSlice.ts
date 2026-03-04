import type { StateCreator } from 'zustand'
import type { EditorState, ElementSlice } from '../types'
import type { Project, Artboard, CanvasElement, ElementStyles, ElementType } from '../../types'
import { slugify } from '../../utils/slugify'
import {
  generateId,
  CONTAINER_TYPES,
  isContainerType,
  pushHistory,
  applyStyleUpdate,
} from '../helpers'
import { findParentId, collectDescendantIds, getCommonParentId } from '../../utils/treeUtils'

export const createElementSlice: StateCreator<EditorState, [], [], ElementSlice> = (set, get) => ({
  addElement: (artboardId, type, parentId) => set((state) => {
    const ab = state.project?.artboards[artboardId]
    if (!ab || !state.project) return state

    const id = generateId()
    const defaults: Record<ElementType, Partial<ElementStyles>> = {
      div:     { width: '100%',  height: '100px', display: 'flex', backgroundColor: '#f9f9f9' },
      text:    { width: 'auto',  height: 'auto',  fontSize: 16,    color: '#1a1a1a' },
      image:   { width: '200px', height: '150px', backgroundColor: '#e0e0e0', objectFit: 'cover', overflow: 'hidden' },
      button:  { width: 'auto',  height: 'auto',  backgroundColor: '#0066ff' },
      input:   { width: '200px', height: '40px',  backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderStyle: 'solid', borderRadius: 4, paddingLeft: 8, paddingRight: 8 },
      body:    { width: '100%',  display: 'block' },
    }

    const nonBodyCount = Object.values(ab.elements).filter(e => e.type !== 'body').length
    const displayType = type === 'div' ? 'Frame' : type
    const name = `${displayType} ${nonBodyCount + 1}`
    const newElement: CanvasElement = {
      id,
      name,
      className: slugify(name),
      type,
      positionMode: 'static',
      styles: defaults[type],
      children: [],
      content: type === 'text' ? 'Текст' : type === 'button' ? 'Кнопка' : type === 'input' ? 'Введите текст...' : undefined,
      ...(type === 'input' ? { inputType: 'text' as const } : {}),
      ...(type === 'image' ? { src: '', alt: '' } : {}),
    }

    const updatedElements = { ...ab.elements, [id]: newElement }
    let updatedRootChildren = ab.rootChildren

    let effectiveParentId = (parentId && ab.elements[parentId])
      ? parentId
      : (ab.rootChildren.find(cid => ab.elements[cid]?.type === 'body') ?? null)

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

    if (newParentId !== null && ab.elements[newParentId] && !isContainerType(ab.elements[newParentId].type)) return state
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

  wrapElementsInDiv: (artboardId, elementIds) => set((state) => {
    const ab = state.project?.artboards[artboardId]
    if (!ab || elementIds.length === 0) return state

    const { parentId: commonParentId, valid } = getCommonParentId(ab, elementIds)
    if (!valid) return state

    const parent = commonParentId ? ab.elements[commonParentId] : null
    const siblings = parent ? parent.children : ab.rootChildren
    const firstIndex = siblings.findIndex(id => elementIds.includes(id))
    if (firstIndex === -1) return state

    const divCount = Object.values(ab.elements).filter(e => e.type === 'div').length
    const newDivName = `Frame ${divCount + 1}`
    const newDivId = generateId()

    const newDiv: CanvasElement = {
      id: newDivId,
      name: newDivName,
      className: slugify(newDivName),
      type: 'div',
      positionMode: 'static',
      styles: { display: 'flex', flexDirection: 'column' },
      children: [...elementIds],
    }

    const newElements = { ...ab.elements, [newDivId]: newDiv }

    if (parent && commonParentId) {
      newElements[commonParentId] = {
        ...parent,
        children: parent.children.filter(id => !elementIds.includes(id)),
      }
    }

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
})
