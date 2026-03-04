import { useCallback } from 'react'
import { useSelectedElementId, useActiveBreakpointId, useCssClasses, useActiveArtboardId, useProject } from '../store/selectors'
import { getPropertySource } from '../utils/resolveClassStyles'
import type { ElementStyles } from '../types'
import type { PropertySource } from '../components/Properties/shared/PropertyRow'

/**
 * Hook that returns a function to get the source of a style property.
 * Used for visual indicators in Properties panel:
 * - 'class' (orange) — value comes from CSS class
 * - 'local' (blue) — value is a local override on the element
 * - 'none' — property not set
 */
export function usePropertySource(): (prop: keyof ElementStyles) => PropertySource {
  const selectedElementId = useSelectedElementId()
  const activeArtboardId = useActiveArtboardId()
  const activeBreakpointId = useActiveBreakpointId()
  const cssClasses = useCssClasses()
  const project = useProject()

  return useCallback((prop: keyof ElementStyles): PropertySource => {
    if (!project || !activeArtboardId || !selectedElementId) return 'none'
    const artboard = project.artboards[activeArtboardId]
    if (!artboard) return 'none'
    const element = artboard.elements[selectedElementId]
    if (!element) return 'none'
    // Only show indicators when element has classes
    if (!element.classIds || element.classIds.length === 0) return 'none'

    return getPropertySource(element, prop, activeBreakpointId, cssClasses)
  }, [project, activeArtboardId, selectedElementId, activeBreakpointId, cssClasses])
}
