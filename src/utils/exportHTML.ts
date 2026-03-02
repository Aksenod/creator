import type { Artboard, CanvasElement, ElementStyles } from '../types'
import type { Fill } from '../types/fills'
import { BREAKPOINT_ORDER, BREAKPOINT_WIDTHS, type BreakpointId } from '../constants/breakpoints'
import { hexToRgb } from './colorUtils'
import { migrateFills } from './fillUtils'

// camelCase → kebab-case: "backgroundColor" → "background-color"
function toKebab(prop: string): string {
  return prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase())
}

// Свойства, которые нужно пропустить (editor-only)
const SKIP_PROPS = new Set<string>([
  'outline', 'outlineOffset', 'boxShadow', 'cursor', 'opacity',
])

// Свойства, где значение в px (числовое)
const PX_PROPS = new Set<string>([
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'fontSize', 'gap', 'columnGap', 'rowGap',
  'borderWidth', 'borderRadius', 'borderTopWidth', 'borderRightWidth',
  'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius',
  'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
  'zIndex', 'letterSpacing',
  'lineHeight',
])

// Свойства, значение которых — строка (передаются as-is)
const STRING_PROPS = new Set<string>([
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems',
  'gridTemplateColumns', 'gridTemplateRows', 'gridAutoFlow',
  'gridColumn', 'gridRow', 'alignSelf', 'justifySelf', 'alignContent', 'justifyItems',
  'backgroundColor', 'color', 'fontWeight', 'fontFamily', 'textAlign',
  'textDecoration', 'textTransform', 'borderColor', 'borderStyle',
  'overflow', 'backgroundImage', 'backgroundClip',
  'objectFit', 'objectPosition',
  'top', 'right', 'bottom', 'left',
])

/**
 * Конвертирует fills[] в CSS-декларации для экспорта.
 */
function fillsToCSSDecls(fills: Fill[]): string[] {
  const visible = fills.filter(f => f.visible)
  if (visible.length === 0) return []

  const images: string[] = []
  const sizes: string[] = []
  const positions: string[] = []
  const repeats: string[] = []

  for (const fill of visible) {
    switch (fill.type) {
      case 'solid': {
        const { r, g, b } = hexToRgb(fill.color)
        const a = fill.opacity
        images.push(`linear-gradient(rgba(${r},${g},${b},${a}), rgba(${r},${g},${b},${a}))`)
        sizes.push('auto')
        positions.push('initial')
        repeats.push('repeat')
        break
      }
      case 'gradient': {
        const stops = fill.stops.map(s => {
          const { r, g, b } = hexToRgb(s.color)
          return `rgba(${r},${g},${b},${fill.opacity}) ${Math.round(s.position * 100)}%`
        }).join(', ')
        images.push(fill.gradientType === 'radial'
          ? `radial-gradient(circle, ${stops})`
          : `linear-gradient(${fill.angle}deg, ${stops})`)
        sizes.push('auto')
        positions.push('initial')
        repeats.push('repeat')
        break
      }
      case 'image': {
        images.push(`url(${fill.url})`)
        sizes.push(fill.scaleMode === 'fill' ? 'cover' : fill.scaleMode === 'fit' ? 'contain' : 'auto')
        positions.push('center')
        repeats.push(fill.scaleMode === 'tile' ? 'repeat' : 'no-repeat')
        break
      }
    }
  }

  const decls: string[] = []
  decls.push(`background-image: ${images.join(', ')};`)
  decls.push(`background-size: ${sizes.join(', ')};`)
  decls.push(`background-position: ${positions.join(', ')};`)
  decls.push(`background-repeat: ${repeats.join(', ')};`)
  return decls
}

/**
 * Конвертирует ElementStyles в набор CSS-деклараций.
 * Возвращает массив строк вида "property: value;"
 */
function stylesToCSS(
  styles: Partial<ElementStyles>,
  positionMode?: string,
): string[] {
  const decls: string[] = []

  // Position
  if (positionMode && positionMode !== 'static') {
    decls.push(`position: ${positionMode};`)
  }

  // Fills (новая система) — приоритет над backgroundColor
  const fills = migrateFills(styles)
  const hasFills = fills && fills.some(f => f.visible)
  if (hasFills) {
    decls.push(...fillsToCSSDecls(fills!))
  }

  // Padding shorthand
  if (styles.paddingTop !== undefined || styles.paddingRight !== undefined ||
      styles.paddingBottom !== undefined || styles.paddingLeft !== undefined) {
    const t = styles.paddingTop ?? 0
    const r = styles.paddingRight ?? 0
    const b = styles.paddingBottom ?? 0
    const l = styles.paddingLeft ?? 0
    decls.push(`padding: ${t}px ${r}px ${b}px ${l}px;`)
  }

  // Margin shorthand
  if (styles.marginTop !== undefined || styles.marginRight !== undefined ||
      styles.marginBottom !== undefined || styles.marginLeft !== undefined) {
    const t = styles.marginTop ?? 0
    const r = styles.marginRight ?? 0
    const b = styles.marginBottom ?? 0
    const l = styles.marginLeft ?? 0
    decls.push(`margin: ${t}px ${r}px ${b}px ${l}px;`)
  }

  // Обрабатываемые через shorthand — не дублировать поштучно
  const handled = new Set([
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  ])

  // Если fills обработаны — пропускаем backgroundColor и backgroundImage
  if (hasFills) {
    handled.add('backgroundColor')
    handled.add('backgroundImage')
    handled.add('fills')
  }

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) continue
    if (SKIP_PROPS.has(key)) continue
    if (handled.has(key)) continue

    const cssProp = toKebab(key)

    if (STRING_PROPS.has(key)) {
      decls.push(`${cssProp}: ${value};`)
    } else if (PX_PROPS.has(key)) {
      // zIndex без px
      if (key === 'zIndex') {
        decls.push(`${cssProp}: ${value};`)
      } else {
        decls.push(`${cssProp}: ${value}px;`)
      }
    }
  }

  return decls
}

/**
 * Конвертирует breakpointStyles delta в CSS-декларации.
 * Для padding/margin — если хоть одна сторона переопределена, нужен полный shorthand
 * с учётом resolved значений на этом брейкпоинте.
 */
function bpDeltaToCSS(
  delta: Partial<ElementStyles>,
  resolvedAtBp: ElementStyles,
): string[] {
  const decls: string[] = []

  const paddingKeys = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const
  const marginKeys = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const

  const hasPadding = paddingKeys.some(k => delta[k] !== undefined)
  const hasMargin = marginKeys.some(k => delta[k] !== undefined)

  if (hasPadding) {
    const t = resolvedAtBp.paddingTop ?? 0
    const r = resolvedAtBp.paddingRight ?? 0
    const b = resolvedAtBp.paddingBottom ?? 0
    const l = resolvedAtBp.paddingLeft ?? 0
    decls.push(`padding: ${t}px ${r}px ${b}px ${l}px;`)
  }

  if (hasMargin) {
    const t = resolvedAtBp.marginTop ?? 0
    const r = resolvedAtBp.marginRight ?? 0
    const b = resolvedAtBp.marginBottom ?? 0
    const l = resolvedAtBp.marginLeft ?? 0
    decls.push(`margin: ${t}px ${r}px ${b}px ${l}px;`)
  }

  const handled = new Set<string>([
    ...paddingKeys, ...marginKeys,
  ])

  for (const [key, value] of Object.entries(delta)) {
    if (value === undefined || value === null) continue
    if (SKIP_PROPS.has(key)) continue
    if (handled.has(key)) continue

    const cssProp = toKebab(key)

    if (STRING_PROPS.has(key)) {
      decls.push(`${cssProp}: ${value};`)
    } else if (PX_PROPS.has(key)) {
      if (key === 'zIndex') {
        decls.push(`${cssProp}: ${value};`)
      } else {
        decls.push(`${cssProp}: ${value}px;`)
      }
    }
  }

  return decls
}

/** HTML-тег по типу элемента */
function tagForType(type: string): string {
  switch (type) {
    case 'section': return 'section'
    case 'button': return 'button'
    case 'text': return 'p'
    case 'image': return 'img'
    default: return 'div'
  }
}

/** Escape HTML */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Генерирует standalone HTML-файл из артборда.
 */
export function exportArtboardHTML(artboard: Artboard): string {
  // --- Первый проход: построить маппинг elementId → уникальный CSS-класс ---
  const classMap = new Map<string, string>()
  const usedNames = new Map<string, number>() // baseName → сколько раз встретился

  function buildClassMap(el: CanvasElement) {
    if (el.hidden) return

    const baseName = el.className || `el-${el.id}`
    const count = usedNames.get(baseName) ?? 0
    usedNames.set(baseName, count + 1)

    // Первое вхождение — без суффикса, далее -2, -3, ...
    const uniqueName = count === 0 ? baseName : `${baseName}-${count + 1}`
    classMap.set(el.id, uniqueName)

    for (const childId of el.children) {
      const child = artboard.elements[childId]
      if (child) buildClassMap(child)
    }
  }

  for (const rootId of artboard.rootChildren) {
    const el = artboard.elements[rootId]
    if (el) buildClassMap(el)
  }

  function cssClass(el: CanvasElement): string {
    return classMap.get(el.id) ?? `el-${el.id}`
  }

  const cssRules: string[] = []
  const mediaRules: Record<BreakpointId, string[]> = {
    desktop: [],
    laptop: [],
    tablet: [],
    mobile: [],
  }

  // Рекурсивная генерация CSS для каждого элемента
  function collectCSS(el: CanvasElement) {
    if (el.hidden) return

    const cls = cssClass(el)

    // Base (desktop) стили
    // Body needs position:relative so absolute children position correctly
    const effectivePosition = el.type === 'body' && el.positionMode === 'static'
      ? 'relative'
      : el.positionMode
    const baseDecls = stylesToCSS(el.styles, effectivePosition)
    if (baseDecls.length > 0) {
      cssRules.push(`.${cls} { ${baseDecls.join(' ')} }`)
    }

    // Breakpoint overrides (пропускаем desktop — он base)
    for (const bpId of BREAKPOINT_ORDER.slice(1)) {
      const delta = el.breakpointStyles?.[bpId]
      if (!delta || Object.keys(delta).length === 0) continue

      // Для padding/margin shorthand нам нужны resolved значения
      const resolved = resolveStylesForBp(el, bpId)
      const bpDecls = bpDeltaToCSS(delta, resolved)
      if (bpDecls.length > 0) {
        mediaRules[bpId].push(`.${cls} { ${bpDecls.join(' ')} }`)
      }
    }

    // Рекурсия по детям
    for (const childId of el.children) {
      const child = artboard.elements[childId]
      if (child) collectCSS(child)
    }
  }

  // Простое разрешение стилей для конкретного BP (без зависимости от resolveStyles)
  function resolveStylesForBp(el: CanvasElement, bpId: BreakpointId): ElementStyles {
    const base = { ...el.styles }
    if (!el.breakpointStyles) return base

    const order = BREAKPOINT_ORDER
    const idx = order.indexOf(bpId)
    let resolved = base
    for (let i = 1; i <= idx; i++) {
      const override = el.breakpointStyles[order[i]]
      if (override) resolved = { ...resolved, ...override }
    }
    return resolved
  }

  // Рекурсивная генерация HTML
  function renderHTML(el: CanvasElement, indent: string): string {
    if (el.hidden) return ''

    const tag = tagForType(el.type)
    const cls = cssClass(el)

    // Image с src → self-closing <img>
    if (el.type === 'image' && el.src) {
      const srcAttr = ` src="${esc(el.src)}"`
      const altAttr = ` alt="${esc(el.alt || '')}"`
      return `${indent}<img class="${cls}"${srcAttr}${altAttr} />`
    }

    const open = `${indent}<${tag} class="${cls}">`

    // Контент + дети
    const childParts: string[] = []

    if (el.content) {
      childParts.push(`${indent}  ${esc(el.content)}`)
    }

    for (const childId of el.children) {
      const child = artboard.elements[childId]
      if (child) {
        const html = renderHTML(child, indent + '  ')
        if (html) childParts.push(html)
      }
    }

    if (childParts.length === 0) {
      return `${indent}<${tag} class="${cls}"></${tag}>`
    }

    return `${open}\n${childParts.join('\n')}\n${indent}</${tag}>`
  }

  // Собираем CSS
  for (const rootId of artboard.rootChildren) {
    const el = artboard.elements[rootId]
    if (el) collectCSS(el)
  }

  // Собираем HTML body
  const bodyParts: string[] = []
  for (const rootId of artboard.rootChildren) {
    const el = artboard.elements[rootId]
    if (el) {
      const html = renderHTML(el, '  ')
      if (html) bodyParts.push(html)
    }
  }

  // Собираем @media блоки
  const mediaSections: string[] = []
  for (const bpId of BREAKPOINT_ORDER.slice(1)) {
    const rules = mediaRules[bpId]
    if (rules.length === 0) continue
    mediaSections.push(
      `    @media (max-width: ${BREAKPOINT_WIDTHS[bpId]}px) {\n` +
      rules.map(r => `      ${r}`).join('\n') + '\n' +
      `    }`
    )
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(artboard.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
${cssRules.map(r => `    ${r}`).join('\n')}
${mediaSections.join('\n')}
  </style>
</head>
<body>
${bodyParts.join('\n')}
</body>
</html>
`
}

/**
 * Открывает HTML в новой вкладке браузера через blob URL.
 */
export function previewHTML(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

/**
 * Скачивает строку как файл.
 */
export function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
