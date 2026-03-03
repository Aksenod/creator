import { useEffect, useState } from 'react'
import { useEditorStore } from './store'
import { ProjectsDashboard } from './components/ProjectsDashboard'
import { CanvasEditor } from './components/CanvasEditor'
import { BacklogPage } from './components/Backlog'
import { TeamPage } from './components/Backlog/TeamPage'

export type ResponsiveMode = 'desktop' | 'tablet' | 'mobile'

function useResponsiveMode(): ResponsiveMode {
  const [mode, setMode] = useState<ResponsiveMode>(() => {
    const w = window.innerWidth
    if (w < 768) return 'mobile'
    if (w < 1024) return 'tablet'
    return 'desktop'
  })
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 768) setMode('mobile')
      else if (w < 1024) setMode('tablet')
      else setMode('desktop')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mode
}

export default function App() {
  const { project, currentView, setCurrentView } = useEditorStore()
  const responsiveMode = useResponsiveMode()
  const isMobileOrTablet = responsiveMode !== 'desktop'

  // On mobile/tablet, only backlog & team are available
  useEffect(() => {
    if (isMobileOrTablet && currentView !== 'backlog' && currentView !== 'team') {
      setCurrentView('backlog')
      window.history.replaceState(null, '', '/backlog')
    }
  }, [isMobileOrTablet, currentView, setCurrentView])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/backlog') setCurrentView('backlog')
      else if (path === '/team') setCurrentView('team')
      else if (isMobileOrTablet) setCurrentView('backlog')
      else setCurrentView('projects')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setCurrentView, isMobileOrTablet])

  if (currentView === 'backlog') return <BacklogPage responsiveMode={responsiveMode} />
  if (currentView === 'team') return <TeamPage responsiveMode={responsiveMode} />
  if (!project) return <ProjectsDashboard />

  return <CanvasEditor />
}
