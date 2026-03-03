import { useState } from 'react'
import { useBacklogStore } from '../../store/backlogStore'

export function PinModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const unlock = useBacklogStore(s => s.unlock)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (unlock(pin)) {
      onSuccess()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, padding: 32,
          width: 320, display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', textAlign: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          Введите PIN
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          Для добавления и удаления задач
        </div>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(false) }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          autoFocus
          placeholder="••••"
          style={{
            width: '100%', padding: '12px 16px', fontSize: 24, textAlign: 'center',
            letterSpacing: 12, border: `2px solid ${error ? '#dc2626' : '#e5e5e5'}`,
            borderRadius: 8, outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center' }}>
            Неверный PIN
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 16px', fontSize: 13, border: '1px solid #e5e5e5',
              borderRadius: 6, cursor: 'pointer', background: '#fff',
              color: '#525252', fontWeight: 500,
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4}
            style={{
              flex: 1, padding: '10px 16px', fontSize: 13, border: 'none',
              borderRadius: 6, cursor: pin.length >= 4 ? 'pointer' : 'default',
              background: pin.length >= 4 ? '#0a0a0a' : '#e5e5e5',
              color: pin.length >= 4 ? '#fff' : '#a3a3a3',
              fontWeight: 500,
            }}
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  )
}
