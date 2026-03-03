import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BacklogTask, BacklogData, TaskStatus } from '../types/backlog'

const generateId = () => Math.random().toString(36).slice(2, 10)

type BacklogState = {
  tasks: BacklogTask[]
  editingTaskId: string | null
  loaded: boolean
  isUnlocked: boolean
  saving: boolean

  loadTasks: () => Promise<void>
  saveTasks: () => Promise<void>
  unlock: (pin: string) => boolean
  addTask: (data: Pick<BacklogTask, 'title' | 'description' | 'type' | 'priority' | 'labels'> & { screenshots?: string[] }) => void
  updateTask: (id: string, patch: Partial<BacklogTask>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, newStatus: TaskStatus, newOrder: number) => void
  setEditingTaskId: (id: string | null) => void
}

export const useBacklogStore = create<BacklogState>()(
  persist(
    (set, get) => ({
      tasks: [],
      editingTaskId: null,
      loaded: false,
      isUnlocked: sessionStorage.getItem('backlog-unlocked') === '1',
      saving: false,

      unlock: (pin) => {
        if (pin === '8888') {
          sessionStorage.setItem('backlog-unlocked', '1')
          set({ isUnlocked: true })
          return true
        }
        return false
      },

      loadTasks: async () => {
        try {
          const res = await fetch('/api/backlog/tasks')
          const data: BacklogData = await res.json()
          // API is source of truth — always overwrite localStorage cache
          set({ tasks: data.tasks, loaded: true })
        } catch {
          // API unavailable — use whatever persist loaded
          set({ loaded: true })
        }
      },

      saveTasks: async () => {
        set({ saving: true })
        const { tasks } = get()
        const data: BacklogData = { version: 1, tasks }
        try {
          await fetch('/api/backlog/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
        } catch { /* silently fail */ }
        set({ saving: false })
      },

      addTask: (data) => {
        const { tasks, saveTasks } = get()
        const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), -1)
        const now = Date.now()
        const task: BacklogTask = {
          id: generateId(),
          title: data.title,
          description: data.description,
          type: data.type,
          status: 'backlog',
          priority: data.priority,
          screenshots: data.screenshots ?? [],
          createdAt: now,
          updatedAt: now,
          order: maxOrder + 1,
          labels: data.labels,
        }
        set({ tasks: [...tasks, task] })
        saveTasks()
      },

      updateTask: (id, patch) => {
        const { tasks, saveTasks } = get()
        set({
          tasks: tasks.map(t =>
            t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
          ),
        })
        saveTasks()
      },

      deleteTask: (id) => {
        const { tasks, saveTasks } = get()
        set({ tasks: tasks.filter(t => t.id !== id), editingTaskId: null })
        saveTasks()
      },

      moveTask: (id, newStatus, newOrder) => {
        const { tasks, saveTasks } = get()
        const updated = tasks.map(t => {
          if (t.id === id) return { ...t, status: newStatus, order: newOrder, updatedAt: Date.now() }
          if (t.status === newStatus && t.id !== id && t.order >= newOrder) {
            return { ...t, order: t.order + 1 }
          }
          return t
        })
        set({ tasks: updated })
        saveTasks()
      },

      setEditingTaskId: (id) => set({ editingTaskId: id }),
    }),
    {
      name: 'creator-backlog',
      partialize: (state) => ({ tasks: state.tasks }),
      merge: (persisted, current) => {
        const p = persisted as Partial<BacklogState> | undefined
        return { ...current, tasks: p?.tasks ?? current.tasks }
      },
    },
  ),
)
