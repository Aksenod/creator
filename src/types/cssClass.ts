import type { ElementStyles } from './index'
import type { BreakpointId } from '../constants/breakpoints'

export type CSSClass = {
  id: string
  name: string
  styles: Partial<ElementStyles>
  breakpointStyles?: Partial<Record<BreakpointId, Partial<ElementStyles>>>
  createdAt: number
  updatedAt: number
}
