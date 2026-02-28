import { useState } from 'react'
import { useEditorStore } from '../../store'
import type { CanvasElement, ElementStyles } from '../../types'
import { BREAKPOINT_LABELS } from '../../constants/breakpoints'
import type { BreakpointId } from '../../constants/breakpoints'
import { resolveStyles } from '../../utils/resolveStyles'
import { LayoutSection } from './LayoutSection'
import { SizeSection } from './SizeSection'
import { TypographySection } from './TypographySection'
import { BackgroundSection } from './BackgroundSection'
import { BorderSection } from './BorderSection'
import { PositionSection } from './PositionSection'
import type { PositionMode } from '../../types'

const getCommonStyles = (
  ids: string[],
  elements: Record<string, CanvasElement>,
  bpId: BreakpointId,
): Partial<ElementStyles> => {
  if (ids.length === 0) return {}
  const first = resolveStyles(elements[ids[0]], bpId)
  const result: Partial<ElementStyles> = {}

  for (const key of Object.keys(first) as (keyof ElementStyles)[]) {
    const val = first[key]
    const allSame = ids.every(id => {
      const s = resolveStyles(elements[id], bpId)
      return (s[key] as unknown) === (val as unknown)
    })
    if (allSame) (result as Record<string, unknown>)[key] = val
  }
  return result
}

export function Properties() {
  const {
    selectedElementId, selectedElementIds, project, activeArtboardId,
    updateElement, updateSelectedElements, activeBreakpointId, clearBreakpointStyle,
  } = useEditorStore()

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null
  const element = artboard && selectedElementId ? artboard.elements[selectedElementId] : null
  const isMultiSelect = selectedElementIds.length > 1
  const commonStyles = isMultiSelect && artboard
    ? getCommonStyles(selectedElementIds, artboard.elements, activeBreakpointId)
    : null

  const updateStyle = (patch: Partial<ElementStyles>) => {
    if (!activeArtboardId) return
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
    if (!activeArtboardId || !selectedElementId) return
    updateElement(activeArtboardId, selectedElementId, { positionMode: mode })
  }

  // Эффективные стили с учётом cascade
  const effectiveStyles = isMultiSelect
    ? (commonStyles ?? {})
    : element ? resolveStyles(element, activeBreakpointId) : {}

  // Есть ли BP-overrides на текущем элементе для текущего BP
  const hasBpOverrides = !isMultiSelect && element && activeBreakpointId !== 'desktop'
    ? !!(element.breakpointStyles?.[activeBreakpointId] && Object.keys(element.breakpointStyles[activeBreakpointId]!).length > 0)
    : false

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 12px', fontSize: 11, fontWeight: 600,
        color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '1px solid #e0e0e0',
      }}>
        Свойства
      </div>
      {/* BP banner — показываем когда не на Desktop */}
      {activeBreakpointId !== 'desktop' && (
        <div style={{
          padding: '6px 12px',
          background: hasBpOverrides ? '#fff3cd' : '#f0f4ff',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: hasBpOverrides ? '#8a6000' : '#3355aa', fontWeight: 500 }}>
            ✎ {BREAKPOINT_LABELS[activeBreakpointId]}
            {hasBpOverrides ? ' · есть переопределения' : ''}
          </span>
          {hasBpOverrides && element && (
            <button
              onClick={() => clearBreakpointStyle(activeArtboardId!, selectedElementId!, activeBreakpointId)}
              title={`Удалить все переопределения ${BREAKPOINT_LABELS[activeBreakpointId]}`}
              style={{
                fontSize: 10, padding: '2px 6px', border: '1px solid #e0b000',
                borderRadius: 3, cursor: 'pointer', background: '#fff', color: '#8a6000',
              }}
            >
              Сбросить
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', overflowX: 'hidden', padding: 12 }}>
        {isMultiSelect ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ padding: '6px 0', fontSize: 12, color: '#555', fontWeight: 500 }}>
              Выбрано: {selectedElementIds.length} элемента
            </div>

            <Divider />

            <LayoutSection styles={effectiveStyles} onUpdate={updateStyle} />

            <Divider />

            <SizeSection styles={effectiveStyles} onUpdate={updateStyle} />

            <Divider />

            <BackgroundSection styles={effectiveStyles} onUpdate={updateStyle} />

            <Divider />

            <BorderSection styles={effectiveStyles} onUpdate={updateStyle} />

            <Divider />

            <TypographySection styles={effectiveStyles} onUpdate={updateStyle} />

          </div>
        ) : !element ? (
          <div style={{ color: '#aaa', fontSize: 12 }}>Выбери элемент</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

            {/* Имя + Класс */}
            <CollapsibleSection label="Слой" defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label="Имя">
                  <input
                    value={element.name}
                    onChange={(e) => updateField({ name: e.target.value })}
                    style={inputStyle}
                  />
                </Row>
                <Row label="Класс">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#aaa', fontSize: 11 }}>.</span>
                    <input
                      value={element.className ?? ''}
                      onChange={(e) => updateField({ className: e.target.value })}
                      placeholder="auto"
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                    />
                  </div>
                </Row>
              </div>
            </CollapsibleSection>

            <Divider />

            <PositionSection
              positionMode={element.positionMode}
              styles={effectiveStyles}
              onUpdateMode={updatePositionMode}
              onUpdateStyle={updateStyle}
            />

            <Divider />

            <LayoutSection styles={element.styles} onUpdate={updateStyle} />

            <Divider />

            <SizeSection styles={element.styles} onUpdate={updateStyle} />

            <Divider />

            <BackgroundSection styles={element.styles} onUpdate={updateStyle} />

            <Divider />

            <BorderSection styles={element.styles} onUpdate={updateStyle} />

            <Divider />

            <TypographySection styles={element.styles} onUpdate={updateStyle} />

          </div>
        )}
      </div>
    </div>
  )
}

// ─── Базовые стили ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '3px 6px', border: '1px solid #e0e0e0', borderRadius: 4,
  fontSize: 12, background: '#fafafa', outline: 'none', width: '100%', minWidth: 0,
  color: '#1a1a1a',
}

// ─── Компоненты ────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />
}

function CollapsibleSection({ label, children, defaultOpen = true }: {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ padding: '8px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: 0, border: 'none', background: 'none',
          cursor: 'pointer', marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{label}</span>
        <span style={{
          fontSize: 9, color: '#aaa',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.15s',
          display: 'inline-block',
        }}>▼</span>
      </button>
      {open && children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
      <span style={{ fontSize: 11, color: '#999', width: 56, flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  )
}
