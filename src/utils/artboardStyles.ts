/**
 * Pure logic for artboard visual styles (outline, label).
 * Extracted from CanvasEditor JSX for testability.
 */

export function getArtboardOutline(
  isActive: boolean,
  isSelected: boolean,
): string | undefined {
  if (isActive) return '1px solid #0a0a0a'
  if (isSelected) return '2px solid #0066ff'
  return undefined
}

export function getArtboardLabelColor(isActive: boolean): string {
  return isActive ? '#0a0a0a' : '#555'
}

export function getArtboardLabelWeight(isActive: boolean): number {
  return isActive ? 600 : 400
}
