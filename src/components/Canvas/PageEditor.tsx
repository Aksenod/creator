import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import { Layers } from '../Layers/Layers'
import { Properties } from '../Properties/Properties'
import { Canvas } from './Canvas'
import { Topbar } from './PageEditor/Topbar'
import { BREAKPOINTS, detectBreakpoint, type Breakpoint } from './PageEditor/BreakpointBar'
import { usePageEditorKeyboard } from '../../hooks/usePageEditorKeyboard'
import { GridEditOverlay } from '../GridEditOverlay'
import { GridChildResizeOverlay } from '../GridChildResizeOverlay'

export function PageEditor() {
  const { exitArtboard, project, activeArtboardId, selectedElementId, setActiveBreakpoint, activeBreakpointId, gridEditElementId } = useEditorStore()
  const [isPreview, setIsPreview] = useState(false)
  const [panelsHidden, setPanelsHidden] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(() => detectBreakpoint())
  const [customWidth, setCustomWidth] = useState<string>('')
  const [scale, setScale] = useState(1)
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null

  const parsedCustom = parseInt(customWidth)
  const displayWidth = customWidth && !isNaN(parsedCustom) && parsedCustom > 0 ? parsedCustom : viewportWidth

  // Авто-масштабирование артборда под доступную ширину canvas
  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return

    const recalc = () => {
      const available = el.clientWidth
      if (available <= 0) return
      setScale(Math.min(1, available / displayWidth))
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [displayWidth])

  const handleBreakpointSelect = (bp: Breakpoint) => {
    setViewportWidth(bp.width)
    setCustomWidth('')
    setActiveBreakpoint(bp.id as import('../../constants/breakpoints').BreakpointId)
  }

  usePageEditorKeyboard({
    isPreview,
    showCanvasSettings,
    selectedElementId,
    activeArtboardId,
    BREAKPOINTS,
    onExitArtboard: exitArtboard,
    onClosePreview: () => setIsPreview(false),
    onCloseSettings: () => setShowCanvasSettings(false),
    onSetViewportWidth: setViewportWidth,
    onClearCustomWidth: () => setCustomWidth(''),
    onTogglePanels: () => setPanelsHidden(v => !v),
  })

  if (!artboard) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <Topbar
        artboardName={artboard.name}
        isPreview={isPreview}
        activeBreakpointId={activeBreakpointId}
        displayWidth={displayWidth}
        customWidth={customWidth}
        scale={scale}
        showCanvasSettings={showCanvasSettings}
        onExitArtboard={exitArtboard}
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
      />

      {/* Основная область */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Панель слоёв */}
        {!isPreview && !panelsHidden && (
          <div style={{ width: 240, borderRight: '1px solid #e0e0e0', flexShrink: 0, overflow: 'hidden' }}>
            <Layers artboard={artboard} />
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasContainerRef} style={{ flex: 1, overflow: 'auto', background: '#f5f5f5' }}>
          <Canvas artboard={{ ...artboard, width: displayWidth }} previewMode={isPreview} scale={scale} />
        </div>

        {/* Панель свойств */}
        {!isPreview && !panelsHidden && (
          <div style={{ width: 240, borderLeft: '1px solid #e0e0e0', flexShrink: 0, overflow: 'hidden' }}>
            <Properties />
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
