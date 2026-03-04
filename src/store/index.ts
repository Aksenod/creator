import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EditorState } from './types'
import { createProjectSlice } from './slices/projectSlice'
import { createArtboardSlice } from './slices/artboardSlice'
import { createSelectionSlice } from './slices/selectionSlice'
import { createElementSlice } from './slices/elementSlice'
import { createHistorySlice } from './slices/historySlice'
import { createUiSlice } from './slices/uiSlice'
import { createClassSlice } from './slices/classSlice'

export type { EditorState } from './types'

export const useEditorStore = create<EditorState>()(
  persist(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createArtboardSlice(...a),
      ...createSelectionSlice(...a),
      ...createElementSlice(...a),
      ...createHistorySlice(...a),
      ...createUiSlice(...a),
      ...createClassSlice(...a),
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
