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

export function CanvasEditor() {
  const {
    activeProjectId, project, activeArtboardId,
    closeProject, addArtboard, setActiveArtboard, selectElement,
    selectedElementId, activeBreakpointId, setActiveBreakpoint,
    deleteElement, undo, redo, copyElement, pasteElement, duplicateElement,
    gridEditElementId,
  } = useEditorStore()

  const [isPreview, setIsPreview] = useState(false)
  const [panelsHidden, setPanelsHidden] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(() => detectBreakpoint())
  const [customWidth, setCustomWidth] = useState<string>('')
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const { cameraRef, fitToScreen, scalePercent } = useCanvasTransform(
    containerRef as React.RefObject<HTMLElement>,
    worldRef as React.RefObject<HTMLElement>,
  )

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
        if (isPreview) { setIsPreview(false); return }
        selectElement(null)
        return
      }

      const tag = (e.target as HTMLElement).tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        const idx = parseInt(e.key) - 1
        if (idx >= 0 && idx < BREAKPOINTS.length) {
          const bp = BREAKPOINTS[idx]
          setViewportWidth(bp.width)
          setCustomWidth('')
          setActiveBreakpoint(bp.id as BreakpointId)
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
    isPreview, showCanvasSettings, selectedElementId, activeArtboardId,
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
      />

      {/* Основная область */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Панель слоёв */}
        {!isPreview && (
          <div style={{
            width: panelsHidden ? 0 : 240,
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
            background: '#e8e8e8',
            backgroundImage: 'radial-gradient(circle, #c0c0c0 1px, transparent 1px)',
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
            width: panelsHidden ? 0 : 240,
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
