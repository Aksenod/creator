import { useEffect, useState } from 'react'
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

// --- Breakpoints config ---

type BreakpointIcon = (props: { active: boolean }) => JSX.Element

type Breakpoint = {
  id: string
  label: string
  width: number
  icon: BreakpointIcon
}

const BREAKPOINTS: Breakpoint[] = [
  { id: 'desktop', label: 'Desktop', width: 1440, icon: DesktopIcon },
  { id: 'laptop',  label: 'Laptop',  width: 1280, icon: LaptopIcon },
  { id: 'tablet',  label: 'Tablet',  width: 768,  icon: TabletIcon },
  { id: 'mobile',  label: 'Mobile',  width: 375,  icon: MobileIcon },
]

// --- PageEditor ---

export function PageEditor() {
  const { exitArtboard, project, activeArtboardId, deleteElement, selectedElementId } = useEditorStore()
  const [isPreview, setIsPreview] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number | null>(null)

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null

  const displayWidth = viewportWidth ?? (artboard?.width ?? 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreview) setIsPreview(false)
        else exitArtboard()
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && activeArtboardId) {
        // Не удалять если фокус в input/textarea/select
        const tag = (e.target as HTMLElement).tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          deleteElement(activeArtboardId, selectedElementId)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitArtboard, isPreview, deleteElement, selectedElementId, activeArtboardId])

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

          {/* Breakpoint bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f0f0f0', borderRadius: 8, padding: 3 }}>
            {BREAKPOINTS.map((bp) => {
              const isActive = displayWidth === bp.width
              return (
                <button
                  key={bp.id}
                  title={`${bp.label} — ${bp.width}px`}
                  onClick={() => {
                    if (isActive && viewportWidth !== null) {
                      setViewportWidth(null)
                    } else {
                      setViewportWidth(bp.width)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: isActive ? '#1a1a1a' : 'transparent',
                    color: isActive ? '#fff' : '#888',
                    transition: 'all 0.1s',
                  }}
                >
                  <bp.icon active={isActive} />
                </button>
              )
            })}
          </div>

          {/* Текущая ширина */}
          <span style={{ fontSize: 12, color: '#888', fontVariantNumeric: 'tabular-nums' }}>
            {displayWidth}px
          </span>

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
        <div style={{ flex: 1, overflow: 'auto', background: '#f5f5f5' }}>
          <Canvas artboard={{ ...artboard, width: displayWidth }} previewMode={isPreview} />
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
