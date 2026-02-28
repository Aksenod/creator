import { useEditorStore } from './store'
import { BirdsEye } from './components/Canvas/BirdsEye'
import { PageEditor } from './components/Canvas/PageEditor'
import { Welcome } from './components/Welcome'

export default function App() {
  const { project, mode } = useEditorStore()

  if (!project) return <Welcome />

  if (mode === 'birdseye') return <BirdsEye />

  return <PageEditor />
}
