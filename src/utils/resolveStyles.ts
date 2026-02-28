import type { CanvasElement, ElementStyles } from '../types'
import { type BreakpointId, getCascadeChain } from '../constants/breakpoints'

/**
 * Возвращает эффективные стили элемента для данного брейкпоинта.
 * Cascade: base (desktop) → laptop overrides → tablet overrides → mobile overrides
 *
 * Пример: element.styles = { width: '200px' }
 *         element.breakpointStyles = { tablet: { width: '100%' } }
 *         resolveStyles(el, 'tablet')  → { ...base, width: '100%' }
 *         resolveStyles(el, 'mobile') → { ...base, width: '100%' }  (наследует tablet)
 *         resolveStyles(el, 'desktop') → { ...base }
 */
export function resolveStyles(el: CanvasElement, activeBpId: BreakpointId): ElementStyles {
  const base = el.styles
  if (activeBpId === 'desktop' || !el.breakpointStyles) return base

  const chain = getCascadeChain(activeBpId)
  let resolved: ElementStyles = { ...base }
  for (const bpId of chain) {
    const override = el.breakpointStyles[bpId]
    if (override) resolved = { ...resolved, ...override }
  }
  return resolved
}

/**
 * Проверяет, переопределено ли свойство именно на текущем BP (синий индикатор).
 */
export function isOverriddenOnBp(
  el: CanvasElement,
  prop: keyof ElementStyles,
  bpId: BreakpointId,
): boolean {
  if (bpId === 'desktop') return false
  return el.breakpointStyles?.[bpId]?.[prop] !== undefined
}

/**
 * Проверяет, унаследовано ли свойство от вышестоящего BP (оранжевый индикатор).
 * true = задано на base или промежуточном BP, но не на текущем.
 */
export function isInheritedFromBp(
  el: CanvasElement,
  prop: keyof ElementStyles,
  bpId: BreakpointId,
): boolean {
  if (bpId === 'desktop') return false
  if (isOverriddenOnBp(el, prop, bpId)) return false

  // Задано на base?
  if (el.styles[prop] !== undefined) return true

  // Задано на промежуточном BP в цепочке?
  const chain = getCascadeChain(bpId)
  return chain.slice(0, -1).some(id => el.breakpointStyles?.[id]?.[prop] !== undefined)
}
