import { useRef, useEffect } from 'react'
import type { ChatMessage } from './types'
import { ToolCallBadge } from './ToolCallBadge'

type Props = {
  messages: ChatMessage[]
  isStreaming: boolean
}

export function ChatMessages({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Filter: hide system and tool messages from display
  const visible = messages.filter(
    (m) => m.role === 'user' || m.role === 'assistant',
  )

  // Check if assistant message is intermediate (has tool_calls and is not the last assistant msg)
  const isIntermediateAssistant = (msg: ChatMessage, idx: number) => {
    if (msg.role !== 'assistant' || !msg.tool_calls?.length) return false
    // Check if there's a later assistant message
    for (let j = idx + 1; j < visible.length; j++) {
      if (visible[j].role === 'assistant') return true
    }
    return false
  }

  if (visible.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          color: '#aaa',
          fontSize: 11,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        AI assistant for your artboard.
        <br />
        Ask to create layouts, grids, or modify elements.
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 8px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {visible.map((msg, i) => {
        const isUser = msg.role === 'user'
        const intermediate = isIntermediateAssistant(msg, i)
        const showText = !intermediate && (msg.content || (isStreaming && i === visible.length - 1 && !isUser))
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {showText && (
              <div
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: isUser ? '#0a0a0a' : '#f4f4f4',
                  color: isUser ? '#fff' : '#0a0a0a',
                }}
              >
                {msg.content || ''}
                {isStreaming && i === visible.length - 1 && !isUser && !msg.content && (
                  <span style={{ opacity: 0.4 }}>…</span>
                )}
              </div>
            )}
            {msg.tool_calls?.map((tc) => (
              <ToolCallBadge key={tc.id} toolCall={tc} />
            ))}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
