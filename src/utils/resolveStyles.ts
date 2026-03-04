import type { CanvasElement, ElementStyles } from '../types'
import type { CSSClass } from '../types/cssClass'
import { type BreakpointId, getCascadeChain } from '../constants/breakpoints'
import { mergeClassStyles } from './resolveClassStyles'

/**
 * Возвращает эффективные стили элемента для данного брейкпоинта.
 *
 * Webflow model:
 * - Element WITH classes: styles come ONLY from classes (el.styles ignored)
 * - Element WITHOUT classes: styles from el.styles (backward compat)
 *
 * Without cssClasses param — поведение идентично текущему (backward compat).
 */
export function resolveStyles(
  el: CanvasElement,
  activeBpId: BreakpointId,
  cssClasses?: Record<string, CSSClass>,
): ElementStyles {
  const hasClasses = cssClasses && el.classIds && el.classIds.length > 0

  let base: ElementStyles

  if (hasClasses) {
    // Webflow model: only class styles, no local overrides
    const classes = el.classIds!
      .map(id => cssClasses![id])
      .filter((c): c is CSSClass => c != null)
    base = classes.length > 0
      ? (mergeClassStyles(classes, activeBpId) as ElementStyles)
      : { ...el.styles }
  } else {
    // No classes — inline styles (legacy/backward compat)
    base = { ...el.styles }
  }

  if (activeBpId === 'desktop' || !el.breakpointStyles) return base

  // Breakpoint cascade only for elements without classes
  // (class breakpoint styles are already resolved in mergeClassStyles)
  if (hasClasses) return base

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
