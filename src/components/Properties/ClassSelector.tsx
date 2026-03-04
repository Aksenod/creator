import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../../store'
import { useProject, useActiveArtboardId, useSelectedElementId, useEditingClassId, useCssClasses } from '../../store/selectors'
import { useShallow } from 'zustand/react/shallow'
import { colors } from '../../styles/tokens'
import type { CSSClass } from '../../types/cssClass'

export function ClassSelector() {
  const project = useProject()
  const activeArtboardId = useActiveArtboardId()
  const selectedElementId = useSelectedElementId()
  const editingClassId = useEditingClassId()
  const cssClasses = useCssClasses()

  const {
    applyClassToElement,
    removeClassFromElement,
    setEditingClassId,
    createClassFromElement,
  } = useEditorStore(useShallow(s => ({
    applyClassToElement: s.applyClassToElement,
    removeClassFromElement: s.removeClassFromElement,
    setEditingClassId: s.setEditingClassId,
    createClassFromElement: s.createClassFromElement,
  })))

  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null
  const element = artboard && selectedElementId ? artboard.elements[selectedElementId] : null
  const appliedClassIds = element?.classIds ?? []

  // Count elements per class (for autocomplete hint)
  const classUsageCount = (classId: string): number => {
    if (!project) return 0
    let count = 0
    for (const ab of Object.values(project.artboards)) {
      for (const el of Object.values(ab.elements)) {
        if (el.classIds?.includes(classId)) count++
      }
    }
    return count
  }

  // Filter available classes for autocomplete
  const allClasses = cssClasses ? Object.values(cssClasses) : []
  const filteredClasses = allClasses.filter(cls =>
    !appliedClassIds.includes(cls.id) &&
    cls.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleAddClass = (classId: string) => {
    if (!activeArtboardId || !selectedElementId) return
    applyClassToElement(activeArtboardId, selectedElementId, classId)
    setInputValue('')
    setShowDropdown(false)
  }

  const handleCreateAndApply = () => {
    if (!inputValue.trim() || !activeArtboardId || !selectedElementId) return
    // Copy element's inline styles into the new class
    createClassFromElement(activeArtboardId, selectedElementId, inputValue.trim())
    setInputValue('')
    setShowDropdown(false)
  }

  const handleRemoveClass = (classId: string) => {
    if (!activeArtboardId || !selectedElementId) return
    removeClassFromElement(activeArtboardId, selectedElementId, classId)
    // Switch to the last remaining class, or null if none left
    if (editingClassId === classId) {
      const remaining = appliedClassIds.filter(id => id !== classId)
      setEditingClassId(remaining.length > 0 ? remaining[remaining.length - 1] : null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredClasses.length > 0 && inputValue.trim()) {
        // If exact match exists, apply it
        const exact = filteredClasses.find(c => c.name === inputValue.trim())
        if (exact) {
          handleAddClass(exact.id)
        } else {
          handleCreateAndApply()
        }
      } else if (inputValue.trim()) {
        handleCreateAndApply()
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setInputValue('')
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Applied class chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {appliedClassIds.map(classId => {
          const cls = cssClasses?.[classId]
          if (!cls) return null
          const isEditing = editingClassId === classId
          return (
            <ClassChip
              key={classId}
              cls={cls}
              isEditing={isEditing}
              onSelect={() => setEditingClassId(classId)}
              onRemove={() => handleRemoveClass(classId)}
            />
          )
        })}

        {/* Search/create input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 80 }}>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={appliedClassIds.length === 0 ? 'Type class name...' : '+'}
            style={{
              width: '100%',
              padding: '2px 6px',
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              fontSize: 11,
              fontFamily: 'monospace',
              background: colors.bgHover,
              outline: 'none',
              color: colors.text,
              minWidth: 0,
            }}
          />

          {/* Autocomplete dropdown */}
          {showDropdown && inputValue.trim() && (filteredClasses.length > 0 || inputValue.trim()) && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 2,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 100,
                maxHeight: 160,
                overflow: 'auto',
              }}
            >
              {filteredClasses.map(cls => (
                <div
                  key={cls.id}
                  onClick={() => handleAddClass(cls.id)}
                  style={{
                    padding: '5px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${colors.bgSurface}`,
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = colors.bgSurface }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ fontFamily: 'monospace' }}>.{cls.name}</span>
                  <span style={{ fontSize: 10, color: colors.textMuted }}>{classUsageCount(cls.id)}</span>
                </div>
              ))}
              {!filteredClasses.find(c => c.name === inputValue.trim()) && inputValue.trim() && (
                <div
                  onClick={handleCreateAndApply}
                  style={{
                    padding: '5px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                    color: colors.textSecondary,
                    fontStyle: 'italic',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = colors.bgSurface }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
                >
                  Create ".{inputValue.trim()}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClassChip({
  cls,
  isEditing,
  onSelect,
  onRemove,
}: {
  cls: CSSClass
  isEditing: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: 'monospace',
        background: isEditing ? '#fff3e0' : colors.bgSurface,
        border: `1px solid ${isEditing ? '#ffb74d' : colors.border}`,
        cursor: 'pointer',
        color: isEditing ? '#e65100' : colors.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span onClick={onSelect}>.{cls.name}</span>
      <span
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        style={{
          marginLeft: 2,
          cursor: 'pointer',
          fontSize: 10,
          color: colors.textMuted,
          lineHeight: 1,
        }}
      >
        ×
      </span>
    </span>
  )
}
