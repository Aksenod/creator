import React, { useState } from 'react'
import type { AISettings } from './types'

const MODELS = [
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash',
  'deepseek/deepseek-chat-v3-0324',
]

type Props = {
  settings: AISettings
  onSave: (patch: Partial<AISettings>) => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  border: '1px solid #e5e5e5',
  borderRadius: 4,
  fontSize: 12,
  fontFamily: 'inherit',
  background: '#fafafa',
  color: '#0a0a0a',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#555',
  marginBottom: 3,
  display: 'block',
}

export function ChatSettingsModal({ settings, onSave, onClose }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [model, setModel] = useState(settings.model)
  const [temperature, setTemperature] = useState(settings.temperature)

  const handleSave = () => {
    onSave({ apiKey, model, temperature })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 10,
          padding: '20px 20px 16px',
          width: 320,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>
          AI Chat Settings
        </div>

        <div>
          <label style={labelStyle}>API Key (OpenRouter)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Temperature: {temperature.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0a0a0a' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '5px 14px',
              border: '1px solid #e5e5e5',
              borderRadius: 6,
              background: '#fff',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
              color: '#555',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '5px 14px',
              border: 'none',
              borderRadius: 6,
              background: '#0a0a0a',
              color: '#fff',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
