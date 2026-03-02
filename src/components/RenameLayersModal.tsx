import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../store'

type Props = {
  artboardId: string
  elementIds: string[]
  onClose: () => void
}

function applyTemplate(
  template: string,
  currentName: string,
  index: number,
  total: number,
  startNum: number,
): string {
  let result = template

  // $nnn, $nn, $n — ascending with padding
  result = result.replace(/\$n{1,}/g, (match) => {
    const digits = match.length - 1 // число 'n' после '$'
    const num = startNum + index
    return digits > 0 ? String(num).padStart(digits, '0') : String(num)
  })

  // $NNN, $NN, $N — descending with padding
  result = result.replace(/\$N{1,}/g, (match) => {
    const digits = match.length - 1
    const num = startNum + (total - 1 - index)
    return digits > 0 ? String(num).padStart(digits, '0') : String(num)
  })

  // Если шаблон пуст, вернуть текущее имя
  if (result === '') return currentName

  return result
}

function applyMatch(
  newName: string,
  currentName: string,
  matchPattern: string,
): string {
  if (!matchPattern) return newName

  // Пробуем как regex
  try {
    const regex = new RegExp(matchPattern, 'g')
    if (regex.test(currentName)) {
      // Сбросить lastIndex после test
      regex.lastIndex = 0
      return currentName.replace(regex, newName)
    }
  } catch {
    // Не regex — используем как литеральную строку
  }

  // Литеральный поиск
  if (currentName.includes(matchPattern)) {
    return currentName.split(matchPattern).join(newName)
  }

  return currentName
}

export function RenameLayersModal({ artboardId, elementIds, onClose }: Props) {
  const { project, renameElements } = useEditorStore()
  const ab = project?.artboards[artboardId]

  const [template, setTemplate] = useState('')
  const [startNum, setStartNum] = useState(1)
  const [matchPattern, setMatchPattern] = useState('')
  const templateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    templateInputRef.current?.focus()
  }, [])

  // ESC закрывает модал
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const elements = useMemo(() => {
    if (!ab) return []
    return elementIds
      .map(id => ab.elements[id])
      .filter(el => el && el.type !== 'body')
  }, [ab, elementIds])

  const previews = useMemo(() => {
    return elements.map((el, i) => {
      if (!template && !matchPattern) {
        return { id: el.id, oldName: el.name, newName: el.name }
      }
      let newName = template
        ? applyTemplate(template, el.name, i, elements.length, startNum)
        : el.name
      if (matchPattern) {
        newName = applyMatch(newName, el.name, matchPattern)
      }
      return { id: el.id, oldName: el.name, newName }
    })
  }, [elements, template, startNum, matchPattern])

  const hasChanges = previews.some(p => p.oldName !== p.newName)

  const handleRename = () => {
    const renames = previews
      .filter(p => p.oldName !== p.newName && p.newName.trim())
      .map(p => ({ id: p.id, name: p.newName.trim() }))
    if (renames.length > 0) {
      renameElements(artboardId, renames)
    }
    onClose()
  }

  const insertToken = (token: string) => {
    setTemplate(prev => prev + token)
    templateInputRef.current?.focus()
  }

  if (!ab || elements.length === 0) {
    return createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: 8, padding: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            width: 400,
          }}
        >
          <div style={{ fontSize: 14, color: '#888' }}>Нет выбранных элементов для переименования</div>
          <button onClick={onClose} style={btnStyle}>Закрыть</button>
        </div>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          width: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px 12px', borderBottom: '1px solid #eee',
          fontSize: 14, fontWeight: 600, color: '#333',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Переименовать слои ({elements.length})</span>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 18, color: '#999', lineHeight: 1, padding: '0 2px',
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', overflow: 'auto', flex: 1 }}>
          {/* Template */}
          <label style={labelStyle}>Переименовать в</label>
          <input
            ref={templateInputRef}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            placeholder="Новое имя (шаблон)"
            style={inputStyle}
          />

          {/* Helper tokens */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <TokenBtn label="Текущее имя" onClick={() => {
              if (elements.length === 1) setTemplate(elements[0].name)
            }} />
            <TokenBtn label="↑ $nn" onClick={() => insertToken('$nn')} />
            <TokenBtn label="↓ $NN" onClick={() => insertToken('$NN')} />
            <TokenBtn label="$n" onClick={() => insertToken('$n')} />
            <TokenBtn label="$nnn" onClick={() => insertToken('$nnn')} />
          </div>

          {/* Start number */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Начать с</label>
            <input
              type="number"
              value={startNum}
              onChange={(e) => setStartNum(parseInt(e.target.value) || 0)}
              style={{ ...inputStyle, width: 64, marginTop: 0 }}
            />
          </div>

          {/* Match */}
          <label style={{ ...labelStyle, marginTop: 14 }}>Совпадение (find/replace)</label>
          <input
            value={matchPattern}
            onChange={(e) => setMatchPattern(e.target.value)}
            placeholder="Текст или /regex/"
            style={inputStyle}
          />

          {/* Preview */}
          <label style={{ ...labelStyle, marginTop: 16 }}>Превью</label>
          <div style={{
            border: '1px solid #e0e0e0', borderRadius: 4,
            maxHeight: 200, overflow: 'auto',
          }}>
            {previews.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', fontSize: 12,
                borderBottom: '1px solid #f0f0f0',
              }}>
                <span style={{
                  flex: 1, color: '#888', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{p.oldName}</span>
                <span style={{ color: '#bbb', flexShrink: 0 }}>→</span>
                <span style={{
                  flex: 1, color: p.oldName !== p.newName ? '#0066ff' : '#333',
                  fontWeight: p.oldName !== p.newName ? 500 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{p.newName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid #eee',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={btnStyle}>Отмена</button>
          <button
            onClick={handleRename}
            disabled={!hasChanges}
            style={{
              ...btnStyle,
              background: hasChanges ? '#0066ff' : '#ccc',
              color: '#fff',
              cursor: hasChanges ? 'pointer' : 'default',
            }}
          >
            Переименовать
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function TokenBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: '1px solid #ddd', borderRadius: 3,
        background: '#f8f8f8', padding: '2px 8px',
        fontSize: 11, color: '#555', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#888', marginBottom: 4, textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', fontSize: 13,
  border: '1px solid #ddd', borderRadius: 4, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #ddd', borderRadius: 4, padding: '6px 16px',
  fontSize: 13, cursor: 'pointer', background: '#fff', color: '#333',
  fontFamily: 'inherit',
}
