import { useEditorStore } from './index'
import { useShallow } from 'zustand/react/shallow'

// --- Primitives (no shallow needed) ---
export const useProject = () => useEditorStore(s => s.project)
export const useAllProjects = () => useEditorStore(s => s.allProjects)
export const useActiveArtboardId = () => useEditorStore(s => s.activeArtboardId)
export const useSelectedElementId = () => useEditorStore(s => s.selectedElementId)
export const useCurrentView = () => useEditorStore(s => s.currentView)
export const useActiveBreakpointId = () => useEditorStore(s => s.activeBreakpointId)
export const useGridEditElementId = () => useEditorStore(s => s.gridEditElementId)
export const useActiveProjectId = () => useEditorStore(s => s.activeProjectId)

// --- Arrays (useShallow) ---
export const useSelectedElementIds = () => useEditorStore(useShallow(s => s.selectedElementIds))
export const useSelectedArtboardIds = () => useEditorStore(useShallow(s => s.selectedArtboardIds))

// --- Objects (useShallow) ---
export const useSelection = () => useEditorStore(
  useShallow(s => ({
    selectedElementId: s.selectedElementId,
    selectedElementIds: s.selectedElementIds,
  }))
)

// --- Derived ---
export const useActiveArtboard = () => useEditorStore(s => {
  if (!s.project || !s.activeArtboardId) return null
  return s.project.artboards[s.activeArtboardId] ?? null
})

// --- Actions (stable references, no re-render) ---
export const useProjectActions = () => useEditorStore(
  useShallow(s => ({
    createProject: s.createProject,
    openProject: s.openProject,
    closeProject: s.closeProject,
    deleteProject: s.deleteProject,
    renameProject: s.renameProject,
    duplicateProject: s.duplicateProject,
    loadProject: s.loadProject,
  }))
)

export const useElementActions = () => useEditorStore(
  useShallow(s => ({
    addElement: s.addElement,
    updateElement: s.updateElement,
    deleteElement: s.deleteElement,
    moveElement: s.moveElement,
    updateSelectedElements: s.updateSelectedElements,
    clearBreakpointStyle: s.clearBreakpointStyle,
    toggleElementVisibility: s.toggleElementVisibility,
    renameElements: s.renameElements,
    wrapElementsInDiv: s.wrapElementsInDiv,
    copyElement: s.copyElement,
    pasteElement: s.pasteElement,
    duplicateElement: s.duplicateElement,
  }))
)

export const useSelectionActions = () => useEditorStore(
  useShallow(s => ({
    selectElement: s.selectElement,
    selectElements: s.selectElements,
    toggleSelectElement: s.toggleSelectElement,
    selectArtboards: s.selectArtboards,
  }))
)

export const useArtboardActions = () => useEditorStore(
  useShallow(s => ({
    enterArtboard: s.enterArtboard,
    setActiveArtboard: s.setActiveArtboard,
    addArtboard: s.addArtboard,
    deleteArtboard: s.deleteArtboard,
    moveArtboard: s.moveArtboard,
    moveArtboardTemp: s.moveArtboardTemp,
    updateArtboard: s.updateArtboard,
    updateCanvasSettings: s.updateCanvasSettings,
  }))
)

export const useHistoryActions = () => useEditorStore(
  useShallow(s => ({
    undo: s.undo,
    redo: s.redo,
  }))
)

export const useUiActions = () => useEditorStore(
  useShallow(s => ({
    setCurrentView: s.setCurrentView,
    setActiveBreakpoint: s.setActiveBreakpoint,
    expandLayers: s.expandLayers,
    collapseLayers: s.collapseLayers,
    collapseAllLayers: s.collapseAllLayers,
    setGridEditElementId: s.setGridEditElementId,
  }))
)
