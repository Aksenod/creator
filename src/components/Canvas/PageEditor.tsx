import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store'
import { Layers } from '../Layers/Layers'
import { Properties } from '../Properties/Properties'
import { Toolbar } from '../Toolbar/Toolbar'
import { Canvas } from './Canvas'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'

export function PageEditor() {
  const { exitArtboard, project, activeArtboardId } = useEditorStore()
  const [isPreview, setIsPreview] = useState(false)

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const { transform, fitToScreen, scalePercent } = useCanvasTransform(canvasContainerRef)

  // При входе в page mode — подогнать артборд под экран
  useEffect(() => {
    if (artboard) {
      // requestAnimationFrame чтобы контейнер успел отрендериться и получить размер
      requestAnimationFrame(() => fitToScreen(artboard.width))
    }
  }, [artboard?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPreview) setIsPreview(false)
        else exitArtboard()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitArtboard, isPreview])

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
          <span style={{ marginLeft: 'auto', color: '#555', fontSize: 12 }}>{scalePercent}%</span>
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
          <span style={{
            marginLeft: 'auto', fontSize: 12, color: '#888',
            padding: '3px 8px', background: '#f5f5f5', borderRadius: 4,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {scalePercent}%
          </span>
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
        <div
          ref={canvasContainerRef}
          tabIndex={0}
          style={{ flex: 1, overflow: 'hidden', background: '#f5f5f5', outline: 'none' }}
        >
          <Canvas artboard={artboard} transform={transform} previewMode={isPreview} />
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
