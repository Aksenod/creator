import React, { Suspense, useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useEditorStore } from './store'
import { useProject, useCurrentView } from './store/selectors'
import { ErrorFallback } from './components/shared/ErrorFallback'
import { ProjectsDashboard } from './components/ProjectsDashboard'
import { CanvasEditor } from './components/CanvasEditor'

const BacklogPage = React.lazy(() => import('./components/Backlog').then(m => ({ default: m.BacklogPage })))
const TeamPage = React.lazy(() => import('./components/Backlog/TeamPage').then(m => ({ default: m.TeamPage })))

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
  const project = useProject()
  const currentView = useCurrentView()
  const setCurrentView = useEditorStore(s => s.setCurrentView)
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

  if (currentView === 'backlog' || currentView === 'team') {
    return (
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#999' }}>Loading...</div>}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {currentView === 'backlog'
            ? <BacklogPage responsiveMode={responsiveMode} />
            : <TeamPage responsiveMode={responsiveMode} />}
        </ErrorBoundary>
      </Suspense>
    )
  }

  if (!project) return <ProjectsDashboard />

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CanvasEditor />
    </ErrorBoundary>
  )
}
