export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light'
  | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'

export type GradientStop = { color: string; position: number }  // hex, 0..1
export type ScaleMode = 'fill' | 'fit' | 'tile'

export type SolidFill = {
  id: string
  type: 'solid'
  color: string            // hex
  opacity: number          // 0..1
  visible: boolean
  blendMode: BlendMode
}

export type GradientFill = {
  id: string
  type: 'gradient'
  gradientType: 'linear' | 'radial'
  angle: number            // deg
  stops: GradientStop[]
  opacity: number
  visible: boolean
  blendMode: BlendMode
}

export type ImageFill = {
  id: string
  type: 'image'
  url: string
  scaleMode: ScaleMode
  opacity: number
  visible: boolean
  blendMode: BlendMode
}

export type Fill = SolidFill | GradientFill | ImageFill

export function createSolidFill(color = '#cccccc'): SolidFill {
  return {
    id: crypto.randomUUID(),
    type: 'solid',
    color,
    opacity: 1,
    visible: true,
    blendMode: 'normal',
  }
}

export function createGradientFill(): GradientFill {
  return {
    id: crypto.randomUUID(),
    type: 'gradient',
    gradientType: 'linear',
    angle: 180,
    stops: [
      { color: '#000000', position: 0 },
      { color: '#ffffff', position: 1 },
    ],
    opacity: 1,
    visible: true,
    blendMode: 'normal',
  }
}

export function createImageFill(url = ''): ImageFill {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    url,
    scaleMode: 'fill',
    opacity: 1,
    visible: true,
    blendMode: 'normal',
  }
}
