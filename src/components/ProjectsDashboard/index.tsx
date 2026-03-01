import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../../store'
import type { Project } from '../../types'

// ─── Форматирование времени ───────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин. назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.floor(hours / 24)
  return `${days} дн. назад`
}

// ─── Инициалы проекта ─────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Контекстное меню ─────────────────────────────────────────────────────────

type ContextMenuProps = {
  x: number
  y: number
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

function ContextMenu({ x, y, onRename, onDuplicate, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    padding: '4px 0',
    minWidth: 160,
    fontSize: 13,
  }

  const itemStyle: React.CSSProperties = {
    padding: '7px 14px',
    cursor: 'pointer',
    color: '#1a1a1a',
    userSelect: 'none',
  }

  const deleteStyle: React.CSSProperties = { ...itemStyle, color: '#e53935' }

  return (
    <div ref={ref} style={menuStyle}>
      <div style={itemStyle} onMouseDown={() => { onRename(); onClose() }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        Переименовать
      </div>
      <div style={itemStyle} onMouseDown={() => { onDuplicate(); onClose() }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        Дублировать
      </div>
      <div style={{ height: 1, background: '#e0e0e0', margin: '4px 0' }} />
      <div style={deleteStyle} onMouseDown={() => { onDelete(); onClose() }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        Удалить
      </div>
    </div>
  )
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

type ProjectCardProps = {
  project: Project
  onOpen: () => void
  onRename: (name: string) => void
  onDuplicate: () => void
  onDelete: () => void
}

function ProjectCard({ project, onOpen, onRename, onDuplicate, onDelete }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(project.name)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleStartRename = () => {
    setRenameValue(project.name)
    setIsRenaming(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleFinishRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== project.name) onRename(trimmed)
    setIsRenaming(false)
  }

  return (
    <div
      style={{ width: 220, cursor: 'pointer', userSelect: 'none' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div
        onClick={onOpen}
        style={{
          width: 220, height: 140,
          background: '#f0f0f0',
          borderRadius: 8,
          border: `2px solid ${isHovered ? '#0066ff' : '#e0e0e0'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 700, color: '#999', letterSpacing: '-0.02em' }}>
          {getInitials(project.name)}
        </span>

        {/* ⋮ кнопка */}
        {isHovered && (
          <button
            onClick={e => {
              e.stopPropagation()
              setContextMenu({ x: e.clientX, y: e.clientY })
            }}
            title="Меню проекта — переименовать, дублировать или удалить этот проект"
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 28, height: 28,
              background: '#fff', border: '1px solid #e0e0e0',
              borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#555',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}
          >
            ⋮
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 2px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isRenaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={handleFinishRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleFinishRename()
              if (e.key === 'Escape') setIsRenaming(false)
            }}
            style={{
              fontSize: 13, fontWeight: 600, color: '#1a1a1a',
              border: '1px solid #0066ff', borderRadius: 4,
              padding: '2px 4px', outline: 'none',
              background: '#fff', width: '100%', boxSizing: 'border-box',
            }}
            autoFocus
          />
        ) : (
          <div
            onDoubleClick={handleStartRename}
            style={{
              fontSize: 13, fontWeight: 600, color: '#1a1a1a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {project.name}
          </div>
        )}
        <div style={{ fontSize: 11, color: '#888' }}>
          {formatRelativeTime(project.updatedAt)}
        </div>
      </div>

      {/* Контекстное меню */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={handleStartRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

// ─── NewProjectCard ───────────────────────────────────────────────────────────

function NewProjectCard({ onCreate }: { onCreate: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onCreate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 220, cursor: 'pointer', userSelect: 'none',
      }}
    >
      <div style={{
        width: 220, height: 140,
        background: isHovered ? '#f5f8ff' : '#fafafa',
        borderRadius: 8,
        border: `2px dashed ${isHovered ? '#0066ff' : '#d0d0d0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        flexDirection: 'column', gap: 8,
      }}>
        <span style={{ fontSize: 28, color: isHovered ? '#0066ff' : '#bbb', lineHeight: 1 }}>+</span>
        <span style={{ fontSize: 12, color: isHovered ? '#0066ff' : '#aaa' }}>Новый проект</span>
      </div>
    </div>
  )
}

// ─── ProjectsDashboard ────────────────────────────────────────────────────────

export function ProjectsDashboard() {
  const { allProjects, createProject, openProject, deleteProject, renameProject, duplicateProject } = useEditorStore()

  const handleCreateProject = () => {
    createProject('Новый проект')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#fafafa' }}>
      {/* Header */}
      <div style={{
        height: 56, background: '#fff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', padding: '0 32px',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>Creator</span>
        <button
          onClick={handleCreateProject}
          title="Создать новый пустой проект с одним артбордом"
          style={{
            marginLeft: 'auto',
            padding: '7px 16px',
            background: '#0066ff', color: '#fff',
            border: 'none', borderRadius: 6,
            fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}
        >
          + Новый проект
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 32, marginTop: 0 }}>
          Проекты
        </h1>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 24,
        }}>
          {allProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => openProject(project.id)}
              onRename={(name) => renameProject(project.id, name)}
              onDuplicate={() => duplicateProject(project.id)}
              onDelete={() => deleteProject(project.id)}
            />
          ))}
          <NewProjectCard onCreate={handleCreateProject} />
        </div>

        {allProjects.length === 0 && (
          <p style={{ color: '#aaa', fontSize: 14, marginTop: 40 }}>
            Нет проектов. Создай первый!
          </p>
        )}
      </div>
    </div>
  )
}
