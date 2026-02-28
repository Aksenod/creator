import { useEffect } from 'react'
import { useEditorStore } from '../../store'
import { Layers } from '../Layers/Layers'
import { Properties } from '../Properties/Properties'
import { Toolbar } from '../Toolbar/Toolbar'
import { Canvas } from './Canvas'

export function PageEditor() {
  const { exitArtboard, project, activeArtboardId } = useEditorStore()

  const artboard = project && activeArtboardId ? project.artboards[activeArtboardId] : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitArtboard()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exitArtboard])

  if (!artboard) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Топбар */}
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
      </div>

      {/* Основная область */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Панель слоёв */}
        <div style={{ width: 240, borderRight: '1px solid #e0e0e0', flexShrink: 0, overflow: 'hidden' }}>
          <Layers artboard={artboard} />
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'auto', background: '#f5f5f5' }}>
          <Canvas artboard={artboard} />
        </div>

        {/* Панель свойств */}
        <div style={{ width: 240, borderLeft: '1px solid #e0e0e0', flexShrink: 0, overflow: 'hidden' }}>
          <Properties />
        </div>
      </div>
    </div>
  )
}
