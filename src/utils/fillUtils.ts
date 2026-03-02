import type { Fill, SolidFill, GradientFill, ImageFill } from '../types/fills'
import { createSolidFill } from '../types/fills'
import type { ElementStyles } from '../types'
import { hexToRgb } from './colorUtils'

/** Ленивая миграция: backgroundColor → fills[] */
export function migrateFills(styles: Partial<ElementStyles>): Fill[] | undefined {
  if (styles.fills && styles.fills.length > 0) return styles.fills
  if (styles.backgroundColor) {
    return [createSolidFill(styles.backgroundColor)]
  }
  return undefined
}

// ─── Внутренние хелперы ─────────────────────────────────────────────────────

function solidToLayer(fill: SolidFill): string {
  const { r, g, b } = hexToRgb(fill.color)
  const a = fill.opacity
  return `linear-gradient(rgba(${r},${g},${b},${a}), rgba(${r},${g},${b},${a}))`
}

function gradientStopsCSS(stops: GradientFill['stops'], opacity: number): string {
  return stops.map(s => {
    const { r, g, b } = hexToRgb(s.color)
    return `rgba(${r},${g},${b},${opacity}) ${Math.round(s.position * 100)}%`
  }).join(', ')
}

function gradientToLayer(fill: GradientFill): string {
  const stops = gradientStopsCSS(fill.stops, fill.opacity)
  if (fill.gradientType === 'radial') {
    return `radial-gradient(circle, ${stops})`
  }
  return `linear-gradient(${fill.angle}deg, ${stops})`
}

function imageToLayer(fill: ImageFill): string {
  return `url(${fill.url})`
}

function imageToSize(fill: ImageFill): string {
  switch (fill.scaleMode) {
    case 'fill': return 'cover'
    case 'fit': return 'contain'
    case 'tile': return 'auto'
  }
}

function imageToRepeat(fill: ImageFill): string {
  return fill.scaleMode === 'tile' ? 'repeat' : 'no-repeat'
}

// ─── Основная функция ───────────────────────────────────────────────────────

export function fillsToCSS(
  fills: Fill[] | undefined,
  fallbackBg?: string,
): React.CSSProperties {
  if (!fills || fills.length === 0) {
    return fallbackBg ? { backgroundColor: fallbackBg } : {}
  }

  const visible = fills.filter(f => f.visible)
  if (visible.length === 0) {
    return { backgroundColor: undefined }
  }

  const images: string[] = []
  const sizes: string[] = []
  const positions: string[] = []
  const repeats: string[] = []
  const blends: string[] = []

  for (const fill of visible) {
    switch (fill.type) {
      case 'solid':
        images.push(solidToLayer(fill))
        sizes.push('auto')
        positions.push('initial')
        repeats.push('repeat')
        blends.push(fill.blendMode)
        break
      case 'gradient':
        images.push(gradientToLayer(fill))
        sizes.push('auto')
        positions.push('initial')
        repeats.push('repeat')
        blends.push(fill.blendMode)
        break
      case 'image':
        images.push(imageToLayer(fill))
        sizes.push(imageToSize(fill))
        positions.push('center')
        repeats.push(imageToRepeat(fill))
        blends.push(fill.blendMode)
        break
    }
  }

  return {
    backgroundColor: undefined,
    backgroundImage: images.join(', '),
    backgroundSize: sizes.join(', '),
    backgroundPosition: positions.join(', '),
    backgroundRepeat: repeats.join(', '),
    backgroundBlendMode: blends.join(', ') as React.CSSProperties['backgroundBlendMode'],
  }
}
