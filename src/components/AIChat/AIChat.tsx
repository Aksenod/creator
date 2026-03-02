import { useState } from 'react'
import { useAIChatStore } from '../../store/aiChatStore'
import { useAIChat } from './useAIChat'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatSettingsModal } from './ChatSettingsModal'

export function AIChat() {
  const { messages, isStreaming, error, settings, updateSettings, clearMessages, setError } =
    useAIChatStore()
  const { send, stop } = useAIChat()
  const [showSettings, setShowSettings] = useState(false)

  const hasApiKey = !!settings.apiKey

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          padding: '4px 8px',
          borderBottom: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      >
        <button
          onClick={clearMessages}
          title="Clear chat"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: '#999',
            padding: '2px 4px',
            fontFamily: 'inherit',
          }}
        >
          Clear
        </button>
        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            padding: '2px 4px',
            lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '6px 10px',
            background: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            fontSize: 11,
            color: '#b91c1c',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#b91c1c',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <ChatMessages messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput
        onSend={send}
        onStop={stop}
        isStreaming={isStreaming}
        disabled={!hasApiKey}
      />

      {/* Settings modal */}
      {showSettings && (
        <ChatSettingsModal
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
