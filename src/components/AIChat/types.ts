export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type ChatMessage = {
  role: ChatRole
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export type AISettings = {
  apiKey: string
  model: string
  temperature: number
  customPrompt: string
}

export type AIChatState = {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  settings: AISettings

  addMessage: (msg: ChatMessage) => void
  setMessages: (msgs: ChatMessage[]) => void
  updateLastAssistant: (content: string, toolCalls?: ToolCall[]) => void
  setStreaming: (v: boolean) => void
  setError: (e: string | null) => void
  updateSettings: (patch: Partial<AISettings>) => void
  clearMessages: () => void
}
