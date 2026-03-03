export type TaskType = 'feature' | 'bug'
export type TaskStatus = 'backlog' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type BacklogTask = {
  id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  screenshots: string[]
  createdAt: number
  updatedAt: number
  order: number
  labels: string[]
}

export type BacklogData = {
  version: 1
  tasks: BacklogTask[]
}
