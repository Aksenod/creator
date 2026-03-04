import { useRef, useEffect } from 'react'
import { BreakpointBar, detectBreakpoint, type Breakpoint } from './BreakpointBar'
import { ArrowLeft, CaretDown, ArrowCounterClockwise, DownloadSimple, Plus, Play } from '@phosphor-icons/react'
import { colors, shadows, radius } from '../../../styles/tokens'
import type { BreakpointId } from '../../../constants/breakpoints'

type Props = {
  projectName: string
  activeBreakpointId: BreakpointId
  displayWidth: number
  customWidth: string
  scale: number
  showCanvasSettings: boolean
  onCloseProject: () => void
  onTogglePreview?: () => void
  onToggleSettings: () => void
  onCustomWidthChange: (v: string) => void
  onCustomWidthBlur: (v: string) => void
  onClearCustomWidth: () => void
  onBreakpointSelect: (bp: Breakpoint) => void
  onSetShowSettings: (show: boolean) => void
  onAddArtboard: () => void
  onExportHTML?: () => void
}

export function Topbar({
  projectName,
  activeBreakpointId,
  displayWidth,
  customWidth,
  scale,
  showCanvasSettings,
  onCloseProject,
  onTogglePreview,
  onToggleSettings,
  onCustomWidthChange,
  onCustomWidthBlur,
  onClearCustomWidth,
  onBreakpointSelect,
  onSetShowSettings,
  onAddArtboard,
  onExportHTML,
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

  return (
    <div style={{
      height: 48, background: colors.bg, borderBottom: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0,
    }}>
      {/* Левая секция */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onCloseProject}
          title="Back to projects — current project is saved automatically"
          style={{
            padding: '4px 10px', border: `1px solid ${colors.border}`, borderRadius: 4,
            cursor: 'pointer', background: colors.bg, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4, color: colors.text,
          }}
        >
          <ArrowLeft size={12} weight="thin" /> Projects
        </button>
        <span style={{ fontWeight: 600, color: colors.text }}>{projectName}</span>
      </div>

      {/* Центральная секция — Canvas Settings + Breakpoint bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }} ref={settingsRef}>

        <button
          onClick={onToggleSettings}
          title="Canvas settings — viewport width and scale. Keys 1–4 for quick breakpoint switching"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: radius.sm, border: 'none', cursor: 'pointer',
            background: showCanvasSettings ? colors.bgActive : colors.bgSurface,
            color: showCanvasSettings ? colors.bg : colors.text,
            fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
            transition: 'all 0.1s',
          }}
        >
          {displayWidth}px
          <CaretDown size={10} weight="thin" />
        </button>

        {/* Canvas Settings popover */}
        {showCanvasSettings && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 100,
            background: colors.bg, borderRadius: radius.md, padding: 12,
            boxShadow: shadows.md, minWidth: 220,
            border: `1px solid ${colors.border}`, fontSize: 12,
          }}>
            <div style={{ marginBottom: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.05em', fontSize: 10, textTransform: 'uppercase' }}>
              Canvas Settings
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <span style={{ color: colors.textSecondary, flexShrink: 0 }}>Width</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  value={customWidth || displayWidth}
                  min={320}
                  max={3840}
                  onChange={e => onCustomWidthChange(e.target.value)}
                  onBlur={e => onCustomWidthBlur(e.target.value)}
                  style={{
                    width: 64, padding: '3px 6px', background: colors.bgHover,
                    border: customWidth ? `1px solid ${colors.borderFocus}` : `1px solid ${colors.border}`,
                    borderRadius: 4, color: colors.text, fontSize: 12,
                    textAlign: 'right', fontVariantNumeric: 'tabular-nums', outline: 'none',
                  }}
                />
                <span style={{ color: colors.textMuted }}>px</span>
                {customWidth && (
                  <button
                    onClick={onClearCustomWidth}
                    style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                    title="Reset to breakpoint"
                  >
                    <ArrowCounterClockwise size={12} weight="thin" />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: colors.textSecondary }}>Scale</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: colors.text, fontWeight: 500 }}>
                {Math.round(scale * 100)}%
              </span>
            </div>

            <div style={{ height: 1, background: colors.border, margin: '8px 0' }} />
            <div style={{ color: colors.textMuted, fontSize: 10, lineHeight: 1.5 }}>
              Shortcuts: 1–4 to switch breakpoints
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
        {onExportHTML && (
          <button
            onClick={onExportHTML}
            title="Export active artboard as standalone HTML file with responsive @media"
            style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <DownloadSimple size={12} weight="thin" /> HTML
          </button>
        )}
        <button
          onClick={onAddArtboard}
          title="Add artboard — new page or section on canvas"
          style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <Plus size={12} weight="thin" /> Artboard
        </button>
        {onTogglePreview && (
          <button
            onClick={onTogglePreview}
            title="Preview — export artboard as HTML and open in new tab"
            style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              border: 'none', background: colors.bgSurface, color: colors.text,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Play size={12} weight="thin" /> Preview
          </button>
        )}
      </div>
    </div>
  )
}
