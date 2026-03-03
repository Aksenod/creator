import React from 'react'
import {
  ClipboardText,
  MagnifyingGlass,
  ListBullets,
  PlusCircle,
  PencilSimple,
  Trash,
  CursorClick,
  ArrowsVertical,
  CaretUp,
  CaretDown,
} from '@phosphor-icons/react'
import type { ToolCall } from './types'
import { colors } from '../../styles/tokens'

const TOOL_LABELS: Record<string, { icon: React.ReactNode; label: string }> = {
  get_artboard_info: { icon: <ClipboardText size={12} weight="thin" />, label: 'Artboard info' },
  get_element: { icon: <MagnifyingGlass size={12} weight="thin" />, label: 'Get element' },
  list_elements: { icon: <ListBullets size={12} weight="thin" />, label: 'List elements' },
  add_element: { icon: <PlusCircle size={12} weight="thin" />, label: 'Add element' },
  update_element: { icon: <PencilSimple size={12} weight="thin" />, label: 'Update element' },
  delete_element: { icon: <Trash size={12} weight="thin" />, label: 'Delete element' },
  select_element: { icon: <CursorClick size={12} weight="thin" />, label: 'Select element' },
  move_element: { icon: <ArrowsVertical size={12} weight="thin" />, label: 'Move element' },
}

export function ToolCallBadge({ toolCall }: { toolCall: ToolCall }) {
  const entry = TOOL_LABELS[toolCall.function.name]
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
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 4,
          cursor: 'pointer',
          color: colors.textSecondary,
        }}
      >
        {entry ? (
          <>
            {entry.icon}
            {entry.label}
          </>
        ) : (
          toolCall.function.name
        )}
        <span style={{ fontSize: 8, opacity: 0.6, display: 'inline-flex' }}>
          {expanded ? <CaretUp size={8} weight="thin" /> : <CaretDown size={8} weight="thin" />}
        </span>
      </button>
      {expanded && parsedArgs && (
        <pre
          style={{
            margin: '2px 0 0',
            padding: '4px 8px',
            fontSize: 9,
            background: colors.bgHover,
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 120,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: colors.textSecondary,
          }}
        >
          {parsedArgs}
        </pre>
      )}
    </div>
  )
}
