import { useState, useCallback, useRef } from 'react'
import type { ElementStyles } from '../../types'
import type { Fill } from '../../types/fills'
import { createSolidFill, createGradientFill, createImageFill } from '../../types/fills'
import { migrateFills } from '../../utils/fillUtils'
import { CollapsibleSection, PropertyRow } from './shared'
import { PropertySelect } from './shared/PropertySelect'
import { FillRow } from './FillRow'
import { GradientPicker } from './shared/GradientPicker'
import { ImageFillPicker } from './shared/ImageFillPicker'

type Props = {
  styles: Partial<ElementStyles>
  onUpdate: (patch: Partial<ElementStyles>) => void
}

type AddMenuType = null | 'open'
type PickerState = { type: 'gradient' | 'image'; index: number; anchorRect: DOMRect } | null

export function FillSection({ styles, onUpdate }: Props) {
  const fills = migrateFills(styles) ?? []
  const fillsRef = useRef(fills)
  fillsRef.current = fills

  const [addMenu, setAddMenu] = useState<AddMenuType>(null)
  const [picker, setPicker] = useState<PickerState>(null)

  // Drag state: render-driven via useState, logic via ref
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<{ index: number; side: 'above' | 'below' } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const updateFills = useCallback((next: Fill[]) => {
    onUpdate({ fills: next, backgroundColor: undefined })
  }, [onUpdate])

  const addFill = useCallback((fill: Fill) => {
    updateFills([fill, ...fillsRef.current])
    setAddMenu(null)
  }, [updateFills])

  const updateFillAt = useCallback((index: number, fill: Fill) => {
    const next = [...fillsRef.current]
    next[index] = fill
    updateFills(next)
  }, [updateFills])

  const removeFillAt = useCallback((index: number) => {
    updateFills(fillsRef.current.filter((_, i) => i !== index))
  }, [updateFills])

  const closePicker = useCallback(() => setPicker(null), [])

  // ─── Drag-to-reorder ────────────────────────────────────────────────

  const handleDragStart = useCallback((fromIndex: number, e: React.MouseEvent) => {
    e.preventDefault()
    setDragIndex(fromIndex)

    // Track last drop target in a local variable (no stale closure)
    let lastDrop: { index: number; side: 'above' | 'below' } | null = null

    const onMove = (ev: MouseEvent) => {
      if (!listRef.current) return
      const rows = listRef.current.querySelectorAll<HTMLElement>('[data-fill-row]')
      let targetIdx = 0
      let side: 'above' | 'below' = 'above'

      for (let i = 0; i < rows.length; i++) {
        const rect = rows[i].getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        if (ev.clientY < mid) {
          targetIdx = i
          side = 'above'
          break
        }
        targetIdx = i
        side = 'below'
      }

      lastDrop = { index: targetIdx, side }
      setDropTarget(lastDrop)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)

      setDragIndex(null)
      setDropTarget(null)

      if (lastDrop == null) return

      let to = lastDrop.side === 'below' ? lastDrop.index + 1 : lastDrop.index
      if (fromIndex < to) to -= 1
      if (fromIndex === to) return

      const arr = [...fillsRef.current]
      const [moved] = arr.splice(fromIndex, 1)
      arr.splice(to, 0, moved)
      updateFills(arr)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [updateFills])

  return (
    <CollapsibleSection
      label="Fill"
      tooltip="Element fills — color, gradient or image"
      defaultOpen
      headerRight={
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setAddMenu(addMenu ? null : 'open') }}
            title="Add fill"
            style={{
              width: 20, height: 20, padding: 0, border: 'none',
              background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#666', fontSize: 18, lineHeight: 1,
            }}
          >
            +
          </button>
          {addMenu === 'open' && (
            <div
              style={{
                position: 'absolute', right: 0, top: 22, zIndex: 100,
                background: '#fff', border: '1px solid #e5e5e5', borderRadius: 6,
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)', padding: 4,
                minWidth: 130,
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              {[
                { label: 'Solid', fn: () => addFill(createSolidFill()) },
                { label: 'Linear Gradient', fn: () => addFill(createGradientFill()) },
                { label: 'Radial Gradient', fn: () => {
                  const g = createGradientFill()
                  g.gradientType = 'radial'
                  addFill(g)
                }},
                { label: 'Image', fn: () => addFill(createImageFill()) },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.fn}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '5px 10px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: 12, borderRadius: 4,
                    color: '#333',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      }
    >
      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {fills.length === 0 && (
          <div style={{ fontSize: 11, color: '#a3a3a3', padding: '4px 0' }}>No fills</div>
        )}
        {fills.map((fill, i) => (
          <div key={fill.id} data-fill-row>
            <FillRow
              fill={fill}
              onChange={f => updateFillAt(i, f)}
              onRemove={() => removeFillAt(i)}
              onOpenGradient={(rect) => setPicker({ type: 'gradient', index: i, anchorRect: rect })}
              onOpenImage={(rect) => setPicker({ type: 'image', index: i, anchorRect: rect })}
              onDragStart={(e) => handleDragStart(i, e)}
              isDragging={dragIndex === i}
              isDragOver={
                dragIndex != null && dropTarget?.index === i && dragIndex !== i
                  ? dropTarget.side
                  : null
              }
            />
          </div>
        ))}

        {/* Background Clip */}
        {fills.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <PropertyRow label="Clip" labelWidth={30}>
              <PropertySelect
                value={styles.backgroundClip ?? ''}
                options={[
                  { value: 'border-box', label: 'Border box' },
                  { value: 'padding-box', label: 'Padding box' },
                  { value: 'content-box', label: 'Content box' },
                  { value: 'text', label: 'Text' },
                ]}
                onChange={v => onUpdate({ backgroundClip: (v as ElementStyles['backgroundClip']) || undefined })}
                placeholder="None"
                title="Background clip — where the background is painted"
              />
            </PropertyRow>
          </div>
        )}
      </div>

      {/* Gradient picker portal */}
      {picker?.type === 'gradient' && fills[picker.index]?.type === 'gradient' && (
        <GradientPicker
          fill={fills[picker.index] as Extract<Fill, { type: 'gradient' }>}
          anchorRect={picker.anchorRect}
          onChange={f => updateFillAt(picker.index, f)}
          onClose={closePicker}
        />
      )}

      {/* Image picker portal */}
      {picker?.type === 'image' && fills[picker.index]?.type === 'image' && (
        <ImageFillPicker
          fill={fills[picker.index] as Extract<Fill, { type: 'image' }>}
          anchorRect={picker.anchorRect}
          onChange={f => updateFillAt(picker.index, f)}
          onClose={closePicker}
        />
      )}
    </CollapsibleSection>
  )
}
