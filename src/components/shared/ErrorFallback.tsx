import type { FallbackProps } from 'react-error-boundary'

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, gap: 12, height: '100%', minHeight: 120,
      background: '#fafafa', color: '#555', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, color: '#e53935' }}>Something went wrong</div>
      <div style={{ fontSize: 12, color: '#999', maxWidth: 300, textAlign: 'center', wordBreak: 'break-word' }}>
        {error instanceof Error ? error.message : String(error)}
      </div>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '6px 16px', border: '1px solid #ddd', borderRadius: 6,
          background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500,
        }}
      >
        Try again
      </button>
    </div>
  )
}
