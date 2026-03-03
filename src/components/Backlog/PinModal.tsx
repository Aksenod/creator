import { useState } from 'react'
import { useBacklogStore } from '../../store/backlogStore'
import { colors, shadows, radius } from '../../styles/tokens'
import { Lock } from '@phosphor-icons/react'

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
        position: 'fixed', inset: 0, background: colors.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.bg, borderRadius: 12, padding: 32,
          width: 320, display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: shadows.xl,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, textAlign: 'center' }}>
          <Lock size={16} weight="thin" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
          Введите PIN
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
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
            letterSpacing: 12, border: `2px solid ${error ? colors.accentRed : colors.border}`,
            borderRadius: radius.md, outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: colors.accentRed, textAlign: 'center' }}>
            Неверный PIN
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 16px', fontSize: 13, border: `1px solid ${colors.border}`,
              borderRadius: radius.sm, cursor: 'pointer', background: colors.bg,
              color: colors.textSecondary, fontWeight: 500,
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4}
            style={{
              flex: 1, padding: '10px 16px', fontSize: 13, border: 'none',
              borderRadius: radius.sm, cursor: pin.length >= 4 ? 'pointer' : 'default',
              background: pin.length >= 4 ? colors.accent : colors.border,
              color: pin.length >= 4 ? colors.bg : colors.textMuted,
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
