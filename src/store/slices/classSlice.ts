import type { StateCreator } from 'zustand'
import type { EditorState, ClassSlice } from '../types'
import type { CSSClass } from '../../types/cssClass'
import type { ElementStyles } from '../../types'
import { generateId, pushHistory } from '../helpers'

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'class'

const uniqueClassName = (name: string, existing: Record<string, CSSClass>): string => {
  const slug = slugify(name)
  const names = new Set(Object.values(existing).map(c => c.name))
  if (!names.has(slug)) return slug
  let i = 2
  while (names.has(`${slug}-${i}`)) i++
  return `${slug}-${i}`
}

export const createClassSlice: StateCreator<EditorState, [], [], ClassSlice> = (set, get) => ({
  createClass: (name, styles) => {
    const s = get()
    if (!s.project) return ''
    const id = generateId()
    const existing = s.project.cssClasses ?? {}
    const uniqueName = uniqueClassName(name, existing)
    const now = Date.now()
    const newClass: CSSClass = {
      id,
      name: uniqueName,
      styles: styles ?? {},
      createdAt: now,
      updatedAt: now,
    }
    const newProject = {
      ...s.project,
      cssClasses: { ...existing, [id]: newClass },
      updatedAt: now,
    }
    set(pushHistory(s.history, s.historyIndex, s.project, newProject))
    return id
  },

  updateClassStyles: (classId, stylesPatch) => {
    const s = get()
    if (!s.project?.cssClasses?.[classId]) return
    const cls = s.project.cssClasses[classId]
    const activeBpId = s.activeBreakpointId
    const now = Date.now()

    let updatedClass: CSSClass
    if (activeBpId !== 'desktop') {
      updatedClass = {
        ...cls,
        breakpointStyles: {
          ...cls.breakpointStyles,
          [activeBpId]: {
            ...(cls.breakpointStyles?.[activeBpId] ?? {}),
            ...stylesPatch,
          },
        },
        updatedAt: now,
      }
    } else {
      updatedClass = {
        ...cls,
        styles: { ...cls.styles, ...stylesPatch },
        updatedAt: now,
      }
    }

    const newProject = {
      ...s.project,
      cssClasses: { ...s.project.cssClasses, [classId]: updatedClass },
      updatedAt: now,
    }
    set(pushHistory(s.history, s.historyIndex, s.project, newProject))
  },

  deleteClass: (classId) => {
    const s = get()
    if (!s.project?.cssClasses?.[classId]) return
    const now = Date.now()

    // Remove class definition
    const { [classId]: _, ...remainingClasses } = s.project.cssClasses
    // Clean classIds from ALL elements in ALL artboards
    const newArtboards = { ...s.project.artboards }
    for (const [abId, ab] of Object.entries(newArtboards)) {
      let changed = false
      const newElements = { ...ab.elements }
      for (const [elId, el] of Object.entries(newElements)) {
        if (el.classIds && el.classIds.includes(classId)) {
          newElements[elId] = {
            ...el,
            classIds: el.classIds.filter(id => id !== classId),
          }
          changed = true
        }
      }
      if (changed) {
        newArtboards[abId] = { ...ab, elements: newElements }
      }
    }

    const newProject = {
      ...s.project,
      cssClasses: remainingClasses,
      artboards: newArtboards,
      updatedAt: now,
    }
    set(pushHistory(s.history, s.historyIndex, s.project, newProject))
  },

  renameClass: (classId, name) => {
    const s = get()
    if (!s.project?.cssClasses?.[classId]) return
    const existing = s.project.cssClasses
    const uniqueName = uniqueClassName(name, { ...existing, [classId]: { ...existing[classId], name: '' } })
    const now = Date.now()

    const newProject = {
      ...s.project,
      cssClasses: {
        ...existing,
        [classId]: { ...existing[classId], name: uniqueName, updatedAt: now },
      },
      updatedAt: now,
    }
    set(pushHistory(s.history, s.historyIndex, s.project, newProject))
  },

  applyClassToElement: (artboardId, elementId, classId) => {
    const s = get()
    if (!s.project) return
    const ab = s.project.artboards[artboardId]
    if (!ab) return
    const el = ab.elements[elementId]
    if (!el) return
    // Already applied?
    if (el.classIds?.includes(classId)) return
    const now = Date.now()

    const newEl = { ...el, classIds: [...(el.classIds ?? []), classId] }
    const newProject = {
      ...s.project,
      artboards: {
        ...s.project.artboards,
        [artboardId]: {
          ...ab,
          elements: { ...ab.elements, [elementId]: newEl },
        },
      },
      updatedAt: now,
    }
    set(pushHistory(s.history, s.historyIndex, s.project, newProject))
  },

  removeClassFromElement: (artboardId, elementId, classId) => {
    const s = get()
    if (!s.project) return
    const ab = s.project.artboards[artboardId]
    if (!ab) return
    const el = ab.elements[elementId]
    if (!el || !el.classIds) return
    const now = Date.now()

    const newEl = { ...el, classIds: el.classIds.filter(id => id !== classId) }
    const newProject = {
      ...s.project,
      artboards: {
        ...s.project.artboards,
        [artboardId]: {
          ...ab,
          elements: { ...ab.elements, [elementId]: newEl },
        },
      },
      updatedAt: now,
    }
    set(pushHistory(s.history, s.historyIndex, s.project, newProject))
  },

  smartUpdateStyles: (artboardId, elementId, stylesPatch) => {
    const s = get()
    if (!s.project) return
    const ab = s.project.artboards[artboardId]
    if (!ab) return
    const el = ab.elements[elementId]
    if (!el) return

    // If element has classes, route to the editing class (or last class)
    if (el.classIds && el.classIds.length > 0 && s.project.cssClasses) {
      const targetClassId = s.editingClassId ?? el.classIds[el.classIds.length - 1]
      if (s.project.cssClasses[targetClassId]) {
        get().updateClassStyles(targetClassId, stylesPatch)
        return
      }
    }
    // No classes — update element inline styles
    get().updateElement(artboardId, elementId, { styles: stylesPatch })
  },

  createClassFromElement: (artboardId, elementId, name) => {
    const s = get()
    if (!s.project) return ''
    const ab = s.project.artboards[artboardId]
    if (!ab) return ''
    const el = ab.elements[elementId]
    if (!el) return ''

    const id = generateId()
    const existing = s.project.cssClasses ?? {}
    const uniqueName = uniqueClassName(name, existing)
    const now = Date.now()

    // Copy position mode into styles so class system handles it
    const classStyles = { ...el.styles }
    if (el.positionMode && el.positionMode !== 'static') {
      classStyles.position = el.positionMode
    }

    const newClass: CSSClass = {
      id,
      name: uniqueName,
      styles: classStyles,
      breakpointStyles: el.breakpointStyles ? JSON.parse(JSON.stringify(el.breakpointStyles)) : undefined,
      createdAt: now,
      updatedAt: now,
    }

    // Clear element styles (they're now in the class), add classId
    const newEl = {
      ...el,
      styles: {} as ElementStyles,
      breakpointStyles: undefined,
      classIds: [...(el.classIds ?? []), id],
    }

    const newProject = {
      ...s.project,
      cssClasses: { ...existing, [id]: newClass },
      artboards: {
        ...s.project.artboards,
        [artboardId]: {
          ...ab,
          elements: { ...ab.elements, [elementId]: newEl },
        },
      },
      updatedAt: now,
    }
    set(pushHistory(s.history, s.historyIndex, s.project, newProject))
    return id
  },
})
