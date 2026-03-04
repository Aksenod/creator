import { useState, useEffect, useRef } from 'react'
import { X, Copy, Check, DownloadSimple } from '@phosphor-icons/react'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import { colors, shadows, radius, zIndex, spacing } from '../../styles/tokens'
import { downloadHTML } from '../../utils/exportHTML'

hljs.registerLanguage('xml', xml)

type Props = {
  html: string
  filename: string
  onClose: () => void
}

export function HTMLLightbox({ html, filename, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  // Highlight on mount
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = html
      hljs.highlightElement(codeRef.current)
    }
  }, [html])

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html)
    } catch {
      // Fallback for HTTP
      const textarea = document.createElement('textarea')
      textarea.value = html
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    downloadHTML(html, filename)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: zIndex.modal,
        background: colors.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['2xl'],
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.bg,
          borderRadius: 12,
          width: '100%',
          maxWidth: 800,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: shadows.xl,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing.xl}px ${spacing['2xl']}px`,
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>HTML</span>
            <span style={{ fontSize: 12, color: colors.textSecondary }}>{filename}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} weight="thin" />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          gap: spacing.md,
          padding: `${spacing.lg}px ${spacing['2xl']}px`,
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm}px ${spacing.lg}px`,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'inherit',
              border: `1px solid ${copied ? '#22c55e' : colors.border}`,
              borderRadius: radius.sm,
              background: copied ? '#f0fdf4' : colors.bg,
              color: copied ? '#16a34a' : colors.text,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm}px ${spacing.lg}px`,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'inherit',
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm,
              background: colors.bg,
              color: colors.text,
              cursor: 'pointer',
            }}
          >
            <DownloadSimple size={14} />
            Download
          </button>
        </div>

        {/* Code area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: spacing['2xl'],
          background: colors.bgSurface,
        }}>
          <pre style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.6,
            fontFamily: "'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            tabSize: 2,
          }}>
            <code ref={codeRef} className="language-xml" />
          </pre>
        </div>
      </div>
    </div>
  )
}
