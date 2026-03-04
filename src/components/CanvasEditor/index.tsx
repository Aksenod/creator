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
import { RenameLayersModal } from '../RenameLayersModal'
import { Toast } from '../Toast/Toast'
import { AIChat } from '../AIChat/AIChat'
import type { BreakpointId } from '../../constants/breakpoints'
import { findParentId, getSiblingInfo, getCommonParentId } from '../../utils/treeUtils'
import { exportArtboardHTML, downloadHTML, previewHTML } from '../../utils/exportHTML'
import type { CanvasPattern } from '../../types'
import { useCanvasMarquee } from '../../hooks/useCanvasMarquee'

// ─── Snap logic ─────────────────────────────────────────────────────────────

type SnapLine =
  | { axis: 'x'; x: number; y1: number; y2: number }
  | { axis: 'y'; y: number; x1: number; x2: number }

const SNAP_THRESHOLD_PX = 8

function computeSnap(
  dragId: string,
  rawX: number,
  rawY: number,
  artboards: Record<string, { x: number; y: number; width: number; height: number }>,
  artboardOrder: string[],
  scale: number,
): { x: number; y: number; lines: SnapLine[] } {
  const dragging = artboards[dragId]
  if (!dragging) return { x: rawX, y: rawY, lines: [] }
  const threshold = SNAP_THRESHOLD_PX / scale
  const dragW = dragging.width
  const dragH = dragging.height

  interface XCand { delta: number; targetVal: number; otherT: number; otherB: number }
  interface YCand { delta: number; targetVal: number; otherL: number; otherR: number }
  let bestX: XCand | null = null
  let bestY: YCand | null = null

  for (const otherId of artboardOrder) {
    if (otherId === dragId) continue
    const other = artboards[otherId]
    if (!other) continue
    const oL = other.x, oR = other.x + other.width
    const oT = other.y, oB = other.y + other.height
    const oCX = (oL + oR) / 2, oCY = (oT + oB) / 2
    const dL = rawX, dR = rawX + dragW, dCX = rawX + dragW / 2
    const dT = rawY, dB = rawY + dragH, dCY = rawY + dragH / 2

    for (const [drag, target] of [
      [dL, oL], [dL, oR], [dR, oL], [dR, oR], [dCX, oCX],
    ] as [number, number][]) {
      const delta = target - drag
      if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta)))
        bestX = { delta, targetVal: target, otherT: oT, otherB: oB }
    }
    for (const [drag, target] of [
      [dT, oT], [dT, oB], [dB, oT], [dB, oB], [dCY, oCY],
    ] as [number, number][]) {
      const delta = target - drag
      if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta)))
        bestY = { delta, targetVal: target, otherL: oL, otherR: oR }
    }
  }

  const finalX = rawX + (bestX?.delta ?? 0)
  const finalY = rawY + (bestY?.delta ?? 0)
  const lines: SnapLine[] = []
  if (bestX) lines.push({ axis: 'x', x: bestX.targetVal, y1: Math.min(finalY, bestX.otherT) - 8, y2: Math.max(finalY + dragH, bestX.otherB) + 8 })
  if (bestY) lines.push({ axis: 'y', y: bestY.targetVal, x1: Math.min(finalX, bestY.otherL) - 8, x2: Math.max(finalX + dragW, bestY.otherR) + 8 })
  return { x: finalX, y: finalY, lines }
}

// ─── Image drop/paste helpers ────────────────────────────────────────────────

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 200, height: 150 })
    img.src = src
  })
}

function constrainDimensions(w: number, h: number, maxSize = 800): { width: number; height: number } {
  if (w <= maxSize && h <= maxSize) return { width: w, height: h }
  const ratio = Math.min(maxSize / w, maxSize / h)
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

async function addImageFromFile(file: File) {
  console.log('[Image drop] file:', file.name, file.type)
  const state = useEditorStore.getState()
  let abId = state.activeArtboardId
  // Если нет активного артборда — активируем первый
  if (!abId && state.project) {
    abId = state.project.artboardOrder[0] ?? null
    if (abId) state.setActiveArtboard(abId)
  }
  if (!abId) { console.warn('[Image drop] no artboard'); return }
  const src = await readFileAsDataURL(file)
  const dims = await getImageDimensions(src)
  const { width, height } = constrainDimensions(dims.width, dims.height)
  console.log('[Image drop] dims:', width, 'x', height)
  // Добавляем image через стандартный addElement, затем обновляем src и размеры
  state.addElement(abId, 'image', state.selectedElementId)
  const s2 = useEditorStore.getState()
  const newId = s2.selectedElementId
  if (newId && s2.activeArtboardId) {
    s2.updateElement(s2.activeArtboardId, newId, {
      src,
      alt: '',
      styles: { width: `${width}px`, height: `${height}px`, objectFit: 'cover', overflow: 'hidden' },
    })
    console.log('[Image drop] created element:', newId)
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function CanvasEditor() {
  const {
    activeProjectId, project, activeArtboardId,
    closeProject, addArtboard, deleteArtboard, setActiveArtboard, selectElement,
    selectedElementId, activeBreakpointId, setActiveBreakpoint,
    deleteElement, undo, redo, copyElement, pasteElement, duplicateElement,
    gridEditElementId, toggleElementVisibility, wrapElementsInDiv,
    selectedArtboardIds,
  } = useEditorStore()

  const [isPreview, setIsPreview] = useState(false)
  const [panelsHidden, setPanelsHidden] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(() => detectBreakpoint())
  const [customWidth, setCustomWidth] = useState<string>('')
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [snapLines, setSnapLines] = useState<SnapLine[]>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<'properties' | 'ai'>('properties')

  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const artboardDragRef = useRef<{
    artboardId: string
    startMouseX: number
    startMouseY: number
    startArtX: number
    startArtY: number
    active: boolean
  } | null>(null)
  const artboardElRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { onCanvasMouseDown, marqueeRect: canvasMarqueeRect, wasCanvasMarqueeRef } = useCanvasMarquee(artboardElRefs, isPreview)
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

  // Drag артбордов за лейбл
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const d = artboardDragRef.current
      if (!d) return
      const scale = cameraRef.current.scale
      const dx = (e.clientX - d.startMouseX) / scale
      const dy = (e.clientY - d.startMouseY) / scale
      if (!d.active) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
        d.active = true
        document.body.style.cursor = 'grabbing'
      }
      const rawX = d.startArtX + dx
      const rawY = d.startArtY + dy
      const state = useEditorStore.getState()
      const { x: newX, y: newY, lines } = computeSnap(
        d.artboardId, rawX, rawY,
        state.project!.artboards, state.project!.artboardOrder, scale,
      )
      setSnapLines(lines)
      const el = artboardElRefs.current.get(d.artboardId)
      if (el) {
        el.style.left = newX + 'px'
        el.style.top = newY + 'px'
      }
      useEditorStore.getState().moveArtboardTemp(d.artboardId, newX, newY)
    }
    const onMouseUp = (e: MouseEvent) => {
      const d = artboardDragRef.current
      if (!d || !d.active) { artboardDragRef.current = null; return }
      const scale = cameraRef.current.scale
      const rawX = d.startArtX + (e.clientX - d.startMouseX) / scale
      const rawY = d.startArtY + (e.clientY - d.startMouseY) / scale
      const state = useEditorStore.getState()
      const { x: newX, y: newY } = computeSnap(
        d.artboardId, rawX, rawY,
        state.project!.artboards, state.project!.artboardOrder, scale,
      )
      useEditorStore.getState().moveArtboard(d.artboardId, newX, newY)
      artboardDragRef.current = null
      setSnapLines([])
      document.body.style.cursor = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Image drag-drop + paste
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      }
    }
    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return
      let hasImage = false
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          hasImage = true
          addImageFromFile(file)
        }
      }
      if (hasImage) e.preventDefault()
    }
    const onPaste = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()

      const items = e.clipboardData?.items
      console.log('[paste] items:', items?.length, 'types:', Array.from(items ?? []).map(i => i.type))

      if (items) {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            console.log('[paste] found image:', item.type)
            const file = item.getAsFile()
            if (file) addImageFromFile(file)
            return
          }
        }
      }

      // Нет image в clipboard — fallback на внутренний paste элемента
      console.log('[paste] no image, fallback to pasteElement')
      useEditorStore.getState().pasteElement()
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('paste', onPaste)
    }
  }, [])

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
        onTogglePreview={() => {
          if (activeArtboard) {
            const html = exportArtboardHTML(activeArtboard)
            previewHTML(html)
          }
        }}
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
          const html = exportArtboardHTML(activeArtboard)
          downloadHTML(html, `${activeArtboard.name}.html`)
        } : undefined}
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
                  Click an artboard to edit
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
                    outline: isActive ? '1px solid #0a0a0a' : selectedArtboardIds.includes(id) ? '2px solid #0066ff' : undefined,
                    outlineOffset: 0,
                  }}
                  onMouseDown={!isActive && !isPreview ? (e) => {
                    e.stopPropagation()
                    const ab = project.artboards[id]
                    artboardDragRef.current = {
                      artboardId: id,
                      startMouseX: e.clientX,
                      startMouseY: e.clientY,
                      startArtX: ab.x,
                      startArtY: ab.y,
                      active: false,
                    }
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
                        color: isActive ? '#0a0a0a' : '#555',
                        fontWeight: isActive ? 600 : 400,
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        lineHeight: '20px',
                        cursor: 'grab',
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        const ab = project.artboards[id]
                        artboardDragRef.current = {
                          artboardId: id,
                          startMouseX: e.clientX,
                          startMouseY: e.clientY,
                          startArtX: ab.x,
                          startArtY: ab.y,
                          active: false,
                        }
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

        {/* Правая панель (Properties / AI Chat) */}
        {!isPreview && (
          <div style={{
            width: panelsHidden ? 0 : 240,
            minWidth: 0,
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 160ms ease',
          }}>
            <div style={{ width: 240, height: '100%', borderLeft: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
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
                {rightTab === 'properties' ? <Properties /> : <AIChat />}
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
