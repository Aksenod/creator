import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
import { Layers } from '../Layers/Layers'
import { Properties } from '../Properties/Properties'
import { Canvas } from '../Canvas/Canvas'
import { Topbar } from '../Canvas/PageEditor/Topbar'
import { BREAKPOINTS, detectBreakpoint, type Breakpoint } from '../Canvas/PageEditor/BreakpointBar'
import { GridEditOverlay } from '../GridEditOverlay'
import { GridChildResizeOverlay } from '../GridChildResizeOverlay'
import type { BreakpointId } from '../../constants/breakpoints'
import { findParentId, getSiblingInfo } from '../../utils/treeUtils'
import type { CanvasPattern } from '../../types'

export function CanvasEditor() {
  const {
    activeProjectId, project, activeArtboardId,
    closeProject, addArtboard, setActiveArtboard, selectElement,
    selectedElementId, activeBreakpointId, setActiveBreakpoint,
    deleteElement, undo, redo, copyElement, pasteElement, duplicateElement,
    gridEditElementId,
  } = useEditorStore()

  const [isPreview, setIsPreview] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [panelsHidden, setPanelsHidden] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(() => detectBreakpoint())
  const [customWidth, setCustomWidth] = useState<string>('')
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const patternSizeRef = useRef<number>(project?.canvasPatternSize ?? 20)
  const { cameraRef, fitToScreen, scalePercent, applyTransform } = useCanvasTransform(
    containerRef as React.RefObject<HTMLElement>,
    worldRef as React.RefObject<HTMLElement>,
    patternSizeRef,
  )

  // Sync patternSizeRef and re-apply when size changes
  useEffect(() => {
    patternSizeRef.current = project?.canvasPatternSize ?? 20
    applyTransform()
  }, [project?.canvasPatternSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const parsedCustom = parseInt(customWidth)
  const displayWidth = customWidth && !isNaN(parsedCustom) && parsedCustom > 0 ? parsedCustom : viewportWidth

  const activeArtboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null

  // Автофит при открытии проекта
  useEffect(() => {
    if (!project) return
    const firstId = project.artboardOrder[0]
    const firstAb = firstId ? project.artboards[firstId] : null
    if (firstAb) {
      setTimeout(() => fitToScreen(firstAb.width), 0)
    }
  }, [activeProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBreakpointSelect = (bp: Breakpoint) => {
    setViewportWidth(bp.width)
    setCustomWidth('')
    setActiveBreakpoint(bp.id as BreakpointId)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCanvasSettings) { setShowCanvasSettings(false); return }
        if (isFocusMode) { setIsFocusMode(false); return }
        if (isPreview) { setIsPreview(false); return }
        selectElement(null)
        return
      }

      const tag = (e.target as HTMLElement).tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        if (e.key === 'f' || e.key === 'F') {
          const s = useEditorStore.getState()
          const abId = s.activeArtboardId
          const ab = abId && s.project ? s.project.artboards[abId] : null
          if (!isFocusMode && ab) {
            setIsFocusMode(true)
            setTimeout(() => fitToScreen(ab.width), 0)
          } else if (isFocusMode) {
            setIsFocusMode(false)
          }
          return
        }

        const idx = parseInt(e.key) - 1
        if (idx >= 0 && idx < BREAKPOINTS.length) {
          const bp = BREAKPOINTS[idx]
          setViewportWidth(bp.width)
          setCustomWidth('')
          setActiveBreakpoint(bp.id as BreakpointId)
          return
        }

        // Навигация по слоям (Figma-style)
        const s = useEditorStore.getState()
        const abId = s.activeArtboardId
        const ab = abId && s.project ? s.project.artboards[abId] : null

        if (ab && e.key === 'Enter' && !e.shiftKey) {
          if (s.selectedElementIds.length === 1) {
            const currentId = s.selectedElementIds[0]
            const el = ab.elements[currentId]
            if (el && el.children.length > 0) {
              useEditorStore.getState().expandLayers([currentId])
              useEditorStore.getState().selectElements(el.children)
              e.preventDefault()
            }
          }
          return
        }

        if (ab && e.key === 'Enter' && e.shiftKey) {
          const id = s.selectedElementIds[0] ?? s.selectedElementId
          if (id) {
            const parentId = findParentId(ab, id)
            if (parentId) {
              useEditorStore.getState().selectElement(parentId)
              e.preventDefault()
            }
          }
          return
        }

        if (ab && e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault()
          if (s.selectedElementIds.length > 1) {
            useEditorStore.getState().selectElement(s.selectedElementIds[0])
            return
          }
          if (s.selectedElementIds.length !== 1) return
          const info = getSiblingInfo(ab, s.selectedElementIds[0])
          if (!info || info.index + 1 >= info.siblings.length) return
          useEditorStore.getState().selectElement(info.siblings[info.index + 1])
          return
        }

        if (ab && e.key === 'Tab' && e.shiftKey) {
          e.preventDefault()
          if (s.selectedElementIds.length > 1) {
            useEditorStore.getState().selectElement(s.selectedElementIds[s.selectedElementIds.length - 1])
            return
          }
          if (s.selectedElementIds.length !== 1) return
          const info = getSiblingInfo(ab, s.selectedElementIds[0])
          if (!info || info.index - 1 < 0) return
          useEditorStore.getState().selectElement(info.siblings[info.index - 1])
          return
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && activeArtboardId) {
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          deleteElement(activeArtboardId, selectedElementId)
        }
      }

      const isMac = navigator.userAgent.includes('Mac')
      const mod = isMac ? e.metaKey : e.ctrlKey

      if (mod && e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && e.code === 'KeyZ' && e.shiftKey) { e.preventDefault(); redo() }
      if (mod && e.key === 'c') { e.preventDefault(); copyElement() }
      if (mod && e.key === 'v') { e.preventDefault(); pasteElement() }
      if (mod && e.key === 'd') { e.preventDefault(); e.stopPropagation(); duplicateElement() }
      if ((e.metaKey || e.ctrlKey) && (e.code === 'Backquote' || e.code === 'Backslash')) {
        e.preventDefault(); setPanelsHidden(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    isPreview, isFocusMode, showCanvasSettings, selectedElementId, activeArtboardId,
    selectElement, deleteElement, undo, redo, copyElement, pasteElement,
    duplicateElement, setActiveBreakpoint,
  ])

  if (!project) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <Topbar
        projectName={project.name}
        isPreview={isPreview}
        activeBreakpointId={activeBreakpointId}
        displayWidth={displayWidth}
        customWidth={customWidth}
        scale={scalePercent / 100}
        showCanvasSettings={showCanvasSettings}
        isFocusMode={isFocusMode}
        hasActiveArtboard={!!activeArtboardId}
        onCloseProject={closeProject}
        onTogglePreview={() => setIsPreview(!isPreview)}
        onToggleSettings={() => setShowCanvasSettings(s => !s)}
        onCustomWidthChange={setCustomWidth}
        onCustomWidthBlur={(v) => {
          const n = parseInt(v)
          if (!n || isNaN(n)) setCustomWidth('')
        }}
        onClearCustomWidth={() => setCustomWidth('')}
        onBreakpointSelect={handleBreakpointSelect}
        onSetShowSettings={setShowCanvasSettings}
        onAddArtboard={() => addArtboard('Artboard ' + (project.artboardOrder.length + 1))}
        onToggleFocusMode={() => setIsFocusMode(f => !f)}
      />

      {/* Основная область */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Панель слоёв */}
        {!isPreview && (
          <div style={{
            width: (panelsHidden || isFocusMode) ? 0 : 240,
            minWidth: 0,
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 160ms ease',
          }}>
            <div style={{ width: 240, height: '100%', borderRight: '1px solid #e0e0e0' }}>
              {activeArtboard ? (
                <Layers artboard={activeArtboard} />
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: '#aaa', fontSize: 12, padding: 16, textAlign: 'center',
                }}>
                  Кликни на артборд для редактирования
                </div>
              )}
            </div>
          </div>
        )}

        {/* Бесконечный холст */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            background: project?.canvasBackground ?? '#e8e8e8',
            backgroundImage: getPatternImage(project?.canvasPattern ?? 'dots'),
            position: 'relative',
            outline: 'none',
          }}
          tabIndex={0}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveArtboard(null)
              selectElement(null)
            }
          }}
        >
          {/* Трансформируемый слой — transform применяется напрямую через worldRef, без React re-render */}
          <div
            ref={worldRef}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
          >
            {project.artboardOrder.map(id => {
              const artboard = project.artboards[id]
              if (!artboard) return null
              const isActive = id === activeArtboardId && !isPreview

              return (
                <div
                  key={id}
                  style={{
                    position: 'absolute',
                    left: artboard.x,
                    top: artboard.y,
                  }}
                >
                  {/* Лейбл над артбордом */}
                  {!isPreview && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -24,
                        left: 0,
                        fontSize: 12,
                        color: '#555',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        lineHeight: '20px',
                      }}
                    >
                      {artboard.name}
                    </div>
                  )}

                  {/* Артборд */}
                  <Canvas
                    artboard={artboard}
                    previewMode={isPreview}
                    cameraRef={cameraRef}
                    plain
                    isActive={isActive}
                    onArtboardClick={() => setActiveArtboard(id)}
                    displayWidth={displayWidth}
                  />
                </div>
              )
            })}
          </div>

          {/* Процент зума */}
          {!isPreview && (
            <div style={{
              position: 'absolute', bottom: 12, left: 12,
              fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.85)',
              padding: '3px 8px', borderRadius: 4,
              pointerEvents: 'none',
            }}>
              {scalePercent}%
            </div>
          )}
        </div>

        {/* Панель свойств */}
        {!isPreview && (
          <div style={{
            width: (panelsHidden || isFocusMode) ? 0 : 240,
            minWidth: 0,
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 160ms ease',
          }}>
            <div style={{ width: 240, height: '100%', borderLeft: '1px solid #e0e0e0' }}>
              <Properties />
            </div>
          </div>
        )}
      </div>

      {/* Grid Edit Mode overlay */}
      {!isPreview && gridEditElementId && activeArtboardId && (
        <GridEditOverlay artboardId={activeArtboardId} />
      )}

      {/* Grid child span resize handles */}
      {!isPreview && activeArtboardId && (
        <GridChildResizeOverlay artboardId={activeArtboardId} />
      )}
    </div>
  )
}

// ─── Паттерны фона ──────────────────────────────────────────────────────────────

function getPatternImage(pattern: CanvasPattern): string {
  switch (pattern) {
    case 'none':
      return 'none'
    case 'dots':
      return 'radial-gradient(circle, #c0c0c0 1px, transparent 1px)'
    case 'grid':
      return 'linear-gradient(#c8c8c8 1px, transparent 1px), linear-gradient(90deg, #c8c8c8 1px, transparent 1px)'
    case 'cross':
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cline x1='10' y1='2' x2='10' y2='18' stroke='%23c0c0c0' stroke-width='1'/%3E%3Cline x1='2' y1='10' x2='18' y2='10' stroke='%23c0c0c0' stroke-width='1'/%3E%3C/svg%3E")`
    case 'hearts':
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M10 15 C10 15 3 10 3 6.5 C3 4.5 4.5 3 6.5 3 C8 3 9.5 4 10 5.5 C10.5 4 12 3 13.5 3 C15.5 3 17 4.5 17 6.5 C17 10 10 15 10 15Z' fill='%23d0d0d0'/%3E%3C/svg%3E")`
    default:
      return 'radial-gradient(circle, #c0c0c0 1px, transparent 1px)'
  }
}
