import { useState, useRef } from 'react'
import {
  FrameCorners,
  TextT,
  HandTap,
  Image,
  Textbox,
  Plus,
} from '@phosphor-icons/react'
import { useProject, useActiveArtboardId, useSelectedElementId } from '../../store/selectors'
import { useEditorStore } from '../../store'
import { colors, shadows } from '../../styles/tokens'
import type { ElementType } from '../../types'

const ELEMENTS: { type: ElementType; label: string; icon: React.ReactNode }[] = [
  { type: 'div',     label: 'Frame',   icon: <FrameCorners size={14} weight="thin" /> },
  { type: 'text',    label: 'Text',    icon: <TextT size={14} weight="thin" /> },
  { type: 'image',   label: 'Image',   icon: <Image size={14} weight="thin" /> },
  { type: 'button',  label: 'Button',  icon: <HandTap size={14} weight="thin" /> },
  { type: 'input',   label: 'Input',   icon: <Textbox size={14} weight="thin" /> },
]

export function Toolbar() {
  const project = useProject()
  const activeArtboardId = useActiveArtboardId()
  const selectedElementId = useSelectedElementId()
  const addElement = useEditorStore(s => s.addElement)
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleAdd = (type: ElementType) => {
    if (!project || !activeArtboardId) return
    const artboard = project.artboards[activeArtboardId]
    const selectedEl = selectedElementId ? artboard.elements[selectedElementId] : null
    const parentId = selectedEl ? selectedElementId : null
    addElement(activeArtboardId, type, parentId)
  }

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
    cancelClose()
    setOpen(true)
  }

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  return (
    <div
      onMouseEnter={openDropdown}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        data-testid="add-element-trigger"
        title="Add element — creates Div, Section, Text, Image, Button or Input inside selected element (or artboard root)"
        style={{
          width: 28, height: 28, fontSize: 18, lineHeight: 1,
          border: `1px solid ${colors.border}`, borderRadius: 4,
          cursor: 'pointer', background: colors.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
      >
        <Plus size={12} weight="thin" />
      </button>

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            background: colors.bg, border: `1px solid ${colors.border}`,
            borderRadius: 6, boxShadow: shadows.md,
            padding: '4px 0', minWidth: 120,
          }}
        >
          {ELEMENTS.map(({ type, label, icon }) => (
            <button
              key={type}
              data-testid={`add-${type}`}
              onClick={() => { handleAdd(type as ElementType); setOpen(false) }}
              onMouseEnter={() => setHoveredItem(type)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 12px', border: 'none',
                background: hoveredItem === type ? colors.bgSurface : 'transparent',
                cursor: 'pointer', fontSize: 12, textAlign: 'left',
              }}
            >
              <span style={{ opacity: 0.5, minWidth: 16, display: 'inline-flex' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
