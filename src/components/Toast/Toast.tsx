import { useEffect } from 'react'

type Props = {
  message: string
  onClose: () => void
  duration?: number
}

export function Toast({ message, onClose, duration = 3000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1a1a1a',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      zIndex: 9999,
      animation: 'toast-slide-up 0.2s ease-out',
    }}>
      {message}
      <style>{`
        @keyframes toast-slide-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
