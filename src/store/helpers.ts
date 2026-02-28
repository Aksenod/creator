import type { Project, Artboard, CanvasElement, ElementStyles } from '../types'
import type { BreakpointId } from '../constants/breakpoints'

export const generateId = () => Math.random().toString(36).slice(2, 10)

export const HISTORY_MAX_SIZE = 50

// Типы-контейнеры, которые принимают дочерние элементы
export const CONTAINER_TYPES = ['div', 'section'] as const

// Найти родителя элемента (null = корень артборда)
export const findParentId = (ab: Artboard, id: string): string | null => {
  if (ab.rootChildren.includes(id)) return null
  for (const [pid, pel] of Object.entries(ab.elements)) {
    if (pel.children.includes(id)) return pid
  }
  return null
}

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

// Рекурсивно собрать все id потомков (включая сам id)
export const collectDescendantIds = (
  elements: Record<string, CanvasElement>,
  id: string,
): Set<string> => {
  const result = new Set<string>()
  const collect = (eid: string) => {
    result.add(eid)
    elements[eid]?.children.forEach(collect)
  }
  collect(id)
  return result
}
