import type { Project, CanvasElement, ElementStyles } from '../types'
import type { BreakpointId } from '../constants/breakpoints'

export const generateId = () => Math.random().toString(36).slice(2, 10)

const HISTORY_MAX_SIZE = 50

// Типы-контейнеры, которые принимают дочерние элементы
export const CONTAINER_TYPES = ['div', 'section', 'body'] as const

// Сохранить текущий проект в историю и вернуть обновлённые поля
export const pushHistory = (
  history: Project[],
  historyIndex: number,
  currentProject: Project,
  newProject: Project,
) => {
  const newHistory = [...history.slice(0, historyIndex + 1), currentProject].slice(-HISTORY_MAX_SIZE)
  return {
    project: newProject,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }
}

// Применить обновление стилей с учётом активного BP
export const applyStyleUpdate = (
  el: CanvasElement,
  stylesPatch: Partial<ElementStyles>,
  activeBpId: BreakpointId,
  extraProps: Partial<CanvasElement> = {},
): CanvasElement => {
  if (activeBpId !== 'desktop') {
    return {
      ...el,
      ...extraProps,
      breakpointStyles: {
        ...el.breakpointStyles,
        [activeBpId]: {
          ...(el.breakpointStyles?.[activeBpId] ?? {}),
          ...stylesPatch,
        },
      },
    }
  }
  return {
    ...el,
    ...extraProps,
    styles: { ...el.styles, ...stylesPatch },
  }
}

