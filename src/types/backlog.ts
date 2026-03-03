export type TaskType = 'feature' | 'bug'
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'design_review' | 'code_review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type ReviewComment = {
  author: string
  text: string
  createdAt: number
}

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
  reviewComments?: ReviewComment[]
}

export type BacklogData = {
  version: 1
  tasks: BacklogTask[]
}
