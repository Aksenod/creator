import React, { useState, useRef, useEffect } from 'react'

type Props = {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus()
  }, [isStreaming])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setText('')
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '6px 8px',
        borderTop: '1px solid #e5e5e5',
        background: '#fff',
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message…"
        disabled={isStreaming || disabled}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid #e5e5e5',
          borderRadius: 6,
          padding: '6px 8px',
          fontSize: 12,
          fontFamily: 'inherit',
          lineHeight: 1.4,
          outline: 'none',
          background: disabled ? '#f5f5f5' : '#fafafa',
          color: '#0a0a0a',
          minHeight: 32,
          maxHeight: 100,
          overflow: 'auto',
        }}
      />
      {isStreaming ? (
        <button
          onClick={onStop}
          style={{
            padding: '0 8px',
            border: '1px solid #e5e5e5',
            borderRadius: 6,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 11,
            color: '#d00',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          Stop
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={!text.trim() || disabled}
          style={{
            padding: '0 8px',
            border: '1px solid #e5e5e5',
            borderRadius: 6,
            background: text.trim() && !disabled ? '#0a0a0a' : '#e5e5e5',
            color: text.trim() && !disabled ? '#fff' : '#999',
            cursor: text.trim() && !disabled ? 'pointer' : 'default',
            fontSize: 11,
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          Send
        </button>
      )}
    </div>
  )
}
