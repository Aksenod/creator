import type { Project, Artboard, CanvasElement, ElementStyles, ElementType, CanvasPattern } from '../types'
import type { BreakpointId } from '../constants/breakpoints'

export type ArtboardPatch = Partial<Pick<Artboard, 'name' | 'height'>>

// --- Slice types ---

export type ProjectSlice = {
  allProjects: Project[]
  project: Project | null
  activeProjectId: string | null

  createProject: (name: string) => void
  openProject: (id: string) => void
  closeProject: () => void
  deleteProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  duplicateProject: (id: string) => void
  loadProject: (project: Project) => void
}

export type ArtboardSlice = {
  activeArtboardId: string | null

  enterArtboard: (artboardId: string) => void
  setActiveArtboard: (id: string | null) => void
  addArtboard: (name: string) => void
  deleteArtboard: (id: string) => void
  moveArtboard: (id: string, x: number, y: number) => void
  moveArtboardTemp: (id: string, x: number, y: number) => void
  updateArtboard: (id: string, patch: ArtboardPatch) => void
  updateCanvasSettings: (patch: { canvasBackground?: string; canvasPattern?: CanvasPattern; canvasPatternSize?: number; canvasPatternColor?: string }) => void
}

export type SelectionSlice = {
  selectedElementId: string | null
  selectedElementIds: string[]
  selectedArtboardIds: string[]

  selectElement: (id: string | null) => void
  selectElements: (ids: string[]) => void
  toggleSelectElement: (id: string) => void
  selectArtboards: (ids: string[]) => void
}

export type ElementSlice = {
  addElement: (artboardId: string, type: ElementType, parentId: string | null) => void
  updateElement: (artboardId: string, elementId: string, patch: Partial<CanvasElement>) => void
  moveElement: (artboardId: string, elementId: string, newParentId: string | null, newIndex: number) => void
  deleteElement: (artboardId: string, elementId: string) => void
  updateSelectedElements: (artboardId: string, patch: Partial<ElementStyles>) => void
  clearBreakpointStyle: (artboardId: string, elementId: string, bpId: BreakpointId) => void
  toggleElementVisibility: (artboardId: string, elementId: string) => void
  renameElements: (artboardId: string, renames: Array<{ id: string; name: string }>) => void
  wrapElementsInDiv: (artboardId: string, elementIds: string[]) => void
  copyElement: () => void
  pasteElement: () => void
  duplicateElement: () => void
}

export type HistorySlice = {
  history: Project[]
  historyIndex: number
  future: Project[]

  undo: () => void
  redo: () => void
}

export type UiSlice = {
  currentView: 'projects' | 'editor' | 'backlog' | 'team'
  activeBreakpointId: BreakpointId
  expandedLayers: Set<string>
  gridEditElementId: string | null

  setCurrentView: (view: 'projects' | 'editor' | 'backlog' | 'team') => void
  setActiveBreakpoint: (bpId: BreakpointId) => void
  expandLayers: (ids: string[]) => void
  collapseLayers: (ids: string[]) => void
  collapseAllLayers: () => void
  setGridEditElementId: (id: string | null) => void
}

// Full store type — intersection of all slices
export type EditorState =
  ProjectSlice &
  ArtboardSlice &
  SelectionSlice &
  ElementSlice &
  HistorySlice &
  UiSlice
