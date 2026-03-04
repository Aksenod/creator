import { useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '../shared/ErrorFallback'
import { useEditorStore } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { useActiveProjectId, useProject, useActiveArtboardId, useSelectedElementId, useActiveBreakpointId, useGridEditElementId, useSelectedArtboardIds } from '../../store/selectors'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
import { Layers } from '../Layers/Layers'
import { Properties } from '../Properties/Properties'
import { Canvas } from '../Canvas/Canvas'
import { Topbar } from '../Canvas/PageEditor/Topbar'
import { BREAKPOINTS, detectBreakpoint, type Breakpoint } from '../Canvas/PageEditor/BreakpointBar'
import { GridEditOverlay } from '../GridEditOverlay'
import { GridChildResizeOverlay } from '../GridChildResizeOverlay'
import { RenameLayersModal } from '../RenameLayersModal'
import { Toast } from '../Toast/Toast'
import { AIChat } from '../AIChat/AIChat'
import type { BreakpointId } from '../../constants/breakpoints'
import { findParentId, getSiblingInfo, getCommonParentId } from '../../utils/treeUtils'
import { exportArtboardHTML, previewHTML } from '../../utils/exportHTML'
import { HTMLLightbox } from '../HTMLLightbox/HTMLLightbox'
import type { CanvasPattern } from '../../types'
import { useCanvasMarquee } from '../../hooks/useCanvasMarquee'
import { getArtboardOutline, getArtboardLabelColor, getArtboardLabelWeight } from '../../utils/artboardStyles'
import { useArtboardDrag } from '../../hooks/useArtboardDrag'
import { useImageDrop } from '../../hooks/useImageDrop'

// ─────────────────────────────────────────────────────────────────────────────

export function CanvasEditor() {
  const activeProjectId = useActiveProjectId()
  const project = useProject()
  const activeArtboardId = useActiveArtboardId()
  const selectedElementId = useSelectedElementId()
  const activeBreakpointId = useActiveBreakpointId()
  const gridEditElementId = useGridEditElementId()
  const selectedArtboardIds = useSelectedArtboardIds()
  const {
    closeProject, addArtboard, deleteArtboard, setActiveArtboard, selectElement,
    setActiveBreakpoint, deleteElement, undo, redo, copyElement, pasteElement,
    duplicateElement, toggleElementVisibility, wrapElementsInDiv,
  } = useEditorStore(useShallow(s => ({
    closeProject: s.closeProject,
    addArtboard: s.addArtboard,
    deleteArtboard: s.deleteArtboard,
    setActiveArtboard: s.setActiveArtboard,
    selectElement: s.selectElement,
    setActiveBreakpoint: s.setActiveBreakpoint,
    deleteElement: s.deleteElement,
    undo: s.undo,
    redo: s.redo,
    copyElement: s.copyElement,
    pasteElement: s.pasteElement,
    duplicateElement: s.duplicateElement,
    toggleElementVisibility: s.toggleElementVisibility,
    wrapElementsInDiv: s.wrapElementsInDiv,
  })))

  const [isPreview, setIsPreview] = useState(false)
  const [panelsHidden, setPanelsHidden] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(() => detectBreakpoint())
  const [customWidth, setCustomWidth] = useState<string>('')
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<'properties' | 'ai'>('properties')
  const [htmlLightbox, setHtmlLightbox] = useState<{ html: string; filename: string } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const artboardElRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { onCanvasMouseDown, marqueeRect: canvasMarqueeRect, wasCanvasMarqueeRef } = useCanvasMarquee(artboardElRefs, isPreview)
  const patternSizeRef = useRef<number>(project?.canvasPatternSize ?? 20)
  const { cameraRef, fitToScreen, scalePercent, applyTransform } = useCanvasTransform(
    containerRef as React.RefObject<HTMLElement>,
    worldRef as React.RefObject<HTMLElement>,
    patternSizeRef,
  )

  const { snapLines, startArtboardDrag } = useArtboardDrag(cameraRef, artboardElRefs)
  useImageDrop()

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

        // Навигация по слоям (Figma-style)
        const s = useEditorStore.getState()
        const abId = s.activeArtboardId
        const ab = abId && s.project ? s.project.artboards[abId] : null

        if (ab && e.key === 'Enter' && !e.shiftKey) {
          if (s.selectedElementIds.length === 0) {
            // Выделен артборд, но нет элемента — провалиться в первый рутовый элемент
            const firstRootId = ab.rootChildren?.[0]
            if (firstRootId) {
              useEditorStore.getState().selectElement(firstRootId)
              e.preventDefault()
            }
          } else if (s.selectedElementIds.length === 1) {
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
            } else {
              // Элемент рутовый — подняться на артборд (снять выделение элементов)
              useEditorStore.getState().selectElement(null)
              e.preventDefault()
            }
          }
          return
        }

        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault()
          if (!ab || s.selectedElementIds.length === 0) {
            // Нет выделенных элементов — переключаемся между артбордами
            const order = s.project?.artboardOrder ?? []
            const idx = abId ? order.indexOf(abId) : -1
            const nextId = order[idx + 1] ?? order[0]
            if (nextId && nextId !== abId) useEditorStore.getState().setActiveArtboard(nextId)
            return
          }
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

        if (e.key === 'Tab' && e.shiftKey) {
          e.preventDefault()
          if (!ab || s.selectedElementIds.length === 0) {
            // Нет выделенных элементов — переключаемся между артбордами (назад)
            const order = s.project?.artboardOrder ?? []
            const idx = abId ? order.indexOf(abId) : -1
            const prevId = order[idx - 1] ?? order[order.length - 1]
            if (prevId && prevId !== abId) useEditorStore.getState().setActiveArtboard(prevId)
            return
          }
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

      if ((e.key === 'Delete' || e.key === 'Backspace') && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        const s = useEditorStore.getState()
        if (s.selectedArtboardIds.length > 0) {
          s.selectedArtboardIds.forEach(id => deleteArtboard(id))
        } else if (selectedElementId && activeArtboardId) {
          deleteElement(activeArtboardId, selectedElementId)
        } else if (!selectedElementId && activeArtboardId) {
          deleteArtboard(activeArtboardId)
        }
      }

      const isMac = navigator.userAgent.includes('Mac')
      const mod = isMac ? e.metaKey : e.ctrlKey

      if (mod && e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && e.code === 'KeyZ' && e.shiftKey) { e.preventDefault(); redo() }
      if (mod && e.key === 'c') { e.preventDefault(); copyElement() }
      // Cmd+V — не перехватываем, пусть сработает paste event (обработчик ниже)
      if (mod && e.key === 'v') return
      if (mod && e.key === 'd') { e.preventDefault(); e.stopPropagation(); duplicateElement() }
      if (mod && e.shiftKey && e.code === 'KeyH') {
        e.preventDefault()
        const s = useEditorStore.getState()
        const selIds = s.selectedElementIds.length > 0 ? s.selectedElementIds : (s.selectedElementId ? [s.selectedElementId] : [])
        const abId = s.activeArtboardId
        if (abId && selIds.length > 0) {
          selIds.forEach(eid => toggleElementVisibility(abId, eid))
        }
      }
      if (mod && e.code === 'KeyR') {
        const s = useEditorStore.getState()
        const hasSelection = s.selectedElementIds.length > 0 || !!s.selectedElementId
        if (hasSelection) { e.preventDefault(); setShowRenameModal(true) }
      }
      if ((e.metaKey || e.ctrlKey) && (e.code === 'Backquote' || e.code === 'Backslash')) {
        e.preventDefault(); setPanelsHidden(v => !v)
      }
      if (mod && e.code === 'Period') {
        e.preventDefault(); setRightTab(t => t === 'properties' ? 'ai' : 'properties')
      }

      // Shift+A — обернуть выбранные элементы в div
      if (e.shiftKey && (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф')) {
        e.preventDefault()
        const s = useEditorStore.getState()
        const abId = s.activeArtboardId
        const selIds = s.selectedElementIds.length > 0 ? s.selectedElementIds : (s.selectedElementId ? [s.selectedElementId] : [])
        if (abId && selIds.length > 0) {
          const ab = s.project?.artboards[abId]
          if (ab) {
            const { valid } = getCommonParentId(ab, selIds)
            if (!valid) {
              setToastMessage('Можно объединять только элементы одного уровня')
              return
            }
          }
          wrapElementsInDiv(abId, selIds)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    isPreview, showCanvasSettings, selectedElementId, activeArtboardId,
    selectElement, deleteElement, deleteArtboard, undo, redo, copyElement, pasteElement,
    duplicateElement, setActiveBreakpoint, toggleElementVisibility, wrapElementsInDiv,
  ])


  if (!project) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <Topbar
        projectName={project.name}
        activeBreakpointId={activeBreakpointId}
        displayWidth={displayWidth}
        customWidth={customWidth}
        scale={scalePercent / 100}
        showCanvasSettings={showCanvasSettings}
        onCloseProject={closeProject}
        onTogglePreview={activeArtboard ? () => {
          const html = exportArtboardHTML(activeArtboard, project?.cssClasses)
          previewHTML(html)
        } : undefined}
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
        onExportHTML={activeArtboard ? () => {
          const html = exportArtboardHTML(activeArtboard, project?.cssClasses)
          setHtmlLightbox({ html, filename: `${activeArtboard.name}.html` })
        } : undefined}
      />

      {/* Основная область */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>

        {/* Бесконечный холст */}
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background: project?.canvasBackground ?? '#e8e8e8',
            backgroundImage: getPatternImage(project?.canvasPattern ?? 'dots', project?.canvasBackground ?? '#e8e8e8', project?.canvasPatternColor),
            position: 'relative',
            outline: 'none',
          }}
          tabIndex={0}
          onMouseDown={onCanvasMouseDown}
          onClick={(e) => {
            if (wasCanvasMarqueeRef.current) {
              wasCanvasMarqueeRef.current = false
              return
            }
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
              willChange: 'transform, zoom',
            }}
          >
            {project.artboardOrder.map(id => {
              const artboard = project.artboards[id]
              if (!artboard) return null
              const isActive = id === activeArtboardId && !isPreview

              return (
                <div
                  key={id}
                  ref={(el) => {
                    if (el) artboardElRefs.current.set(id, el)
                    else artboardElRefs.current.delete(id)
                  }}
                  style={{
                    position: 'absolute',
                    left: artboard.x,
                    top: artboard.y,
                    cursor: !isActive && !isPreview ? 'grab' : undefined,
                    outline: getArtboardOutline(isActive, selectedArtboardIds.includes(id)),
                    outlineOffset: 0,
                  }}
                  onMouseDown={!isActive && !isPreview ? (e) => {
                    e.stopPropagation()
                    const ab = project.artboards[id]
                    startArtboardDrag(id, e, ab.x, ab.y)
                  } : undefined}
                >
                  {/* Лейбл над артбордом */}
                  {!isPreview && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -24,
                        left: 0,
                        fontSize: 12,
                        color: getArtboardLabelColor(isActive),
                        fontWeight: getArtboardLabelWeight(isActive),
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        lineHeight: '20px',
                        cursor: 'grab',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        const ab = project.artboards[id]
                        startArtboardDrag(id, e, ab.x, ab.y)
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
          {/* Snap guides */}
          {snapLines.length > 0 && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 9999 }}>
              {snapLines.map((line, i) =>
                line.axis === 'x' ? (
                  <line key={i} x1={line.x} y1={line.y1} x2={line.x} y2={line.y2}
                    stroke="#0066ff" strokeWidth={1 / cameraRef.current.scale} />
                ) : (
                  <line key={i} x1={line.x1} y1={line.y} x2={line.x2} y2={line.y}
                    stroke="#0066ff" strokeWidth={1 / cameraRef.current.scale} />
                )
              )}
            </svg>
          )}
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

          {/* Canvas-level marquee overlay */}
          {canvasMarqueeRect && (
            <div
              style={{
                position: 'absolute',
                left: canvasMarqueeRect.left,
                top: canvasMarqueeRect.top,
                width: canvasMarqueeRect.width,
                height: canvasMarqueeRect.height,
                background: 'rgba(0, 102, 255, 0.08)',
                border: '1px solid #0066ff',
                pointerEvents: 'none',
                zIndex: 9998,
              }}
            />
          )}
        </div>

        {/* Панель слоёв — absolute overlay */}
        {!isPreview && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: 240,
            zIndex: 10,
            transform: panelsHidden ? 'translateX(-240px)' : 'translateX(0)',
            transition: 'transform 160ms ease',
          }}>
            <div style={{ width: 240, height: '100%', borderRight: '1px solid #e0e0e0', background: '#fff' }}>
              {activeArtboard ? (
                <Layers artboard={activeArtboard} />
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: '#aaa', fontSize: 12, padding: 16, textAlign: 'center',
                }}>
                  Click an artboard to edit
                </div>
              )}
            </div>
          </div>
        )}

        {/* Правая панель (Properties / AI Chat) — absolute overlay */}
        {!isPreview && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: '100%',
            width: 240,
            zIndex: 10,
            transform: panelsHidden ? 'translateX(240px)' : 'translateX(0)',
            transition: 'transform 160ms ease',
          }}>
            <div style={{ width: 240, height: '100%', borderLeft: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              {/* Табы */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5e5e5',
                flexShrink: 0,
              }}>
                {(['properties', 'ai'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      border: 'none',
                      borderBottom: rightTab === tab ? '2px solid #0a0a0a' : '2px solid transparent',
                      background: 'none',
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      color: rightTab === tab ? '#0a0a0a' : '#999',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                  >
                    {tab === 'properties' ? 'Properties' : 'AI Chat'}
                  </button>
                ))}
              </div>
              {/* Содержимое */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  {rightTab === 'properties' ? <Properties /> : <AIChat />}
                </ErrorBoundary>
              </div>
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

      {/* Rename layers modal */}
      {showRenameModal && activeArtboardId && (
        <RenameLayersModal
          artboardId={activeArtboardId}
          elementIds={useEditorStore.getState().selectedElementIds}
          onClose={() => setShowRenameModal(false)}
        />
      )}

      {/* Toast notifications */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* HTML Lightbox */}
      {htmlLightbox && (
        <HTMLLightbox
          html={htmlLightbox.html}
          filename={htmlLightbox.filename}
          onClose={() => setHtmlLightbox(null)}
        />
      )}
    </div>
  )
}

// ─── Паттерны фона ──────────────────────────────────────────────────────────────

function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return true
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  // Relative luminance (перцептивная яркость)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function getPatternImage(pattern: CanvasPattern, bg = '#e8e8e8', patternColor?: string): string {
  let c: string
  let ce: string
  let ca: string
  if (patternColor) {
    c = patternColor
    ce = encodeURIComponent(patternColor)
    ca = '1'
  } else {
    const light = isLightColor(bg)
    c = light ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.2)'
    ce = light ? '%23000000' : '%23ffffff'
    ca = light ? '0.18' : '0.2'
  }
  switch (pattern) {
    case 'none':
      return 'none'
    case 'dots':
      return `radial-gradient(circle, ${c} 1px, transparent 1px)`
    case 'grid':
      return `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`
    case 'cross':
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cline x1='10' y1='2' x2='10' y2='18' stroke='${ce}' stroke-width='1' stroke-opacity='${ca}'/%3E%3Cline x1='2' y1='10' x2='18' y2='10' stroke='${ce}' stroke-width='1' stroke-opacity='${ca}'/%3E%3C/svg%3E")`
    case 'hearts':
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M10 15 C10 15 3 10 3 6.5 C3 4.5 4.5 3 6.5 3 C8 3 9.5 4 10 5.5 C10.5 4 12 3 13.5 3 C15.5 3 17 4.5 17 6.5 C17 10 10 15 10 15Z' fill='${ce}' fill-opacity='${ca}'/%3E%3C/svg%3E")`
    default:
      return `radial-gradient(circle, ${c} 1px, transparent 1px)`
  }
}
