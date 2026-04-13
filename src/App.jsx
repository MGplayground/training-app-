import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { SUPERSETS as DEFAULT_SUPERSETS, BANDS, FEEL, DAYS } from './data'

function getTodayISO() { return new Date().toISOString().split('T')[0] }

function getWeekDates() {
  const now = new Date(), dow = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({length:7}, (_,i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i)
    return {
      label: DAYS[i], date: d.getDate(),
      month: d.toLocaleDateString('en-GB',{month:'short'}),
      full:  d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}),
      iso:   d.toISOString().split('T')[0]
    }
  })
}

function buildSets(stored, ex) {
  const fallback = Array.from({length:ex.sets}, () => ({val:'',band:ex.band,feel:'',done:false,skipped:false}))
  if (!stored || !Array.isArray(stored)) return fallback
  return Array.from({length:ex.sets}, (_,i) => stored[i] ?? {val:'',band:ex.band,feel:'',done:false,skipped:false})
}

const REHAB_SS = {
  id:'ssR', label:'Rehab', note:'Elbow protocol — every session while flagged.',
  push:{name:'Tricep isometric',sets:2,target:'30–45s',band:'Unassisted',role:'Rehab',coaching:'From B14 protocol. Slow build, no pain. Stop at first twinge.'},
  pull:{name:'Soft tissue / band rotator',sets:2,target:'20–30s',band:'Red band',role:'Rehab',coaching:'Light band only. Maintenance, not training.'}
}

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 0'}}>
      <div style={{width:28,height:28,border:'3px solid #3b1d8a',borderTop:'3px solid #7c3aed',borderRadius:'50%',animation:'_sp 0.8s linear infinite'}}/>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function RestTimer({ onDismiss }) {
  const OPTIONS = [60, 90, 120, 180]
  const [sel, setSel] = useState(90)
  const [rem, setRem] = useState(90)
  const [running, setRunning] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    if (running && rem > 0) {
      ref.current = setInterval(() => setRem(r => {
        if (r <= 1) { clearInterval(ref.current); setRunning(false); return 0 }
        return r - 1
      }), 1000)
    }
    return () => clearInterval(ref.current)
  }, [running])

  function changeSel(s) {
    clearInterval(ref.current)
    setSel(s); setRem(s); setRunning(true)
  }

  const mins = Math.floor(rem / 60)
  const secs = String(rem % 60).padStart(2,'0')

  return (
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',
      width:'100%',maxWidth:430,background:'#141414',borderTop:'1px solid #2c2c2e',
      padding:'14px 16px',zIndex:50,display:'flex',alignItems:'center',gap:12}}>
      <div style={{width:48,height:48,borderRadius:'50%',border:'3px solid #7c3aed',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:14,fontWeight:800,color:'#7c3aed',flexShrink:0}}>
        {mins}:{secs}
      </div>
      <div style={{display:'flex',gap:6,flex:1,flexWrap:'wrap'}}>
        {OPTIONS.map(o => (
          <button key={o} onClick={() => changeSel(o)}
            style={{padding:'5px 10px',borderRadius:20,border:`1px solid ${o===sel?'#7c3aed':'#3c3c3e'}`,
              background:o===sel?'#1a0f3c':'transparent',color:o===sel?'#7c3aed':'#ababab',
              fontSize:11,cursor:'pointer'}}>
            {o===60?'1m':o===90?'1m30':o===120?'2m':'3m'}
          </button>
        ))}
      </div>
      <button onClick={onDismiss}
        style={{width:32,height:32,borderRadius:'50%',border:'none',background:'#1c1c1e',
          color:'#ababab',fontSize:16,cursor:'pointer'}}>✕</button>
    </div>
  )
}

function LogModal({ ctx, onSave, onSkip, onClose }) {
  const { ex, si, set } = ctx
  const [val, setVal]   = useState(set?.done ? set.val : '')
  const [band, setBand] = useState(set?.done ? set.band : ex.band)
  const [feel, setFeel] = useState(set?.done ? set.feel : '')
  const inputRef = useRef()
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',
      alignItems:'flex-end',justifyContent:'center',zIndex:100}}>
      <div style={{background:'#141414',borderRadius:'20px 20px 0 0',padding:'20px 20px 40px',
        width:'100%',maxWidth:430,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:700,color:'#f5f5f7'}}>{ex.name} — Set {si+1}</span>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:'none',
            background:'#1c1c1e',color:'#ababab',fontSize:16,cursor:'pointer'}}>✕</button>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:'#6b6b6b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Value (seconds / reps)</div>
        <input ref={inputRef} type="number" inputMode="decimal" value={val}
          onChange={e => setVal(e.target.value)}
          style={{width:'100%',background:'transparent',border:'none',
            borderBottom:'2px solid #7c3aed',fontSize:40,fontWeight:800,color:'#f5f5f7',
            textAlign:'center',padding:'8px 0 4px',marginBottom:16,fontFamily:'inherit',outline:'none'}}/>
        <div style={{fontSize:11,fontWeight:700,color:'#6b6b6b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Band</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {BANDS.map(b => (
            <button key={b} onClick={() => setBand(b)}
              style={{padding:'6px 12px',borderRadius:20,
                border:`1.5px solid ${b===band?'#3b82f6':'#3c3c3e'}`,
                background:b===band?'#0d1f3c':'transparent',
                color:b===band?'#3b82f6':'#ababab',fontSize:12,cursor:'pointer'}}>
              {b}
            </button>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:'#6b6b6b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Feel</div>
        <div style={{display:'flex',gap:6,marginBottom:20}}>
          {FEEL.map(f => (
            <button key={f} onClick={() => setFeel(f)}
              style={{flex:1,padding:'8px 4px',borderRadius:8,
                border:`1.5px solid ${f===feel?'#7c3aed':'#3c3c3e'}`,
                background:f===feel?'#1a0f3c':'transparent',
                color:f===feel?'#7c3aed':'#ababab',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => val && onSave({val,band,feel,done:true,skipped:false})}
          style={{width:'100%',padding:15,borderRadius:12,border:'none',background:'#7c3aed',
            color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',marginBottom:8}}>
          Log Set ✓
        </button>
        <button onClick={onSkip}
          style={{width:'100%',padding:12,borderRadius:12,
            border:'1.5px solid #3c3c3e',background:'transparent',
            color:'#ababab',fontSize:14,cursor:'pointer'}}>
          Skip this set
        </button>
      </div>
    </div>
  )
}

function EditModal({ ex, onSave, onClose }) {
  const [name, setName]         = useState(ex.name)
  const [target, setTarget]     = useState(ex.target)
  const [sets, setSets]         = useState(ex.sets)
  const [band, setBand]         = useState(ex.band)
  const [coaching, setCoaching] = useState(ex.coaching)

  const inp = (val, set) => ({
    value: val, onChange: e => set(e.target.value),
    style:{width:'100%',background:'#1c1c1e',border:'1px solid #3c3c3e',borderRadius:8,
      padding:'10px 12px',color:'#f5f5f7',fontSize:13,fontFamily:'inherit',
      marginBottom:10,outline:'none'}
  })

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',
      alignItems:'flex-end',justifyContent:'center',zIndex:100}}>
      <div style={{background:'#141414',borderRadius:'20px 20px 0 0',padding:'20px 20px 40px',
        width:'100%',maxWidth:430,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:700,color:'#f5f5f7'}}>Edit Exercise</span>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:'none',
            background:'#1c1c1e',color:'#ababab',fontSize:16,cursor:'pointer'}}>✕</button>
        </div>
        {[['Name',name,setName],['Target',target,setTarget]].map(([lbl,v,set]) => (
          <div key={lbl}>
            <div style={{fontSize:11,fontWeight:700,color:'#6b6b6b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{lbl}</div>
            <input type="text" {...inp(v,set)} />
          </div>
        ))}
        <div style={{fontSize:11,fontWeight:700,color:'#6b6b6b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Sets</div>
        <input type="number" inputMode="numeric" {...inp(sets, v => setSets(Number(v)))} />
        <div style={{fontSize:11,fontWeight:700,color:'#6b6b6b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Default Band</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {BANDS.map(b => (
            <button key={b} onClick={() => setBand(b)}
              style={{padding:'6px 12px',borderRadius:20,
                border:`1.5px solid ${b===band?'#3b82f6':'#3c3c3e'}`,
                background:b===band?'#0d1f3c':'transparent',
                color:b===band?'#3b82f6':'#ababab',fontSize:12,cursor:'pointer'}}>
              {b}
            </button>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:'#6b6b6b',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Coaching Cue</div>
        <textarea value={coaching} onChange={e => setCoaching(e.target.value)} rows={2}
          style={{width:'100%',background:'#1c1c1e',border:'1px solid #3c3c3e',borderRadius:8,
            padding:'10px 12px',color:'#f5f5f7',fontSize:13,fontFamily:'inherit',
            resize:'none',marginBottom:12,outline:'none'}}/>
        <button onClick={() => onSave({name,target,sets,band,coaching})}
          style={{width:'100%',padding:15,borderRadius:12,border:'none',background:'#7c3aed',
            color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>
          Save Changes
        </button>
      </div>
    </div>
  )
}

function NoteModal({ title, initial, onSave, onClose }) {
  const [val, setVal] = useState(initial || '')
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',
      alignItems:'flex-end',justifyContent:'center',zIndex:100}}>
      <div style={{background:'#141414',borderRadius:'20px 20px 0 0',padding:'20px 20px 40px',
        width:'100%',maxWidth:430}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:700,color:'#f5f5f7'}}>{title}</span>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:'none',
            background:'#1c1c1e',color:'#ababab',fontSize:16,cursor:'pointer'}}>✕</button>
        </div>
        <textarea value={val} onChange={e => setVal(e.target.value)}
          placeholder="Add a note..." rows={4}
          style={{width:'100%',background:'#1c1c1e',border:'1px solid #3c3c3e',borderRadius:8,
            padding:'10px 12px',color:'#f5f5f7',fontSize:13,fontFamily:'inherit',
            resize:'none',marginBottom:12,outline:'none'}}/>
        <button onClick={() => onSave(val)}
          style={{width:'100%',padding:15,borderRadius:12,border:'none',background:'#7c3aed',
            color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>
          Save Note
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [ready,        setReady]        = useState(false)
  const [view,         setView]         = useState('session')
  const [trainingDays, setTrainingDays] = useState([])
  const [activeDay,    setActiveDay]    = useState(getTodayISO)
  const [openSS,       setOpenSS]       = useState(null)
  const [modal,        setModal]        = useState(null)
  const [editCtx,      setEditCtx]      = useState(null)
  const [noteCtx,      setNoteCtx]      = useState(null)
  const [logs,         setLogs]         = useState({})
  const [notes,        setNotes]        = useState({})
  const [exNotes,      setExNotes]      = useState({})
  const [history,      setHistory]      = useState([])
  const [supersets,    setSupersets]    = useState(() => JSON.parse(JSON.stringify(DEFAULT_SUPERSETS)))
  const [rehabOn,      setRehabOn]      = useState(false)
  const [settingDays,  setSettingDays]  = useState(false)
  const [flash,        setFlash]        = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [showTimer,    setShowTimer]    = useState(false)
  const [selEx,        setSelEx]        = useState('ss1_push')
  const noteBufferRef = useRef({})

  const weekDates = getWeekDates()
  const TODAY = getTodayISO()
  const activeSS = rehabOn ? [...supersets, REHAB_SS] : supersets

  useEffect(() => {
    ;(async () => {
      const [{ data: td }, { data: lg }, { data: nt }, { data: hs }, { data: en }, { data: pg }] =
        await Promise.all([
          supabase.from('training_days').select('iso_date'),
          supabase.from('session_logs').select('*'),
          supabase.from('session_notes').select('iso_date, note'),
          supabase.from('session_history').select('*').order('saved_at', {ascending: false}),
          supabase.from('exercise_notes').select('note_key, note'),
          supabase.from('programme').select('*'),
        ])
      if (td) setTrainingDays(td.map(r => r.iso_date))
      if (lg) {
        const rebuilt = {}
        lg.forEach(r => {
          if (!rebuilt[r.iso_date]) rebuilt[r.iso_date] = {}
          rebuilt[r.iso_date][`${r.ss_id}_${r.side}`] = r.sets
        })
        setLogs(rebuilt)
      }
      if (nt) {
        const rebuilt = {}
        nt.forEach(r => { rebuilt[r.iso_date] = r.note })
        setNotes(rebuilt)
      }
      if (hs) setHistory(hs)
      if (en) {
        const rebuilt = {}
        en.forEach(r => { rebuilt[r.note_key] = r.note })
        setExNotes(rebuilt)
      }
      if (pg && pg.length) {
        const base = JSON.parse(JSON.stringify(DEFAULT_SUPERSETS))
        pg.forEach(row => {
          const ss = base.find(s => s.id === row.ss_id)
          if (ss && ss[row.side]) Object.assign(ss[row.side], row.overrides)
        })
        setSupersets(base)
      }
      setReady(true)
    })()
  }, [])

  async function toggleDay(iso) {
    const isTD = trainingDays.includes(iso)
    if (isTD) {
      await supabase.from('training_days').delete().eq('iso_date', iso)
      setTrainingDays(prev => prev.filter(d => d !== iso))
    } else {
      await supabase.from('training_days').upsert({iso_date: iso})
      setTrainingDays(prev => [...prev, iso])
    }
  }

  function getSets(iso, ssId, side, ex) {
    const stored = logs?.[iso]?.[`${ssId}_${side}`]
    return buildSets(stored, ex)
  }

  async function writeSets(iso, ssId, side, newSets) {
    const updatedDay  = { ...(logs[iso] ?? {}), [`${ssId}_${side}`]: newSets }
    const updatedLogs = { ...logs, [iso]: updatedDay }
    setLogs(updatedLogs)
    await supabase.from('session_logs').upsert({
      iso_date: iso, ss_id: ssId, side, sets: newSets,
      updated_at: new Date().toISOString()
    }, { onConflict: 'iso_date,ss_id,side' })
  }

  function openLogModal(ssId, side, ex, si) {
    const sets = getSets(activeDay, ssId, side, ex)
    setModal({ssId, side, ex, si, set: sets[si]})
  }

  async function handleModalSave(updated) {
    const {ssId, side, ex, si} = modal
    const prev = getSets(activeDay, ssId, side, ex)
    const next = prev.map((s,i) => i === si ? {...s, ...updated} : s)
    await writeSets(activeDay, ssId, side, next)
    setModal(null)
    setShowTimer(true)
  }

  async function handleModalSkip() {
    const {ssId, side, ex, si} = modal
    const prev = getSets(activeDay, ssId, side, ex)
    const next = prev.map((s,i) => i === si ? {...s, val:'—', done:false, skipped:true} : s)
    await writeSets(activeDay, ssId, side, next)
    setModal(null)
  }

  async function saveExerciseEdit(ssId, side, updated) {
    const next = supersets.map(ss => ss.id === ssId ? {...ss, [side]: {...ss[side], ...updated}} : ss)
    setSupersets(next)
    await supabase.from('programme').upsert({
      ss_id: ssId, side,
      ss_index: next.findIndex(s => s.id === ssId),
      overrides: {name:updated.name, sets:updated.sets, target:updated.target, band:updated.band, coaching:updated.coaching}
    }, {onConflict: 'ss_id,side'})
  }

  async function saveExNote(key, note) {
    setExNotes(prev => ({...prev, [key]: note}))
    await supabase.from('exercise_notes').upsert(
      {note_key: key, note, updated_at: new Date().toISOString()},
      {onConflict: 'note_key'}
    )
  }

  function handleNoteInput(iso, val) {
    noteBufferRef.current[iso] = val
  }

  async function flushNote(iso) {
    const val = noteBufferRef.current[iso]
    if (val === undefined) return
    setNotes(prev => ({...prev, [iso]: val}))
    await supabase.from('session_notes').upsert(
      {iso_date: iso, note: val, updated_at: new Date().toISOString()},
      {onConflict: 'iso_date'}
    )
  }

  async function saveSession() {
    setSaving(true)
    await flushNote(activeDay)
    const dayInfo = weekDates.find(d => d.iso === activeDay)
    const entry = {
      iso_date: activeDay,
      date_label: dayInfo?.full ?? activeDay,
      log: logs[activeDay] ?? {},
      note: notes[activeDay] ?? noteBufferRef.current[activeDay] ?? '',
      saved_at: new Date().toISOString()
    }
    await supabase.from('session_history').upsert(entry, {onConflict: 'iso_date'})
    const {data: hs} = await supabase.from('session_history').select('*').order('saved_at',{ascending:false})
    if (hs) setHistory(hs)
    setSaving(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 1600)
  }

  function reorderSS(idx, dir) {
    const ni = idx + dir
    if (ni < 0 || ni >= supersets.length) return
    const arr = [...supersets];
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]]
    setSupersets(arr)
  }

  function dayStatus(iso) {
    const isTD  = trainingDays.includes(iso)
    const flat  = Object.values(logs[iso] ?? {}).flat()
    const done  = flat.filter(s => s?.done).length
    const total = supersets.reduce((a,ss) => a + ss.push.sets + ss.pull.sets, 0)
    const saved = history.some(h => h.iso_date === iso)
    const hasData = flat.some(s => s?.done || s?.skipped)
    return {isTD, done, total, pct: total ? Math.round(done/total*100) : 0, saved, hasData}
  }

  function sessionProgress() {
    let done = 0, total = 0
    for (const ss of activeSS) {
      for (const side of ['push','pull']) {
        getSets(activeDay, ss.id, side, ss[side]).forEach(s => {
          total++
          if (s.done || s.skipped) done++
        })
      }
    }
    return {done, total, pct: total ? Math.round(done/total*100) : 0}
  }

  function ssDone(ssId) {
    const ss = activeSS.find(s => s.id === ssId)
    if (!ss) return false
    for (const side of ['push','pull']) {
      if (getSets(activeDay, ss.id, side, ss[side]).some(s => !s.done && !s.skipped)) return false
    }
    return true
  }

  function allExercises() {
    return supersets.flatMap(ss => [
      {ssId: ss.id, side:'push', name: ss.push.name},
      {ssId: ss.id, side:'pull', name: ss.pull.name}
    ])
  }

  function getExHistory(ssId, side) {
    return history.map(sess => {
      const sets = (sess.log ?? {})[`${ssId}_${side}`] ?? []
      const done = sets.filter(s => s?.done)
      const vals = done.map(s => parseFloat(s.val) || 0)
      const best = vals.length ? Math.max(...vals) : 0
      return {date: sess.date_label || sess.iso_date, best, setCount: done.length, sets: done}
    }).filter(p => p.setCount > 0)
  }

  function totalSetsDone(ssId, side) {
    return history.reduce((acc, sess) =>
      acc + ((sess.log ?? {})[`${ssId}_${side}`] ?? []).filter(s => s?.done).length, 0)
  }

  const ads = dayStatus(activeDay)
  const prog = sessionProgress()

  const S = {
    bg:'#0a0a0a', bg2:'#141414', bg3:'#1c1c1e',
    text:'#f5f5f7', text2:'#ababab', text3:'#6b6b6b',
    purple:'#7c3aed', green:'#16a34a', red:'#ef4444', blue:'#3b82f6',
    border:'#2c2c2e', border2:'#3c3c3e',
  }

  if (!ready) return (
    <div style={{background:S.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Spinner/>
    </div>
  )

  return (
    <div style={{background:S.bg,minHeight:'100vh',fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
      color:S.text,maxWidth:430,margin:'0 auto'}}>

      <div style={{padding:'16px 16px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:`0.5px solid ${S.border}`,background:S.bg,position:'sticky',top:0,zIndex:40}}>
        <span style={{fontSize:17,fontWeight:600}}>Cali Training</span>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {view === 'session' && prog.done > 0 && (
            <button onClick={saveSession}
              style={{padding:'8px 14px',borderRadius:20,border:'none',
                background: flash ? '#16a34a' : saving ? '#5b21b6' : '#7c3aed',
                color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',transition:'background .2s'}}>
              {flash ? 'Saved ✓' : saving ? 'Saving…' : 'Save session'}
            </button>
          )}
          <button onClick={() => setSettingDays(p => !p)}
            style={{width:34,height:34,borderRadius:'50%',border:'none',
              background: settingDays ? '#7c3aed' : S.bg3,
              color: settingDays ? '#fff' : S.text2, fontSize:15,cursor:'pointer'}}>
            📅
          </button>
          <button onClick={() => setRehabOn(p => !p)}
            style={{width:34,height:34,borderRadius:'50%',border:'none',
              background: rehabOn ? '#3b0000' : S.bg3,
              color: rehabOn ? S.red : S.text2,
              opacity: rehabOn ? 1 : 0.5, fontSize:15,cursor:'pointer'}}>
            🏥
          </button>
        </div>
      </div>

      <div style={{display:'flex',background:S.bg2,borderBottom:`0.5px solid ${S.border}`}}>
        {[['session','Session'],['history','History'],['progress','Progress']].map(([v,l]) => (
          <button key={v} onClick={() => setView(v)}
            style={{flex:1,padding:'11px 0',fontSize:13,fontWeight:500,border:'none',
              background:'transparent',cursor:'pointer',
              color: view===v ? S.purple : S.text3,
              borderBottom: view===v ? `2px solid ${S.purple}` : '2px solid transparent'}}>
            {l}
          </button>
        ))}
      </div>

      {view === 'session' && (
        <div style={{paddingBottom:40}}>
          {rehabOn && (
            <div style={{margin:'12px 16px 0',padding:'10px 14px',
              background:'#1a0505',border:`1px solid ${S.red}`,borderRadius:12,
              fontSize:12,color:S.red}}>
              🏥 Rehab protocol active — tricep/elbow. Rehab superset added to end of session.
            </div>
          )}
          <div style={{display:'flex',gap:6,padding:'12px 16px',overflowX:'auto',scrollbarWidth:'none'}}>
            {weekDates.map(d => {
              const st = dayStatus(d.iso)
              const isActive = d.iso === activeDay
              const isToday = d.iso === TODAY
              return (
                <button key={d.iso}
                  onClick={() => settingDays ? toggleDay(d.iso) : setActiveDay(d.iso)}
                  style={{flexShrink:0,width:44,padding:'8px 4px 6px',borderRadius:8,cursor:'pointer',
                    textAlign:'center',border:`1.5px solid ${isActive?S.purple:st.isTD?'#5b21b6':isToday?'#3c3c3e':S.border}`,
                    background:isActive?S.purple:settingDays&&st.isTD?'#2e1d5c':'transparent'}}>
                  <span style={{fontSize:10,fontWeight:500,display:'block',marginBottom:3,
                    color:isActive?'#fff':st.isTD?'#a78bfa':S.text3}}>{d.label}</span>
                  <span style={{fontSize:16,fontWeight:700,display:'block',marginBottom:4,
                    color:isActive?'#fff':S.text}}>
                    {settingDays?d.date:(st.isTD&&st.pct>0?`${st.pct}%`:d.date)}
                  </span>
                  <span style={{display:'block',width:5,height:5,borderRadius:'50%',margin:'0 auto',
                    background:isActive?'#fff':S.purple,visibility:st.hasData?'visible':'hidden'}}/>
                </button>
              )
            })}
          </div>
          {settingDays && (
            <div style={{padding:'0 16px 8px',fontSize:12,color:S.text3,textAlign:'center'}}>
              Tap days to set your training schedule
            </div>
          )}
          <div style={{height:3,background:S.bg3,margin:'0 16px 4px',borderRadius:2}}>
            <div style={{height:'100%',background:S.purple,borderRadius:2,width:`${prog.pct}%`,transition:'width .3s'}}/>
          </div>
          <div style={{fontSize:11,color:S.text3,margin:'0 16px 12px',textAlign:'right'}}>
            {prog.done} / {prog.total} sets — {prog.pct}%
          </div>

          {activeSS.map((ss, idx) => {
            const isOpen = openSS === ss.id
            const done = ssDone(ss.id)
            return (
              <div key={ss.id} style={{margin:'0 16px 10px',borderRadius:12,
                border:`1px solid ${done?S.green:S.border}`,overflow:'hidden'}}>
                <div onClick={() => setOpenSS(isOpen ? null : ss.id)}
                  style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:10,
                    cursor:'pointer',background:S.bg2}}>
                  <span style={{color:S.text3,fontSize:14,cursor:'grab'}}>⠿</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:S.text3,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>{ss.label}</div>
                    <div style={{fontSize:12,color:S.text2}}>{ss.note}</div>
                  </div>
                  {done && <span style={{fontSize:10,fontWeight:700,color:S.green,background:'#052015',padding:'3px 8px',borderRadius:20}}>DONE</span>}
                  <span style={{color:S.text3,fontSize:12,transform:isOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>▼</span>
                </div>
                {isOpen && (
                  <div style={{background:S.bg}}>
                    {ss.id !== 'ssR' && (
                      <div style={{display:'flex',gap:4,alignItems:'center',padding:'4px 14px 8px'}}>
                        <span style={{fontSize:11,color:S.text3,flex:1}}>Reorder</span>
                        <button onClick={() => reorderSS(idx,-1)} disabled={idx===0}
                          style={{width:28,height:28,borderRadius:8,border:`1px solid ${S.border2}`,background:S.bg3,color:S.text2,fontSize:13,cursor:'pointer',opacity:idx===0?0.3:1}}>↑</button>
                        <button onClick={() => reorderSS(idx,1)} disabled={idx===supersets.length-1}
                          style={{width:28,height:28,borderRadius:8,border:`1px solid ${S.border2}`,background:S.bg3,color:S.text2,fontSize:13,cursor:'pointer',opacity:idx===supersets.length-1?0.3:1}}>↓</button>
                      </div>
                    )}
                    {['push','pull'].map((side, si) => {
                      const ex = ss[side]
                      const sets = getSets(activeDay, ss.id, side, ex)
                      const exNoteKey = `${activeDay}_${ss.id}_${side}`
                      const exNote = exNotes[exNoteKey] || ''
                      return (
                        <div key={side}>
                          {si===1 && <div style={{height:'0.5px',background:S.border,margin:'0 14px'}}/>}
                          <div style={{padding:'12px 14px'}}>
                            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6}}>
                              <span style={{fontSize:14,fontWeight:600}}>{ex.name}</span>
                              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                <span style={{fontSize:10,fontWeight:700,color:S.purple,background:'#2e1d5c',padding:'2px 7px',borderRadius:10}}>{ex.role}</span>
                                <button onClick={() => setEditCtx({ssId:ss.id,side,ex})}
                                  style={{fontSize:11,color:S.text3,background:'transparent',border:'none',cursor:'pointer',padding:'2px 6px'}}>✏️</button>
                              </div>
                            </div>
                            <div style={{fontSize:11,color:S.purple,background:'#1a0f3c',padding:'7px 10px',borderRadius:8,margin:'6px 0',borderLeft:`2px solid ${S.purple}`}}>{ex.coaching}</div>
                            <div style={{fontSize:11,color:S.text3,marginBottom:8}}>Target: {ex.target} · {ex.band}</div>
                            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                              {sets.map((s,idx2) => (
                                <button key={idx2} onClick={() => openLogModal(ss.id,side,ex,idx2)}
                                  style={{minWidth:54,padding:'8px 10px',borderRadius:8,cursor:'pointer',textAlign:'center',
                                    border:`1px solid ${s.done?S.green:S.border2}`,
                                    background:s.done?'#052015':S.bg3,opacity:s.skipped?0.5:1}}>
                                  <span style={{fontSize:10,color:s.done?S.green:S.text3,display:'block',marginBottom:2}}>Set {idx2+1}</span>
                                  <span style={{fontSize:13,fontWeight:700,display:'block',color:s.done?S.green:S.text}}>
                                    {s.done?`✓ ${s.val}`:s.skipped?'—':'Tap'}
                                  </span>
                                  {s.done&&s.feel&&<span style={{fontSize:10,color:S.green,display:'block'}}>{s.feel}</span>}
                                </button>
                              ))}
                            </div>
                            {exNote ? (
                              <>
                                <div style={{fontSize:11,color:S.text2,background:S.bg2,borderRadius:8,padding:'6px 10px',marginTop:4,borderLeft:`2px solid ${S.border2}`}}>📝 {exNote}</div>
                                <button onClick={() => setNoteCtx({key:exNoteKey,title:ex.name,initial:exNote})}
                                  style={{fontSize:11,color:S.text3,background:'transparent',border:`1px dashed ${S.border2}`,borderRadius:8,padding:'5px 10px',cursor:'pointer',width:'100%',marginTop:4}}>Edit note</button>
                              </>
                            ) : (
                              <button onClick={() => setNoteCtx({key:exNoteKey,title:ex.name,initial:''})}
                                style={{fontSize:11,color:S.text3,background:'transparent',border:`1px dashed ${S.border2}`,borderRadius:8,padding:'5px 10px',cursor:'pointer',width:'100%'}}>+ Add note</button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <div style={{margin:'0 16px 10px'}}>
            <textarea
              defaultValue={notes[activeDay] || ''}
              onInput={e => handleNoteInput(activeDay, e.target.value)}
              onBlur={() => flushNote(activeDay)}
              placeholder="Session notes..." rows={2}
              style={{width:'100%',background:S.bg2,border:`1px solid ${S.border}`,borderRadius:12,
                padding:'10px 12px',color:S.text,fontSize:13,resize:'none',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{height:80}}/>
        </div>
      )}

      {view === 'history' && (
        <div style={{paddingBottom:40}}>
          {history.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:S.text3,fontSize:13}}>
              No sessions saved yet.<br/><br/>Complete a session and tap<br/><strong style={{color:S.text2}}>Save session</strong> in the header.
            </div>
          ) : history.map((h,hi) => (
            <div key={hi} style={{margin:'12px 16px 0',background:S.bg2,borderRadius:12,border:`1px solid ${S.border}`,overflow:'hidden'}}>
              <div style={{padding:'12px 14px',background:S.bg3,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,fontWeight:600}}>{h.date_label||h.iso_date}</span>
                <span style={{fontSize:11,color:S.text3}}>{Object.values(h.log??{}).flat().filter(s=>s?.done).length} sets</span>
              </div>
              <div style={{padding:'10px 14px'}}>
                {supersets.map(ss => ['push','pull'].map(side => {
                  const sets = (h.log??{})[`${ss.id}_${side}`]?.filter(s=>s?.done&&s.val)
                  if (!sets?.length) return null
                  const best = Math.max(...sets.map(s=>parseFloat(s.val)||0))
                  return best > 0 ? (
                    <div key={ss.id+side} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'4px 0',borderBottom:`0.5px solid ${S.border}`}}>
                      <span style={{fontSize:12,color:S.text2}}>{ss[side].name}</span>
                      <span style={{fontSize:12,fontWeight:600,color:S.green}}>Best: {best}</span>
                    </div>
                  ) : null
                }))}
                {h.note&&<div style={{fontSize:11,color:S.text3,marginTop:8,paddingTop:6,borderTop:`0.5px solid ${S.border}`}}>📝 {h.note}</div>}
              </div>
            </div>
          ))}
          <div style={{height:40}}/>
        </div>
      )}

      {view === 'progress' && (
        <div style={{paddingBottom:40}}>
          <div style={{padding:'16px 16px 4px'}}>
            <select value={selEx} onChange={e => setSelEx(e.target.value)}
              style={{width:'100%',background:S.bg2,border:`1px solid ${S.border2}`,borderRadius:12,
                padding:'12px 14px',color:S.text,fontSize:14,fontWeight:500,fontFamily:'inherit',cursor:'pointer',
                appearance:'none',WebkitAppearance:'none',outline:'none',
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b6b6b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat:'no-repeat',backgroundPosition:'right 14px center'}}>
              {allExercises().map(ex => (
                <option key={`${ex.ssId}_${ex.side}`} value={`${ex.ssId}_${ex.side}`} style={{background:S.bg3,color:S.text}}>{ex.name}</option>
              ))}
            </select>
          </div>
          {(() => {
            const [ssId, side] = selEx.split('_')
            const selExData = allExercises().find(e => `${e.ssId}_${e.side}` === selEx)
            if (!selExData) return null
            const exHist = getExHistory(ssId, side)
            const total = totalSetsDone(ssId, side)
            const best = exHist.length ? Math.max(...exHist.map(p=>p.best)) : 0
            const latest = exHist.length ? exHist[exHist.length-1].best : 0
            const prev = exHist.length > 1 ? exHist[exHist.length-2].best : null
            const delta = prev !== null ? +(latest-prev).toFixed(1) : null
            return (
              <div style={{padding:'12px 16px'}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>{selExData.name}</div>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  {[{label:'Total sets',val:total,color:S.purple},{label:'Sessions',val:exHist.length,color:S.blue},{label:'Personal best',val:best||'—',color:S.green}].map(({label,val,color}) => (
                    <div key={label} style={{flex:1,background:S.bg2,borderRadius:8,padding:'10px',border:`1px solid ${S.border}`}}>
                      <div style={{fontSize:10,color:S.text3,textTransform:'uppercase',letterSpacing:'.4px',marginBottom:4}}>{label}</div>
                      <div style={{fontSize:22,fontWeight:800,color}}>{val}</div>
                    </div>
                  ))}
                </div>
                {delta !== null && (
                  <div style={{fontSize:12,fontWeight:600,marginBottom:12,color:delta>0?S.green:delta<0?S.red:S.text3}}>
                    {delta>=0?'+':''}{delta} vs previous session
                  </div>
                )}
                {exHist.length > 1 ? (() => {
                  const pts = exHist.slice(-10)
                  const max = Math.max(...pts.map(p=>p.best))
                  return (
                    <div style={{background:S.bg2,borderRadius:12,border:`1px solid ${S.border}`,padding:14,marginBottom:12}}>
                      <div style={{fontSize:11,color:S.text3,textTransform:'uppercase',letterSpacing:'.4px',fontWeight:600,marginBottom:12}}>Best per session</div>
                      <div style={{display:'flex',gap:4,alignItems:'flex-end',height:80}}>
                        {pts.map((p,i) => {
                          const h = max?Math.max(8,Math.round((p.best/max)*68)):8
                          const isLast = i===pts.length-1
                          return (
                            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:0}}>
                              <span style={{fontSize:9,fontWeight:700,color:isLast?S.purple:S.text3}}>{p.best}</span>
                              <div style={{width:'100%',borderRadius:'3px 3px 0 0',height:h,background:isLast?S.purple:'#5b21b666'}}/>
                              <span style={{fontSize:9,color:S.text3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{p.date.replace(/\s?\d{4}/,'').trim().slice(0,7)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })() : (
                  <div style={{background:S.bg2,borderRadius:12,border:`1px solid ${S.border}`,padding:24,marginBottom:12,textAlign:'center'}}>
                    <div style={{fontSize:13,color:S.text3}}>{exHist.length===1?'Log more sessions to see your chart':'No data yet for this exercise.'}</div>
                    {exHist.length===1&&<div style={{fontSize:36,fontWeight:800,color:S.purple,marginTop:8}}>{exHist[0].best}</div>}
                  </div>
                )}
                {exHist.length > 0 && (() => {
                  const last = exHist[exHist.length-1]
                  return (
                    <div style={{background:S.bg2,borderRadius:12,border:`1px solid ${S.border}`,padding:'12px 14px'}}>
                      <div style={{fontSize:11,color:S.text3,textTransform:'uppercase',letterSpacing:'.4px',fontWeight:600,marginBottom:8}}>Last session — {last.date}</div>
                      {last.sets.map((s,i) => (
                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:`0.5px solid ${S.border}`}}>
                          <span style={{fontSize:12,color:S.text2}}>Set {i+1}</span>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            {s.band&&s.band!=='Unassisted'&&<span style={{fontSize:10,color:S.blue,background:'#0d1f3c',padding:'2px 7px',borderRadius:10}}>{s.band}</span>}
                            {s.feel&&<span style={{fontSize:10,color:S.text3}}>{s.feel}</span>}
                            <span style={{fontSize:13,fontWeight:700,color:S.green}}>{s.val}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )
          })()}
          <div style={{height:40}}/>
        </div>
      )}

      {modal && <LogModal ctx={modal} onSave={handleModalSave} onSkip={handleModalSkip} onClose={() => setModal(null)}/>}
      {editCtx && <EditModal ex={editCtx.ex} onSave={async updated => { await saveExerciseEdit(editCtx.ssId,editCtx.side,updated); setEditCtx(null) }} onClose={() => setEditCtx(null)}/>}
      {noteCtx && <NoteModal title={noteCtx.title} initial={noteCtx.initial} onSave={async val => { await saveExNote(noteCtx.key,val); setNoteCtx(null) }} onClose={() => setNoteCtx(null)}/>}
      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)}/>}
    </div>
  )
}
