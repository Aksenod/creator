import { useEditorStore } from './store'
import { ProjectsDashboard } from './components/ProjectsDashboard'
import { CanvasEditor } from './components/CanvasEditor'

export default function App() {
  const mode = useEditorStore((s) => s.mode)

  if (mode === 'dashboard') return <ProjectsDashboard />
  return <CanvasEditor />
}
