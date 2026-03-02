import React, { useState } from 'react'
import type { AISettings } from './types'

const MODELS = [
  'google/gemini-3.1-pro-preview',
  'google/gemini-3-pro-preview',
  'google/gemini-3-flash-preview',
  'qwen/qwen3.5-397b-a17b',
  'qwen/qwen3-coder-plus',
  'qwen/qwen3.5-plus-02-15',
  'qwen/qwen3-max-thinking',
  'moonshotai/kimi-k2-thinking',
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
  const [model, setModel] = useState(settings.model)
  const [temperature, setTemperature] = useState(settings.temperature)

  const handleSave = () => {
    onSave({ model, temperature })
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
