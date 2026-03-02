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
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
