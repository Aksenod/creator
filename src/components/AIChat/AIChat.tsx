import { useState } from 'react'
import { Gear, X } from '@phosphor-icons/react'
import { useAIChatStore } from '../../store/aiChatStore'
import { useAIChat } from './useAIChat'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatSettingsModal } from './ChatSettingsModal'
import { colors } from '../../styles/tokens'

export function AIChat() {
  const { messages, isStreaming, error, settings, updateSettings, clearMessages, setError } =
    useAIChatStore()
  const { send, stop } = useAIChat()
  const [showSettings, setShowSettings] = useState(false)

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
          borderBottom: `1px solid ${colors.border}`,
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
            color: colors.textMuted,
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
          <Gear size={14} weight="thin" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '6px 10px',
            background: colors.bgSurface,
            borderBottom: `1px solid ${colors.border}`,
            fontSize: 11,
            color: colors.accentRed,
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
              color: colors.accentRed,
              padding: 0,
              lineHeight: 1,
            }}
          >
            <X size={12} weight="thin" />
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
