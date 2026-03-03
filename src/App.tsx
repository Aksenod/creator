import { useEditorStore } from './store'
import { ProjectsDashboard } from './components/ProjectsDashboard'
import { CanvasEditor } from './components/CanvasEditor'
import { BacklogPage } from './components/Backlog'

export default function App() {
  const { project, currentView } = useEditorStore()

  if (currentView === 'backlog') return <BacklogPage />
  if (!project) return <ProjectsDashboard />

  return <CanvasEditor />
}
