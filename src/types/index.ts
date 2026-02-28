// Режим позиционирования элемента
export type PositionMode = 'flow' | 'pinned'

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
}

// Тип элемента
export type ElementType = 'div' | 'text' | 'image' | 'section' | 'button' | 'input'

// Элемент на canvas
export type CanvasElement = {
  id: string
  name: string
  type: ElementType
  positionMode: PositionMode
  pin?: PinAnchor
  styles: ElementStyles
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
