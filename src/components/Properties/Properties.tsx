import { useEffect, useMemo } from 'react'
import { useEditorStore } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { useSelectedElementId, useSelectedElementIds, useProject, useActiveArtboardId, useActiveBreakpointId, useEditingClassId, useCssClasses } from '../../store/selectors'
import { CollapsibleSection, PropertyRow } from './shared'
import { PropertySelect } from './shared/PropertySelect'
import { AppearanceSection } from './AppearanceSection'
import type { CanvasElement, ElementStyles } from '../../types'
import { CanvasSection } from './CanvasSection'
import { ArtboardSection } from './ArtboardSection'
import { BREAKPOINT_LABELS } from '../../constants/breakpoints'
import type { BreakpointId } from '../../constants/breakpoints'
import { resolveStyles } from '../../utils/resolveStyles'
import { LayoutSection } from './LayoutSection'
import { SizeSection } from './SizeSection'
import { TypographySection } from './TypographySection'
import { FillSection } from './FillSection'
import { BorderSection } from './BorderSection'
import { ImageSection } from './ImageSection'
import { PositionSection } from './PositionSection'
import { SpacingSection } from './SpacingSection'
import { GridChildSection } from './GridChildSection'
import { ClassSelector } from './ClassSelector'
import type { PositionMode } from '../../types'
import { findParentId } from '../../utils/treeUtils'
import { BREAKPOINTS } from '../Canvas/PageEditor/BreakpointBar'


const getCommonStyles = (
  ids: string[],
  elements: Record<string, CanvasElement>,
  bpId: BreakpointId,
  cssClasses?: Record<string, import('../../types/cssClass').CSSClass>,
): Partial<ElementStyles> => {
  if (ids.length === 0) return {}
  const first = resolveStyles(elements[ids[0]], bpId, cssClasses)
  const result: Partial<ElementStyles> = {}

  for (const key of Object.keys(first) as (keyof ElementStyles)[]) {
    const val = first[key]
    const allSame = ids.every(id => {
      const s = resolveStyles(elements[id], bpId, cssClasses)
      return Object.is(s[key], val)
    })
    if (allSame) (result as Record<string, unknown>)[key] = val
  }
  return result
}

export function Properties() {
  const selectedElementId = useSelectedElementId()
  const selectedElementIds = useSelectedElementIds()
  const project = useProject()
  const activeArtboardId = useActiveArtboardId()
  const activeBreakpointId = useActiveBreakpointId()
  const editingClassId = useEditingClassId()
  const cssClasses = useCssClasses()
  const { updateElement, updateSelectedElements, clearBreakpointStyle, updateClassStyles, setEditingClassId } = useEditorStore(useShallow(s => ({
    updateElement: s.updateElement,
    updateSelectedElements: s.updateSelectedElements,
    clearBreakpointStyle: s.clearBreakpointStyle,
    updateClassStyles: s.updateClassStyles,
    setEditingClassId: s.setEditingClassId,
  })))
  const updateCanvasSettings = useEditorStore(s => s.updateCanvasSettings)
  const updateArtboard = useEditorStore(s => s.updateArtboard)

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null
  const element = artboard && selectedElementId ? artboard.elements[selectedElementId] : null

  // Webflow behavior: always edit through last class when classes exist
  // No "Done" button — classes are always the editing target
  useEffect(() => {
    if (!element || !element.classIds || element.classIds.length === 0) {
      if (editingClassId) setEditingClassId(null)
      return
    }
    const lastClassId = element.classIds[element.classIds.length - 1]
    if (cssClasses?.[lastClassId]) {
      setEditingClassId(lastClassId)
    } else {
      setEditingClassId(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElementId, element?.classIds?.length])

  const activeBp = BREAKPOINTS.find(bp => bp.id === activeBreakpointId)
  const effectiveWidth = activeBp?.width ?? artboard?.width ?? 1440
  const breakpointLabel = activeBp?.label ?? 'Desktop'
  const isMultiSelect = selectedElementIds.length > 1
  const commonStyles = useMemo(
    () => isMultiSelect && artboard
      ? getCommonStyles(selectedElementIds, artboard.elements, activeBreakpointId, cssClasses)
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMultiSelect, selectedElementIds, artboard, activeBreakpointId, cssClasses],
  )

  const updateStyle = (patch: Partial<ElementStyles>) => {
    if (!activeArtboardId) return
    // Class editing mode — update class definition, not element
    if (editingClassId) {
      updateClassStyles(editingClassId, patch)
      return
    }
    if (isMultiSelect) {
      updateSelectedElements(activeArtboardId, patch)
    } else if (selectedElementId) {
      updateElement(activeArtboardId, selectedElementId, { styles: patch })
    }
  }

  const updateField = (patch: Parameters<typeof updateElement>[2]) => {
    if (!activeArtboardId || !selectedElementId) return
    updateElement(activeArtboardId, selectedElementId, patch)
  }

  const updatePositionMode = (mode: PositionMode) => {
    if (!activeArtboardId) return
    // Route through class system (position is now in ElementStyles)
    updateStyle({ position: mode })
    // Also update legacy positionMode field for backward compat
    if (selectedElementId) {
      updateElement(activeArtboardId, selectedElementId, { positionMode: mode })
    }
  }

  const effectiveStyles = isMultiSelect
    ? (commonStyles ?? {})
    : element ? resolveStyles(element, activeBreakpointId, cssClasses) : {}

  const parentId = artboard && selectedElementId ? findParentId(artboard, selectedElementId) : null
  const parentEl = parentId && artboard ? artboard.elements[parentId] : null
  const parentEffectiveStyles = parentEl ? resolveStyles(parentEl, activeBreakpointId, cssClasses) : null
  const isGridChild = parentEffectiveStyles?.display === 'grid'

  const hasBpOverrides = !isMultiSelect && element && activeBreakpointId !== 'desktop'
    ? !!(element.breakpointStyles?.[activeBreakpointId] && Object.keys(element.breakpointStyles[activeBreakpointId]!).length > 0)
    : false

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 12px', fontSize: 11, fontWeight: 600,
        color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '1px solid #e5e5e5',
      }}>
        Properties
      </div>
      {activeBreakpointId !== 'desktop' && (
        <div style={{
          padding: '6px 12px',
          background: hasBpOverrides ? '#fff3cd' : '#f5f5f5',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: hasBpOverrides ? '#8a6000' : '#525252', fontWeight: 500 }}>
            ✎ {BREAKPOINT_LABELS[activeBreakpointId]}
            {hasBpOverrides ? ' · has overrides' : ''}
          </span>
          {hasBpOverrides && element && (
            <button
              onClick={() => clearBreakpointStyle(activeArtboardId!, selectedElementId!, activeBreakpointId)}
              title={`Remove all ${BREAKPOINT_LABELS[activeBreakpointId]} overrides`}
              style={{
                fontSize: 10, padding: '2px 6px', border: '1px solid #e0b000',
                borderRadius: 3, cursor: 'default', background: '#fff', color: '#8a6000',
              }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', overflowX: 'hidden', padding: 12 }}>
        {isMultiSelect ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ padding: '6px 0', fontSize: 12, color: '#525252', fontWeight: 500 }}>
              Selected: {selectedElementIds.length} elements
            </div>

            <SpacingSection styles={effectiveStyles} onUpdate={updateStyle} />
            <LayoutSection styles={effectiveStyles} onUpdate={updateStyle} />
            <SizeSection styles={effectiveStyles} onUpdate={updateStyle} />
            <AppearanceSection styles={effectiveStyles} onUpdate={updateStyle} />
            <FillSection styles={effectiveStyles} onUpdate={updateStyle} />
            <BorderSection styles={effectiveStyles} onUpdate={updateStyle} />
            <TypographySection styles={effectiveStyles} onUpdate={updateStyle} />
          </div>
        ) : !element && artboard ? (
          <ArtboardSection
            artboard={artboard}
            effectiveWidth={effectiveWidth}
            breakpointLabel={breakpointLabel}
            onUpdate={(patch) => updateArtboard(artboard.id, patch)}
          />
        ) : !element ? (
          <CanvasSection
            canvasBackground={project?.canvasBackground ?? '#e8e8e8'}
            canvasPattern={project?.canvasPattern ?? 'dots'}
            canvasPatternSize={project?.canvasPatternSize ?? 20}
            canvasPatternColor={project?.canvasPatternColor}
            onUpdate={updateCanvasSettings}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {editingClassId && cssClasses?.[editingClassId] && (
              <div style={{
                padding: '6px 12px',
                background: '#fff8f0',
                borderRadius: 6,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #ffcc80',
              }}>
                <span style={{ fontSize: 11, color: '#e65100', fontWeight: 500 }}>
                  .{cssClasses[editingClassId].name}
                </span>
                <span style={{ fontSize: 10, color: '#bf7600', marginLeft: 6 }}>
                  — all changes apply to this class
                </span>
              </div>
            )}

            <CollapsibleSection label="Layer" defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <PropertyRow label="Name">
                  <input
                    value={element.name}
                    onChange={(e) => updateField({ name: e.target.value })}
                    style={inputStyle}
                  />
                </PropertyRow>
                <PropertyRow label="Class">
                  <ClassSelector />
                </PropertyRow>
                {(element.type === 'text' || element.type === 'button' || element.type === 'input') && (
                  <PropertyRow label="Контент">
                    <textarea
                      value={element.content ?? ''}
                      onChange={(e) => updateField({ content: e.target.value })}
                      placeholder={element.type === 'text' ? 'Введите текст' : element.type === 'button' ? 'Текст кнопки' : 'Placeholder'}
                      rows={3}
                      style={{
                        ...inputStyle,
                        resize: 'vertical',
                        fontFamily: element.type === 'text' ? 'inherit' : undefined,
                      }}
                    />
                  </PropertyRow>
                )}
                {element.type === 'input' && (
                  <PropertyRow label="Тип">
                    <PropertySelect
                      value={element.inputType ?? 'text'}
                      options={[
                        { value: 'text', label: 'text' },
                        { value: 'email', label: 'email' },
                        { value: 'password', label: 'password' },
                        { value: 'number', label: 'number' },
                        { value: 'tel', label: 'tel' },
                      ]}
                      onChange={(v) => updateField({ inputType: v as CanvasElement['inputType'] })}
                      placeholder=""
                    />
                  </PropertyRow>
                )}
              </div>
            </CollapsibleSection>

            {element.type === 'image' && (
              <ImageSection
                element={element}
                styles={effectiveStyles}
                onUpdateField={updateField}
                onUpdateStyle={updateStyle}
              />
            )}

            <SpacingSection styles={effectiveStyles} onUpdate={updateStyle} />

            {isGridChild && (
              <GridChildSection styles={effectiveStyles} onUpdate={updateStyle} />
            )}

            <LayoutSection styles={effectiveStyles} onUpdate={updateStyle} elementId={selectedElementId} />
            <SizeSection
              styles={effectiveStyles}
              onUpdate={updateStyle}
              elementId={selectedElementId ?? undefined}
              artboardWidth={effectiveWidth}
              artboardHeight={artboard?.height}
            />

            {element.type !== 'body' && (
              <PositionSection
                positionMode={(effectiveStyles as any).position ?? element.positionMode}
                styles={effectiveStyles}
                onUpdateMode={updatePositionMode}
                onUpdateStyle={updateStyle}
                elementId={selectedElementId ?? undefined}
                artboardWidth={effectiveWidth}
                artboardHeight={artboard?.height}
              />
            )}

            <AppearanceSection styles={effectiveStyles} onUpdate={updateStyle} />
            <FillSection styles={effectiveStyles} onUpdate={updateStyle} />
            <BorderSection styles={effectiveStyles} onUpdate={updateStyle} />
            <TypographySection styles={effectiveStyles} onUpdate={updateStyle} />
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '3px 6px', border: '1px solid #e5e5e5', borderRadius: 4,
  fontSize: 12, background: '#fafafa', outline: 'none', width: '100%', minWidth: 0,
  color: '#0a0a0a',
}
