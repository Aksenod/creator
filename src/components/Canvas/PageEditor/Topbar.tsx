import { useRef, useEffect } from 'react'
import { BreakpointBar, detectBreakpoint, type Breakpoint } from './BreakpointBar'
import type { BreakpointId } from '../../../constants/breakpoints'

type Props = {
  projectName: string
  isPreview: boolean
  activeBreakpointId: BreakpointId
  displayWidth: number
  customWidth: string
  scale: number
  showCanvasSettings: boolean
  isFocusMode: boolean
  hasActiveArtboard: boolean
  onCloseProject: () => void
  onTogglePreview: () => void
  onToggleSettings: () => void
  onCustomWidthChange: (v: string) => void
  onCustomWidthBlur: (v: string) => void
  onClearCustomWidth: () => void
  onBreakpointSelect: (bp: Breakpoint) => void
  onSetShowSettings: (show: boolean) => void
  onAddArtboard: () => void
  onToggleFocusMode: () => void
}

export function Topbar({
  projectName,
  isPreview,
  activeBreakpointId,
  displayWidth,
  customWidth,
  scale,
  showCanvasSettings,
  isFocusMode,
  hasActiveArtboard,
  onCloseProject,
  onTogglePreview,
  onToggleSettings,
  onCustomWidthChange,
  onCustomWidthBlur,
  onClearCustomWidth,
  onBreakpointSelect,
  onSetShowSettings,
  onAddArtboard,
  onToggleFocusMode,
}: Props) {
  const settingsRef = useRef<HTMLDivElement>(null)
  const detectedWidth = detectBreakpoint()

  useEffect(() => {
    if (!showCanvasSettings) return
    const onClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        onSetShowSettings(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showCanvasSettings, onSetShowSettings])

  if (isPreview) {
    return (
      <div style={{
        height: 40, background: '#1a1a1a', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={onTogglePreview}
          style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
            border: 'none', background: '#333', color: '#fff',
          }}
        >
          ← Редактор
        </button>
        <span style={{ color: '#888', fontSize: 12 }}>{projectName}</span>
      </div>
    )
  }

  return (
    <div style={{
      height: 48, background: '#fff', borderBottom: '1px solid #e0e0e0',
      display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0,
    }}>
      {/* Левая секция */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onCloseProject}
          style={{ padding: '4px 10px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#fff', fontSize: 12 }}
        >
          ← Проекты
        </button>
        <span style={{ fontWeight: 600 }}>{projectName}</span>
      </div>

      {/* Центральная секция — Canvas Settings + Breakpoint bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }} ref={settingsRef}>

        {/* Кнопка открытия Canvas Settings */}
        <button
          onClick={onToggleSettings}
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

        {/* Canvas Settings popover */}
        {showCanvasSettings && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100,
            background: '#fff', borderRadius: 8, padding: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 220,
            border: '1px solid #e0e0e0', fontSize: 12,
          }}>
            <div style={{ marginBottom: 10, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em', fontSize: 10, textTransform: 'uppercase' }}>
              Canvas Settings
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <span style={{ color: '#555', flexShrink: 0 }}>Ширина</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  value={customWidth || displayWidth}
                  min={320}
                  max={3840}
                  onChange={e => onCustomWidthChange(e.target.value)}
                  onBlur={e => onCustomWidthBlur(e.target.value)}
                  style={{
                    width: 64, padding: '3px 6px', background: '#fafafa',
                    border: customWidth ? '1px solid #0066ff' : '1px solid #e0e0e0',
                    borderRadius: 4, color: '#1a1a1a', fontSize: 12,
                    textAlign: 'right', fontVariantNumeric: 'tabular-nums', outline: 'none',
                  }}
                />
                <span style={{ color: '#888' }}>px</span>
                {customWidth && (
                  <button
                    onClick={onClearCustomWidth}
                    style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}
                    title="Сбросить к брейкпоинту"
                  >↺</button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#555' }}>Масштаб</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: '#1a1a1a', fontWeight: 500 }}>
                {Math.round(scale * 100)}%
              </span>
            </div>

            <div style={{ height: 1, background: '#e0e0e0', margin: '8px 0' }} />
            <div style={{ color: '#aaa', fontSize: 10, lineHeight: 1.5 }}>
              Shortcuts: 1–4 для переключения BP
            </div>
          </div>
        )}

        <BreakpointBar
          activeBreakpointId={activeBreakpointId}
          detectedWidth={detectedWidth}
          onSelect={onBreakpointSelect}
        />
      </div>

      {/* Правая секция */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <button
          onClick={onAddArtboard}
          style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
            border: '1px solid #ddd', background: '#fff', color: '#333',
          }}
        >
          + Артборд
        </button>
        <button
          onClick={onToggleFocusMode}
          disabled={!hasActiveArtboard && !isFocusMode}
          title={isFocusMode ? 'Выйти из Focus Mode (F)' : 'Focus Mode — один артборд на весь экран (F)'}
          style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 12,
            border: 'none', cursor: 'pointer',
            background: isFocusMode ? '#0066ff' : '#f0f0f0',
            color: isFocusMode ? '#fff' : '#333',
            opacity: (!hasActiveArtboard && !isFocusMode) ? 0.4 : 1,
          }}
        >
          {isFocusMode ? '⊞ Все' : '⊟ Фокус'}
        </button>
        <button
          onClick={onTogglePreview}
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
    </div>
  )
}
