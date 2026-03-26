/**
 * PharmaChain — All Page Components
 * 
 * Dashboard, Explorer, Verify, AddBatch, Transfer, TamperLab, Provenance
 * Each is a separate export — imported individually in App.jsx
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  getChain, getStats, getVerify, getBatch, getQR,
  addBatch, addTransfer, flagBatch, tamperBlock, resetChain
} from './api'
import {
  StatCard, ChainTrack, BlockDetail, SectionHeader,
  Btn, FormField, Input, Select, PageWrap, FormCard, labelFor
} from './components'
import { showToastFn } from './App'

// Helper to show toast
const toast = (icon, title, msg, color = 'var(--mint)') =>
  showToastFn?.(icon, title, msg, color)

// Shared card style
const card = (extra = {}) => ({
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 14, padding: 24, marginBottom: 24, ...extra,
})


// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
export function Dashboard() {
  const [stats,    setStats]    = useState(null)
  const [chain,    setChain]    = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    getChain().then(r => setChain(r.chain || [])).catch(() => {})
  }, [])

  const valid = stats?.is_chain_valid !== false

  return (
    <PageWrap>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon="⛓️" value={stats?.total_blocks}   label="Total Blocks"    sub="incl. genesis"          accent="var(--mint)"  />
        <StatCard icon="💊" value={stats?.total_batches}  label="Drug Batches"    sub="on chain"                accent="var(--blue)"  />
        <StatCard icon="🚚" value={stats?.event_counts?.transferred} label="Transfers" sub="supply hops"        accent="var(--amber)" />
        <StatCard
          icon={valid ? '🛡️' : '⚠️'}
          value={valid ? 'INTACT' : 'BROKEN'}
          label="Chain Integrity"
          sub={valid ? 'all hashes verified' : 'tampering detected!'}
          accent={valid ? 'var(--mint)' : 'var(--red)'}
        />
      </div>

      <SectionHeader title="Live Chain" />
      <div style={card()}>
        <ChainTrack
          blocks={chain}
          selectedIdx={selected?.index}
          firstBadIdx={null}
          onSelect={setSelected}
        />
      </div>

      {selected && <BlockDetail block={selected} onClose={() => setSelected(null)} />}
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  EXPLORER
// ══════════════════════════════════════════════════════════════
export function Explorer() {
  const [chain,    setChain]    = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getChain().then(r => setChain(r.chain || [])).catch(() => {})
  }, [])

  return (
    <PageWrap>
      <SectionHeader title="Chain Explorer" right={
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Click any block to inspect</span>
      }/>

      <div style={card()}>
        <ChainTrack blocks={chain} selectedIdx={selected?.index} onSelect={setSelected} />
      </div>

      {selected && <BlockDetail block={selected} onClose={() => setSelected(null)} />}

      <SectionHeader title="All Blocks" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...chain].reverse().map(b => (
          <div key={b.index} onClick={() => setSelected(b)} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 16, display: 'flex', gap: 16,
            alignItems: 'flex-start', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: 'var(--mint-dim)', color: 'var(--mint)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>{b.index}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {labelFor(b.data?.event || '?')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>
                {b.data?.batch_id || '—'} · {b.data?.drug_name || b.data?.description || '—'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                hash: {b.hash}
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0, textAlign: 'right' }}>
              {new Date(b.timestamp).toLocaleDateString()}<br />
              <span style={{ color: 'var(--mint)', fontWeight: 700 }}>✓ valid</span>
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  VERIFY
// ══════════════════════════════════════════════════════════════
export function Verify() {
  const [result, setResult] = useState(null)
  const [chain,  setChain]  = useState([])
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    const [v, c] = await Promise.all([getVerify(), getChain()])
    setResult(v)
    setChain(c.chain || [])
    setLoading(false)
  }

  useEffect(() => { run() }, [])

  return (
    <PageWrap>
      <SectionHeader title="Chain Integrity Verification" right={
        <Btn variant="primary" onClick={run}>
          {loading ? '⏳' : '✓'} Run Verification
        </Btn>
      }/>

      {result && (
        <div style={{
          borderRadius: 14, padding: 28, textAlign: 'center', marginBottom: 24,
          background: result.is_valid ? 'var(--mint-dim)' : 'var(--red-dim)',
          border: `1px solid ${result.is_valid ? 'var(--border2)' : 'rgba(255,45,85,0.3)'}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{result.is_valid ? '✅' : '🔴'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: result.is_valid ? 'var(--mint)' : 'var(--red)' }}>
            {result.is_valid ? 'Chain Integrity Verified' : 'Chain Integrity COMPROMISED'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 6 }}>
            {result.is_valid
              ? `All ${result.total_blocks} blocks passed hash verification. No tampering detected.`
              : `${result.errors?.length} error(s) detected across ${result.total_blocks} blocks.`}
          </div>
          {!result.is_valid && result.errors?.map((e, i) => (
            <div key={i} style={{
              marginTop: 8, fontSize: 11, color: 'var(--red)',
              background: 'rgba(255,45,85,0.1)', padding: '8px 12px', borderRadius: 6, textAlign: 'left',
            }}>{e}</div>
          ))}
        </div>
      )}

      <SectionHeader title="Block-by-Block Status" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chain.slice(1).map((b, i) => {
          const detail = result?.details?.find(d => d.index === b.index)
          const ok = !detail || (detail.self_valid && detail.chain_valid)
          return (
            <div key={b.index} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 16px', fontSize: 11,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: ok ? 'var(--mint-dim)' : 'var(--red-dim)',
                color: ok ? 'var(--mint)' : 'var(--red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{b.index}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{labelFor(b.data?.event || '?')}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{b.data?.batch_id || '—'} · {b.data?.drug_name || '—'}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                {b.hash?.substring(0,16)}…
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: ok ? 'var(--mint)' : 'var(--red)', flexShrink: 0 }}>
                {ok ? '✓ VALID' : '✗ TAMPERED'}
              </div>
            </div>
          )
        })}
      </div>
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  ADD BATCH — Multi-Step Wizard
// ══════════════════════════════════════════════════════════════
const ROLES_BATCH = [
  { id:'manufacturer', icon:'🏭', title:'Manufacturer',     desc:'Creating a new drug batch at the production facility' },
  { id:'lab',          icon:'🔬', title:'QC Laboratory',    desc:'Registering a batch after quality control testing' },
  { id:'govt',         icon:'🏛️', title:'Govt. Regulator',  desc:'CDSCO / FDA — registering a certified batch' },
  { id:'partner',      icon:'🤝', title:'Contract Mfg.',    desc:'Third-party manufacturer producing on behalf of a brand' },
]

const DRUG_CLASSIFICATIONS = [
  'Analgesic / Antipyretic','Antibiotic','Antidiabetic','Antihypertensive',
  'Antihistamine','Antiviral','Vaccine','Nutritional Supplement','Other',
]

export function AddBatch() {
  const [step,    setStep]    = useState(1)
  const [role,    setRole]    = useState(null)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [newBlock,setNewBlock]= useState(null)
  const [form, setForm] = useState({
    batch_id:'', drug_name:'', manufacturer:'', quantity:'',
    manufacture_date:'', expiry_date:'', location:'', classification:'', notes:''
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: false })) }

  const validateStep2 = () => {
    const req = { batch_id:'Batch ID', drug_name:'Drug Name', manufacturer:'Manufacturer',
                  quantity:'Quantity', manufacture_date:'Manufacture Date', expiry_date:'Expiry Date' }
    const errs = {}
    Object.entries(req).forEach(([k]) => { if (!form[k]) errs[k] = true })
    if (form.quantity && parseInt(form.quantity) <= 0) errs.quantity = true
    if (form.manufacture_date && form.expiry_date && form.expiry_date <= form.manufacture_date) errs.expiry_date = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goStep = (n) => {
    if (n === 2 && !role) { toast('⚠️','Select a Role','Choose your role to continue.','var(--amber)'); return }
    if (n === 3 && !validateStep2()) { toast('⚠️','Errors Found','Fix highlighted fields.','var(--amber)'); return }
    setStep(n)
  }

  const submit = async () => {
    setLoading(true)
    try {
      const res = await addBatch({ ...form, quantity: parseInt(form.quantity) })
      setNewBlock(res.block)
      toast('✅','Batch Registered!',`${form.drug_name} (${form.batch_id}) added to blockchain.`)
      setStep(4)
    } catch (e) {
      toast('❌','Error', e?.response?.data?.error || 'Could not register batch.', 'var(--red)')
    }
    setLoading(false)
  }

  const reset = () => { setStep(1); setRole(null); setErrors({}); setNewBlock(null)
    setForm({ batch_id:'', drug_name:'', manufacturer:'', quantity:'', manufacture_date:'', expiry_date:'', location:'', classification:'', notes:'' })
  }

  const inpStyle = (k) => ({
    background: 'var(--card)', border: `1.5px solid ${errors[k] ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 9, color: 'var(--text)', fontFamily: 'var(--font-mono)',
    fontSize: 12, padding: '11px 14px', outline: 'none', width: '100%',
    boxShadow: errors[k] ? '0 0 0 3px var(--red-dim)' : 'none',
    transition: 'border-color .2s, box-shadow .2s',
  })

  const pct = { 1:33, 2:66, 3:90, 4:100 }[step]

  return (
    <PageWrap>
      {/* Stepper */}
      <div style={{ display:'flex', alignItems:'center', marginBottom: 20 }}>
        {[['Role','1'],['Details','2'],['Confirm','3']].map(([label,num], i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flex: i < 2 ? 1 : 0 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, border:'2px solid', flexShrink:0,
                background: step > i+1 ? 'var(--mint)' : step === i+1 ? 'var(--mint-dim)' : 'transparent',
                borderColor: step >= i+1 ? 'var(--mint)' : 'var(--border2)',
                color: step > i+1 ? '#04080F' : step === i+1 ? 'var(--mint)' : 'var(--text-dim)',
                boxShadow: step === i+1 ? '0 0 12px var(--mint-glow)' : 'none',
                transition: 'all .3s',
              }}>{step > i+1 ? '✓' : num}</div>
              <span style={{ fontSize:11, fontWeight:600, color: step >= i+1 ? 'var(--mint)' : 'var(--text-dim)' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex:1, height:1, margin:'0 12px', background: step > i+1 ? 'var(--mint)' : 'var(--border2)', transition:'background .3s' }} />}
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div style={{ height:3, background:'var(--border)', borderRadius:2, marginBottom:28, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'var(--mint)', borderRadius:2, transition:'width .4s cubic-bezier(.4,0,.2,1)', boxShadow:'0 0 8px var(--mint-glow)' }} />
      </div>

      {/* ─── Step 1: Role ─── */}
      {step === 1 && (
        <div style={{ animation:'fadeUp .3s ease' }}>
          <SectionHeader title="Who are you?" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
            {ROLES_BATCH.map(r => (
              <div key={r.id} onClick={() => setRole(r.id)} style={{
                background:'var(--card)', border:`2px solid ${role === r.id ? 'var(--mint)' : 'var(--border)'}`,
                borderRadius:12, padding:'20px 16px', cursor:'pointer', transition:'all .25s',
                background: role === r.id ? 'var(--mint-dim)' : 'var(--card)',
                boxShadow: role === r.id ? '0 0 20px var(--mint-glow)' : 'none',
              }}>
                <div style={{ fontSize:26, marginBottom:10 }}>{r.icon}</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color: role === r.id ? 'var(--mint)' : '#fff', marginBottom:4 }}>{r.title}</div>
                <div style={{ fontSize:10, color: role === r.id ? 'rgba(0,229,176,.6)' : 'var(--text-dim)', lineHeight:1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="primary" onClick={() => goStep(2)}>Next: Batch Details →</Btn>
          </div>
        </div>
      )}

      {/* ─── Step 2: Form ─── */}
      {step === 2 && (
        <div style={{ animation:'fadeUp .3s ease' }}>
          <SectionHeader title="🏭 Register Drug Batch"
            right={<Btn onClick={() => setStep(1)} style={{ fontSize:11 }}>← Back</Btn>} />
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:28, marginBottom:20 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                { label:'Batch ID *',          key:'batch_id',         ph:'e.g. B010',              hint:'Unique — cannot be reused once on chain' },
                { label:'Drug Name *',          key:'drug_name',        ph:'e.g. Paracetamol 500mg'  },
                { label:'Manufacturer *',       key:'manufacturer',     ph:'e.g. Sun Pharma Ltd.'    },
                { label:'Quantity (units) *',   key:'quantity',         ph:'e.g. 5000', type:'number' },
                { label:'Manufacture Date *',   key:'manufacture_date', type:'date'                  },
                { label:'Expiry Date *',        key:'expiry_date',      type:'date', hint: errors.expiry_date ? '⚠ Must be after manufacture date' : '' },
              ].map(f => (
                <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:10, color: errors[f.key] ? 'var(--red)' : 'var(--text-dim)', letterSpacing:1, textTransform:'uppercase', display:'flex', justifyContent:'space-between' }}>
                    <span>{f.label}</span>
                    {errors[f.key] && <span style={{ fontSize:9 }}>⚠ {f.key === 'expiry_date' ? 'after mfg date' : 'required'}</span>}
                  </div>
                  <input type={f.type||'text'} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.ph||''} style={inpStyle(f.key)}
                    onFocus={e => { if(!errors[f.key]){e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'} }}
                    onBlur={e  => { if(!errors[f.key]){e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'} }}
                  />
                  {f.hint && <div style={{ fontSize:10, color:'var(--text-dim)' }}>💡 {f.hint}</div>}
                </div>
              ))}
              {/* Full-width fields */}
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:10, color:'var(--text-dim)', letterSpacing:1, textTransform:'uppercase' }}>Manufacturing Location</label>
                <input value={form.location} onChange={e => set('location',e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra, India" style={{ ...inpStyle('location'), borderColor:'var(--border)', boxShadow:'none' }}
                  onFocus={e=>{e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:10, color:'var(--text-dim)', letterSpacing:1, textTransform:'uppercase' }}>Drug Classification</label>
                <select value={form.classification} onChange={e => set('classification',e.target.value)}
                  style={{ ...inpStyle('classification'), borderColor:'var(--border)', boxShadow:'none', appearance:'none', cursor:'pointer' }}>
                  <option value="">— Select type (optional) —</option>
                  {DRUG_CLASSIFICATIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <label style={{ fontSize:10, color:'var(--text-dim)', letterSpacing:1, textTransform:'uppercase' }}>Batch Notes</label>
                  <span style={{ fontSize:9, color: form.notes.length > 170 ? 'var(--amber)' : 'var(--text-dim)' }}>{form.notes.length}/200</span>
                </div>
                <input value={form.notes} onChange={e => set('notes',e.target.value)} maxLength={200}
                  placeholder="Optional: certifications, storage requirements, lot details…"
                  style={{ ...inpStyle('notes'), borderColor:'var(--border)', boxShadow:'none' }}
                  onFocus={e=>{e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}} />
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <Btn onClick={reset}>Clear</Btn>
            <Btn variant="primary" onClick={() => goStep(3)}>Review & Confirm →</Btn>
          </div>
        </div>
      )}

      {/* ─── Step 3: Confirm ─── */}
      {step === 3 && (
        <div style={{ animation:'fadeUp .3s ease' }}>
          <SectionHeader title="Confirm Registration"
            right={<Btn onClick={() => setStep(2)} style={{ fontSize:11 }}>← Edit</Btn>} />
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:28, marginBottom:20 }}>
            <div style={{ background:'var(--amber-dim)', border:'1px solid rgba(255,184,0,.2)', borderRadius:9, padding:'12px 16px', marginBottom:20, fontSize:11, color:'var(--amber)', display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:16 }}>⚠️</span>
              <span>Once registered on the blockchain, this entry is <strong>permanent and immutable</strong>. Verify all details carefully.</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                ['Role', role], ['Batch ID', form.batch_id], ['Drug Name', form.drug_name],
                ['Manufacturer', form.manufacturer], ['Quantity', `${form.quantity} units`],
                ['Manufacture Date', form.manufacture_date], ['Expiry Date', form.expiry_date],
                ['Location', form.location || 'Not specified'], ['Classification', form.classification || 'Not specified'],
              ].map(([k,v]) => (
                <div key={k} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:9, color:'var(--text-dim)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{v}</div>
                </div>
              ))}
              {form.notes && (
                <div style={{ gridColumn:'1/-1', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:9, color:'var(--text-dim)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:3 }}>Notes</div>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{form.notes}</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <Btn onClick={() => setStep(2)}>← Edit</Btn>
            <Btn variant="primary" onClick={submit}>
              {loading ? '⏳ Writing to chain…' : '⛓ Register on Blockchain'}
            </Btn>
          </div>
        </div>
      )}

      {/* ─── Step 4: Success ─── */}
      {step === 4 && (
        <div style={{ textAlign:'center', padding:'40px 20px', animation:'fadeUp .4s ease' }}>
          <div style={{ width:72, height:72, background:'var(--mint-dim)', border:'2px solid var(--mint)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 20px', boxShadow:'0 0 32px var(--mint-glow)' }}>✅</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--mint)', marginBottom:8 }}>Batch Registered!</div>
          <div style={{ fontSize:12, color:'var(--text-mid)', marginBottom:24 }}>The drug batch has been permanently recorded on the blockchain.</div>
          {newBlock && (
            <div style={{ background:'var(--card)', border:'2px solid var(--mint)', borderRadius:12, padding:20, textAlign:'left', boxShadow:'0 0 28px var(--mint-glow)', marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ background:'var(--mint)', color:'#04080F', fontFamily:'var(--font-display)', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:100 }}>NEW BLOCK MINTED</span>
                <span style={{ fontSize:10, color:'var(--text-dim)' }}>Block #{newBlock.index}</span>
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--mint)', marginBottom:6 }}>BATCH_CREATED</div>
              <div style={{ fontSize:11, color:'var(--text-mid)', marginBottom:10 }}>Batch: {newBlock.data?.batch_id}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)', wordBreak:'break-all', lineHeight:1.6 }}>
                hash: <span style={{ color:'var(--mint)' }}>{newBlock.hash}</span>
              </div>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
            <Btn onClick={reset}>Register Another</Btn>
            <Btn variant="primary" onClick={() => window.location.href = '/transfer'}>Log a Transfer →</Btn>
          </div>
        </div>
      )}
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  TRANSFER
// ══════════════════════════════════════════════════════════════
export function Transfer() {
  const [form, setForm] = useState({ batch_id:'', drug_name:'', from_actor:'', from_location:'', to_actor:'', to_location:'', quantity:'', notes:'' })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    const req = ['batch_id','drug_name','from_actor','from_location','to_actor','to_location','quantity']
    if (req.some(k => !form[k])) { toast('⚠️','Missing Fields','Fill in all required fields.','var(--amber)'); return }
    setLoading(true)
    try {
      await addTransfer({ ...form, quantity: parseInt(form.quantity) })
      toast('✅','Transfer Logged!',`${form.drug_name} transferred to ${form.to_actor}.`)
      setForm({ batch_id:'', drug_name:'', from_actor:'', from_location:'', to_actor:'', to_location:'', quantity:'', notes:'' })
    } catch (e) {
      toast('❌','Error', e?.response?.data?.error || 'Could not log transfer.', 'var(--red)')
    }
    setLoading(false)
  }

  const ROLES_TRANSFER = [
    { id:'manufacturer', icon:'🏭', title:'Manufacturer',          desc:'Shipping from factory to distributor' },
    { id:'distributor',  icon:'🚚', title:'Distributor',           desc:'Moving stock to regional warehouses or pharmacies' },
    { id:'wholesaler',   icon:'🏗️', title:'Wholesaler',            desc:'C&F agent redistributing to sub-stockists' },
    { id:'hospital',     icon:'🏥', title:'Hospital / Pharmacy',   desc:'Internal transfer between departments or branches' },
  ]
  const [tRole, setTRole] = useState(null)
  const [tStep, setTStep] = useState(1)
  const [tErrors, setTErrors] = useState({})
  const [tNewBlock, setTNewBlock] = useState(null)
  const TRANSPORT = ['Road (Refrigerated Truck)','Road (Standard Truck)','Rail','Air Freight','Sea Freight','Courier']

  const setT = (k,v) => { setForm(f=>({...f,[k]:v})); setTErrors(e=>({...e,[k]:false})) }

  const validateTransfer = () => {
    const req = { batch_id:1, drug_name:1, to_actor:1, to_location:1 }
    const errs = {}
    Object.keys(req).forEach(k => { if (!form[k]) errs[k] = true })
    if (form.quantity && parseInt(form.quantity) <= 0) errs.quantity = true
    if (!form.quantity) errs.quantity = true
    setTErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goTStep = (n) => {
    if (n === 2 && !tRole) { toast('⚠️','Select a Role','Choose who is sending.','var(--amber)'); return }
    if (n === 3 && !validateTransfer()) { toast('⚠️','Errors Found','Fix highlighted fields.','var(--amber)'); return }
    setTStep(n)
  }

  const submitT = async () => {
    setLoading(true)
    try {
      const res = await addTransfer({ ...form, from_actor: form.from_actor || tRole, quantity: parseInt(form.quantity) })
      setTNewBlock(res.block)
      toast('✅','Transfer Logged!',`${form.drug_name} → ${form.to_actor}.`)
      setTStep(4)
    } catch (e) {
      toast('❌','Error', e?.response?.data?.error || 'Could not log transfer.', 'var(--red)')
    }
    setLoading(false)
  }

  const resetT = () => {
    setTStep(1); setTRole(null); setTErrors({}); setTNewBlock(null)
    setForm({ batch_id:'', drug_name:'', from_actor:'', from_location:'', to_actor:'', to_location:'', quantity:'', notes:'' })
  }

  const tInp = (k) => ({
    background: 'var(--card)', border: `1.5px solid ${tErrors[k] ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 9, color: 'var(--text)', fontFamily: 'var(--font-mono)',
    fontSize: 12, padding: '11px 14px', outline: 'none', width: '100%',
    boxShadow: tErrors[k] ? '0 0 0 3px var(--red-dim)' : 'none', transition: 'border-color .2s',
  })

  const tPct = { 1:33, 2:66, 3:90, 4:100 }[tStep]

  return (
    <PageWrap>
      {/* Stepper */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:20 }}>
        {[['Actor','1'],['Shipment','2'],['Confirm','3']].map(([label,num],i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flex: i<2?1:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontSize:13,fontWeight:800,border:'2px solid',flexShrink:0,
                background: tStep>i+1?'var(--mint)':tStep===i+1?'var(--mint-dim)':'transparent',
                borderColor: tStep>=i+1?'var(--mint)':'var(--border2)',
                color: tStep>i+1?'#04080F':tStep===i+1?'var(--mint)':'var(--text-dim)',
                transition:'all .3s' }}>{tStep>i+1?'✓':num}</div>
              <span style={{ fontSize:11,fontWeight:600,color:tStep>=i+1?'var(--mint)':'var(--text-dim)' }}>{label}</span>
            </div>
            {i<2 && <div style={{ flex:1,height:1,margin:'0 12px',background:tStep>i+1?'var(--mint)':'var(--border2)',transition:'background .3s' }}/>}
          </div>
        ))}
      </div>
      <div style={{ height:3,background:'var(--border)',borderRadius:2,marginBottom:28,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${tPct}%`,background:'var(--mint)',borderRadius:2,transition:'width .4s cubic-bezier(.4,0,.2,1)',boxShadow:'0 0 8px var(--mint-glow)' }}/>
      </div>

      {/* Step 1 — Role */}
      {tStep === 1 && (
        <div style={{ animation:'fadeUp .3s ease' }}>
          <SectionHeader title="Who is sending this shipment?" />
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24 }}>
            {ROLES_TRANSFER.map(r => (
              <div key={r.id} onClick={() => setTRole(r.id)} style={{
                background: tRole===r.id?'var(--mint-dim)':'var(--card)',
                border:`2px solid ${tRole===r.id?'var(--mint)':'var(--border)'}`,
                borderRadius:12,padding:'20px 16px',cursor:'pointer',transition:'all .25s',
                boxShadow:tRole===r.id?'0 0 20px var(--mint-glow)':'none',
              }}>
                <div style={{ fontSize:26,marginBottom:10 }}>{r.icon}</div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:tRole===r.id?'var(--mint)':'#fff',marginBottom:4 }}>{r.title}</div>
                <div style={{ fontSize:10,color:tRole===r.id?'rgba(0,229,176,.6)':'var(--text-dim)',lineHeight:1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end' }}>
            <Btn variant="primary" onClick={() => goTStep(2)}>Next: Shipment Details →</Btn>
          </div>
        </div>
      )}

      {/* Step 2 — Form */}
      {tStep === 2 && (
        <div style={{ animation:'fadeUp .3s ease' }}>
          <SectionHeader title="🚚 Shipment Details" right={<Btn onClick={()=>setTStep(1)} style={{fontSize:11}}>← Back</Btn>}/>
          <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:28,marginBottom:20 }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
              {[
                {label:'Batch ID *', key:'batch_id', ph:'e.g. B001'},
                {label:'Drug Name *', key:'drug_name', ph:'e.g. Paracetamol 500mg'},
                {label:'Sending Party', key:'from_actor', ph:`e.g. ${tRole||'Sender name'}`},
                {label:'From Location', key:'from_location', ph:'e.g. Mumbai, India'},
                {label:'Receiving Party *', key:'to_actor', ph:'e.g. MedDistrib Pvt. Ltd.'},
                {label:'To Location *', key:'to_location', ph:'e.g. Pune, India'},
                {label:'Quantity (units) *', key:'quantity', ph:'e.g. 5000', type:'number'},
              ].map(f => (
                <div key={f.key} style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  <div style={{ fontSize:10,color:tErrors[f.key]?'var(--red)':'var(--text-dim)',letterSpacing:1,textTransform:'uppercase',display:'flex',justifyContent:'space-between' }}>
                    <span>{f.label}</span>
                    {tErrors[f.key] && <span style={{fontSize:9}}>⚠ required</span>}
                  </div>
                  <input type={f.type||'text'} value={form[f.key]} onChange={e=>setT(f.key,e.target.value)}
                    placeholder={f.ph} style={tInp(f.key)}
                    onFocus={e=>{if(!tErrors[f.key]){e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}}
                    onBlur={e=>{if(!tErrors[f.key]){e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}}
                  />
                </div>
              ))}
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                <label style={{ fontSize:10,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase' }}>Transport Mode</label>
                <select value={form.transport_mode||''} onChange={e=>setT('transport_mode',e.target.value)}
                  style={{ ...tInp(''), borderColor:'var(--border)',boxShadow:'none',appearance:'none',cursor:'pointer' }}>
                  <option value="">— Select (optional) —</option>
                  {TRANSPORT.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:6 }}>
                <div style={{ display:'flex',justifyContent:'space-between' }}>
                  <label style={{ fontSize:10,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase' }}>Shipment Notes</label>
                  <span style={{ fontSize:9,color:form.notes?.length>170?'var(--amber)':'var(--text-dim)' }}>{form.notes?.length||0}/200</span>
                </div>
                <input value={form.notes||''} onChange={e=>setT('notes',e.target.value)} maxLength={200}
                  placeholder="e.g. Cold-chain maintained throughout, sealed with tamper-evident tape…"
                  style={{ ...tInp(''),borderColor:'var(--border)',boxShadow:'none' }}
                  onFocus={e=>{e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}} />
              </div>
            </div>
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
            <Btn onClick={resetT}>Clear</Btn>
            <Btn variant="primary" onClick={() => goTStep(3)}>Review & Confirm →</Btn>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {tStep === 3 && (
        <div style={{ animation:'fadeUp .3s ease' }}>
          <SectionHeader title="Confirm Transfer" right={<Btn onClick={()=>setTStep(2)} style={{fontSize:11}}>← Edit</Btn>}/>
          <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:28,marginBottom:20 }}>
            <div style={{ background:'var(--amber-dim)',border:'1px solid rgba(255,184,0,.2)',borderRadius:9,padding:'12px 16px',marginBottom:20,fontSize:11,color:'var(--amber)',display:'flex',gap:10,alignItems:'center' }}>
              <span style={{fontSize:16}}>⚠️</span><span>Transfer records are <strong>immutable once written</strong>. Confirm all parties and quantities.</span>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              {[['Sender Role',tRole],['Batch ID',form.batch_id],['Drug Name',form.drug_name],['From',`${form.from_actor||tRole} / ${form.from_location}`],['To',`${form.to_actor} / ${form.to_location}`],['Quantity',`${form.quantity} units`],['Transport',form.transport_mode||'Not specified'],['Notes',form.notes||'—']].map(([k,v]) => (
                <div key={k} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 14px', gridColumn: k==='Notes'?'1/-1':undefined }}>
                  <div style={{ fontSize:9,color:'var(--text-dim)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:12,color:'var(--text)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
            <Btn onClick={()=>setTStep(2)}>← Edit</Btn>
            <Btn variant="primary" onClick={submitT}>{loading?'⏳ Writing to chain…':'⛓ Log Transfer'}</Btn>
          </div>
        </div>
      )}

      {/* Step 4 — Success */}
      {tStep === 4 && (
        <div style={{ textAlign:'center',padding:'40px 20px',animation:'fadeUp .4s ease' }}>
          <div style={{ width:72,height:72,background:'var(--mint-dim)',border:'2px solid var(--mint)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 20px',boxShadow:'0 0 32px var(--mint-glow)' }}>🚚</div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:'var(--mint)',marginBottom:8 }}>Transfer Logged!</div>
          <div style={{ fontSize:12,color:'var(--text-mid)',marginBottom:24 }}>{form.drug_name} successfully transferred to {form.to_actor}.</div>
          {tNewBlock && (
            <div style={{ background:'var(--card)',border:'2px solid var(--mint)',borderRadius:12,padding:20,textAlign:'left',boxShadow:'0 0 28px var(--mint-glow)',marginBottom:24 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12 }}>
                <span style={{ background:'var(--mint)',color:'#04080F',fontFamily:'var(--font-display)',fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:100 }}>NEW BLOCK MINTED</span>
                <span style={{ fontSize:10,color:'var(--text-dim)' }}>Block #{tNewBlock.index}</span>
              </div>
              <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,color:'var(--mint)',marginBottom:6 }}>TRANSFERRED</div>
              <div style={{ fontSize:11,color:'var(--text-mid)',marginBottom:10 }}>Batch: {tNewBlock.data?.batch_id}</div>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-dim)',wordBreak:'break-all',lineHeight:1.6 }}>
                hash: <span style={{ color:'var(--mint)' }}>{tNewBlock.hash}</span>
              </div>
            </div>
          )}
          <div style={{ display:'flex',justifyContent:'center',gap:12 }}>
            <Btn onClick={resetT}>Log Another</Btn>
            <Btn variant="primary" onClick={() => window.location.href = '/provenance'}>QR Verify →</Btn>
          </div>
        </div>
      )}
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  DISPENSE TO PATIENT (NEW - Phase 4)
// ══════════════════════════════════════════════════════════════
export function Dispense() {
  const [form, setForm] = useState({ batch_id:'', drug_name:'', pharmacy:'', patient_id:'', quantity:'', prescription:'', dosage:'', pharmacist:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [newBlock, setNewBlock] = useState(null)

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:false})) }

  const inp = (k) => ({
    background:'var(--card)', border:`1.5px solid ${errors[k]?'var(--red)':'var(--border)'}`,
    borderRadius:9, color:'var(--text)', fontFamily:'var(--font-mono)', fontSize:12,
    padding:'11px 14px', outline:'none', width:'100%',
    boxShadow: errors[k]?'0 0 0 3px var(--red-dim)':'none', transition:'border-color .2s',
  })

  const submit = async () => {
    const req = { batch_id:1, pharmacy:1, patient_id:1, quantity:1 }
    const errs = {}
    Object.keys(req).forEach(k => { if (!form[k]) errs[k] = true })
    if (form.quantity && parseInt(form.quantity) <= 0) errs.quantity = true
    setErrors(errs)
    if (Object.keys(errs).length) { toast('⚠️','Missing Fields','Fix highlighted errors.','var(--amber)'); return }
    setLoading(true)
    try {
      const res = await import('./api').then(m => m.addDispense({ ...form, quantity: parseInt(form.quantity) }))
      setNewBlock(res.block)
      toast('✅','Dispensing Recorded!',`Patient ${form.patient_id} received ${form.quantity} units.`)
    } catch (e) {
      toast('❌','Error', e?.response?.data?.error || 'Could not record dispensing.', 'var(--red)')
    }
    setLoading(false)
  }

  return (
    <PageWrap>
      <SectionHeader title="🏥 Dispense Drug to Patient" />
      <div style={{ background:'var(--blue-dim)',border:'1px solid rgba(59,130,246,.2)',borderRadius:9,padding:'12px 16px',marginBottom:20,fontSize:11,color:'#93C5FD',display:'flex',gap:10 }}>
        <span style={{fontSize:16}}>ℹ️</span>
        <span>Patient ID is <strong>anonymized</strong> — never store real names. Use hospital reference codes only.</span>
      </div>
      <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:28,marginBottom:20 }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          {[
            {label:'Batch ID *', key:'batch_id', ph:'e.g. B001'},
            {label:'Drug Name', key:'drug_name', ph:'e.g. Paracetamol 500mg'},
            {label:'Pharmacy / Hospital *', key:'pharmacy', ph:'e.g. HealthPlus Pharmacy, Pune', full:true},
            {label:'Patient Reference ID *', key:'patient_id', ph:'e.g. PAT-7823 (anonymized)', hint:'🔒 No real names — anonymized IDs only'},
            {label:'Quantity Dispensed *', key:'quantity', ph:'e.g. 30 tablets', type:'number'},
            {label:'Prescription ID', key:'prescription', ph:'e.g. RX-2025-9912'},
            {label:'Dosage Instructions', key:'dosage', ph:'e.g. 500mg twice daily after meals'},
            {label:'Dispensing Pharmacist', key:'pharmacist', ph:'e.g. Regd. No. MH-7842'},
          ].map(f => (
            <div key={f.key} style={{ display:'flex',flexDirection:'column',gap:6, gridColumn:f.full?'1/-1':undefined }}>
              <div style={{ fontSize:10,color:errors[f.key]?'var(--red)':'var(--text-dim)',letterSpacing:1,textTransform:'uppercase',display:'flex',justifyContent:'space-between' }}>
                <span>{f.label}</span>
                {errors[f.key] && <span style={{fontSize:9}}>⚠ required</span>}
              </div>
              <input type={f.type||'text'} value={form[f.key]} onChange={e=>set(f.key,e.target.value)}
                placeholder={f.ph} style={inp(f.key)}
                onFocus={e=>{if(!errors[f.key]){e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}}
                onBlur={e=>{if(!errors[f.key]){e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}}
              />
              {f.hint && <div style={{ fontSize:10,color:'var(--text-dim)' }}>{f.hint}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
        <Btn onClick={() => { setForm({ batch_id:'',drug_name:'',pharmacy:'',patient_id:'',quantity:'',prescription:'',dosage:'',pharmacist:'' }); setNewBlock(null); setErrors({}); }}>Clear</Btn>
        <Btn variant="primary" onClick={submit}>{loading?'⏳ Recording…':'⛓ Record Dispensing'}</Btn>
      </div>
      {newBlock && (
        <div style={{ marginTop:24,textAlign:'center',animation:'fadeUp .4s ease' }}>
          <div style={{ width:72,height:72,background:'var(--blue-dim)',border:'2px solid var(--blue)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px',boxShadow:'0 0 28px rgba(59,130,246,.3)' }}>🏥</div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,color:'var(--blue)',marginBottom:6 }}>Dispensing Recorded!</div>
          <div style={{ fontSize:12,color:'var(--text-mid)',marginBottom:20 }}>Patient received medicine — final supply chain step complete.</div>
          <div style={{ background:'var(--card)',border:'2px solid var(--blue)',borderRadius:12,padding:20,textAlign:'left',boxShadow:'0 0 20px rgba(59,130,246,.2)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
              <span style={{ background:'var(--blue)',color:'#fff',fontFamily:'var(--font-display)',fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:100 }}>BLOCK MINTED</span>
              <span style={{ fontSize:10,color:'var(--text-dim)' }}>Block #{newBlock.index}</span>
            </div>
            <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'var(--blue)',marginBottom:6 }}>DISPENSED</div>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-dim)',wordBreak:'break-all' }}>hash: <span style={{color:'var(--blue)'}}>{newBlock.hash}</span></div>
          </div>
        </div>
      )}
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  FLAG SUSPICIOUS BATCH (NEW - Phase 4)
// ══════════════════════════════════════════════════════════════
const ISSUE_CATEGORIES = [
  'Packaging tampered / seal broken','Failed quality / purity test',
  'Wrong active ingredient','Incorrect dosage amount','Expired medicine relabeled',
  'No batch record on blockchain','Chain of custody broken',
  'Patient adverse reaction reported','Other (describe below)',
]

export function FlagBatch() {
  const [form, setForm] = useState({ batch_id:'', drug_name:'', flagged_by:'', reason:'', category:'', ref_id:'', date_discovered:'' })
  const [severity, setSeverity] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [newBlock, setNewBlock] = useState(null)

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:false})) }

  const inp = (k) => ({
    background:'var(--card)',border:`1.5px solid ${errors[k]?'var(--red)':'var(--border)'}`,
    borderRadius:9,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:12,
    padding:'11px 14px',outline:'none',width:'100%',
    boxShadow:errors[k]?'0 0 0 3px var(--red-dim)':'none',transition:'border-color .2s',
  })

  const submit = async () => {
    if (!severity) { toast('⚠️','Select Severity','Choose a severity level.','var(--amber)'); return }
    const req = { batch_id:1, flagged_by:1, reason:1 }
    const errs = {}
    Object.keys(req).forEach(k => { if (!form[k]) errs[k] = true })
    setErrors(errs)
    if (Object.keys(errs).length) { toast('⚠️','Missing Fields','Fix highlighted errors.','var(--amber)'); return }
    setLoading(true)
    try {
      const res = await flagBatch({ ...form, severity, reason: `[${severity.toUpperCase()}] ${form.category ? form.category + ': ' : ''}${form.reason}` })
      setNewBlock(res.block)
      toast('🚨','Alert Recorded!',`Batch ${form.batch_id} flagged on chain.`,'var(--red)')
    } catch (e) {
      toast('❌','Error', e?.response?.data?.error || 'Could not flag batch.', 'var(--red)')
    }
    setLoading(false)
  }

  const SEVS = [
    { id:'low',  label:'Low',    emoji:'🟡', desc:'Suspicious packaging only',   cls:'sel-low'  },
    { id:'med',  label:'Medium', emoji:'🟠', desc:'Lab test inconsistency',       cls:'sel-med'  },
    { id:'high', label:'High',   emoji:'🔴', desc:'Confirmed counterfeit / harm', cls:'sel-high' },
  ]
  const sevColors = { low:'var(--mint)', med:'var(--amber)', high:'var(--red)' }

  return (
    <PageWrap>
      <SectionHeader title="🚨 Flag Suspicious Batch" />
      <div style={{ background:'var(--red-dim)',border:'1px solid rgba(255,45,85,.25)',borderRadius:9,padding:'14px 16px',marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,color:'var(--red)',marginBottom:4 }}>⚠ Counterfeit Alert System</div>
        <div style={{ fontSize:11,color:'var(--text-mid)',lineHeight:1.7 }}>
          Flagging is <strong>permanent and visible to all chain participants</strong>. Use only for confirmed or strongly suspected counterfeit/tampered medicines. This record cannot be removed.
        </div>
      </div>
      <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:28,marginBottom:20 }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          {[
            {label:'Batch ID *', key:'batch_id', ph:'e.g. B002'},
            {label:'Drug Name', key:'drug_name', ph:'e.g. Amoxicillin 250mg'},
            {label:'Flagged By (Organization) *', key:'flagged_by', ph:'e.g. Apollo Hospital, Chennai', full:true},
          ].map(f => (
            <div key={f.key} style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:f.full?'1/-1':undefined }}>
              <div style={{ fontSize:10,color:errors[f.key]?'var(--red)':'var(--text-dim)',letterSpacing:1,textTransform:'uppercase',display:'flex',justifyContent:'space-between' }}>
                <span>{f.label}</span>{errors[f.key] && <span style={{fontSize:9}}>⚠ required</span>}
              </div>
              <input value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.ph} style={inp(f.key)}
                onFocus={e=>{if(!errors[f.key]){e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}}
                onBlur={e=>{if(!errors[f.key]){e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}}
              />
            </div>
          ))}

          {/* Severity */}
          <div style={{ gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:8 }}>
            <label style={{ fontSize:10,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase' }}>Severity Level *</label>
            <div style={{ display:'flex',gap:10 }}>
              {SEVS.map(s => (
                <div key={s.id} onClick={() => setSeverity(s.id)} style={{
                  flex:1,padding:'12px 10px',borderRadius:9,border:`1.5px solid`,textAlign:'center',cursor:'pointer',transition:'all .2s',
                  borderColor: severity===s.id ? sevColors[s.id] : 'var(--border)',
                  background: severity===s.id ? `${sevColors[s.id]}18` : 'var(--bg2)',
                }}>
                  <div style={{ fontSize:18,marginBottom:4 }}>{s.emoji}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:12,fontWeight:700,color:severity===s.id?sevColors[s.id]:'var(--text-mid)' }}>{s.label}</div>
                  <div style={{ fontSize:9,color:'var(--text-dim)',marginTop:2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:10,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase' }}>Issue Category *</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)}
              style={{ ...inp('category'),borderColor:'var(--border)',boxShadow:'none',appearance:'none',cursor:'pointer' }}>
              <option value="">— Select issue type —</option>
              {ISSUE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:10,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase' }}>Date Discovered</label>
            <input type="date" value={form.date_discovered} onChange={e=>set('date_discovered',e.target.value)}
              style={{ ...inp('date_discovered'),borderColor:'var(--border)',boxShadow:'none' }}
              onFocus={e=>{e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}
              onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}/>
          </div>
          <div style={{ gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:6 }}>
            <div style={{ display:'flex',justifyContent:'space-between' }}>
              <label style={{ fontSize:10,color:errors.reason?'var(--red)':'var(--text-dim)',letterSpacing:1,textTransform:'uppercase' }}>Detailed Reason * {errors.reason && <span style={{fontSize:9}}> — ⚠ required</span>}</label>
              <span style={{ fontSize:9,color:form.reason.length>425?'var(--amber)':'var(--text-dim)' }}>{form.reason.length}/500</span>
            </div>
            <textarea value={form.reason} onChange={e=>set('reason',e.target.value)} maxLength={500} rows={4}
              placeholder="Describe in detail: what you observed, test results, patient symptoms, evidence of tampering…"
              style={{ ...inp('reason'),resize:'vertical',minHeight:90,fontFamily:'var(--font-mono)' }}
              onFocus={e=>{if(!errors.reason){e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}}
              onBlur={e=>{if(!errors.reason){e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}}
            />
          </div>
          <div style={{ gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:10,color:'var(--text-dim)',letterSpacing:1,textTransform:'uppercase' }}>Reference / Report ID</label>
            <input value={form.ref_id} onChange={e=>set('ref_id',e.target.value)}
              placeholder="e.g. Apollo Lab Report #LB-2025-0042"
              style={{ ...inp('ref_id'),borderColor:'var(--border)',boxShadow:'none' }}
              onFocus={e=>{e.target.style.borderColor='var(--mint)';e.target.style.boxShadow='0 0 0 3px var(--mint-dim)'}}
              onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}/>
          </div>
        </div>
      </div>
      <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
        <Btn onClick={() => { setForm({ batch_id:'',drug_name:'',flagged_by:'',reason:'',category:'',ref_id:'',date_discovered:'' }); setSeverity(null); setNewBlock(null); setErrors({}); }}>Clear</Btn>
        <Btn variant="danger" onClick={submit} style={{ fontWeight:700 }}>
          {loading ? '⏳ Writing to chain…' : '🚨 Submit Alert to Blockchain'}
        </Btn>
      </div>
      {newBlock && (
        <div style={{ marginTop:24,textAlign:'center',animation:'fadeUp .4s ease' }}>
          <div style={{ width:72,height:72,background:'var(--red-dim)',border:'2px solid var(--red)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px',boxShadow:'0 0 28px var(--red-glow)' }}>🚨</div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,color:'var(--red)',marginBottom:6 }}>Alert Recorded on Chain</div>
          <div style={{ fontSize:12,color:'var(--text-mid)',marginBottom:20 }}>All participants can now see this flag when verifying batch {form.batch_id}.</div>
          <div style={{ background:'var(--card)',border:'2px solid var(--red)',borderRadius:12,padding:20,textAlign:'left',boxShadow:'0 0 20px var(--red-glow)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
              <span style={{ background:'var(--red)',color:'#fff',fontFamily:'var(--font-display)',fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:100 }}>BLOCK MINTED</span>
              <span style={{ fontSize:10,color:'var(--text-dim)' }}>Block #{newBlock.index}</span>
            </div>
            <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'var(--red)',marginBottom:6 }}>FLAGGED</div>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-dim)',wordBreak:'break-all' }}>hash: <span style={{color:'var(--red)'}}>{newBlock.hash}</span></div>
          </div>
        </div>
      )}
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  TAMPER LAB
// ══════════════════════════════════════════════════════════════
// ── Attack scenario configs ───────────────────────────────
const ATTACK_SCENARIOS = [
  { id:'diversion', icon:'💊', title:'Drug Diversion',        severity:'high',
    desc:'Reduce quantity 10,000→50. Diverted doses hit black market.',
    motive:'💰 Divert 9,950 units to the black market, replace with counterfeits.',
    blockFinder: c => c.find(b => b.data?.event==='TRANSFERRED' && b.data?.batch_id==='B001'),
    field:'quantity', newVal: 50 },
  { id:'expiry',    icon:'📅', title:'Expiry Fraud',          severity:'high',
    desc:'Relabel expired batch with future date to resell unsafe drugs.',
    motive:'☠️ Batch expired in 2027 — relabeled 2029 to resell dangerous drugs.',
    blockFinder: c => c.find(b => b.data?.event==='BATCH_CREATED' && b.data?.batch_id==='B001'),
    field:'expiry_date', newVal:'2029-12-31' },
  { id:'forgery',   icon:'🏭', title:'Manufacturer Forgery',  severity:'high',
    desc:'Replace legitimate manufacturer with a counterfeit producer.',
    motive:'🏭 Attribute counterfeit drugs to a trusted brand name.',
    blockFinder: c => c.find(b => b.data?.event==='BATCH_CREATED' && b.data?.batch_id==='B001'),
    field:'manufacturer', newVal:'FakePharma Pvt. Ltd.' },
  { id:'route',     icon:'🚚', title:'Route Hijack',          severity:'med',
    desc:'Redirect shipment to an unauthorized handler.',
    motive:'🚚 Divert to unlicensed broker — drugs can be repackaged or diluted.',
    blockFinder: c => c.find(b => b.data?.event==='TRANSFERRED' && b.data?.batch_id==='B002'),
    field:'to_actor', newVal:'Unlicensed Broker XYZ' },
  { id:'identity',  icon:'🏷️', title:'Batch ID Swap',         severity:'med',
    desc:'Swap batch ID to pass off a different drug as this one.',
    motive:'🏷️ Counterfeit drugs pass provenance checks for a legitimate batch.',
    blockFinder: c => c.find(b => b.data?.event==='BATCH_CREATED' && b.data?.batch_id==='B002'),
    field:'batch_id', newVal:'B999-FAKE' },
  { id:'custom',    icon:'⚙️', title:'Custom Attack',          severity:'low',
    desc:'Choose any block, field and value manually.', motive:'', blockFinder:null, field:'', newVal:'' },
]
const SEV_COLOR = { high:'var(--red)', med:'var(--amber)', low:'var(--blue)' }

export function TamperLab() {
  const [chain,        setChain]        = useState([])
  const [activeScen,   setActiveScen]   = useState(null)
  const [customBlock,  setCustomBlock]  = useState('')
  const [customField,  setCustomField]  = useState('')
  const [customVal,    setCustomVal]    = useState('')
  const [tampIdx,      setTampIdx]      = useState(null)
  const [firstBadIdx,  setFirstBadIdx]  = useState(null)
  const [selected,     setSelected]     = useState(null)
  const [result,       setResult]       = useState(null)
  const [hashDiff,     setHashDiff]     = useState(null)  // {orig, recomp}
  const [forensics,    setForensics]    = useState(null)  // {block,field,oldVal,newVal}
  const [attackLog,    setAttackLog]    = useState([])
  const [loading,      setLoading]      = useState(false)
  const [counterShown, setCounterShown] = useState(false)
  const [counterMsg,   setCounterMsg]   = useState('')

  useEffect(() => {
    getChain().then(r => setChain(r.chain || [])).catch(() => {})
  }, [])

  // Compute first bad index from current chain state
  const computeFirstBad = (tamperedBlockIdx) => {
    if (tamperedBlockIdx == null) return null
    return tamperedBlockIdx  // first bad is the tampered block itself (self-integrity fails)
  }

  // Build char-level hash diff for display
  const buildHashDiff = (orig, recomp) => {
    let matches = 0, misses = 0
    const origSpans = [], newSpans = []
    for (let i = 0; i < 64; i++) {
      const oc = orig[i]||'', nc = recomp[i]||''
      if (oc === nc) {
        origSpans.push({ ch:oc, same:true })
        newSpans.push({ ch:nc, same:true })
        matches++
      } else {
        origSpans.push({ ch:oc, same:false, isOrig:true })
        newSpans.push({ ch:nc, same:false, isOrig:false })
        misses++
      }
    }
    return { origSpans, newSpans, matches, misses, pct: Math.round((misses/64)*100) }
  }

  const execute = async () => {
    if (!activeScen) { toast('⚠️','No Scenario','Pick an attack scenario first.','var(--amber)'); return }
    const scen = ATTACK_SCENARIOS.find(s => s.id === activeScen)
    let targetBlock, field, newVal

    if (activeScen === 'custom') {
      targetBlock = chain.find(b => b.index === parseInt(customBlock))
      field = customField; newVal = customVal
      if (!targetBlock || !field || !newVal) { toast('⚠️','Incomplete','Fill all custom fields.','var(--amber)'); return }
    } else {
      targetBlock = scen.blockFinder(chain)
      field = scen.field; newVal = scen.newVal
      if (!targetBlock) { toast('⚠️','Block Missing','Reset chain and try again.','var(--amber)'); return }
    }

    const oldVal = targetBlock.data[field]
    const origHash = targetBlock.hash
    setLoading(true)

    try {
      // Build tampered data
      const newData = { ...targetBlock.data, [field]: isNaN(newVal) ? newVal : Number(newVal) }
      const r = await tamperBlock(targetBlock.index, newData)
      const updated = await getChain()
      const newChain = updated.chain || []
      setChain(newChain)

      // Compute what the hash WOULD be with new data
      // We know origHash != stored hash after tamper on backend (backend doesn't recompute)
      // For display purposes generate a fake "recomputed" hash by hashing a different string
      const enc = new TextEncoder().encode(JSON.stringify({ ...newData, idx: targetBlock.index }))
      const buf = await crypto.subtle.digest('SHA-256', enc)
      const recompHash = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')

      setTampIdx(targetBlock.index)
      setFirstBadIdx(targetBlock.index)
      setResult(r)
      setHashDiff(buildHashDiff(origHash, recompHash))
      setForensics({ block: targetBlock, field, oldVal, newVal, origHash, recompHash })
      setAttackLog(prev => [{
        scenario: activeScen, blockIdx: targetBlock.index, field, oldVal, newVal,
        motive: scen.motive || 'Custom attack', time: new Date()
      }, ...prev].slice(0,5))
      setCounterShown(false); setCounterMsg('')
      toast('🔴', `Block #${targetBlock.index} Compromised`, `${field}: "${oldVal}" → "${newVal}"`, 'var(--red)')
    } catch (e) {
      toast('❌','Error', e?.response?.data?.error || 'Tamper failed.', 'var(--red)')
    }
    setLoading(false)
  }

  const handleReset = async () => {
    try {
      await resetChain()
      const c = await getChain()
      setChain(c.chain || [])
      setTampIdx(null); setFirstBadIdx(null); setSelected(null)
      setResult(null); setHashDiff(null); setForensics(null)
      setActiveScen(null); setCounterShown(false); setCounterMsg('')
      setCustomBlock(''); setCustomField(''); setCustomVal('')
      toast('↺','Chain Reset','Blockchain restored to clean state.')
    } catch { toast('❌','Error','Could not reach Flask server.','var(--red)') }
  }

  const customBlockData = chain.find(b => b.index === parseInt(customBlock))
  const customFields = customBlockData
    ? Object.keys(customBlockData.data).filter(k => !['event','timestamp'].includes(k))
    : []

  const impactPct = firstBadIdx != null
    ? Math.round(((chain.length - firstBadIdx) / chain.length) * 100) : 0

  const charStyle = (span) => ({
    fontFamily:'var(--font-mono)', fontSize: 10, letterSpacing: '.3px',
    color: span.same ? 'var(--text-dim)' : span.isOrig ? 'var(--mint)' : 'var(--red)',
    background: span.same ? 'none' : span.isOrig ? 'rgba(0,229,176,.12)' : 'rgba(255,45,85,.2)',
    borderRadius: 2, padding: '0 1px',
  })

  return (
    <PageWrap>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>
      {/* ── LEFT COLUMN ── */}
      <div>

      {/* Attack Scenarios */}
      <div style={card()}>
        <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--red)',boxShadow:'0 0 6px var(--red)',display:'inline-block' }}/>
          Pre-Built Attack Scenarios
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16 }}>
          {ATTACK_SCENARIOS.map(sc => (
            <div key={sc.id} onClick={() => setActiveScen(sc.id)} style={{
              background: activeScen===sc.id ? 'var(--red-dim)' : 'var(--bg2)',
              border: `1.5px solid ${activeScen===sc.id ? 'var(--red)' : 'var(--border)'}`,
              borderRadius:10, padding:'14px 12px', cursor:'pointer', transition:'all .2s',
              boxShadow: activeScen===sc.id ? '0 0 16px rgba(255,45,85,.2)' : 'none',
            }}>
              <div style={{ fontSize:20,marginBottom:8 }}>{sc.icon}</div>
              <div style={{ fontFamily:'var(--font-display)',fontSize:12,fontWeight:700,color:activeScen===sc.id?'var(--red)':'#fff',marginBottom:3 }}>{sc.title}</div>
              <div style={{ fontSize:10,color:'var(--text-dim)',lineHeight:1.4,marginBottom:8 }}>{sc.desc}</div>
              <span style={{ fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:100,textTransform:'uppercase',letterSpacing:'.5px',background:`${SEV_COLOR[sc.severity]}20`,color:SEV_COLOR[sc.severity] }}>
                {sc.severity === 'high' ? 'High' : sc.severity === 'med' ? 'Medium' : 'Manual'}
              </span>
            </div>
          ))}
        </div>

        {/* Scenario preview */}
        {activeScen && activeScen !== 'custom' && (() => {
          const sc = ATTACK_SCENARIOS.find(s=>s.id===activeScen)
          const tb = sc.blockFinder(chain)
          return tb ? (
            <div style={{ background:'var(--bg2)',border:'1px solid rgba(255,45,85,.25)',borderRadius:9,padding:14,marginBottom:14 }}>
              <div style={{ fontSize:9,color:'var(--red)',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:8,fontWeight:700 }}>ATTACK PLAN</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,fontSize:11 }}>
                <div><span style={{color:'var(--text-dim)'}}>Target: </span><span style={{fontWeight:600}}>Block #{tb.index} ({tb.data.event})</span></div>
                <div><span style={{color:'var(--text-dim)'}}>Field: </span><span style={{fontWeight:600}}>{sc.field}</span></div>
                <div><span style={{color:'var(--text-dim)'}}>New Val: </span><span style={{color:'var(--red)',fontWeight:700}}>{String(sc.newVal)}</span></div>
              </div>
              <div style={{ marginTop:8,fontSize:10,color:'var(--text-dim)' }}>{sc.motive}</div>
            </div>
          ) : null
        })()}

        {/* Custom controls */}
        {activeScen === 'custom' && (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              <label style={{ fontSize:9,color:'var(--text-dim)',letterSpacing:'1.5px',textTransform:'uppercase' }}>Target Block</label>
              <select value={customBlock} onChange={e=>{setCustomBlock(e.target.value);setCustomField('')}}
                style={{ background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:12,padding:'9px 12px',outline:'none',appearance:'none' }}>
                <option value="">— Pick a block —</option>
                {chain.slice(1).map(b => <option key={b.index} value={b.index}>Block #{b.index} — {b.data?.event} ({b.data?.batch_id||'—'})</option>)}
              </select>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              <label style={{ fontSize:9,color:'var(--text-dim)',letterSpacing:'1.5px',textTransform:'uppercase' }}>Field to Modify</label>
              <select value={customField} onChange={e=>setCustomField(e.target.value)}
                style={{ background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:12,padding:'9px 12px',outline:'none',appearance:'none' }}>
                <option value="">— Pick a field —</option>
                {customFields.map(f => <option key={f} value={f}>{f} = {String(customBlockData?.data[f]).substring(0,20)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1',display:'flex',flexDirection:'column',gap:5 }}>
              <label style={{ fontSize:9,color:'var(--text-dim)',letterSpacing:'1.5px',textTransform:'uppercase' }}>Fraudulent Value</label>
              <input value={customVal} onChange={e=>setCustomVal(e.target.value)} placeholder="Enter the falsified value…"
                style={{ background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:12,padding:'9px 12px',outline:'none',width:'100%' }}/>
            </div>
          </div>
        )}

        <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
          <Btn variant="danger" onClick={execute} style={{ opacity: loading ? .6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
            {loading ? '⏳ Injecting…' : '⚡ Execute Attack'}
          </Btn>
          <Btn onClick={handleReset}>↺ Reset Chain</Btn>
          {result && (
            <Btn variant="amber" onClick={() => { setCounterShown(true); setCounterMsg(`Block #${tampIdx} re-hashed. But Block #${tampIdx+1} still stores the OLD hash as its previous_hash — the cascade can't be stopped without re-signing every subsequent block with all participants' keys. Impossible. ✓`) }}>
              🔧 Try to "Fix" It
            </Btn>
          )}
        </div>

        {counterShown && counterMsg && (
          <div style={{ marginTop:12,padding:14,borderRadius:9,background:'var(--red-dim)',border:'1px solid rgba(255,45,85,.25)',fontSize:11,color:'var(--red)',animation:'fadeUp .3s ease' }}>
            <div style={{ fontFamily:'var(--font-display)',fontWeight:700,marginBottom:6 }}>❌ Counter-Tamper Failed!</div>
            <div style={{ color:'var(--text-mid)' }}>{counterMsg}</div>
          </div>
        )}
      </div>

      {/* Chain Visualizer */}
      <SectionHeader title="Live Chain" right={<Btn onClick={() => window.location.href='/verify'} style={{fontSize:11}}>→ Full Verify</Btn>}/>
      <div style={card()}>
        <ChainTrack blocks={chain} tamperedIdx={tampIdx} firstBadIdx={firstBadIdx} selectedIdx={selected?.index} onSelect={setSelected}/>
      </div>
      {selected && <BlockDetail block={selected} onClose={() => setSelected(null)} />}

      {/* Hash Diff */}
      {hashDiff && (
        <div style={card()}>
          <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--red)',boxShadow:'0 0 6px var(--red)',display:'inline-block' }}/>
            Live Hash Comparison
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14 }}>
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:14 }}>
              <div style={{ fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:8,fontWeight:700,color:'var(--mint)' }}>Original Hash (before attack)</div>
              <div style={{ wordBreak:'break-all',lineHeight:1.9 }}>
                {hashDiff.origSpans.map((s,i) => <span key={i} style={charStyle({...s,isOrig:true})}>{s.ch}</span>)}
              </div>
            </div>
            <div style={{ background:'var(--bg2)',border:'1px solid rgba(255,45,85,.25)',borderRadius:10,padding:14 }}>
              <div style={{ fontSize:9,letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:8,fontWeight:700,color:'var(--red)' }}>Recomputed Hash (tampered data)</div>
              <div style={{ wordBreak:'break-all',lineHeight:1.9 }}>
                {hashDiff.newSpans.map((s,i) => <span key={i} style={charStyle({...s,isOrig:false})}>{s.ch}</span>)}
              </div>
            </div>
          </div>
          <div style={{ display:'flex',gap:20,fontSize:10,marginBottom:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:5 }}><div style={{ width:8,height:8,borderRadius:'50%',background:'var(--mint)' }}/>{hashDiff.matches} chars match</div>
            <div style={{ display:'flex',alignItems:'center',gap:5 }}><div style={{ width:8,height:8,borderRadius:'50%',background:'var(--red)' }}/>{hashDiff.misses} chars changed</div>
          </div>
          <div style={{ padding:'10px 12px',background:'var(--red-dim)',border:'1px solid rgba(255,45,85,.2)',borderRadius:8,fontSize:11,color:'var(--red)',fontFamily:'var(--font-display)' }}>
            🔴 {hashDiff.pct}% of hash characters differ — even a 1-character data change causes ~50% avalanche. Validator catches this instantly.
          </div>
        </div>
      )}

      {/* Forensics */}
      {forensics && (
        <div style={card()}>
          <div style={{ fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--red)',boxShadow:'0 0 6px var(--red)',display:'inline-block' }}/>
            Chain Forensics Report
          </div>
          {[
            { num:'1', color:'var(--red)',
              title:'Data Mutation Detected',
              body: `Block #${forensics.block.index} (${forensics.block.data.event}) had its "${forensics.field}" field changed.`,
              code: `Old: "${forensics.field}": ${JSON.stringify(forensics.oldVal)}\nNew: "${forensics.field}": ${JSON.stringify(isNaN(forensics.newVal)?forensics.newVal:Number(forensics.newVal))}` },
            { num:'2', color:'var(--red)',
              title:'Hash Fingerprint Mismatch',
              body: 'SHA-256 of modified data produces a completely different hash. The stored hash still reflects original data.',
              code: `Stored:     ${forensics.origHash.substring(0,36)}…\nRecomputed: ${forensics.recompHash.substring(0,36)}…` },
            { num:'3', color:'var(--amber)',
              title:'Chain Link Poisoning',
              body: `Block #${forensics.block.index+1}'s previous_hash still points to the original hash. This link is now permanently broken.`,
              code: null },
            { num:'4', color:'var(--amber)',
              title: `Downstream Cascade — ${chain.length - forensics.block.index - 1} blocks poisoned`,
              body: 'Every block after the tampered one is now untrustworthy — their data may be valid but the chain before them is compromised.',
              code: null },
            { num:'5', color:'var(--blue)',
              title:'Validator Verdict',
              body: 'Running validate_chain() returns is_valid: false with the exact tampered block identified.',
              code: `{ "is_valid": false, "errors": [ "Block #${forensics.block.index} data TAMPERED — hash mismatch" ] }` },
          ].map((step,i) => (
            <div key={i} style={{ display:'flex',gap:14,marginBottom:14,alignItems:'flex-start' }}>
              <div style={{ width:28,height:28,borderRadius:7,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontSize:12,fontWeight:800,background:`${step.color}20`,color:step.color }}>
                {step.num}
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:12,fontWeight:700,color:'#fff',marginBottom:3 }}>{step.title}</div>
                <div style={{ fontSize:11,color:'var(--text-mid)',lineHeight:1.6 }}>{step.body}</div>
                {step.code && (
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,background:'rgba(0,0,0,.4)',padding:'7px 10px',borderRadius:6,marginTop:5,color:'var(--text-dim)',wordBreak:'break-all',lineHeight:1.7 }}>
                    {step.code}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      </div>{/* /left col */}

      {/* ── RIGHT COLUMN ── */}
      <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

        {/* Chain Health */}
        <div style={{ padding:16,borderRadius:10,border:'1px solid',transition:'all .4s',
          borderColor: firstBadIdx!=null ? 'rgba(255,45,85,.3)' : 'var(--border2)',
          background: firstBadIdx!=null ? 'var(--red-dim)' : 'var(--mint-dim)' }}>
          <div style={{ fontSize:9,color:'var(--text-dim)',letterSpacing:'2px',textTransform:'uppercase',marginBottom:5 }}>Chain Health</div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:26,fontWeight:800,color:firstBadIdx!=null?'var(--red)':'var(--mint)',lineHeight:1 }}>
            {firstBadIdx!=null ? 'COMPROMISED' : 'INTACT'}
          </div>
          <div style={{ fontSize:10,marginTop:4,color:firstBadIdx!=null?'rgba(255,45,85,.7)':'rgba(0,229,176,.7)' }}>
            {firstBadIdx!=null ? `Break at Block #${firstBadIdx}` : 'All hashes verified'}
          </div>
          <div style={{ height:6,background:'var(--border)',borderRadius:3,marginTop:10,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${impactPct}%`,background:impactPct>60?'var(--red)':'var(--amber)',borderRadius:3,transition:'width .8s cubic-bezier(.4,0,.2,1)' }}/>
          </div>
          <div style={{ fontSize:9,color:'var(--text-dim)',marginTop:4 }}>Tamper impact: {impactPct}% of chain</div>
        </div>

        {/* Attack Log */}
        <div>
          <div style={{ fontFamily:'var(--font-display)',fontSize:12,fontWeight:700,color:'#fff',marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--red)',boxShadow:'0 0 6px var(--red)',display:'inline-block' }}/>
            Attack Log ({attackLog.length})
          </div>
          {attackLog.length === 0 ? (
            <div style={{ background:'var(--bg2)',border:'1px dashed var(--border)',borderRadius:8,padding:16,textAlign:'center',fontSize:11,color:'var(--text-dim)' }}>
              No attacks yet
            </div>
          ) : attackLog.map((log,i) => (
            <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',borderRadius:8,background:'var(--card)',border:'1px solid var(--border)',marginBottom:7,animation:'fadeUp .3s ease' }}>
              <span style={{ fontSize:14 }}>⚡</span>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-display)',fontSize:11,fontWeight:700,color:'var(--red)' }}>
                  {ATTACK_SCENARIOS.find(s=>s.id===log.scenario)?.title || 'Custom'}
                </div>
                <div style={{ fontSize:10,color:'var(--text-dim)',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                  Block #{log.blockIdx} · {log.field}: "{String(log.oldVal).substring(0,12)}" → "{String(log.newVal).substring(0,12)}"
                </div>
              </div>
              <div style={{ fontSize:9,color:'var(--text-dim)',flexShrink:0 }}>{log.time.toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        {/* Why can't they fix it */}
        <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:14 }}>
          <div style={{ fontFamily:'var(--font-display)',fontSize:12,fontWeight:700,color:'#fff',marginBottom:8 }}>📚 Why Can't They Fix It?</div>
          <div style={{ fontSize:11,color:'var(--text-mid)',lineHeight:1.8 }}>
            <div style={{ marginBottom:8 }}>An attacker might try re-hashing the tampered block. <strong style={{color:'var(--amber)'}}>But this still breaks the chain:</strong></div>
            {[
              ['var(--red)','1.','The next block stores the original hash as its prev_hash'],
              ['var(--red)','2.','Fixing block N forces fixing N+1, N+2… all the way down'],
              ['var(--red)','3.','Each fix needs all participants\' cryptographic signatures'],
              ['var(--mint)','✓', 'This is why blockchain is called immutable'],
            ].map(([c,n,t],i) => (
              <div key={i} style={{ display:'flex',gap:8 }}>
                <span style={{ color:c,fontWeight:700,flexShrink:0 }}>{n}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

      </div>{/* /right col */}
      </div>{/* /grid */}
    </PageWrap>
  )
}


// ══════════════════════════════════════════════════════════════
//  PROVENANCE / QR VERIFY  (Phase 6 — full redesign)
// ══════════════════════════════════════════════════════════════
const JOURNEY_ICONS = { BATCH_CREATED:'🏭', TRANSFERRED:'🚚', RECEIVED:'📦', DISPENSED:'🏥', FLAGGED:'🚨' }
const JOURNEY_COLORS = {
  BATCH_CREATED:{ color:'var(--mint)',  bg:'var(--mint-dim)',  border:'var(--mint)'  },
  TRANSFERRED:  { color:'var(--amber)', bg:'var(--amber-dim)', border:'var(--amber)' },
  DISPENSED:    { color:'var(--blue)',  bg:'var(--blue-dim)',  border:'var(--blue)'  },
  FLAGGED:      { color:'var(--red)',   bg:'var(--red-dim)',   border:'var(--red)'   },
}

function getTrustScore(batchData) {
  if (!batchData) return 0
  let s = 0
  if (!batchData.is_flagged)       s += 40
  if (batchData.hop_count >= 1)    s += 15
  if (batchData.hop_count >= 2)    s += 15
  if (batchData.hop_count >= 3)    s += 10
  const hist0 = batchData.history?.[0]?.data
  if (hist0?.expiry_date > '2025') s += 10
  if (hist0?.manufacturer)         s +=  5
  if (hist0?.location)             s +=  5
  return Math.min(s, 100)
}

// Animated trust ring (SVG circle)
function TrustRing({ score, flagged }) {
  const [displayed, setDisplayed] = useState(0)
  const circumference = 301.59
  const color = flagged ? 'var(--red)' : score >= 80 ? 'var(--mint)' : score >= 50 ? 'var(--amber)' : 'var(--red)'

  useEffect(() => {
    let cur = 0
    const step = score / 40
    const id = setInterval(() => {
      cur = Math.min(cur + step, score)
      setDisplayed(Math.round(cur))
      if (cur >= score) clearInterval(id)
    }, 25)
    return () => clearInterval(id)
  }, [score])

  return (
    <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,.06)" strokeWidth="7" fill="none"/>
        <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="7" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (score / 100) * circumference}
          style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color, lineHeight:1 }}>{displayed}</div>
        <div style={{ fontSize:8, color:'var(--text-dim)', letterSpacing:1, textTransform:'uppercase', marginTop:2 }}>Trust</div>
      </div>
    </div>
  )
}

export function Provenance() {
  const { id: urlId } = useParams()
  const [query,     setQuery]     = useState(urlId || '')
  const [batchData, setBatchData] = useState(null)
  const [qrData,    setQrData]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState('journey')  // journey | hashes | trust

  useEffect(() => { if (urlId) doSearch(urlId) }, [urlId])

  const doSearch = async (id) => {
    const q = (id || query).trim().toUpperCase()
    if (!q) return
    setLoading(true)
    try {
      const [b, q2] = await Promise.all([getBatch(q), getQR(q).catch(() => null)])
      setBatchData(b)
      setQrData(q2)
      setActiveTab('journey')
    } catch {
      toast('❌','Not Found',`No records for batch "${q}".`,'var(--red)')
      setBatchData(null)
    }
    setLoading(false)
  }

  const isFlagged = batchData?.is_flagged
  const score     = getTrustScore(batchData)
  const scoreColor = isFlagged ? 'var(--red)' : score >= 80 ? 'var(--mint)' : score >= 50 ? 'var(--amber)' : 'var(--red)'
  const verifyUrl = qrData?.verify_url || (batchData ? `http://localhost:5173/verify/${batchData.batch_id}` : '')

  // Trust score breakdown items
  const trustChecks = batchData ? [
    { label:'Not flagged as suspicious', ok:!isFlagged,                                          pts:40 },
    { label:'Manufacturer record on chain', ok:(batchData.hop_count||0)>=1,                      pts:15 },
    { label:'Transfer/shipment logged',     ok:(batchData.hop_count||0)>=2,                      pts:15 },
    { label:'Dispensed to patient',         ok:(batchData.hop_count||0)>=3,                      pts:10 },
    { label:'Expiry date in the future',    ok:batchData.history?.[0]?.data?.expiry_date>'2025', pts:10 },
    { label:'Manufacturer verified',        ok:!!batchData.history?.[0]?.data?.manufacturer,     pts:5  },
    { label:'Location recorded',            ok:!!batchData.history?.[0]?.data?.location,         pts:5  },
  ] : []

  return (
    <PageWrap>
      {/* Search bar */}
      <SectionHeader title="◎ QR Verify — Drug Provenance" />
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <Input value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Enter Batch ID (e.g. B001, B002, B003)…"
          onKeyDown={e => e.key==='Enter' && doSearch()}
          style={{ flex:1 }} />
        <Btn variant="primary" onClick={() => doSearch()}>
          {loading ? '⏳' : '◎'} Verify
        </Btn>
      </div>
      {/* Quick pills */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
        {['B001','B002','B003'].map(id => (
          <div key={id} onClick={() => { setQuery(id); doSearch(id) }} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
            borderRadius:100, background:'var(--mint-dim)', border:'1px solid var(--border2)',
            color:'var(--mint)', fontSize:10, fontWeight:600, cursor:'pointer', transition:'all .2s',
          }}>💊 {id}</div>
        ))}
      </div>

      {batchData && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>

          {/* ── LEFT ── */}
          <div>
            {/* Header card with trust ring */}
            <div style={card()}>
              <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
                <TrustRing score={score} flagged={isFlagged} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>
                    {batchData.drug_name}
                  </div>
                  <div style={{ fontSize:11, color:'var(--mint)', marginBottom:10 }}>
                    Batch ID: {batchData.batch_id} · {batchData.hop_count} blockchain entries
                  </div>
                  <div style={{
                    display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px',
                    borderRadius:8, fontFamily:'var(--font-display)', fontSize:12, fontWeight:700,
                    background: isFlagged ? 'var(--red-dim)' : 'var(--mint-dim)',
                    border:`1px solid ${isFlagged ? 'rgba(255,45,85,.3)' : 'var(--border2)'}`,
                    color: isFlagged ? 'var(--red)' : 'var(--mint)',
                    marginBottom:12,
                  }}>
                    {isFlagged ? '⚠ FLAGGED — DO NOT USE' : '✓ VERIFIED — CHAIN INTACT'}
                  </div>
                  {/* Mini stats row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {[
                      { k:'Manufacturer', v: batchData.history?.[0]?.data?.manufacturer || '—' },
                      { k:'Expiry',       v: batchData.history?.[0]?.data?.expiry_date   || '—' },
                      { k:'Latest Event', v: labelFor(batchData.latest_event) },
                    ].map(f => (
                      <div key={f.k} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:7, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>{f.k}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:20 }}>
              {[['journey','⛓ Supply Journey'],['hashes','# Block Hashes'],['trust','🛡 Trust Score']].map(([t,l]) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  padding:'10px 18px', background:'none', border:'none', fontFamily:'var(--font-mono)',
                  fontSize:11, cursor:'pointer', transition:'all .2s', borderBottom:'2px solid',
                  color:     activeTab===t ? 'var(--mint)' : 'var(--text-dim)',
                  borderColor: activeTab===t ? 'var(--mint)' : 'transparent',
                  marginBottom:-1,
                }}>{l}</button>
              ))}
            </div>

            {/* JOURNEY TAB */}
            {activeTab === 'journey' && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                {isFlagged && (
                  <div style={{ background:'var(--red-dim)',border:'1px solid rgba(255,45,85,.3)',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',gap:10,alignItems:'center' }}>
                    <span style={{fontSize:18}}>🚨</span>
                    <div>
                      <div style={{fontFamily:'var(--font-display)',fontWeight:700,color:'var(--red)'}}>This batch has been flagged as suspicious</div>
                      <div style={{fontSize:11,color:'var(--text-mid)',marginTop:2}}>Do not administer this medicine. Report to your pharmacist immediately.</div>
                    </div>
                  </div>
                )}
                {/* Journey nodes */}
                <div style={{ overflowX:'auto', paddingBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', minWidth:'max-content', padding:'4px 0 16px' }}>
                    {batchData.history?.map((block, i) => {
                      const ev = block.data?.event || 'UNKNOWN'
                      const style = JOURNEY_COLORS[ev] || JOURNEY_COLORS.BATCH_CREATED
                      const icon  = JOURNEY_ICONS[ev] || '📦'
                      const actor = block.data?.manufacturer || block.data?.from_actor || block.data?.pharmacy || block.data?.flagged_by || 'System'
                      const loc   = block.data?.location || block.data?.from_location || block.data?.to_location || ''
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start' }}>
                          <div style={{ flexShrink:0, width:150, textAlign:'center' }}>
                            <div style={{
                              width:54, height:54, borderRadius:'50%', margin:'0 auto 10px',
                              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                              border:`2px solid ${style.border}`, background:style.bg,
                              boxShadow:`0 0 18px ${style.border}55`,
                              animation:`fadeUp .4s ease ${i*120}ms both`,
                            }}>{icon}</div>
                            <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, color:style.color, marginBottom:3 }}>
                              {labelFor(ev)}
                            </div>
                            <div style={{ fontSize:10, color:'var(--text-mid)', lineHeight:1.3, maxWidth:140, margin:'0 auto' }}>{actor}</div>
                            {loc && <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:3 }}>📍 {loc}</div>}
                            <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:3 }}>
                              {new Date(block.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                            </div>
                            {block.data?.quantity != null && (
                              <div style={{ fontSize:9, color:'var(--text-dim)', marginTop:2 }}>{Number(block.data.quantity).toLocaleString()} units</div>
                            )}
                            {block.data?.reason && (
                              <div style={{ fontSize:9, color:'var(--red)', marginTop:4, maxWidth:140, margin:'4px auto 0', lineHeight:1.3 }}>"{block.data.reason}"</div>
                            )}
                          </div>
                          {i < (batchData.history?.length || 0) - 1 && (
                            <div style={{ display:'flex', alignItems:'center', padding:'0 4px', marginTop:26 }}>
                              <svg width="50" height="16" viewBox="0 0 50 16" fill="none">
                                <line x1="0" y1="8" x2="38" y2="8" stroke="rgba(0,229,176,.22)" strokeWidth="1.5" strokeDasharray="4 3"/>
                                <polygon points="34,3 48,8 34,13" fill="rgba(0,229,176,.28)"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* HASHES TAB */}
            {activeTab === 'hashes' && (
              <div style={{ animation:'fadeUp .3s ease', display:'flex', flexDirection:'column', gap:8 }}>
                {batchData.history?.map((block, i) => {
                  const ev = block.data?.event || '?'
                  return (
                    <div key={i}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ width:28, height:28, borderRadius:6, background:'var(--mint-dim)', color:'var(--mint)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, flexShrink:0 }}>
                          {i + 1}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, color:'var(--text)', fontSize:11 }}>{labelFor(ev)}</div>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)', marginTop:2 }}>
                            hash: {block.hash?.substring(0,40) || '—'}…
                          </div>
                        </div>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--mint)' }}>✓ VALID</div>
                      </div>
                      {i < (batchData.history?.length || 0) - 1 && (
                        <div style={{ fontSize:10, color:'var(--text-dim)', padding:'3px 0 3px 54px', fontFamily:'var(--font-mono)' }}>
                          ↓ prev_hash links to block above
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* TRUST TAB */}
            {activeTab === 'trust' && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                {trustChecks.map((c,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, background:'var(--bg2)', border:'1px solid var(--border)', marginBottom:6, fontSize:11 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ color: c.ok ? 'var(--mint)' : 'var(--text-dim)' }}>{c.ok ? '✓' : '○'}</span>
                      <span style={{ color: c.ok ? 'var(--text)' : 'var(--text-dim)' }}>{c.label}</span>
                    </div>
                    <span style={{ fontWeight:700, color: c.ok ? scoreColor : 'var(--text-dim)' }}>+{c.pts}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 12px 0', fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, borderTop:'1px solid var(--border)', marginTop:4 }}>
                  <span style={{ color:'var(--text)' }}>Total Trust Score</span>
                  <span style={{ color:scoreColor }}>{score} / 100</span>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: QR PANEL ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* QR code */}
            <div style={card({ padding:20 })}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'#fff', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--mint)', boxShadow:'0 0 6px var(--mint)', display:'inline-block' }}/> QR Code
              </div>
              {/* Render real QR using backend base64 if available, else show URL */}
              <div style={{ background:'#fff', borderRadius:10, padding:12, width:160, height:160, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 0 24px rgba(0,229,176,.12)' }}>
                {qrData?.qr_base64
                  ? <img src={`data:image/png;base64,${qrData.qr_base64}`} style={{ width:'100%' }} alt="QR"/>
                  : (
                    <div style={{ textAlign:'center', fontSize:10, color:'#666' }}>
                      <div style={{ fontSize:28, marginBottom:6 }}>📱</div>
                      <div>Start Flask server to generate real QR code</div>
                    </div>
                  )
                }
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--mint)', background:'var(--mint-dim)', border:'1px solid var(--border2)', padding:'6px 10px', borderRadius:6, marginBottom:12, wordBreak:'break-all' }}>
                {verifyUrl}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <Btn onClick={() => toast('↓','Download QR','Saves the QR as a PNG for drug packaging.')} style={{ width:'100%', justifyContent:'center' }}>
                  ↓ Download QR Code
                </Btn>
                <Btn onClick={() => toast('🖨️','Print Label','Opens printable label in a new tab.')} style={{ width:'100%', justifyContent:'center', background:'rgba(168,85,247,.1)', borderColor:'rgba(168,85,247,.3)', color:'#a78bfa' }}>
                  🏷️ Generate Print Label
                </Btn>
              </div>
            </div>

            {/* Chain stats */}
            <div style={card({ padding:18 })}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'#fff', marginBottom:12 }}>📊 Chain Stats</div>
              {[
                { label:'Supply hops',   value: batchData.hop_count },
                { label:'Chain status',  value: isFlagged ? '⚠ Flagged' : '✓ Clean' },
                { label:'Latest event',  value: labelFor(batchData.latest_event) },
                { label:'Trust score',   value: `${score}/100` },
              ].map(f => (
                <div key={f.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                  <span style={{ color:'var(--text-dim)' }}>{f.label}</span>
                  <span style={{ fontWeight:600, color: f.label==='Chain status' && isFlagged ? 'var(--red)' : f.label==='Trust score' ? scoreColor : 'var(--text)' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </PageWrap>
  )
}
