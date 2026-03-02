import type { Artboard, CanvasElement } from '../types'

// Найти родителя элемента (null = корень артборда)
export const findParentId = (ab: Artboard, id: string): string | null => {
  if (ab.rootChildren.includes(id)) return null
  for (const [pid, pel] of Object.entries(ab.elements)) {
    if (pel.children.includes(id)) return pid
  }
  return null
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

// Проверить, является ли candidateId потомком ancestorId
export const isDescendantOf = (
  elements: Record<string, CanvasElement>,
  candidateId: string,
  ancestorId: string,
): boolean => {
  return collectDescendantIds(elements, ancestorId).has(candidateId)
}

// Получить список siblings и позицию элемента среди них
export const getSiblingInfo = (
  ab: Artboard,
  id: string,
): { siblings: string[]; index: number } | null => {
  // Проверяем rootChildren
  const rootIdx = ab.rootChildren.indexOf(id)
  if (rootIdx !== -1) return { siblings: ab.rootChildren, index: rootIdx }
  // Ищем среди children элементов
  for (const el of Object.values(ab.elements)) {
    const idx = el.children.indexOf(id)
    if (idx !== -1) return { siblings: el.children, index: idx }
  }
  return null
}

// Плоский список видимых слоёв в порядке дерева (для Tab-навигации при inline rename)
export const getVisibleLayerIds = (
  artboard: Artboard,
  expandedLayers: Set<string>,
): string[] => {
  const result: string[] = []
  const walk = (ids: string[]) => {
    for (const id of ids) {
      const el = artboard.elements[id]
      if (!el) continue
      result.push(id)
      if (el.children.length > 0 && expandedLayers.has(id)) {
        walk(el.children)
      }
    }
  }
  walk(artboard.rootChildren)
  return result
}
