/**
 * PharmaChain — Shared UI Components
 * 
 * Reusable building blocks used across all pages.
 * Keep it simple — each component is a pure presentational function.
 */

// ── EVENT HELPERS ────────────────────────────────────────────
export const EVENT_LABELS = {
  GENESIS      : 'Genesis',
  BATCH_CREATED: 'Batch Created',
  TRANSFERRED  : 'Transferred',
  RECEIVED     : 'Received',
  DISPENSED    : 'Dispensed',
  FLAGGED      : '⚠ Flagged',
}

export function labelFor(ev) { return EVENT_LABELS[ev] || ev }

export function colorFor(ev) {
  if (ev === 'FLAGGED')   return 'var(--red)'
  if (ev === 'GENESIS')   return 'var(--text-mid)'
  if (ev === 'DISPENSED') return 'var(--blue)'
  return 'var(--mint)'
}

// ── STAT CARD ────────────────────────────────────────────────
export function StatCard({ icon, value, label, sub, accent = 'var(--mint)' }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, boxShadow: `0 0 8px ${accent}55` }} />
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${accent}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12, fontSize: 15,
      }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-mid)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ── BLOCK CARD (chain explorer) ───────────────────────────────
export function BlockCard({ block, selected, tampered, downstream, onClick }) {
  const ev = block.data?.event || 'UNKNOWN'
  const color = tampered ? 'var(--red)' : downstream ? 'rgba(255,45,85,0.5)' : colorFor(ev)

  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0, width: 180,
        background: tampered ? 'var(--red-dim)' : selected ? 'var(--mint-dim)' : downstream ? 'rgba(255,45,85,0.06)' : 'var(--bg2)',
        border: `1px solid ${selected ? 'var(--mint)' : tampered ? 'var(--red)' : downstream ? 'rgba(255,45,85,0.25)' : 'var(--border)'}`,
        borderRadius: 10, padding: 14, cursor: 'pointer',
        transition: 'all 0.25s',
        animation: tampered ? 'tamperFlash 0.5s ease' : 'none',
        boxShadow: selected ? '0 0 20px var(--mint-glow)' : tampered ? '0 0 12px var(--red-glow)' : 'none',
      }}
      onMouseEnter={e => { if (!selected && !tampered) e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        Block #{block.index}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color, marginBottom: 8, lineHeight: 1.2 }}>
        {labelFor(ev)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {block.data?.batch_id || block.data?.drug_name || 'System'}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        hash: <span style={{ color }}>{block.hash?.substring(0,14)}…</span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
        prev: <span style={{ color: 'var(--text-dim)' }}>{block.previous_hash?.substring(0,14)}…</span>
      </div>
    </div>
  )
}

// ── CHAIN TRACK ───────────────────────────────────────────────
export function ChainTrack({ blocks, tamperedIdx, firstBadIdx, selectedIdx, onSelect }) {
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', padding: '8px 0' }}>
        {blocks.map((block, i) => {
          const isTampered   = block.index === tamperedIdx
          const isDownstream = firstBadIdx != null && block.index > firstBadIdx && block.index !== tamperedIdx
          const isSelected   = block.index === selectedIdx
          const isBroken     = firstBadIdx != null && block.index === firstBadIdx

          return (
            <div key={block.index} style={{ display: 'flex', alignItems: 'center' }}>
              <BlockCard
                block={block}
                selected={isSelected}
                tampered={isTampered}
                downstream={isDownstream}
                onClick={() => onSelect && onSelect(block)}
              />
              {i < blocks.length - 1 && (
                <div style={{ padding: '0 4px', position: 'relative' }}>
                  {isBroken && (
                    <div style={{
                      position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--red)', color: '#fff', fontSize: 8, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', letterSpacing: 1,
                    }}>BROKEN</div>
                  )}
                  <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                    <line x1="0" y1="12" x2="30" y2="12"
                      stroke={isBroken ? 'var(--red)' : 'rgba(0,229,176,0.2)'}
                      strokeWidth="1.5"
                      strokeDasharray={isBroken ? '4 3' : undefined}
                    />
                    <polygon points="28,7 38,12 28,17"
                      fill={isBroken ? 'var(--red)' : 'rgba(0,229,176,0.2)'}
                    />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── BLOCK DETAIL PANEL ────────────────────────────────────────
export function BlockDetail({ block, onClose }) {
  if (!block) return null
  const fields = [
    { label: 'Hash',          value: block.hash,          full: true,  mono: true, color: 'var(--mint)' },
    { label: 'Previous Hash', value: block.previous_hash, full: true,  mono: true, color: 'var(--text-mid)' },
    { label: 'Index',         value: block.index },
    { label: 'Timestamp',     value: new Date(block.timestamp).toLocaleString() },
    ...Object.entries(block.data || {}).map(([k,v]) => ({ label: k, value: String(v) })),
  ]

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 24, marginBottom: 24,
      animation: 'fadeUp 0.25s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff' }}>
            Block #{block.index}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>
            {labelFor(block.data?.event || '?')} — {new Date(block.timestamp).toLocaleString()}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-dim)', borderRadius: 6, padding: '5px 12px',
          cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)',
        }}>✕ Close</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {fields.map((f, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '12px 14px',
            gridColumn: f.full ? '1 / -1' : undefined,
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>
              {f.label}
            </div>
            <div style={{
              fontSize: f.mono ? 10 : 12,
              color: f.color || 'var(--text)',
              fontFamily: f.mono ? 'var(--font-mono)' : undefined,
              wordBreak: 'break-all',
              letterSpacing: f.mono ? '0.5px' : undefined,
            }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SECTION HEADER ────────────────────────────────────────────
export function SectionHeader({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', boxShadow: '0 0 6px var(--mint)', display: 'inline-block' }} />
        {title}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

// ── BTN ───────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'ghost', style: extra }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 18px', borderRadius: 8, border: '1px solid',
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
    ...extra,
  }
  const variants = {
    ghost  : { background: 'transparent', borderColor: 'var(--border2)', color: 'var(--text-mid)' },
    primary: { background: 'var(--mint)',  borderColor: 'var(--mint)',    color: '#04080F', fontWeight: 700, boxShadow: '0 0 16px var(--mint-glow)' },
    danger : { background: 'var(--red-dim)', borderColor: 'rgba(255,45,85,0.3)', color: 'var(--red)' },
    amber  : { background: 'var(--amber-dim)', borderColor: 'rgba(255,184,0,0.3)', color: 'var(--amber)' },
  }
  return <button onClick={onClick} style={{ ...base, ...variants[variant] }}>{children}</button>
}

// ── FORM FIELD ────────────────────────────────────────────────
export function FormField({ label, children, full }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)',
        fontSize: 12, padding: '11px 14px', outline: 'none', width: '100%',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...(props.style || {}),
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--mint)'; e.target.style.boxShadow = '0 0 0 3px var(--mint-dim)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 8, color: 'var(--text)', fontFamily: 'var(--font-mono)',
        fontSize: 12, padding: '11px 14px', outline: 'none', width: '100%',
        appearance: 'none', cursor: 'pointer',
      }}
    >
      {children}
    </select>
  )
}

// ── PAGE WRAPPER ──────────────────────────────────────────────
export function PageWrap({ children }) {
  return <div style={{ animation: 'fadeUp 0.3s ease' }}>{children}</div>
}

// ── FORM CARD ─────────────────────────────────────────────────
export function FormCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 28, marginBottom: 24,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}
