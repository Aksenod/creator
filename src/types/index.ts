export type { BreakpointId } from '../constants/breakpoints'

// Режим позиционирования элемента
export type PositionMode = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'

// Привязка для pinned-элементов
export type PinAnchor = {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

// CSS-свойства элемента
export type ElementStyles = {
  width?: string
  height?: string
  minWidth?: string
  minHeight?: string
  maxWidth?: string
  maxHeight?: string
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-block' | 'none'
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  gap?: number
  gridTemplateColumns?: string
  gridTemplateRows?: string
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around'
  justifyItems?: 'start' | 'end' | 'center' | 'stretch'
  columnGap?: number
  rowGap?: number

  // Grid container
  gridAutoFlow?: 'row' | 'column' | 'row dense' | 'column dense'

  // Grid child
  gridColumn?: string        // e.g. "1 / 3", "span 2", "1 / -1"
  gridRow?: string           // e.g. "1 / 2", "span 1"
  alignSelf?: 'auto' | 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  justifySelf?: 'auto' | 'start' | 'end' | 'center' | 'stretch'

  backgroundColor?: string
  color?: string
  fontSize?: number
  fontWeight?: string
  lineHeight?: number
  borderWidth?: number
  borderColor?: string
  borderStyle?: string
  borderRadius?: number
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'

  // Position offsets (top/right/bottom/left in px, for relative/absolute/fixed/sticky)
  top?: number
  right?: number
  bottom?: number
  left?: number
  zIndex?: number

  // Typography
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: 'none' | 'line-through' | 'underline' | 'overline'
  letterSpacing?: number
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'

  // Background
  backgroundImage?: string
  backgroundClip?: 'border-box' | 'padding-box' | 'content-box' | 'text'

  // Borders (individual sides)
  borderTopWidth?: number
  borderRightWidth?: number
  borderBottomWidth?: number
  borderLeftWidth?: number
  borderTopLeftRadius?: number
  borderTopRightRadius?: number
  borderBottomRightRadius?: number
  borderBottomLeftRadius?: number
}

// Тип элемента
export type ElementType = 'div' | 'text' | 'image' | 'section' | 'button' | 'input' | 'body'

// Элемент на canvas
export type CanvasElement = {
  id: string
  name: string
  className?: string  // CSS-класс (slug из имени или переопределённый вручную)
  type: ElementType
  positionMode: PositionMode
  pin?: PinAnchor
  styles: ElementStyles  // Base (Desktop) стили
  // Переопределения для конкретных брейкпоинтов (только delta, не полная копия)
  // Cascade: base → laptop → tablet → mobile
  breakpointStyles?: Partial<Record<import('../constants/breakpoints').BreakpointId, Partial<ElementStyles>>>
  children: string[] // id дочерних элементов
  content?: string   // для text/button
}

// Артборд (страница)
export type Artboard = {
  id: string
  name: string
  width: number
  height: number
  x: number // позиция на bird's eye холсте
  y: number
  elements: Record<string, CanvasElement>
  rootChildren: string[] // корневые элементы страницы
}

// Проект
export type Project = {
  id: string
  name: string
  artboards: Record<string, Artboard>
  artboardOrder: string[]
}

// Режим редактора
export type EditorMode = 'birdseye' | 'page'
