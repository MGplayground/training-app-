import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { SUPERSETS, BANDS, FEEL, DAYS } from './data'

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
  const fallback = Array.from({length:ex.sets}, () => ({val:'',band:ex.band,feel:'',done:false}))
  if (!stored || !Array.isArray(stored)) return fallback
  return Array.from({length:ex.sets}, (_,i) => stored[i] ?? {val:'',band:ex.band,feel:'',done:false})
}

function CheckIcon({color='#fff', size=14}) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Spinner() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 0'}}>
      <div style={{width:28,height:28,border:'3px solid #EDE9FE',borderTop:'3px solid #6D28D9',borderRadius:'50%',animation:'_sp 0.8s linear infinite'}}/>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function RestTimer({onDismiss}) {
  const OPTIONS = [60,90,120,180]
  const [sel, setSel] = useState(90)
  const [rem, setRem] = useState(null)
  const [active, setActive] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (active && rem > 0) {
      ref.current = setInterval(() => setRem(r => {
        if (r <= 1) { clearInterval(ref.current); setActive(false); return 0 }
        return r - 1
      }), 1000)
    }
    return () => clearInterval(ref.current)
  }, [active])
  const pct = rem !== null ? Math.round(((sel-rem)/sel)*100) : 0
  const display = rem !== null ? rem : sel
  const m = Math.floor(display/60), s = (display%60).toString().padStart(2,'0')
  return (
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:900,display:'flex',justifyContent:'center',pointerEvents:'none'}}>
      <div style={{width:'100%',maxWidth:430,padding:'16px 20px 40px',background:'#fff',borderTop:'1px solid #E5E7EB',boxShadow:'0 -4px 24px rgba(0,0,0,0.12)',pointerEvents:'all'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:700,color:'#6D28D9',textTransform:'uppercase',letterSpacing:'0.07em'}}>Rest timer</span>
          <button onClick={onDismiss} style={{background:'none',border:'none',color:'#aaa',fontSize:16,cursor:'pointer',padding:'2px 6px'}}>✕</button>
        </div>
        {!active && rem===null && (
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {OPTIONS.map(o => (
              <button key={o} onClick={()=>setSel(o)} style={{flex:1,padding:'8px 4px',fontSize:12,fontWeight:sel===o?700:400,borderRadius:20,cursor:'pointer',border:`2px solid ${sel===o?'#6D28D9':'#E5E7EB'}`,background:sel===o?'#6D28D9':'#fff',color:sel===o?'#fff':'#555'}}>
                {o<60?`${o}s`:`${Math.floor(o/60)}m${o%60?`${o%60}s`:''}`}
              </button>
            ))}
          </div>
        )}
        {rem !== null && (
          <div style={{marginBottom:14}}>
            <div style={{height:5,background:'#EDE9FE',borderRadius:3,marginBottom:12}}>
              <div style={{height:5,borderRadius:3,background:rem===0?'#22C55E':'#6D28D9',width:`${pct}%`,transition:'width 1s linear'}}/>
            </div>
            <div style={{textAlign:'center',fontSize:52,fontWeight:900,color:rem===0?'#22C55E':'#111',lineHeight:1}}>
              {rem===0?'Go!':m>0?`${m}:${s}`:display}
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:8}}>
          {!active && rem===null && (
            <button onClick={()=>{setRem(sel);setActive(true)}} style={{flex:1,padding:'13px',fontSize:14,fontWeight:700,borderRadius:14,border:'none',background:'#6D28D9',color:'#fff',cursor:'pointer'}}>Start rest</button>
          )}
          {active && (
            <button onClick={()=>{clearInterval(ref.current);setActive(false);setRem(null)}} style={{flex:1,padding:'13px',fontSize:14,fontWeight:600,borderRadius:14,border:'2px solid #E5E7EB',background:'#fff',color:'#555',cursor:'pointer'}}>Cancel</button>
          )}
          {!active && rem!==null && (
            <>
              <button onClick={()=>setRem(null)} style={{flex:1,padding:'13px',fontSize:14,fontWeight:600,borderRadius:14,border:'2px solid #E5E7EB',background:'#fff',color:'#555',cursor:'pointer'}}>Reset</button>
              <button onClick={onDismiss} style={{flex:1,padding:'13px',fontSize:14,fontWeight:700,borderRadius:14,border:'none',background:'#6D28D9',color:'#fff',cursor:'pointer'}}>Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LogModal({side, ex, si, initialSet, onSave, onClose}) {
  const [val,  setVal]  = useState(initialSet?.val  ?? '')
  const [band, setBand] = useState(initialSet?.band ?? ex.band)
  const [feel, setFeel] = useState(initialSet?.feel ?? '')
  function commit() { onSave({val, band, feel, done:true}); onClose() }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onPointerDown={onClose}>
      <div onPointerDown={e=>e.stopPropagation()}
        style={{background:'#fff',borderRadius:'22px 22px 0 0',padding:'20px 20px 48px',width:'100%',maxWidth:430,boxSizing:'border-box'}}>
        <div style={{width:40,height:4,background:'#E5E7EB',borderRadius:2,margin:'0 auto 18px'}}/>
        <div style={{fontSize:10,fontWeight:800,color:side==='Push'?'#7C3AED':'#059669',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>{side} · Set {si+1}</div>
        <div style={{fontSize:17,fontWeight:700,color:'#111',marginBottom:20}}>{ex.name}</div>
        <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>
          {ex.target.includes('s') ? 'Hold time (sec)' : 'Reps'}
        </div>
        <input type="tel" value={val} onChange={e=>setVal(e.target.value)} placeholder="0"
          style={{display:'block',width:'100%',fontSize:54,fontWeight:900,textAlign:'center',padding:'6px 0',border:'none',borderBottom:'3px solid #7C3AED',outline:'none',background:'transparent',color:'#111',boxSizing:'border-box',fontFamily:'inherit',marginBottom:22}}/>
        <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Band</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18}}>
          {BANDS.map(b=>(
            <button key={b} onClick={()=>setBand(b)} style={{padding:'7px 12px',fontSize:13,borderRadius:20,cursor:'pointer',fontWeight:band===b?700:400,border:`2px solid ${band===b?'#7C3AED':'#E5E7EB'}`,background:band===b?'#7C3AED':'#fff',color:band===b?'#fff':'#555'}}>{b}</button>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Feel</div>
        <div style={{display:'flex',gap:6,marginBottom:24}}>
          {FEEL.map(f=>(
            <button key={f} onClick={()=>setFeel(f)} style={{flex:1,padding:'10px 4px',fontSize:13,borderRadius:20,cursor:'pointer',fontWeight:feel===f?700:400,border:`2px solid ${feel===f?'#7C3AED':'#E5E7EB'}`,background:feel===f?'#7C3AED':'#fff',color:feel===f?'#fff':'#555'}}>{f}</button>
          ))}
        </div>
        <button onClick={commit} style={{width:'100%',padding:'16px',fontSize:16,fontWeight:800,borderRadius:16,border:'none',background:'#6D28D9',color:'#fff',cursor:'pointer'}}>
          Log set →
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [ready,        setReady]        = useState(false)
  const [view,         setView]         = useState('session')
  const [trainingDays, setTrainingDays] = useState([])
  const [activeDay,    setActiveDay]    = useState(() => getTodayISO())
  const [openSS,       setOpenSS]       = useState(null)
  const [modal,        setModal]        = useState(null)
  const [logs,         setLogs]         = useState({})
  const [notes,        setNotes]        = useState({})
  const [history,      setHistory]      = useState([])
  const [flash,        setFlash]        = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [settingDays,  setSettingDays]  = useState(false)
  const [showTimer,    setShowTimer]    = useState(false)
  const weekDates = getWeekDates()
  const TODAY = getTodayISO()

  useEffect(() => {
    (async () => {
      const [{ data: td }, { data: lg }, { data: nt }, { data: hs }] = await Promise.all([
        supabase.from('training_days').select('iso_date'),
        supabase.from('session_logs').select('*'),
        supabase.from('session_notes').select('iso_date, note'),
        supabase.from('session_history').select('*').order('saved_at', {ascending:false}),
      ])
      if (td) setTrainingDays(td.map(r => r.iso_date))
      if (lg) {
        const rebuilt = {}
        lg.forEach(r => {
          if (!rebuilt[r.iso_date]) rebuilt[r.iso_date] = {}
          rebuilt[r.iso_date][`${r.ss_id}-${r.side}`] = r.sets
        })
        setLogs(rebuilt)
      }
      if (nt) {
        const rebuilt = {}
        nt.forEach(r => { rebuilt[r.iso_date] = r.note })
        setNotes(rebuilt)
      }
      if (hs) setHistory(hs)
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
    const stored = logs?.[iso]?.[`${ssId}-${side}`]
    return buildSets(stored, ex)
  }

  async function writeSets(iso, ssId, side, newSets) {
    const updatedDay  = { ...(logs[iso] ?? {}), [`${ssId}-${side}`]: newSets }
    const updatedLogs = { ...logs, [iso]: updatedDay }
    setLogs(updatedLogs)
    await supabase.from('session_logs').upsert({
      iso_date: iso, ss_id: ssId, side, sets: newSets, updated_at: new Date().toISOString()
    }, { onConflict: 'iso_date,ss_id,side' })
  }

  function openModal(ssId, side, ex, si) {
    const sets = getSets(activeDay, ssId, side, ex)
    setModal({ssId, side, ex, si, set: sets[si]})
  }

  async function handleModalSave(updated) {
    const {ssId, side, ex, si} = modal
    const prev = getSets(activeDay, ssId, side, ex)
    const next = prev.map((s,i) => i===si ? {...s,...updated} : s)
    await writeSets(activeDay, ssId, side, next)
    setShowTimer(true)
  }

  async function updateNote(iso, val) {
    setNotes(prev => ({...prev, [iso]:val}))
    await supabase.from('session_notes').upsert({
      iso_date: iso, note: val, updated_at: new Date().toISOString()
    }, {onConflict:'iso_date'})
  }

  async function saveSession() {
    setSaving(true)
    const dayInfo = weekDates.find(d => d.iso===activeDay)
    const entry = {
      iso_date: activeDay,
      date_label: dayInfo?.full ?? activeDay,
      log: logs[activeDay] ?? {},
      note: notes[activeDay] ?? '',
      saved_at: new Date().toISOString()
    }
    await supabase.from('session_history').upsert(entry, {onConflict:'iso_date'})
    const {data: hs} = await supabase.from('session_history').select('*').order('saved_at',{ascending:false})
    if (hs) setHistory(hs)
    setSaving(false)
    setFlash(true)
    setTimeout(() => setFlash(false), 1600)
  }

  function dayStatus(iso) {
    const isTD  = trainingDays.includes(iso)
    const flat  = Object.values(logs[iso] ?? {}).flat()
    const done  = flat.filter(s => s?.done).length
    const total = SUPERSETS.reduce((a,ss) => a + ss.push.sets + ss.pull.sets, 0)
    const saved = history.some(h => h.iso_date===iso)
    return {isTD, done, total, pct: total ? Math.round(done/total*100) : 0, saved}
  }

  const ads = dayStatus(activeDay)
  const adl = weekDates.find(d=>d.iso===activeDay)?.full ?? ''

  if (!ready) return <div style={{background:'#F5F5F7',minHeight:'100vh'}}><Spinner/></div>

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',maxWidth:430,margin:'0 auto',background:'#F5F5F7',minHeight:'100vh',paddingBottom:120}}>
      {modal && <LogModal side={modal.side} ex={modal.ex} si={modal.si} initialSet={modal.set} onSave={handleModalSave} onClose={()=>setModal(null)}/>}
      {showTimer && !modal && <RestTimer onDismiss={()=>setShowTimer(false)}/>}

      <div style={{background:'#fff',paddingTop:16,borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
        <div style={{padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#6D28D9',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3}}>Week 1 · Return to Performance</div>
            <div style={{fontSize:22,fontWeight:800,color:'#111',lineHeight:1.1}}>Training Week</div>
          </div>
          <button onClick={()=>setSettingDays(v=>!v)}
            style={{padding:'7px 14px',fontSize:12,fontWeight:700,borderRadius:20,cursor:'pointer',border:`2px solid ${settingDays?'#6D28D9':'#E5E7EB'}`,background:settingDays?'#6D28D9':'#fff',color:settingDays?'#fff':'#444'}}>
            {settingDays?'Done':'Set days'}
          </button>
        </div>

        <div style={{display:'flex',padding:'0 8px',overflowX:'auto'}}>
          {weekDates.map(d => {
            const st = dayStatus(d.iso)
            const isToday  = d.iso === TODAY
            const isActive = d.iso === activeDay
            return (
              <div key={d.iso}
                onClick={()=>settingDays?toggleDay(d.iso):(setActiveDay(d.iso),setView('session'))}
                style={{flex:1,minWidth:42,display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 2px 12px',cursor:'pointer',borderBottom:isActive?'3px solid #6D28D9':'3px solid transparent'}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6,color:isActive?'#6D28D9':isToday?'#111':'#bbb'}}>{d.label}</div>
                <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                  background:settingDays?(st.isTD?'#6D28D9':'#F5F5F7'):st.saved?'#ECFDF5':st.isTD?(isActive?'#6D28D9':'#F5F3FF'):'#F5F5F7',
                  border:settingDays?(st.isTD?'2px solid #6D28D9':'2px solid #E5E7EB'):isToday&&!isActive?'2px solid #6D28D9':'2px solid transparent'}}>
                  {st.saved && !settingDays
                    ? <CheckIcon color={isActive?'#fff':'#22C55E'} size={16}/>
                    : <span style={{fontSize:13,fontWeight:800,color:settingDays?(st.isTD?'#fff':'#aaa'):isActive?'#fff':st.isTD?'#6D28D9':'#aaa'}}>
                        {settingDays?d.date:st.isTD&&st.done>0?`${st.pct}%`:d.date}
                      </span>
                  }
                </div>
                <div style={{fontSize:9,color:'#ccc',marginTop:3}}>{d.month}</div>
              </div>
            )
          })}
        </div>

        {settingDays && <div style={{padding:'4px 20px 10px',fontSize:12,color:'#888',textAlign:'center'}}>Tap days to toggle your training schedule</div>}

        <div style={{display:'flex'}}>
          {[['session','Session'],['history','History'],['progress','Progress']].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{flex:1,padding:'12px 0',fontSize:13,cursor:'pointer',fontWeight:view===v?700:400,color:view===v?'#6D28D9':'#888',background:'transparent',border:'none',borderBottom:view===v?'2px solid #6D28D9':'2px solid transparent'}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'16px 16px 0'}}>
        {view==='session' && (()=>{
          if (!ads.isTD) return (
            <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:16,border:'1px solid rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:36,marginBottom:12}}>🛌</div>
              <div style={{fontSize:16,fontWeight:700,color:'#111',marginBottom:6}}>Rest day</div>
              <div style={{fontSize:13,color:'#888',marginBottom:16}}>Recovery is part of the program.</div>
              <button onClick={()=>setSettingDays(true)} style={{padding:'10px 20px',fontSize:13,fontWeight:600,borderRadius:20,cursor:'pointer',border:'2px solid #6D28D9',background:'transparent',color:'#6D28D9'}}>Change training days</button>
            </div>
          )

          if (ads.saved) return (
            <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:16,border:'1px solid #86EFAC'}}>
              <div style={{fontSize:36,marginBottom:12}}>✅</div>
              <div style={{fontSize:16,fontWeight:700,color:'#111',marginBottom:6}}>Session complete</div>
              <div style={{fontSize:13,color:'#888'}}>Data saved. Check History for your numbers.</div>
            </div>
          )

          return (
            <>
              <div style={{marginBottom:12,padding:'14px 16px',borderRadius:16,background:'#fff',border:'1px solid rgba(0,0,0,0.06)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#6D28D9',marginBottom:2}}>{adl}</div>
                    <div style={{fontSize:12,color:'#888'}}>{ads.done}/{ads.total} sets logged</div>
                  </div>
                  <div style={{width:46,height:46,borderRadius:'50%',background:'#F5F3FF',border:'2px solid #6D28D9',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:14,fontWeight:800,color:'#6D28D9'}}>{ads.pct}%</span>
                  </div>
                </div>
                {ads.done>0 && (
                  <div style={{marginTop:10,height:4,background:'#EDE9FE',borderRadius:2}}>
                    <div style={{height:4,borderRadius:2,background:'#6D28D9',width:`${ads.pct}%`,transition:'width 0.3s'}}/>
                  </div>
                )}
              </div>

              <div style={{marginBottom:12,padding:'11px 14px',borderRadius:12,background:'#FEF2F2',border:'1px solid #FECACA',display:'flex',gap:10,alignItems:'flex-start'}}>
                <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
                <div style={{fontSize:12,color:'#991B1B',lineHeight:1.6}}>Elbow flag active. Stop any set immediately if you feel a tricep niggle.</div>
              </div>

              {SUPERSETS.map(ss => {
                const isOpen   = openSS===ss.id
                const pushSets = getSets(activeDay, ss.id, 'push', ss.push)
                const pullSets = getSets(activeDay, ss.id, 'pull', ss.pull)
                const ssDone   = [...pushSets,...pullSets].filter(s=>s.done).length
                const ssTotal  = ss.push.sets + ss.pull.sets
                const allDone  = ssDone===ssTotal
                const isRehab  = ss.id==='ss6'
                return (
                  <div key={ss.id} style={{marginBottom:10,borderRadius:16,overflow:'hidden',background:'#fff',border:`1.5px solid ${allDone?'#22C55E':isOpen?isRehab?'#FECACA':'#C4B5FD':isRehab?'#FEE2E2':'rgba(0,0,0,0.08)'}`}}>
                    <div onClick={()=>setOpenSS(isOpen?null:ss.id)}
                      style={{padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:38,height:38,borderRadius:10,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,
                        background:allDone?'#ECFDF5':isOpen?isRehab?'#FEF2F2':'#F5F3FF':isRehab?'#FEF2F2':'#F5F5F7'}}>
                        {allDone ? <CheckIcon color='#22C55E' size={18}/> : isRehab?'🔴':'●'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:'#111',marginBottom:3}}>{ss.label}</div>
                        <div style={{fontSize:11,color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ss.push.name} + {ss.pull.name}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                        <span style={{fontSize:12,fontWeight:700,color:allDone?'#22C55E':'#aaa'}}>{ssDone}/{ssTotal}</span>
                        <span style={{fontSize:18,color:'#ccc',display:'inline-block',transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}>⏄</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{borderTop:'1px solid #F0F0F0',padding:'16px'}}>
                        <div style={{fontSize:12,color:'#888',marginBottom:14,fontStyle:'italic'}}>{ss.note}</div>
                        {[{side:'Push',ex:ss.push,sets:pushSets},{side:'Pull',ex:ss.pull,sets:pullSets}].map(({side,ex,sets})=>(
                          <div key={side} style={{marginBottom:20}}>
                            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                              <div>
                                <div style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2,color:side==='Push'?'#7C3AED':'#059669'}}>{side}</div>
                                <div style={{fontSize:15,fontWeight:700,color:'#111'}}>{ex.name}</div>
                                <div style={{fontSize:12,color:'#888'}}>{ex.sets} sets · {ex.target} · {ex.band}</div>
                              </div>
                              <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,flexShrink:0,marginLeft:8,background:'rgba(124,58,237,0.1)',color:'#7C3AED'}}>{ex.role}</span>
                            </div>
                            <div style={{fontSize:12,color:'#555',marginBottom:12,padding:'10px 12px',background:'#FAFAFA',borderRadius:10,lineHeight:1.6}}>{ex.coaching}</div>
                            {sets.map((s,si) => (
                              <button key={`${ss.id}-${side}-${si}`} onClick={()=>openModal(ss.id,side,ex,si)}
                                style={{width:'100%',marginBottom:8,padding:'13px 16px',borderRadius:12,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12,background:s.done?'#F0FDF4':'#FAFAFA',border:`1.5px solid ${s.done?'#22C55E':'#E5E7EB'}`}}>
                                <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:s.done?'#22C55E':'#E9E9E9',transition:'background 0.2s'}}>
                                  {s.done ? <CheckIcon/> : <span style={{fontSize:13,fontWeight:700,color:'#888'}}>{si+1}</span>}
                                </div>
                                <span style={{flex:1,fontSize:14,fontWeight:600,color:s.done?'#059669':'#111'}}>Set {si+1}</span>
                                {s.done&&s.val ? <span style={{fontSize:15,fontWeight:800,color:'#059669'}}>{s.val}{ex.target.includes('s')?'s':''}</span> : null}
                                {s.done&&s.feel ? <span style={{fontSize:11,padding:'3px 9px',borderRadius:20,background:'#DCFCE7',color:'#16A34A',fontWeight:600}}>{s.feel}</span> : null}
                                {!s.done && <span style={{fontSize:12,color:'#bbb'}}>Tap to log</span>}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <textarea value={notes[activeDay]??''} onChange={e=>updateNote(activeDay,e.target.value)}
                placeholder="Session notes — how did the elbow feel? Any niggles to flag?" rows={3}
                style={{width:'100%',marginTop:4,marginBottom:12,fontSize:14,boxSizing:'border-box',padding:'12px 14px',borderRadius:14,border:'1px solid #E5E7EB',background:'#fff',color:'#111',resize:'none',fontFamily:'inherit',outline:'none'}}/>

              <button onClick={saveSession} disabled={saving}
                style={{width:'100%',padding:'16px',fontSize:16,fontWeight:800,borderRadius:16,border:'none',cursor:'pointer',marginBottom:10,transition:'background 0.3s',background:flash?'#059669':saving?'#9CA3AF':'#6D28D9',color:'#fff'}}>
                {flash?'Saved ✓':saving?'Saving...':'Save session'}
              </button>
            </>
          )
        })()}

        {view==='history' && (
          history.length===0
            ? <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:16,border:'1px solid rgba(0,0,0,0.06)'}}>
                <div style={{fontSize:40,marginBottom:12}}>📋</div>
                <div style={{fontSize:16,fontWeight:700,color:'#111',marginBottom:6}}>No sessions yet</div>
                <div style={{fontSize:14,color:'#888'}}>Complete your first session to see history here.</div>
              </div>
            : history.map((h,hi)=>(
              <div key={hi} style={{marginBottom:12,padding:'16px',background:'#fff',border:'1px solid rgba(0,0,0,0.06)',borderRadius:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{fontSize:15,fontWeight:800,color:'#111'}}>{h.date_label}</div>
                  <div style={{fontSize:12,color:'#888'}}>{Object.values(h.log).flat().filter(s=>s.done).length} sets</div>
                </div>
                {h.note&&<div style={{fontSize:13,color:'#555',marginBottom:12,padding:'10px 12px',background:'#FAFAFA',borderRadius:10,lineHeight:1.6,fontStyle:'italic'}}>{h.note}</div>}
                {SUPERSETS.map(ss=>{
                  const rows=[[ss.push,h.log[`${ss.id}-push`]?.filter(s=>s.done&&s.val),'Push'],[ss.pull,h.log[`${ss.id}-pull`]?.filter(s=>s.done&&s.val),'Pull']].filter(([,s])=>s?.length)
                  if(!rows.length) return null
                  return (
                    <div key={ss.id} style={{marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{ss.label}</div>
                      {rows.map(([ex,sets,side])=>(
                        <div key={side} style={{marginBottom:6}}>
                          <div style={{fontSize:12,color:'#555',marginBottom:4}}>{ex.name}</div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            {sets.map((s,i)=>(
                              <span key={i} style={{fontSize:12,padding:'4px 10px',background:'#F5F3FF',borderRadius:20,color:'#6D28D9',fontWeight:600}}>
                                {s.val}{ex.target.includes('s')?'s':''}{s.band!==ex.band?` · ${s.band}`:''}{s.feel?` · ${s.feel}`:''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))
        )}

        {view==='progress' && (
          history.length<2
            ? <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:16,border:'1px solid rgba(0,0,0,0.06)'}}>
                <div style={{fontSize:40,marginBottom:12}}>📈</div>
                <div style={{fontSize:16,fontWeight:700,color:'#111',marginBottom:6}}>Need more data</div>
                <div style={{fontSize:14,color:'#888'}}>Complete 2+ sessions to see progress charts.</div>
              </div>
            : <>
                {[
                  {label:'Full planche hold',ssId:'ss1',side:'push',unit:'s',color:'#6D28D9'},
                  {label:'Front lever touch',ssId:'ss1',side:'pull',unit:'s',color:'#059669'},
                  {label:'FL pull-ups',ssId:'ss2',side:'pull',unit:'',color:'#0891B2'},
                  {label:'Straddle planche press',ssId:'ss2',side:'push',unit:'',color:'#D97706'},
                ].map(({label,ssId,side,unit,color})=>{
                  const pts=[...history].reverse().map(h=>{
                    const sets=h.log[`${ssId}-${side}`]?.filter(s=>s.done&&s.val)
                    if(!sets?.length) return null
                    return {date:h.date_label.split(' ').slice(0,2).join(' '),best:Math.max(...sets.map(s=>parseFloat(s.val)||0))}
                  }).filter(Boolean)
                  if(!pts.length) return null
                  const max=Math.max(...pts.map(p=>p.best))||1
                  const latest=pts[pts.length-1]
                  const prev=pts.length>1?pts[pts.length-2]:null
                  const trend=prev?+(latest.best-prev.best).toFixed(1):0
                  return (
                    <div key={label} style={{marginBottom:12,padding:'16px',background:'#fff',border:'1px solid rgba(0,0,0,0.06)',borderRadius:16}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
                        <div style={{fontSize:13,fontWeight:700,color:'#111'}}>{label}</div>
                        {trend!==0&&<div style={{fontSize:13,fontWeight:800,color:trend>0?'#059669':'#DC2626'}}>{trend>0?'+':''}{trend}{unit}</div>}
                      </div>
                      <div style={{fontSize:28,fontWeight:900,color,marginBottom:14}}>{latest.best}{unit}</div>
                      <div style={{display:'flex',alignItems:'flex-end',gap:5,height:72}}>
                        {pts.map((p,i)=>(
                          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                            <div style={{fontSize:10,fontWeight:700,color}}>{p.best}{unit}</div>
                            <div style={{width:'100%',borderRadius:4,background:i===pts.length-1?color:color+'33',height:`${Math.max(6,(p.best/max)*54)}px`,transition:'height 0.3s'}}/>
                            <div style={{fontSize:9,color:'#bbb',whiteSpace:'nowrap'}}>{p.date}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
        )}
      </div>
    </div>
  )
}
