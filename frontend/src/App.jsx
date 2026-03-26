import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { checkHealth, getStats, getVerify, resetChain } from './api'

// Pages (all in pages.jsx)
import { Dashboard, Explorer, Verify, AddBatch, Transfer, TamperLab, Provenance, Dispense, FlagBatch } from './pages'

// ── Styles ────────────────────────────────────────────────
const S = {
  shell: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gridTemplateRows: 'auto 1fr',
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  sidebar: {
    gridRow: '1 / 3',
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
  },
  logoArea: {
    padding: '28px 24px 22px',
    borderBottom: '1px solid var(--border)',
  },
  logoBox: {
    width: 36, height: 36,
    background: 'var(--mint)',
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    boxShadow: '0 0 20px var(--mint-glow)',
  },
  logoName: {
    fontFamily: 'var(--font-display)',
    fontSize: 18, fontWeight: 800, color: '#fff',
  },
  logoSub: {
    fontSize: 10, color: 'var(--text-dim)',
    letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2,
  },
  statusWidget: (valid) => ({
    margin: 14,
    padding: '12px 16px',
    borderRadius: 10,
    border: `1px solid ${valid ? 'rgba(0,229,176,0.25)' : 'rgba(255,45,85,0.3)'}`,
    background: valid ? 'var(--mint-dim)' : 'var(--red-dim)',
    transition: 'all 0.4s',
  }),
  swLabel: {
    fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
    color: 'var(--text-dim)', marginBottom: 5,
  },
  swStatus: (valid) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
    color: valid ? 'var(--mint)' : 'var(--red)',
  }),
  swDot: (valid) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: valid ? 'var(--mint)' : 'var(--red)',
    boxShadow: `0 0 6px ${valid ? 'var(--mint)' : 'var(--red)'}`,
    animation: valid ? 'pulse 2s infinite' : 'none',
    flexShrink: 0,
  }),
  swBlocks: {
    fontSize: 10, color: 'var(--text-mid)', marginTop: 4,
  },
  nav: { padding: '8px 12px', flex: 1 },
  navSectionLabel: {
    fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
    color: 'var(--text-dim)', padding: '10px 12px 6px',
  },
  topbar: {
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    padding: '0 32px',
    height: 56,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  main: {
    padding: 32,
    overflowY: 'auto',
    minHeight: 'calc(100vh - 56px)',
  },
  apiDot: (online) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: online ? 'var(--mint)' : 'var(--red)',
    marginRight: 6, display: 'inline-block',
  }),
}

// ── NavItem component ─────────────────────────────────────
function NavItem({ to, icon, label, badge }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8,
        color: isActive ? 'var(--mint)' : 'var(--text-mid)',
        background: isActive ? 'var(--mint-dim)' : 'transparent',
        border: isActive ? '1px solid var(--border2)' : '1px solid transparent',
        textDecoration: 'none', fontSize: 12, fontWeight: 500,
        transition: 'all 0.2s', marginBottom: 2, fontFamily: 'var(--font-mono)',
      })}
    >
      <span style={{ opacity: 0.8, fontSize: 13 }}>{icon}</span>
      {label}
      {badge != null && (
        <span style={{
          marginLeft: 'auto', background: 'var(--mint-dim)', color: 'var(--mint)',
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
          border: '1px solid var(--border2)',
        }}>{badge}</span>
      )}
    </NavLink>
  )
}

// ── Toast ─────────────────────────────────────────────────
export let showToastFn = null  // export so pages can call it

function Toast({ toast }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
      background: 'var(--card)', border: `1px solid ${toast?.color || 'var(--mint)'}`,
      borderRadius: 10, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px ${toast?.color || 'var(--mint)'}44`,
      transform: toast?.show ? 'translateY(0)' : 'translateY(80px)',
      opacity: toast?.show ? 1 : 0,
      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      pointerEvents: 'none',
    }}>
      <span style={{ fontSize: 16 }}>{toast?.icon || '✅'}</span>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: toast?.color || 'var(--mint)' }}>
          {toast?.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{toast?.msg}</div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  const [stats,   setStats]   = useState(null)
  const [valid,   setValid]   = useState(true)
  const [online,  setOnline]  = useState(false)
  const [toast,   setToast]   = useState({ show: false })
  const navigate = useNavigate()

  // Export toast so child pages can trigger it
  showToastFn = (icon, title, msg, color = 'var(--mint)') => {
    setToast({ show: true, icon, title, msg, color })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }

  // Poll health + stats
  useEffect(() => {
    const load = async () => {
      const up = await checkHealth()
      setOnline(up)
      if (up) {
        try {
          const [s, v] = await Promise.all([getStats(), getVerify()])
          setStats(s)
          setValid(v.is_valid)
        } catch {}
      }
    }
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  const handleReset = async () => {
    try {
      await resetChain()
      showToastFn('↺', 'Chain Reset', 'Blockchain restored to demo state.', 'var(--mint)')
      window.location.reload()
    } catch {
      showToastFn('❌', 'Error', 'Could not reach Flask server.', 'var(--red)')
    }
  }

  return (
    <div style={S.shell}>

      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.logoArea}>
          <div style={S.logoBox}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="7" height="12" rx="1.5" fill="#04080F"/>
              <path d="M5 7h1M5 10h1M5 13h1" stroke="#00E5B0" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="11" y="4" width="7" height="12" rx="1.5" fill="#04080F"/>
              <path d="M14 7h1M14 10h1M14 13h1" stroke="#00E5B0" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 10h2" stroke="#00E5B0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={S.logoName}>PharmaChain</div>
          <div style={S.logoSub}>Drug Auth Terminal v1.0</div>
        </div>

        {/* Status widget */}
        <div style={S.statusWidget(valid)}>
          <div style={S.swLabel}>Chain Status</div>
          <div style={S.swStatus(valid)}>
            <span style={S.swDot(valid)}></span>
            {valid ? 'VERIFIED' : 'COMPROMISED'}
          </div>
          <div style={S.swBlocks}>
            {stats ? `${stats.total_blocks} blocks on chain` : 'connecting…'}
          </div>
        </div>

        <nav style={S.nav}>
          <div style={S.navSectionLabel}>Navigation</div>
          <NavItem to="/"           icon="⊞" label="Dashboard"     badge={stats?.total_blocks} />
          <NavItem to="/explorer"   icon="⛓" label="Chain Explorer" />
          <NavItem to="/verify"     icon="✓" label="Verify Chain"   />
          <div style={{ ...S.navSectionLabel, marginTop: 8 }}>Actions</div>
          <NavItem to="/add-batch"  icon="🏭" label="Add Drug Batch" />
          <NavItem to="/transfer"   icon="🚚" label="Log Transfer"   />
          <NavItem to="/dispense"   icon="🏥" label="Dispense Patient"/>
          <NavItem to="/flag"       icon="🚨" label="Flag Suspicious" />
          <div style={{ ...S.navSectionLabel, marginTop: 8 }}>Security</div>
          <NavItem to="/tamper"     icon="⚡" label="Tamper Lab"     />
          <NavItem to="/provenance" icon="◎" label="QR Verify"      />
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={S.apiDot(online)}></span>
            {online ? 'Flask API connected' : 'Demo mode (no server)'}
          </div>
          <div>localhost:5000</div>
        </div>
      </aside>

      {/* ── TOPBAR ── */}
      <header style={S.topbar}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#fff' }}>
            PharmaChain
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {online ? '🟢 Connected to Flask API' : '🔴 Demo mode — start Flask to enable full features'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleReset} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
            borderRadius: 8, border: '1px solid var(--border2)',
            background: 'transparent', color: 'var(--text-mid)',
            fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
          }}>↺ Reset Demo</button>
          <button onClick={() => navigate('/add-batch')} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
            borderRadius: 8, border: '1px solid var(--mint)',
            background: 'var(--mint)', color: '#04080F',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 16px var(--mint-glow)', fontFamily: 'var(--font-mono)',
          }}>＋ Add Batch</button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={S.main}>
        <Routes>
          <Route path="/"           element={<Dashboard />}  />
          <Route path="/explorer"   element={<Explorer />}   />
          <Route path="/verify"     element={<Verify />}     />
          <Route path="/add-batch"  element={<AddBatch />}   />
          <Route path="/transfer"   element={<Transfer />}   />
          <Route path="/dispense"   element={<Dispense />}   />
          <Route path="/flag"       element={<FlagBatch />}  />
          <Route path="/tamper"     element={<TamperLab />}  />
          <Route path="/provenance" element={<Provenance />} />
          <Route path="/verify/:id" element={<Provenance />} />
        </Routes>
      </main>

      <Toast toast={toast} />
    </div>
  )
}
