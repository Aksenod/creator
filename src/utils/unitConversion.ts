import type { CssUnit } from '../components/Properties/shared/FigmaInput'

export type ConvertRef = {
  percentBase: number  // parent width/height in px (for %)
  vwBase: number       // artboard width (for vw)
  vhBase: number       // artboard height (for vh)
}

/**
 * Convert a numeric value between CSS units.
 * Strategy: from → px → to
 */
export function convertCssUnit(num: number, from: CssUnit, to: CssUnit, ref: ConvertRef): number {
  if (from === to) return num

  // Step 1: from → px
  let px: number
  switch (from) {
    case 'px': px = num; break
    case '%':  px = num * ref.percentBase / 100; break
    case 'vw': px = num * ref.vwBase / 100; break
    case 'vh': px = num * ref.vhBase / 100; break
    default:   px = num
  }

  // Step 2: px → to
  let result: number
  switch (to) {
    case 'px': result = px; break
    case '%':  result = ref.percentBase ? px / ref.percentBase * 100 : px; break
    case 'vw': result = ref.vwBase ? px / ref.vwBase * 100 : px; break
    case 'vh': result = ref.vhBase ? px / ref.vhBase * 100 : px; break
    default:   result = px
  }

  // Rounding: px → integers, %/vw/vh → 2 decimal places
  if (to === 'px') {
    return Math.round(result)
  }
  return Math.round(result * 100) / 100
}

/**
 * Get parent element's pixel size by querying the DOM.
 * Returns null if the element or parent is not found.
 */
export function getParentPixelSize(
  elementId: string,
  artboardWidth: number,
): { width: number; height: number } | null {
  const el = document.querySelector(`[data-element-id="${elementId}"]`)
  if (!el) return null

  const parent = el.parentElement
  if (!parent) return null

  const artboardEl = el.closest('[data-testid="artboard-frame"]')
  if (!artboardEl) return null

  const artboardRect = artboardEl.getBoundingClientRect()
  const scale = artboardRect.width / artboardWidth
  if (!scale || scale <= 0) return null

  const parentRect = parent.getBoundingClientRect()
  return {
    width: parentRect.width / scale,
    height: parentRect.height / scale,
  }
}

/**
 * Get the element's own computed pixel size by querying the DOM.
 * Used when converting from auto → numeric unit.
 */
export function getElementPixelSize(
  elementId: string,
  artboardWidth: number,
): { width: number; height: number } | null {
  const el = document.querySelector(`[data-element-id="${elementId}"]`)
  if (!el) return null

  const artboardEl = el.closest('[data-testid="artboard-frame"]')
  if (!artboardEl) return null

  const artboardRect = artboardEl.getBoundingClientRect()
  const scale = artboardRect.width / artboardWidth
  if (!scale || scale <= 0) return null

  const elRect = (el as HTMLElement).getBoundingClientRect()
  return {
    width: Math.round(elRect.width / scale),
    height: Math.round(elRect.height / scale),
  }
}
