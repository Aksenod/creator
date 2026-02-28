import { useEditorStore } from '../store'

export function Welcome() {
  const createProject = useEditorStore((s) => s.createProject)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 24,
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 600 }}>Creator</h1>
      <p style={{ color: '#666' }}>Визуальный редактор сайтов</p>
      <button
        onClick={() => createProject('Мой проект')}
        style={{
          padding: '10px 24px',
          background: '#0066ff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Новый проект
      </button>
    </div>
  )
}
