import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import { Layers } from '../Layers/Layers'
import { Properties } from '../Properties/Properties'
import { Toolbar } from '../Toolbar/Toolbar'
import { Canvas } from './Canvas'

// --- SVG icons ---

function DesktopIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function LaptopIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 13h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function TabletIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="13" r="0.8" fill="currentColor" />
    </svg>
  )
}

function MobileIcon({ active }: { active: boolean }) {
  void active
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="4.5" y="1" width="7" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="13" r="0.7" fill="currentColor" />
    </svg>
  )
}

// --- Breakpoints config (Webflow-style) ---

type BreakpointIcon = (props: { active: boolean }) => JSX.Element

type Breakpoint = {
  id: string
  label: string
  width: number
  icon: BreakpointIcon
  isBase?: boolean   // Desktop = Base, стили каскадируют во все стороны
  cascade: 'up' | 'down' | 'both'
  tooltip: string
}

const BREAKPOINTS: Breakpoint[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    width: 1440,
    icon: DesktopIcon,
    isBase: true,
    cascade: 'both',
    tooltip: 'Desktop: ✳ Base breakpoint\nСтили Desktop применяются на всех брейкпоинтах, если не переопределены на другом. Начинай дизайн здесь.',
  },
  {
    id: 'laptop',
    label: 'Laptop',
    width: 1280,
    icon: LaptopIcon,
    cascade: 'down',
    tooltip: 'Laptop — 1280px\nСтили каскадируют вниз от Desktop.',
  },
  {
    id: 'tablet',
    label: 'Tablet',
    width: 768,
    icon: TabletIcon,
    cascade: 'down',
    tooltip: 'Tablet — 768px\nПереопредели стили Desktop для планшетов.',
  },
  {
    id: 'mobile',
    label: 'Mobile',
    width: 375,
    icon: MobileIcon,
    cascade: 'down',
    tooltip: 'Mobile — 375px\nПереопредели стили для мобильных устройств.',
  },
]

// --- Auto-breakpoint detection ---

// Определяем по реальному разрешению экрана пользователя, а не по размеру окна браузера
const detectBreakpoint = () => {
  const w = window.screen.width
  if (w >= 1440) return 1440
  if (w >= 1280) return 1280
  if (w >= 768) return 768
  return 375
}

// --- PageEditor ---

export function PageEditor() {
  const { exitArtboard, project, activeArtboardId, deleteElement, selectedElementId, undo, copyElement, pasteElement, duplicateElement, setActiveBreakpoint, activeBreakpointId } = useEditorStore()
  const [isPreview, setIsPreview] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(() => detectBreakpoint())
  const [customWidth, setCustomWidth] = useState<string>('')  // Task 3: ручной ввод ширины
  const [scale, setScale] = useState(1)
  const [showCanvasSettings, setShowCanvasSettings] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasSettingsRef = useRef<HTMLDivElement>(null)

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null

  // Task 3: кастомная ширина overrides брейкпоинт
  const parsedCustom = parseInt(customWidth)
  const displayWidth = customWidth && !isNaN(parsedCustom) && parsedCustom > 0 ? parsedCustom : viewportWidth

  // Реальное разрешение экрана пользователя → его рабочий брейкпоинт
  const detectedWidth = detectBreakpoint()

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

  // Закрыть Canvas Settings при клике вне
  useEffect(() => {
    if (!showCanvasSettings) return
    const onClickOutside = (e: MouseEvent) => {
      if (canvasSettingsRef.current && !canvasSettingsRef.current.contains(e.target as Node)) {
        setShowCanvasSettings(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showCanvasSettings])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCanvasSettings) { setShowCanvasSettings(false); return }
        if (isPreview) setIsPreview(false)
        else exitArtboard()
      }

      // Keyboard shortcuts для брейкпоинтов (1-4), только если не в input
      const tag = (e.target as HTMLElement).tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        const idx = parseInt(e.key) - 1
        if (idx >= 0 && idx < BREAKPOINTS.length) {
          const bp = BREAKPOINTS[idx]
          setViewportWidth(bp.width)
          setCustomWidth('')
          setActiveBreakpoint(bp.id as import('../../constants/breakpoints').BreakpointId)
          return
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && activeArtboardId) {
        // Не удалять если фокус в input/textarea/select
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          deleteElement(activeArtboardId, selectedElementId)
        }
      }

      const isMac = navigator.platform.includes('Mac')
      const mod = isMac ? e.metaKey : e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && e.key === 'c') { e.preventDefault(); copyElement() }
      if (mod && e.key === 'v') { e.preventDefault(); pasteElement() }
      if (mod && e.key === 'd') { e.preventDefault(); e.stopPropagation(); duplicateElement() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitArtboard, isPreview, showCanvasSettings, deleteElement, selectedElementId, activeArtboardId, undo, copyElement, pasteElement, duplicateElement])

  if (!artboard) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Топбар */}
      {isPreview ? (
        <div style={{
          height: 40, background: '#1a1a1a', borderBottom: '1px solid #333',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={() => setIsPreview(false)}
            style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              border: 'none', background: '#333', color: '#fff',
            }}
          >
            ← Редактор
          </button>
          <span style={{ color: '#888', fontSize: 12 }}>{artboard.name}</span>
        </div>
      ) : (
        <div style={{
          height: 48, background: '#fff', borderBottom: '1px solid #e0e0e0',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={exitArtboard}
            style={{ padding: '4px 10px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#fff', fontSize: 12 }}
          >
            ← Назад
          </button>
          <span style={{ fontWeight: 600 }}>{artboard.name}</span>
          <Toolbar />

          {/* Canvas Settings + Breakpoint bar (Webflow-style) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }} ref={canvasSettingsRef}>

            {/* Ширина = кнопка открытия Canvas Settings */}
            <button
              onClick={() => setShowCanvasSettings(s => !s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: showCanvasSettings ? '#1a1a1a' : '#f0f0f0',
                color: showCanvasSettings ? '#fff' : '#333',
                fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
                transition: 'all 0.1s',
              }}
            >
              {displayWidth}px
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Canvas Settings popover (Task 3) */}
            {showCanvasSettings && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100,
                background: '#2a2a2a', borderRadius: 8, padding: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)', minWidth: 220,
                color: '#fff', fontSize: 12,
              }}>
                <div style={{ marginBottom: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em', fontSize: 10, textTransform: 'uppercase' }}>
                  Canvas Settings
                </div>

                {/* Ширина (custom override) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#ccc', flexShrink: 0 }}>Ширина</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      value={customWidth || viewportWidth}
                      min={320}
                      max={3840}
                      onChange={e => setCustomWidth(e.target.value)}
                      onBlur={e => {
                        const v = parseInt(e.target.value)
                        if (!v || isNaN(v)) setCustomWidth('')
                      }}
                      style={{
                        width: 64, padding: '3px 6px', background: '#3a3a3a',
                        border: customWidth ? '1px solid #0066ff' : '1px solid #555',
                        borderRadius: 4, color: '#fff', fontSize: 12,
                        textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                    <span style={{ color: '#666' }}>px</span>
                    {customWidth && (
                      <button
                        onClick={() => setCustomWidth('')}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}
                        title="Сбросить к брейкпоинту"
                      >↺</button>
                    )}
                  </div>
                </div>

                {/* Масштаб */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#ccc' }}>Масштаб</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: '#fff', fontWeight: 500 }}>
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                <div style={{ height: 1, background: '#3a3a3a', margin: '8px 0' }} />
                <div style={{ color: '#555', fontSize: 10, lineHeight: 1.5 }}>
                  Shortcuts: 1–4 для переключения BP
                </div>
              </div>
            )}

            {/* Breakpoint buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f0f0f0', borderRadius: 8, padding: 3 }}>
              {BREAKPOINTS.map((bp, idx) => {
                const isActive = activeBreakpointId === bp.id
                const isDetected = bp.width === detectedWidth
                return (
                  <button
                    key={bp.id}
                    title={bp.tooltip + (isDetected ? '\n· Твой экран' : '') + `\nShortcut: ${idx + 1}`}
                    onClick={() => {
                      setViewportWidth(bp.width)
                      setCustomWidth('')
                      setActiveBreakpoint(bp.id as import('../../constants/breakpoints').BreakpointId)
                    }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      width: 30, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer',
                      background: isActive ? '#1a1a1a' : 'transparent',
                      color: isActive ? '#fff' : '#888',
                      transition: 'all 0.1s',
                      gap: 2, position: 'relative',
                    }}
                  >
                    {/* ✳ для Base breakpoint, иконка для остальных */}
                    {bp.isBase ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <bp.icon active={isActive} />
                        <span style={{ fontSize: 8, lineHeight: 1, color: isActive ? '#aaa' : '#bbb', fontWeight: 700 }}>✳</span>
                      </div>
                    ) : (
                      <bp.icon active={isActive} />
                    )}
                    {/* Точка = реальный экран пользователя */}
                    <span style={{
                      width: 3, height: 3, borderRadius: '50%',
                      background: isDetected ? (isActive ? '#fff' : '#1a1a1a') : 'transparent',
                      flexShrink: 0,
                    }} />
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => setIsPreview(!isPreview)}
            style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              border: 'none',
              background: isPreview ? '#1a1a1a' : '#f0f0f0',
              color: isPreview ? '#fff' : '#333',
            }}
          >
            {isPreview ? '← Редактор' : '▶ Preview'}
          </button>
        </div>
      )}

      {/* Основная область */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Панель слоёв */}
        {!isPreview && (
          <div style={{ width: 240, borderRight: '1px solid #e0e0e0', flexShrink: 0, overflow: 'hidden' }}>
            <Layers artboard={artboard} />
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasContainerRef} style={{ flex: 1, overflow: 'auto', background: '#f5f5f5' }}>
          <Canvas artboard={{ ...artboard, width: displayWidth }} previewMode={isPreview} scale={scale} />
        </div>

        {/* Панель свойств */}
        {!isPreview && (
          <div style={{ width: 240, borderLeft: '1px solid #e0e0e0', flexShrink: 0, overflow: 'hidden' }}>
            <Properties />
          </div>
        )}
      </div>
    </div>
  )
}
