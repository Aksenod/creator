import { useState, useRef } from 'react'
import { useEditorStore } from '../../store'
import type { ElementType } from '../../types'

const ELEMENTS: { type: ElementType; label: string; icon: string }[] = [
  { type: 'div',     label: 'Div',     icon: '▣' },
  { type: 'section', label: 'Section', icon: '⬜' },
  { type: 'text',    label: 'Text',    icon: 'T' },
  { type: 'image',   label: 'Image',   icon: '⬚' },
  { type: 'button',  label: 'Button',  icon: '⊡' },
]

export function Toolbar() {
  const { project, activeArtboardId, selectedElementId, addElement } = useEditorStore()
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleAdd = (type: ElementType) => {
    if (!project || !activeArtboardId) return
    const artboard = project.artboards[activeArtboardId]
    const selectedEl = selectedElementId ? artboard.elements[selectedElementId] : null
    // Если выбранный элемент — не-контейнер, передаём его id (addElement сам найдёт родителя)
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
        title="Добавить элемент — создаёт Div, Section, Text, Image или Button внутри выбранного элемента (или в корне артборда)"
        style={{
          width: 28, height: 28, fontSize: 18, lineHeight: 1,
          border: '1px solid #ddd', borderRadius: 4,
          cursor: 'pointer', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
      >
        +
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
            background: '#fff', border: '1px solid #e0e0e0',
            borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
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
                background: hoveredItem === type ? '#f5f5f5' : 'transparent',
                cursor: 'pointer', fontSize: 12, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 14, opacity: 0.5, minWidth: 16 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
