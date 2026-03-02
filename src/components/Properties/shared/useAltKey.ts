import { useState, useEffect } from 'react'

/** Tracks whether the Alt/Option key is currently pressed */
export function useAltKey(enabled = true): boolean {
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const down = (e: KeyboardEvent) => { if (e.key === 'Alt') setPressed(true) }
    const up = (e: KeyboardEvent) => { if (e.key === 'Alt') setPressed(false) }
    const blur = () => setPressed(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [enabled])

  return pressed
}
