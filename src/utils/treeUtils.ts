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
