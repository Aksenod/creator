import { useEditorStore } from './store'
import { ProjectsDashboard } from './components/ProjectsDashboard'
import { CanvasEditor } from './components/CanvasEditor'

export default function App() {
  const { project } = useEditorStore()

  if (!project) return <ProjectsDashboard />

  return <CanvasEditor />
}
