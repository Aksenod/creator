import type { ChatMessage, AISettings } from './types'

type ToolDef = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export type StreamDelta = {
  content?: string
  tool_calls?: Array<{
    index: number
    id?: string
    type?: 'function'
    function?: { name?: string; arguments?: string }
  }>
}

export type StreamCallbacks = {
  onDelta: (delta: StreamDelta) => void
  onDone: () => void
  onError: (err: string) => void
}

export async function streamChat(
  settings: AISettings,
  messages: ChatMessage[],
  tools: ToolDef[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
) {
  const body = {
    model: settings.model,
    messages,
    tools: tools.length > 0 ? tools : undefined,
    temperature: settings.temperature,
    stream: true,
  }
  console.log('[AIChat] fetch →', settings.model, 'body:', JSON.stringify(body).slice(0, 500))
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  console.log('[AIChat] response status:', res.status)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    console.error('[AIChat] API error:', res.status, text)
    callbacks.onError(`API error ${res.status}: ${text}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          callbacks.onDone()
          return
        }
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta as StreamDelta | undefined
          if (delta) callbacks.onDelta(delta)
        } catch {
          // ignore malformed JSON chunks
        }
      }
    }
    callbacks.onDone()
  } catch (err) {
    if (signal?.aborted) return
    callbacks.onError(err instanceof Error ? err.message : 'Stream error')
  }
}
