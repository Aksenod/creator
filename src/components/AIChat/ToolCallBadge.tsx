import React from 'react'
import type { ToolCall } from './types'

const TOOL_LABELS: Record<string, string> = {
  get_artboard_info: '📋 Artboard info',
  get_element: '🔍 Get element',
  list_elements: '📄 List elements',
  add_element: '➕ Add element',
  update_element: '✏️ Update element',
  delete_element: '🗑 Delete element',
  select_element: '👆 Select element',
  move_element: '↕️ Move element',
}

export function ToolCallBadge({ toolCall }: { toolCall: ToolCall }) {
  const label = TOOL_LABELS[toolCall.function.name] || toolCall.function.name
  const [expanded, setExpanded] = React.useState(false)

  let parsedArgs: string | null = null
  try {
    const obj = JSON.parse(toolCall.function.arguments || '{}')
    parsedArgs = JSON.stringify(obj, null, 2)
  } catch {
    parsedArgs = toolCall.function.arguments
  }

  return (
    <div style={{ margin: '2px 0' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          fontSize: 10,
          fontFamily: 'inherit',
          background: '#f0f0f0',
          border: '1px solid #e0e0e0',
          borderRadius: 4,
          cursor: 'pointer',
          color: '#555',
        }}
      >
        {label}
        <span style={{ fontSize: 8, opacity: 0.6 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && parsedArgs && (
        <pre
          style={{
            margin: '2px 0 0',
            padding: '4px 8px',
            fontSize: 9,
            background: '#f7f7f7',
            border: '1px solid #eee',
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 120,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: '#666',
          }}
        >
          {parsedArgs}
        </pre>
      )}
    </div>
  )
}
