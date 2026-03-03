import { useEffect, useState } from 'react'
import { useEditorStore } from './store'
import { ProjectsDashboard } from './components/ProjectsDashboard'
import { CanvasEditor } from './components/CanvasEditor'
import { BacklogPage } from './components/Backlog'
import { TeamPage } from './components/Backlog/TeamPage'

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

export default function App() {
  const { project, currentView, setCurrentView } = useEditorStore()
  const isMobile = useIsMobile()

  // On mobile, only backlog & team are available
  useEffect(() => {
    if (isMobile && currentView !== 'backlog' && currentView !== 'team') {
      setCurrentView('backlog')
      window.history.replaceState(null, '', '/backlog')
    }
  }, [isMobile, currentView, setCurrentView])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/backlog') setCurrentView('backlog')
      else if (path === '/team') setCurrentView('team')
      else if (isMobile) setCurrentView('backlog')
      else setCurrentView('projects')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setCurrentView, isMobile])

  if (currentView === 'backlog') return <BacklogPage isMobile={isMobile} />
  if (currentView === 'team') return <TeamPage isMobile={isMobile} />
  if (!project) return <ProjectsDashboard />

  return <CanvasEditor />
}
