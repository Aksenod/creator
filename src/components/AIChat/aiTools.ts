import { useEditorStore } from '../../store'
import { resolveStyles } from '../../utils/resolveStyles'
import type { CanvasElement, ElementStyles, ElementType, Artboard } from '../../types'

// ─── Tool definitions (JSON Schema for OpenAI function calling) ───

export const toolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'get_artboard_info',
      description:
        'Get artboard dimensions and element tree. Returns artboard name, width, height, and a nested tree of elements with their types and names.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_element',
      description:
        'Get full details of a single element by ID, including resolved styles for the active breakpoint.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'string', description: 'Element ID' },
        },
        required: ['elementId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_elements',
      description:
        'Get a flat list of all elements in the artboard with id, name, type, and parentId.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_element',
      description:
        'Create a new element. Returns the created element ID. The element is added as the last child of parentId (or body if omitted).',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['div', 'section', 'text', 'image', 'button', 'input'],
            description: 'Element type',
          },
          parentId: {
            type: 'string',
            description: 'Parent element ID. Defaults to body.',
          },
          styles: {
            type: 'object',
            description:
              'CSS styles to apply (width, height, display, gridTemplateColumns, gap, backgroundColor, top, left, right, bottom, zIndex, etc.)',
          },
          positionMode: {
            type: 'string',
            enum: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
            description: 'CSS position mode. Default: static.',
          },
          content: {
            type: 'string',
            description: 'Text content (for text/button elements) or placeholder (for input elements)',
          },
          name: {
            type: 'string',
            description: 'Element name',
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_element',
      description:
        'Update styles or properties of an existing element by ID.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'string', description: 'Element ID to update' },
          styles: {
            type: 'object',
            description: 'CSS styles to update',
          },
          positionMode: {
            type: 'string',
            enum: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
            description: 'CSS position mode',
          },
          content: { type: 'string', description: 'New text content' },
          name: { type: 'string', description: 'New element name' },
          src: { type: 'string', description: 'Image source URL' },
          alt: { type: 'string', description: 'Image alt text' },
        },
        required: ['elementId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_element',
      description: 'Delete an element and all its descendants.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'string', description: 'Element ID to delete' },
        },
        required: ['elementId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'select_element',
      description: 'Select an element on the canvas by ID. Pass empty string to deselect all.',
      parameters: {
        type: 'object',
        properties: {
          elementId: {
            type: 'string',
            description: 'Element ID to select, or empty string to deselect',
          },
        },
        required: ['elementId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'move_element',
      description: 'Move an element to a new parent at a given index.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'string', description: 'Element to move' },
          newParentId: { type: 'string', description: 'New parent element ID' },
          index: {
            type: 'number',
            description: 'Position among siblings (0-based). Defaults to end.',
          },
        },
        required: ['elementId', 'newParentId'],
      },
    },
  },
]

// ─── Helpers ───

function getActiveArtboard(): { artboard: Artboard; artboardId: string } | null {
  const { project, activeArtboardId } = useEditorStore.getState()
  if (!project || !activeArtboardId) return null
  const artboard = project.artboards[activeArtboardId]
  if (!artboard) return null
  return { artboard, artboardId: activeArtboardId }
}

function findParentId(artboard: Artboard, elementId: string): string | null {
  for (const el of Object.values(artboard.elements)) {
    if (el.children.includes(elementId)) return el.id
  }
  if (artboard.rootChildren.includes(elementId)) return null
  return null
}

function buildTree(
  artboard: Artboard,
  ids: string[],
  bpId: string,
): unknown[] {
  return ids
    .map((id) => {
      const el = artboard.elements[id]
      if (!el) return null
      const styles = resolveStyles(el, bpId as never)
      return {
        id: el.id,
        name: el.name,
        type: el.type,
        positionMode: el.positionMode,
        styles: summarizeStyles(styles),
        ...(el.content ? { content: el.content } : {}),
        ...(el.children.length > 0
          ? { children: buildTree(artboard, el.children, bpId) }
          : {}),
      }
    })
    .filter(Boolean)
}

function summarizeStyles(s: ElementStyles): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(s)) {
    if (v !== undefined && v !== null && v !== '' && k !== 'fills') out[k] = v
  }
  return out
}

// ─── Executor ───

export function executeTool(
  name: string,
  argsStr: string,
): string {
  let args: Record<string, unknown>
  try {
    args = JSON.parse(argsStr || '{}')
  } catch {
    return JSON.stringify({ error: 'Invalid JSON arguments' })
  }

  const store = useEditorStore.getState()
  const ctx = getActiveArtboard()

  if (!ctx) {
    return JSON.stringify({ error: 'No active artboard' })
  }

  const { artboard, artboardId } = ctx
  const bpId = store.activeBreakpointId

  switch (name) {
    case 'get_artboard_info': {
      const bodyId = artboard.rootChildren.find(
        (id) => artboard.elements[id]?.type === 'body',
      )
      return JSON.stringify({
        name: artboard.name,
        width: artboard.width,
        height: artboard.height,
        activeBreakpoint: bpId,
        elementCount: Object.keys(artboard.elements).length,
        tree: buildTree(artboard, bodyId ? [bodyId] : artboard.rootChildren, bpId),
      })
    }

    case 'get_element': {
      const el = artboard.elements[args.elementId as string]
      if (!el) return JSON.stringify({ error: 'Element not found' })
      const styles = resolveStyles(el, bpId)
      const parentId = findParentId(artboard, el.id)
      return JSON.stringify({
        id: el.id,
        name: el.name,
        type: el.type,
        positionMode: el.positionMode,
        parentId,
        styles: summarizeStyles(styles),
        children: el.children,
        ...(el.content !== undefined ? { content: el.content } : {}),
        ...(el.src !== undefined ? { src: el.src } : {}),
        ...(el.alt !== undefined ? { alt: el.alt } : {}),
      })
    }

    case 'list_elements': {
      const list = Object.values(artboard.elements).map((el: CanvasElement) => ({
        id: el.id,
        name: el.name,
        type: el.type,
        parentId: findParentId(artboard, el.id),
        childCount: el.children.length,
      }))
      return JSON.stringify(list)
    }

    case 'add_element': {
      const type = args.type as ElementType
      const parentId = (args.parentId as string) || null
      store.addElement(artboardId, type, parentId)

      // Find the newly created element (last added)
      const updated = useEditorStore.getState()
      const updatedAb = updated.project?.artboards[artboardId]
      if (!updatedAb) return JSON.stringify({ error: 'Failed to add' })

      const newIds = Object.keys(updatedAb.elements).filter(
        (id) => !artboard.elements[id],
      )
      const newId = newIds[0]
      if (!newId) return JSON.stringify({ error: 'Element not created' })

      // Apply extra styles/content/name/positionMode if given
      const patch: Partial<CanvasElement> = {}
      if (args.styles) patch.styles = { ...updatedAb.elements[newId].styles, ...(args.styles as Partial<ElementStyles>) }
      if (args.positionMode) patch.positionMode = args.positionMode as CanvasElement['positionMode']
      if (args.content) patch.content = args.content as string
      if (args.name) patch.name = args.name as string

      if (Object.keys(patch).length > 0) {
        store.updateElement(artboardId, newId, patch)
      }

      return JSON.stringify({ ok: true, elementId: newId })
    }

    case 'update_element': {
      const elId = args.elementId as string
      if (!artboard.elements[elId]) return JSON.stringify({ error: 'Element not found' })
      const patch: Partial<CanvasElement> = {}
      if (args.styles) patch.styles = { ...artboard.elements[elId].styles, ...(args.styles as Partial<ElementStyles>) }
      if (args.positionMode) patch.positionMode = args.positionMode as CanvasElement['positionMode']
      if (args.content !== undefined) patch.content = args.content as string
      if (args.name !== undefined) patch.name = args.name as string
      if (args.src !== undefined) patch.src = args.src as string
      if (args.alt !== undefined) patch.alt = args.alt as string

      store.updateElement(artboardId, elId, patch)
      return JSON.stringify({ ok: true })
    }

    case 'delete_element': {
      const elId = args.elementId as string
      if (!artboard.elements[elId]) return JSON.stringify({ error: 'Element not found' })
      store.deleteElement(artboardId, elId)
      return JSON.stringify({ ok: true })
    }

    case 'select_element': {
      store.selectElement((args.elementId as string) || null)
      return JSON.stringify({ ok: true })
    }

    case 'move_element': {
      const elId = args.elementId as string
      const newParentId = args.newParentId as string
      const index = typeof args.index === 'number' ? args.index : -1
      if (!artboard.elements[elId]) return JSON.stringify({ error: 'Element not found' })
      if (!artboard.elements[newParentId]) return JSON.stringify({ error: 'Parent not found' })
      const targetChildren = artboard.elements[newParentId].children
      const idx = index >= 0 ? index : targetChildren.length
      store.moveElement(artboardId, elId, newParentId, idx)
      return JSON.stringify({ ok: true })
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}
