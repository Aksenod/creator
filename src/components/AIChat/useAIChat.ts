import { useRef, useCallback } from 'react'
import { useAIChatStore } from '../../store/aiChatStore'
import { streamChat, type StreamDelta } from './openRouterApi'
import { toolDefinitions, executeTool } from './aiTools'
import { buildSystemPrompt } from './systemPrompt'
import type { ChatMessage, ToolCall } from './types'

const MAX_TOOL_ITERATIONS = 10
const MAX_API_MESSAGES = 40

/**
 * Sanitize message history: remove orphaned tool results
 * and assistant messages with empty content and no tool_calls.
 */
function sanitizeMessages(msgs: ChatMessage[]): ChatMessage[] {
  // Collect all tool_call IDs from assistant messages
  const validToolCallIds = new Set<string>()
  for (const m of msgs) {
    if (m.role === 'assistant' && m.tool_calls) {
      for (const tc of m.tool_calls) validToolCallIds.add(tc.id)
    }
  }

  return msgs.filter((m) => {
    // Remove tool results without matching tool_call
    if (m.role === 'tool') {
      return m.tool_call_id ? validToolCallIds.has(m.tool_call_id) : false
    }
    // Remove empty assistant messages (leftover from aborted streams)
    if (m.role === 'assistant' && !m.content && !m.tool_calls?.length) {
      return false
    }
    return true
  })
}

export function useAIChat() {
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    useAIChatStore.getState().setStreaming(false)
  }, [])

  const send = useCallback(
    async (userText: string) => {
      console.log('[AIChat] send called:', userText)
      const currentSettings = useAIChatStore.getState().settings
      console.log('[AIChat] apiKey present:', !!currentSettings.apiKey, 'model:', currentSettings.model)
      if (!currentSettings.apiKey) {
        useAIChatStore.getState().setError('API key is not set. Open settings (⚙) to configure.')
        return
      }

      useAIChatStore.getState().setError(null)
      useAIChatStore.getState().setStreaming(true)

      const userMsg: ChatMessage = { role: 'user', content: userText }
      useAIChatStore.getState().addMessage(userMsg)

      const systemMsg: ChatMessage = {
        role: 'system',
        content: buildSystemPrompt(),
      }

      // Build history for API call (sanitize orphaned tool messages)
      let apiMessages: ChatMessage[] = [
        systemMsg,
        ...sanitizeMessages(useAIChatStore.getState().messages),
      ]

      const abortController = new AbortController()
      abortRef.current = abortController

      try {
        let prevToolKey = ''

        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          // Add empty assistant message for streaming
          useAIChatStore.getState().addMessage({ role: 'assistant', content: '' })

          let contentAcc = ''
          const toolCallsAcc: Record<
            number,
            { id: string; name: string; arguments: string }
          > = {}

          console.log('[AIChat] iter', iter, 'sending', apiMessages.length, 'messages')
          await new Promise<void>((resolve, reject) => {
            streamChat(
              currentSettings,
              apiMessages,
              toolDefinitions,
              {
                onDelta: (delta: StreamDelta) => {
                  if (delta.content) {
                    contentAcc += delta.content
                    useAIChatStore.getState().updateLastAssistant(contentAcc)
                  }
                  if (delta.tool_calls) {
                    for (const tc of delta.tool_calls) {
                      if (!toolCallsAcc[tc.index]) {
                        toolCallsAcc[tc.index] = {
                          id: tc.id || '',
                          name: tc.function?.name || '',
                          arguments: '',
                        }
                      }
                      const entry = toolCallsAcc[tc.index]
                      if (tc.id) entry.id = tc.id
                      if (tc.function?.name) entry.name = tc.function.name
                      if (tc.function?.arguments)
                        entry.arguments += tc.function.arguments
                    }
                  }
                },
                onDone: () => resolve(),
                onError: (err) => reject(new Error(err)),
              },
              abortController.signal,
            ).catch(reject)
          })

          // Build tool_calls array
          const toolCalls: ToolCall[] = Object.values(toolCallsAcc)
            .filter((tc) => tc.id && tc.name)
            .map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: tc.arguments },
            }))

          if (toolCalls.length === 0) {
            // No tool calls — done
            break
          }

          // Loop detection: if same tools with same args as previous iteration, break
          const toolKey = toolCalls
            .map((tc) => `${tc.function.name}:${tc.function.arguments}`)
            .sort()
            .join('|')
          if (toolKey === prevToolKey) {
            console.warn('[AIChat] loop detected — same tool calls repeated, breaking')
            useAIChatStore.getState().updateLastAssistant(
              contentAcc || '(Repeated action detected — stopping to avoid loop)',
              toolCalls,
            )
            break
          }
          prevToolKey = toolKey

          // Update last assistant with tool calls
          useAIChatStore.getState().updateLastAssistant(contentAcc, toolCalls)

          // Execute each tool call and add results
          const toolResultMsgs: ChatMessage[] = toolCalls.map((tc) => {
            const result = executeTool(tc.function.name, tc.function.arguments)
            return {
              role: 'tool' as const,
              content: result,
              tool_call_id: tc.id,
              name: tc.function.name,
            }
          })

          // Add tool results to store
          for (const msg of toolResultMsgs) {
            useAIChatStore.getState().addMessage(msg)
          }

          // Rebuild apiMessages for next iteration (limit history size)
          const allMsgs = sanitizeMessages(useAIChatStore.getState().messages)
          apiMessages = [
            systemMsg,
            ...allMsgs.slice(-MAX_API_MESSAGES),
          ]
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          console.error('[AIChat] error:', msg)
          useAIChatStore.getState().setError(msg)
        }
      } finally {
        useAIChatStore.getState().setStreaming(false)
        abortRef.current = null
      }
    },
    [],
  )

  return { send, stop }
}
