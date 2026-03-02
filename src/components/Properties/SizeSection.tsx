import type { ElementStyles } from '../../types'
import { CollapsibleSection, FigmaInput } from './shared'

// ─── Icons ───────────────────────────────────────────────────────────────────

const MinWidthIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="2" y1="7" x2="6.5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="4.5,5.5 6.5,7 4.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="7" x2="7.5" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="9.5,5.5 7.5,7 9.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MinHeightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7" y1="2" x2="7" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,4.5 7,6.5 8.5,4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="7" y1="12" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,9.5 7,7.5 8.5,9.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MaxWidthIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="2" y1="3.5" x2="2" y2="10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="12" y1="3.5" x2="12" y2="10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="2.5" y1="7" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="4.5,5.5 2.5,7 4.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="11.5" y1="7" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="9.5,5.5 11.5,7 9.5,8.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MaxHeightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <line x1="3.5" y1="2" x2="10.5" y2="2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="3.5" y1="12" x2="10.5" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7" y1="2.5" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,4.5 7,2.5 8.5,4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="7" y1="11.5" x2="7" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <polyline points="5.5,9.5 7,11.5 8.5,9.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  styles: ElementStyles
  onUpdate: (patch: Partial<ElementStyles>) => void
}

export function SizeSection({ styles, onUpdate }: Props) {
  return (
    <CollapsibleSection label="Size" tooltip="Size — width, height, min/max constraints and overflow" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Dimensions */}
        <div>
          <div style={{ fontSize: 10, color: '#a3a3a3', marginBottom: 5 }}>Dimensions</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div title="Width — element width. Auto = fit content/parent. Supports px, %, vw" style={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <FigmaInput
                prefix="W"
                value={styles.width ?? ''}
                placeholder="Auto"
                allowAuto
                testId="size-width"
                onChange={(v) => onUpdate({ width: v || undefined })}
                onReset={() => onUpdate({ width: undefined })}
              />
            </div>
            <div title="Height — element height. Auto = fit content" style={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <FigmaInput
                prefix="H"
                value={styles.height ?? ''}
                placeholder="Auto"
                allowAuto
                testId="size-height"
                onChange={(v) => onUpdate({ height: v || undefined })}
                onReset={() => onUpdate({ height: undefined })}
              />
            </div>
          </div>
        </div>

        {/* Min */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }} title="Min width — element won't shrink below this">
            <div style={{ fontSize: 10, color: '#a3a3a3', marginBottom: 5 }}>Min width</div>
            <FigmaInput
              prefix={<MinWidthIcon />}
              value={styles.minWidth ?? ''}
              placeholder="Min W"
              onChange={(v) => onUpdate({ minWidth: v || undefined })}
              onReset={() => onUpdate({ minWidth: undefined })}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }} title="Min height — element won't shrink below this">
            <div style={{ fontSize: 10, color: '#a3a3a3', marginBottom: 5 }}>Min height</div>
            <FigmaInput
              prefix={<MinHeightIcon />}
              value={styles.minHeight ?? ''}
              placeholder="Min H"
              onChange={(v) => onUpdate({ minHeight: v || undefined })}
              onReset={() => onUpdate({ minHeight: undefined })}
            />
          </div>
        </div>

        {/* Max */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }} title="Max width — element won't grow beyond this">
            <div style={{ fontSize: 10, color: '#a3a3a3', marginBottom: 5 }}>Max width</div>
            <FigmaInput
              prefix={<MaxWidthIcon />}
              value={styles.maxWidth ?? ''}
              placeholder="Max W"
              allowNone
              onChange={(v) => onUpdate({ maxWidth: v || undefined })}
              onReset={() => onUpdate({ maxWidth: undefined })}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }} title="Max height — element won't grow beyond this">
            <div style={{ fontSize: 10, color: '#a3a3a3', marginBottom: 5 }}>Max height</div>
            <FigmaInput
              prefix={<MaxHeightIcon />}
              value={styles.maxHeight ?? ''}
              placeholder="Max H"
              allowNone
              onChange={(v) => onUpdate({ maxHeight: v || undefined })}
              onReset={() => onUpdate({ maxHeight: undefined })}
            />
          </div>
        </div>

        {/* Overflow */}
        <OverflowRow
          value={styles.overflow}
          onChange={(v) => onUpdate({ overflow: v })}
        />

      </div>
    </CollapsibleSection>
  )
}

// ─── OverflowRow ──────────────────────────────────────────────────────────────

type OverflowValue = ElementStyles['overflow']

const OVERFLOW_OPTIONS: { value: NonNullable<OverflowValue>; icon: React.ReactNode; tooltip: string }[] = [
  {
    value: 'visible',
    tooltip: 'Visible — content flows outside the element (default)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'hidden',
    tooltip: 'Hidden — clip content at element boundaries',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'scroll',
    tooltip: 'Scroll — always show scrollbar',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2L7 12M4 5L7 2L10 5M4 9L7 12L10 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'auto',
    tooltip: 'Auto — scrollbar appears only when content overflows',
    icon: <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '-0.02em' }}>Auto</span>,
  },
]

function OverflowRow({ value, onChange }: {
  value: OverflowValue
  onChange: (v: OverflowValue) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
      <span title="Overflow — what happens with content that doesn't fit" style={{ fontSize: 10, color: '#a3a3a3', width: 52, flexShrink: 0 }}>Overflow</span>
      <div style={{
        display: 'flex', background: '#efefef', borderRadius: 6,
        padding: 2, gap: 2, flex: 1,
      }}>
        {OVERFLOW_OPTIONS.map((opt) => {
          const active = (value ?? 'visible') === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={opt.tooltip}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px 0', border: 'none', borderRadius: 4, cursor: 'default',
                background: active ? '#0a0a0a' : 'transparent',
                color: active ? '#fff' : '#737373',
                transition: 'all 0.1s',
              }}
            >
              {opt.icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
