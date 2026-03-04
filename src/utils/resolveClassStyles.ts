import type { CSSClass } from '../types/cssClass'
import type { CanvasElement, ElementStyles } from '../types'
import type { BreakpointId } from '../constants/breakpoints'
import { getCascadeChain } from '../constants/breakpoints'

/**
 * Мержит стили из нескольких CSS-классов (в порядке classIds).
 * Для заданного breakpoint: сначала base стили класса, потом cascade overrides.
 */
export function mergeClassStyles(
  classes: CSSClass[],
  bpId: BreakpointId,
): Partial<ElementStyles> {
  if (classes.length === 0) return {}

  let merged: Partial<ElementStyles> = {}

  for (const cls of classes) {
    // Base styles
    merged = { ...merged, ...cls.styles }

    // Breakpoint cascade
    if (bpId !== 'desktop' && cls.breakpointStyles) {
      const chain = getCascadeChain(bpId)
      for (const chainBpId of chain) {
        const override = cls.breakpointStyles[chainBpId]
        if (override) merged = { ...merged, ...override }
      }
    }
  }

  return merged
}

/**
 * Определяет источник свойства для visual indicators.
 * Webflow model:
 * - 'class' — value comes from CSS class (when element has classes)
 * - 'local' — value from inline styles (only when element has NO classes)
 * - 'none' — property not set
 */
export function getPropertySource(
  el: CanvasElement,
  prop: keyof ElementStyles,
  bpId: BreakpointId,
  cssClasses?: Record<string, CSSClass>,
): 'class' | 'local' | 'none' {
  const hasClasses = cssClasses && el.classIds && el.classIds.length > 0

  if (hasClasses) {
    // Webflow model: all styles from classes
    const classes = el.classIds!
      .map(id => cssClasses![id])
      .filter((c): c is CSSClass => c != null)

    if (classes.length > 0) {
      const classStyles = mergeClassStyles(classes, bpId)
      if (classStyles[prop] !== undefined) return 'class'
    }
    return 'none'
  }

  // No classes — check inline styles
  const hasLocalBase = el.styles[prop] !== undefined
  const hasLocalBp = bpId !== 'desktop' && el.breakpointStyles?.[bpId]?.[prop] !== undefined
  if (hasLocalBase || hasLocalBp) return 'local'

  return 'none'
}
