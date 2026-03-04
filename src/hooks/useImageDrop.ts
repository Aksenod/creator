import { useEffect } from 'react'
import { useEditorStore } from '../store'

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 200, height: 150 })
    img.src = src
  })
}

export function constrainDimensions(w: number, h: number, maxSize = 800): { width: number; height: number } {
  if (w <= maxSize && h <= maxSize) return { width: w, height: h }
  const ratio = Math.min(maxSize / w, maxSize / h)
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

async function addImageFromFile(file: File) {
  const state = useEditorStore.getState()
  let abId = state.activeArtboardId
  if (!abId && state.project) {
    abId = state.project.artboardOrder[0] ?? null
    if (abId) state.setActiveArtboard(abId)
  }
  if (!abId) return
  const src = await readFileAsDataURL(file)
  const dims = await getImageDimensions(src)
  const { width, height } = constrainDimensions(dims.width, dims.height)
  state.addElement(abId, 'image', state.selectedElementId)
  const s2 = useEditorStore.getState()
  const newId = s2.selectedElementId
  if (newId && s2.activeArtboardId) {
    s2.updateElement(s2.activeArtboardId, newId, {
      src,
      alt: '',
      styles: { width: `${width}px`, height: `${height}px`, objectFit: 'cover', overflow: 'hidden' },
    })
  }
}

export function useImageDrop() {
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      }
    }
    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return
      let hasImage = false
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          hasImage = true
          addImageFromFile(file)
        }
      }
      if (hasImage) e.preventDefault()
    }
    const onPaste = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()

      const items = e.clipboardData?.items
      if (items) {
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) addImageFromFile(file)
            return
          }
        }
      }

      useEditorStore.getState().pasteElement()
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('paste', onPaste)
    }
  }, [])
}
