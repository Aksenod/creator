import type { StateCreator } from 'zustand'
import type { EditorState, ProjectSlice } from '../types'
import type { Project, Artboard, CanvasElement } from '../../types'
import { generateId } from '../helpers'

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

export { createDefaultArtboard, syncProjectToAll }

export const createProjectSlice: StateCreator<EditorState, [], [], ProjectSlice> = (set) => ({
  allProjects: [],
  project: null,
  activeProjectId: null,

  createProject: (name) => {
    const artboard = createDefaultArtboard('Home', 100, 100)
    const project: Project = {
      id: generateId(),
      name,
      artboards: { [artboard.id]: artboard },
      artboardOrder: [artboard.id],
      updatedAt: Date.now(),
    }
    set((state) => {
      const updatedAll = state.project
        ? syncProjectToAll(state.allProjects, state.project)
        : state.allProjects
      return {
        allProjects: [...updatedAll.filter(p => p.id !== project.id), project],
        project,
        activeProjectId: project.id,
        activeArtboardId: artboard.id,
        selectedElementId: null,
        selectedElementIds: [],
        history: [],
        historyIndex: -1,
        future: [],
      }
    })
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
})
