import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Plus, RotateCcw, Trash2, Check } from 'lucide-react';
import { supabase } from './supabaseClient';
import {
  INIT_SS, REHAB_SS, ASSIST_LEVELS, FEEL_LABELS, DAYS,
  RECOVERY, RECOVERY_EXTRAS, PHASE_CONFIG, generatePhaseWorkout,
} from './data';

function Face({ type, active, onClick }) {
  const faces = {
    4: { color: 'var(--green)', path: 'M9 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 5.5c-2.5 0-4.5-1.5-5.5-3h11c-1 1.5-3 3-5.5 3zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z' },
    3: { color: 'var(--amber)', path: 'M9 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-6 4h6v1.5H9V16zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z' },
    2: { color: '#f97316',      path: 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 17c-2 0-3.5-1-4-2l1.5-1c.5 1 1.5 1.5 2.5 1.5s2-.5 2.5-1.5l1.5 1c-.5 1-2 2-4 2zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z' },
    1: { color: 'var(--red)',   path: 'M8 11.5l2-1.5-2-1.5v3zm6 0l-2-1.5 2-1.5v3zM12 14c-1.5 0-2.5 1-2.5 2h5c0-1-1-2-2.5-2zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z' }
  };
  const f = faces[type];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? f.color : 'var(--border2)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" onClick={onClick} style={{ width: 22, height: 22, cursor: 'pointer', flexShrink: 0, transition: 'stroke 0.2s', ...(!active&&{opacity:0.6}) }}>
      <path d={f.path} />
    </svg>
  );
}

function todayISO() { return new Date().toISOString().split('T')[0]; }
function formatDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function getWeekDates() {
  const now = new Date(); const dow = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return { label: DAYS[i], date: d.getDate(), iso: d.toISOString().split('T')[0], full: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) };
  });
}
function getWeekMonday() {
  const now = new Date(); const dow = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return mon.toISOString().split('T')[0];
}
function VideoSlot({ videoUrl, editHint = 'Edit exercise to add a video.' }) {
  if (!videoUrl) return (<div className="video-placeholder" title={editHint}><span className="video-placeholder-icon">▶</span><span className="video-placeholder-label">No video — add via edit</span></div>);
  if (videoUrl.startsWith('yt:')) { const id = videoUrl.slice(3); return (<div className="video-embed"><iframe src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`} allowFullScreen title="Exercise video" /></div>); }
  const href = videoUrl.startsWith('url:') ? videoUrl.slice(4) : videoUrl;
  return (<a className="video-ext-link" href={href} target="_blank" rel="noreferrer">▶ Watch video</a>);
}function SwapSVG({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M1 4h9M7 1l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 10H4m3 3L4 10l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

async function buildBriefingPrompt(iso) {
  const { data: rows, error } = await supabase
    .from('session_briefing_data')
    .select('ss_id,side,avg_feel,sets_completed,sets_skipped,session_best,exercise_note,session_note,flags')
    .eq('iso_date', iso);
  console.log('briefing rows:', rows, 'error:', error, 'iso:', iso);
  if (!rows || rows.length === 0) return null;
  const sessionNote = rows[0]?.session_note || null;
  let lines = rows.map(row => {
    let line = `${row.ss_id} ${row.side}: best=${row.session_best ?? '—'}, feel=${row.avg_feel ?? '—'}, done=${row.sets_completed}, skipped=${row.sets_skipped}`;
    if (row.flags?.length) line += ` | flags: ${row.flags.map(f => f.note).join('; ')}`;
    if (row.exercise_note) line += ` | athlete note: "${row.exercise_note}"`;
    return line;
  }).join('\n');
  let prompt = lines;
  if (sessionNote) prompt = `Session note from athlete: "${sessionNote}"\n\n` + prompt;
  return prompt;
}


export default function App() {
  const [activeTab, setActiveTab] = useState('session');
  const [selectedISO, setSelectedISO] = useState(todayISO());
  const [supersets, setSupersets] = useState(JSON.parse(JSON.stringify(INIT_SS)));
  const [ssNoteOverrides, setSsNoteOverrides] = useState({});
  const [exOverrides, setExOverrides] = useState({});
  const [videoOverrides, setVideoOverrides] = useState({});
  const [rehabOn, setRehabOn] = useState(false);
  const [trainingDays, setTrainingDays] = useState(new Set());
  const [logs, setLogs] = useState({});
  const [sessionNotes, setSessionNotes] = useState({});
  const [exNotes, setExNotes] = useState({});
  const [history, setHistory] = useState([]);
  const [openSS, setOpenSS] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [selectedExKey, setSelectedExKey] = useState('ss1_push');
  const [editModal, setEditModal] = useState(null);
  const [ssNoteModal, setSsNoteModal] = useState(null);
  const [exNoteModal, setExNoteModal] = useState(null);
  const [gateModal, setGateModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [resetTargetISO, setResetTargetISO] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editSets, setEditSets] = useState(3);
  const [editAssist, setEditAssist] = useState(100);
  const [editWeighted, setEditWeighted] = useState(false);
  const [editCoaching, setEditCoaching] = useState('');
  const [editVideo, setEditVideo] = useState('');
  const [ssNoteInput, setSsNoteInput] = useState('');
  const [exNoteInput, setExNoteInput] = useState('');
  const [feedbackFeel, setFeedbackFeel] = useState(0);
  const [feedbackFlags, setFeedbackFlags] = useState('');
  const [feedbackSessionNum, setFeedbackSessionNum] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const restIntervalRef = useRef(null);
  const [openRecItem, setOpenRecItem] = useState(null);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [openExtra, setOpenExtra] = useState(new Set());
  const [recTimers, setRecTimers] = useState({});
  const noteBufferRef = useRef({});
  const [loading, setLoading] = useState(true);
  const recIntervalsRef = useRef({});
  const longPressRef = useRef(null);
  const [currentPhase, setCurrentPhase] = useState(
    () => localStorage.getItem('cali_phase') || 'strength'
  );
  function setPhase(p) { setCurrentPhase(p); localStorage.setItem('cali_phase', p); }
  const [swapModal, setSwapModal] = useState(null); // { ssId, side, exName, slug }
  const [swapCandidates, setSwapCandidates] = useState([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [briefingModal, setBriefingModal] = useState(false);
  const [briefingText, setBriefingText] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  async function openSwapModal(ssId, side, exName, slug) {
    setSwapModal({ ssId, side, exName, slug });
    setSwapCandidates([]);
    setSwapLoading(true);
    const { data } = await supabase
      .from('exercise_swap_candidates')
      .select('swap_slug,swap_name,swap_track,swap_direction,swap_difficulty,current_band,athlete_notes')
      .eq('for_exercise_slug', slug)
      .order('swap_direction')
      .order('swap_difficulty');
    setSwapCandidates(data || []);
    setSwapLoading(false);
  }

  function onSwap(ssId, side, swapSlug, swapName) {
    setSupersets(prev => prev.map(ss => {
      if (ss.id !== ssId) return ss;
      return { ...ss, [side]: { ...ss[side], name: swapName, slug: swapSlug } };
    }));
    setSwapModal(null);
  }

  async function openBriefing() {
    setBriefingModal(true);
    setBriefingText(null);
    setBriefingLoading(true);

    const { data: logDates } = await supabase
      .from('session_logs')
      .select('iso_date')
      .lt('iso_date', selectedISO)
      .order('iso_date', { ascending: false })
      .limit(20);

    const lastISO = logDates?.find(r => r.iso_date)?.iso_date ?? null;

    if (!lastISO) {
      setBriefingLoading(false);
      return;
    }

    const { data: cached } = await supabase
      .from('session_history')
      .select('briefing_text')
      .eq('iso_date', lastISO)
      .single();

    if (cached?.briefing_text) {
      setBriefingText(cached.briefing_text);
      setBriefingLoading(false);
      return;
    }

    const prompt = await buildBriefingPrompt(lastISO);
    if (!prompt) { setBriefingLoading(false); return; }

    try {
      const res = await fetch(
        'https://dxryqlcwbzcgjyqtqaij.supabase.co/functions/v1/session-briefing',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        }
      );
      const data = await res.json();
      const text = data.briefing ?? null;
      setBriefingText(text);
      if (text) {
        await supabase
          .from('session_history')
          .update({ briefing_text: text, briefing_generated_at: new Date().toISOString() })
          .eq('iso_date', lastISO);
      }
    } catch(e) {
      console.error('Briefing error:', e);
    }
    setBriefingLoading(false);
  }

  // ── AUTO WEEKLY RESET ─────────────────────────────────────────────
  // Silently wipes the previous week's training days + logs on first
  // load of a new week. History tab data is preserved.
  async function autoResetIfNewWeek(currentLogs, currentTrainingDays) {
    const currentMonday = getWeekMonday();
    const storedMonday = localStorage.getItem('cali_last_known_week');
    if (storedMonday === currentMonday) return { logs: currentLogs, trainingDays: currentTrainingDays };

    // New week detected — wipe previous week from Supabase
    // We don't know which week was previous so we wipe anything NOT in the current week
    const currentWeekISOs = new Set(getWeekDates().map(d => d.iso));
    const staleISOs = Object.keys(currentLogs).filter(iso => !currentWeekISOs.has(iso));

    if (staleISOs.length > 0) {
      await Promise.all(staleISOs.flatMap(iso => [
        supabase.from('session_logs').delete().eq('iso_date', iso),
        supabase.from('training_days').delete().eq('iso_date', iso),
      ]));
    }

    // Update local state — remove stale days, keep history
    const freshLogs = { ...currentLogs };
    staleISOs.forEach(iso => delete freshLogs[iso]);
    const freshTD = new Set([...currentTrainingDays].filter(iso => currentWeekISOs.has(iso)));

    localStorage.setItem('cali_last_known_week', currentMonday);
    return { logs: freshLogs, trainingDays: freshTD };
  }

  useEffect(() => {
    async function loadAll() {
      try {
        const [{ data: tdData },{ data: logsData },{ data: snData },{ data: enData },{ data: histData },{ data: progData }] = await Promise.all([
          supabase.from('training_days').select('iso_date'),
          supabase.from('session_logs').select('*'),
          supabase.from('session_notes').select('*'),
          supabase.from('exercise_notes').select('*'),
          supabase.from('session_history').select('*').order('saved_at', { ascending: true }),
          supabase.from('active_programme').select('*').eq('id', '11111111-1111-1111-1111-111111111111').single(),
        ]);

        let rawLogs = {};
        const storedLocalLogs = localStorage.getItem('cali_logs_draft');
        if (storedLocalLogs) {
          try { rawLogs = JSON.parse(storedLocalLogs); } catch(e){}
        } else if (logsData) {
          logsData.forEach(r => { if (!rawLogs[r.iso_date]) rawLogs[r.iso_date] = {}; rawLogs[r.iso_date][`${r.ss_id}_${r.side}`] = r.sets; });
        }

        let rawTD = new Set();
        if (tdData) rawTD = new Set(tdData.map(r => r.iso_date));

        // Auto-reset if new week
        const { logs: cleanLogs, trainingDays: cleanTD } = await autoResetIfNewWeek(rawLogs, rawTD);
        setLogs(cleanLogs);
        setTrainingDays(cleanTD);

        if (snData) { const m = {}; snData.forEach(r => { m[r.iso_date] = r.note; }); setSessionNotes(m); }
        if (enData) { const m = {}; enData.forEach(r => { m[r.note_key] = r.note; }); setExNotes(m); }
        if (histData) setHistory(histData);
        
        if (progData && progData.payload && progData.payload.length > 0) {
           setSupersets(progData.payload);
        } else {
           // Seed database on first load
           const seed = JSON.parse(JSON.stringify(INIT_SS));
           setSupersets(seed);
           await supabase.from('active_programme').upsert({ id: '11111111-1111-1111-1111-111111111111', payload: seed });
        }
      } catch(e) { console.error('Load error:', e); } finally { setLoading(false); }
    }
    loadAll();
  }, []);

  async function syncProgramme(newSupersets) {
     setSupersets(newSupersets);
     await supabase.from('active_programme').upsert({ id: '11111111-1111-1111-1111-111111111111', payload: newSupersets });
  }

  const activeSS = rehabOn ? [...supersets, REHAB_SS] : [...supersets];
  function getSets(iso, ssId, side) {
    const ss = activeSS.find(s => s.id === ssId); if (!ss) return [];
    const ex = ss[side]; const stored = logs[iso]?.[`${ssId}_${side}`];
    const blank = () => ({ val:'', assist: ex.assist||100, feel:null, done:false, skipped:false, missed:false, ...(ex.isWeighted && { weight: '' }) });
    if (!stored || !Array.isArray(stored)) return Array.from({ length: ex.sets }, blank);
    return Array.from({ length: ex.sets }, (_, i) => stored[i] ?? blank());
  }
  const isActioned = s => s.done || s.skipped || s.missed;
  function unloggedSets(iso) {
    const r = [];
    activeSS.forEach(ss => ['push','pull'].forEach(side => getSets(iso,ss.id,side).forEach((s,i) => { if (!isActioned(s)) r.push({ ssId:ss.id, side, idx:i, name:ss[side].name, ssLabel:ss.label }); })));
    return r;
  }
  function sessionProg(iso) {
    let d=0,t=0;
    activeSS.forEach(ss => ['push','pull'].forEach(side => getSets(iso,ss.id,side).forEach(s => { t++; if (isActioned(s)) d++; })));
    return { decided:d, total:t, pct: t ? Math.round(d/t*100) : 0 };
  }
  function doneSetsCount(iso) { let n=0; activeSS.forEach(ss => ['push','pull'].forEach(side => getSets(iso,ss.id,side).forEach(s => { if(s.done) n++; }))); return n; }
  function ssDone(iso,ssId) { const ss = activeSS.find(s=>s.id===ssId); if(!ss) return false; return !['push','pull'].some(side => getSets(iso,ss.id,side).some(s => !isActioned(s))); }
  function hasData(iso) { const dl=logs[iso]; if(!dl) return false; return Object.values(dl).some(sets => Array.isArray(sets) && sets.some(s => isActioned(s))); }
  function getSSnote(ss) { return ssNoteOverrides[ss.id] !== undefined ? ssNoteOverrides[ss.id] : ss.note; }
  function getExVideo(ssId,side) { const k=`${ssId}_${side}`; if(videoOverrides[k]!==undefined) return videoOverrides[k]; return activeSS.find(s=>s.id===ssId)?.[side]?.video||null; }

  async function writeSets(iso,ssId,side,sets) {
    const next={...logs}; if(!next[iso]) next[iso]={}; next[iso][`${ssId}_${side}`]=sets; 
    setLogs(next);
    localStorage.setItem('cali_logs_draft', JSON.stringify(next));
    await supabase.from('session_logs').upsert({ iso_date:iso, ss_id:ssId, side, sets, updated_at:new Date().toISOString() },{ onConflict:'iso_date,ss_id,side' });
  }
  async function markTrainingDay(iso) { const n=new Set(trainingDays); n.add(iso); setTrainingDays(n); await supabase.from('training_days').upsert({ iso_date:iso }); }
  async function unmarkTrainingDay(iso) { if(hasData(iso)){alert('Remove logged sets before unmarking.');return;} const n=new Set(trainingDays); n.delete(iso); setTrainingDays(n); await supabase.from('training_days').delete().eq('iso_date',iso); }
  async function flushNote(iso) { const note=noteBufferRef.current[iso]; if(note===undefined) return; setSessionNotes(p=>({...p,[iso]:note})); await supabase.from('session_notes').upsert({iso_date:iso,note},{onConflict:'iso_date'}); }
  async function saveExNote(iso,ssId,side,note) { const k=`${iso}_${ssId}_${side}`; setExNotes(p=>({...p,[k]:note})); await supabase.from('exercise_notes').upsert({note_key:k,note},{onConflict:'note_key'}); }
  async function saveExOverride(ssId,side,ov,videoVal) {
    const fresh=JSON.parse(JSON.stringify(supersets)); 
    const ss=fresh.find(x=>x.id===ssId); 
    if(ss&&ss[side]) { Object.assign(ss[side],ov); ss[side].video = videoVal||null; }
    await syncProgramme(fresh);
  }
  async function saveSsNoteOverride(ssId,note) { 
    const fresh=JSON.parse(JSON.stringify(supersets)); 
    const ss=fresh.find(x=>x.id===ssId); 
    if(ss) ss.note = note;
    await syncProgramme(fresh);
  }

  async function clearDay(iso) {
    await Promise.all([
      supabase.from('session_logs').delete().eq('iso_date', iso),
      supabase.from('session_history').delete().eq('iso_date', iso),
      supabase.from('session_notes').delete().eq('iso_date', iso),
      supabase.from('training_days').delete().eq('iso_date', iso),
    ]);
    setLogs(p => { const n = {...p}; delete n[iso]; localStorage.setItem('cali_logs_draft', JSON.stringify(n)); return n; });
    setHistory(p => p.filter(h => h.iso_date !== iso));
    setSessionNotes(p => { const n = {...p}; delete n[iso]; return n; });
    setTrainingDays(p => { const n = new Set(p); n.delete(iso); return n; });
    setResetModal(null); setResetTargetISO(null);
  }
  async function clearWeek() {
    const isos = getWeekDates().map(d => d.iso);
    await Promise.all(isos.flatMap(iso => [
      supabase.from('session_logs').delete().eq('iso_date', iso),
      supabase.from('session_history').delete().eq('iso_date', iso),
      supabase.from('session_notes').delete().eq('iso_date', iso),
      supabase.from('training_days').delete().eq('iso_date', iso),
    ]));
    setLogs(p => { const n = {...p}; isos.forEach(iso => delete n[iso]); localStorage.setItem('cali_logs_draft', JSON.stringify(n)); return n; });
    setHistory(p => p.filter(h => !isos.includes(h.iso_date)));
    setSessionNotes(p => { const n = {...p}; isos.forEach(iso => delete n[iso]); return n; });
    setTrainingDays(new Set());
    setResetModal(null);
  }

  function onDayPressStart(iso) {
    longPressRef.current = setTimeout(() => {
      if (hasData(iso) || trainingDays.has(iso)) { setResetTargetISO(iso); setResetModal('day'); }
    }, 600);
  }
  function onDayPressEnd() { clearTimeout(longPressRef.current); }

  function attemptSave(iso) { const note=noteBufferRef.current[iso]; if(note!==undefined) flushNote(iso); if(unloggedSets(iso).length>0){setGateModal(true);return;} doSave(iso); }
  async function markAllSkipped() {
    const iso=selectedISO; const ul=unloggedSets(iso);
    for(const {ssId,side,idx} of ul) { const s=getSets(iso,ssId,side); s[idx]={val:'',assist:100,feel:null,done:false,skipped:true,missed:false}; await writeSets(iso,ssId,side,s); }
    setGateModal(false); doSave(iso);
  }
  async function doSave(iso) {
    const log=logs[iso]||{}; const doneCount=doneSetsCount(iso);
    const entry={iso_date:iso,date_label:formatDate(iso),log,note:sessionNotes[iso]||'',doneCount,saved_at:new Date().toISOString()};
    const idx=history.findIndex(h=>h.iso_date===iso); const nh=[...history];
    if(idx>=0) nh[idx]={...nh[idx],...entry}; else nh.push(entry);
    setHistory(nh); await supabase.from('session_history').upsert(entry,{onConflict:'iso_date'});
    localStorage.removeItem('cali_logs_draft');
    setFeedbackModal(iso); setFeedbackFeel(0); setFeedbackFlags(''); setFeedbackSessionNum(0);
  }
  async function saveFeedback() {
    if(!feedbackModal) return; const iso=feedbackModal;
    const upd={overall_feel:feedbackFeel||null,physical_flags:feedbackFlags||null,session_number:feedbackSessionNum||null};
    setHistory(history.map(h=>h.iso_date===iso?{...h,...upd}:h));
    await supabase.from('session_history').update(upd).eq('iso_date',iso); setFeedbackModal(null);
  }
  function startRestTimer() {
    if(restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTimer({rem:90,sel:90});
    restIntervalRef.current=setInterval(()=>setRestTimer(p=>{if(!p)return null;if(p.rem<=1){clearInterval(restIntervalRef.current);return null;}return{...p,rem:p.rem-1};}),1000);
  }
  function setRestSel(s) {
    if(restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTimer({rem:s,sel:s});
    restIntervalRef.current=setInterval(()=>setRestTimer(p=>{if(!p)return null;if(p.rem<=1){clearInterval(restIntervalRef.current);return null;}return{...p,rem:p.rem-1};}),1000);
  }
  function dismissRest() { if(restIntervalRef.current) clearInterval(restIntervalRef.current); setRestTimer(null); }
  function getRecTS(idx,fd) { return recTimers[idx]||{running:false,rem:fd.items[idx]?.target?.duration||0,currentSet:1,done:false}; }
  function startRecTimer(idx,fd) {
    if(recIntervalsRef.current[idx]) clearInterval(recIntervalsRef.current[idx]);
    const item=fd.items[idx]; setRecTimers(p=>({...p,[idx]:{...getRecTS(idx,fd),running:true}}));
    recIntervalsRef.current[idx]=setInterval(()=>setRecTimers(p=>{
      const ts=p[idx]; if(!ts) return p;
      if(ts.rem<=1){clearInterval(recIntervalsRef.current[idx]);const nx=ts.currentSet<(item.target.sets||1);return{...p,[idx]:{...ts,running:false,rem:nx?item.target.duration:0,currentSet:nx?ts.currentSet+1:ts.currentSet,done:!nx}};}
      return{...p,[idx]:{...ts,rem:ts.rem-1}};
    }),1000);
  }
  function stopRecTimer(idx) { if(recIntervalsRef.current[idx]) clearInterval(recIntervalsRef.current[idx]); setRecTimers(p=>({...p,[idx]:{...p[idx],running:false}})); }
  function resetRecTimer(idx,fd) { if(recIntervalsRef.current[idx]) clearInterval(recIntervalsRef.current[idx]); const item=fd.items[idx]; setRecTimers(p=>({...p,[idx]:{running:false,rem:item.target.duration||0,currentSet:1,done:false}})); }
  function nextRecSet(idx,fd) { const ts=getRecTS(idx,fd); const item=fd.items[idx]; if(ts.currentSet<(item.target.sets||1)) setRecTimers(p=>({...p,[idx]:{...ts,currentSet:ts.currentSet+1}})); else setRecTimers(p=>({...p,[idx]:{...ts,done:true}})); }
  const focusData=useCallback(()=>{
    const last=history.length?history[history.length-1]:null; if(!last) return{type:'default',exercise:null};
    let pt=0,pc=0,lt=0,lc=0;
    Object.entries(last.log||{}).forEach(([k,sets])=>(sets||[]).filter(s=>s?.done).forEach(s=>{const sc=s.feel||3;if(k.endsWith('_push')){pt+=sc;pc++;}if(k.endsWith('_pull')){lt+=sc;lc++;}}));
    const pa=pc?pt/pc:3,la=lc?lt/lc:3;
    if(pa>=3&&la>=3) return{type:'default',exercise:null};
    const side=pa<la?'push':'pull'; let worst='',ws=99;
    Object.entries(last.log||{}).forEach(([k,sets])=>{ if(!k.endsWith('_'+side)) return; const d=(sets||[]).filter(s=>s?.done); const avg=d.length?d.reduce((a,s)=>a+(s.feel||3),0)/d.length:3; if(avg<ws){ws=avg;worst=k;} });
    const EN={ss1_push:'Full planche hold',ss1_pull:'Front lever touch',ss3_push:'Straddle planche press',ss3_pull:'FL pull-ups'};
    return{type:side,exercise:worst?(EN[worst]||worst):null};
  },[history]);
  function getWeekStats() {
    const dates=getWeekDates(); const wISOs=new Set(dates.map(d=>d.iso)); const saved=history.filter(h=>wISOs.has(h.iso_date));
    const totalSets=saved.reduce((acc,sess)=>acc+Object.values(sess.log??{}).flat().filter(s=>s?.done).length,0);
    const consistency=Math.min(Math.round(saved.length/3*100),100);
    const keyEx=[{ssId:'ss1',side:'push',label:'Full planche'},{ssId:'ss1',side:'pull',label:'FL touch'},{ssId:'ss3',side:'push',label:'Straddle press'},{ssId:'ss3',side:'pull',label:'FL pull-ups'}];
    const bests=keyEx.map(ex=>{let best=0;saved.forEach(sess=>((sess.log??{})[`${ex.ssId}_${ex.side}`]??[]).filter(s=>s?.done).forEach(s=>{const v=parseFloat(s.val)||0;if(v>best)best=v;}));return{...ex,best};}).filter(e=>e.best>0);
    return{sessions:saved.length,totalSets,consistency,bests};
  }
  function allExercises() { return supersets.flatMap(ss=>[{ssId:ss.id,side:'push',name:ss.push.name},{ssId:ss.id,side:'pull',name:ss.pull.name}]); }
  function getExHistory(ssId,side) {
    return history.map(sess=>{
      const sets=(sess.log??{})[`${ssId}_${side}`]??[]; const relevant=sets.filter(s=>s?.done||s?.missed);
      const vals=relevant.map(s=>s.missed?0:(parseFloat(s.val)||0)); const best=vals.filter(v=>v>0).length?Math.max(...vals.filter(v=>v>0)):0;
      return{date:sess.date_label||sess.iso_date,best,setCount:relevant.length,sets:sets.filter(s=>s?.done)};
    }).filter(p=>p.setCount>0);
  }
  function totalSetsDone(ssId,side) { return history.reduce((acc,sess)=>acc+((sess.log??{})[`${ssId}_${side}`]??[]).filter(s=>s?.done).length,0); }
  function openEditModal(ssId,side) {
    const ss=activeSS.find(s=>s.id===ssId); const ex=ss[side];
    setEditName(ex.name);setEditTarget(ex.target);setEditSets(ex.sets);setEditAssist(ex.assist||100);setEditWeighted(ex.isWeighted||false);setEditCoaching(ex.coaching);setEditVideo(getExVideo(ssId,side)||'');setEditModal({ssId,side});
  }
  if(loading) return(<div style={{background:'#0a0a0a',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#7c3aed',fontFamily:'system-ui',fontSize:14}}>Loading…</div>);
  const isTraining=trainingDays.has(selectedISO);
  const prog=sessionProg(selectedISO); const ws=getWeekStats(); const weekDates=getWeekDates();
  const focus=focusData(); const focusDef=RECOVERY[focus.type]||RECOVERY.default;
  return (
    <div className="app">
      <header className="header">
        <span className="header-title">Cali Training</span>
        <div className="header-actions">
          {activeTab==='session'&&isTraining&&doneSetsCount(selectedISO)>0&&(<button className="save-btn-header" onClick={()=>attemptSave(selectedISO)}>Save session</button>)}
          {activeTab==='session'&&isTraining&&(<button className="btn-icon" title="Session briefing" onClick={()=>openBriefing()} style={{fontSize:13}}>📋</button>)}
          <button className="icon-btn" title="Reset week" onClick={()=>setResetModal('week')} style={{opacity:0.45}}><RotateCcw size={14}/></button>
          <button className="icon-btn" style={{opacity:rehabOn?1:0.45,color:rehabOn?'var(--red)':'var(--text2)',background:rehabOn?'var(--red-bg)':'var(--bg3)'}} onClick={()=>setRehabOn(v=>!v)} title="Toggle rehab"><Plus size={14}/></button>
        </div>
      </header>
      <div className="tabs">
        {['session','history','progress','builder'].map(t=>(<button key={t} className={`tab${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
      </div>
      <div className="scroll">
        {activeTab==='session'&&(<>
          <div className="week-strip">
            {weekDates.map(d=>{
              const isSel=d.iso===selectedISO,isTrain=trainingDays.has(d.iso);
              return(<button key={d.iso} className={`day-btn${isSel?' active':isTrain?' training':''}`}
                onClick={()=>{setSelectedISO(d.iso);setOpenSS(null);}}
                onMouseDown={()=>onDayPressStart(d.iso)} onMouseUp={onDayPressEnd} onMouseLeave={onDayPressEnd}
                onTouchStart={()=>onDayPressStart(d.iso)} onTouchEnd={onDayPressEnd}>
                <span className="day-name">{d.label}</span><span className="day-num">{d.date}</span>
                <span className={`day-dot${hasData(d.iso)||isTrain?' show':''}`}/>
              </button>);
            })}
          </div>
          {!isTraining?(
            <div className="rest-day">
              <div className="rest-day-date">{formatDate(selectedISO)}</div>
              <div className="rest-day-title">Rest Day</div>
              <div className="rest-day-sub">Recovery is part of the programme.</div>
              <div className="focus-card">
                <div className="focus-top-label" style={{color:focusDef.color}}>Today's focus</div>
                <div className="focus-title" style={{color:focusDef.color}}>{focusDef.label}</div>
                <div className="focus-reason">{focusDef.reason_fn(focus.exercise||'Your session')}</div>
                <div>{focusDef.items.map((item,idx)=>{
                  const ts=getRecTS(idx,focusDef),isOpen=openRecItem===idx;
                  const isDur=item.type==='hold'||item.type==='duration';
                  const m=Math.floor((ts.rem||0)/60),s=String((ts.rem||0)%60).padStart(2,'0');
                  return(<div key={idx} className={`rec-item${ts.done?' complete':''}`}>
                    <div className="rec-row" onClick={()=>setOpenRecItem(isOpen?null:idx)}>
                      <div><div className="rec-name">{ts.done?'✓ ':''}{item.name}</div><div className="rec-meta">{item.target.label||item.target.repsLabel||''}</div></div>
                      <span className={`rec-arrow${isOpen?' open':''}`}>▼</span>
                    </div>
                    {isOpen&&(<div className="rec-panel">
                      <div className="rec-desc">{item.desc}</div>
                      <div className="video-slot" style={{marginBottom:12}}><VideoSlot videoUrl={item.video} editHint="Contact coach to add video."/></div>
                      <div className="rec-tracker">
                        <div className="tracker-label">Set {ts.currentSet} of {item.target.sets}{ts.done?' — Complete ✓':''}</div>
                        {isDur?(<><div className="timer-display" style={{color:ts.done?'var(--green)':ts.running?'var(--purple)':'var(--text)'}}>{ts.done?'Done':`${m}:${s}`}</div>
                          <div className="tracker-btns">{ts.done?(<button className="tracker-btn reset" onClick={()=>resetRecTimer(idx,focusDef)}>Reset</button>):ts.running?(<button className="tracker-btn stop" onClick={()=>stopRecTimer(idx)}>Pause</button>):(<><button className="tracker-btn start" onClick={()=>startRecTimer(idx,focusDef)}>Start</button><button className="tracker-btn reset" onClick={()=>resetRecTimer(idx,focusDef)}>Reset</button></>)}</div>
                        </>):(<><div className="set-display" style={{color:ts.done?'var(--green)':'var(--text)'}}>{ts.done?'Done ✓':`${item.target.reps} ${item.target.repsLabel}`}</div>
                          <div className="tracker-btns">{ts.done?(<button className="tracker-btn reset" onClick={()=>setRecTimers(p=>({...p,[idx]:{running:false,rem:0,currentSet:1,done:false}}))}>Reset</button>):(<button className="tracker-btn next" onClick={()=>nextRecSet(idx,focusDef)}>{ts.currentSet<item.target.sets?'Next set':'Done'}</button>)}</div>
                        </>)}
                      </div>
                    </div>)}
                  </div>);
                })}</div>
              </div>
              <button className="extras-toggle" onClick={()=>setExtrasOpen(v=>!v)}><span>If you have 10 extra minutes</span><span className={`extras-chevron${extrasOpen?' open':''}`}>▼</span></button>
              {extrasOpen&&RECOVERY_EXTRAS.map((cat,i)=>(<div key={i} className="extra-card">
                <div className="extra-header" onClick={()=>setOpenExtra(p=>{const n=new Set(p);n.has(i)?n.delete(i):n.add(i);return n;})}>
                  <div className="extra-dot" style={{background:cat.color}}/><span className="extra-label-text" style={{color:cat.color}}>{cat.label}</span><span className={`extra-chevron${openExtra.has(i)?' open':''}`}>▼</span>
                </div>
                {openExtra.has(i)&&(<div className="extra-body">{cat.items.map((item,j)=>(<div key={j} className="extra-item"><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{item.name}</div><div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>{item.desc}</div></div>))}</div>)}
              </div>))}
              <button className="mark-training-btn" onClick={()=>markTrainingDay(selectedISO)}>+ Mark as training day</button>
            </div>
          ):(
            <>
              {rehabOn&&<div className="rehab-banner">Rehab protocol active.</div>}
              {doneSetsCount(selectedISO)>0&&unloggedSets(selectedISO).length>0&&(<div className="incomplete-banner" onClick={()=>setGateModal(true)}>{unloggedSets(selectedISO).length} set{unloggedSets(selectedISO).length>1?'s':''} not yet logged</div>)}
              <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                {Object.entries(PHASE_CONFIG).map(([key,cfg])=>(
                  <button key={key} onClick={()=>setPhase(key)} style={{
                    padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',border:'none',
                    background: currentPhase===key ? cfg.color : 'var(--bg3)',
                    color: currentPhase===key ? '#fff' : 'var(--text3)',
                    letterSpacing:'.5px',
                  }}>{cfg.arrow} {cfg.label}</button>
                ))}
                <span style={{fontSize:10,color:'var(--text3)',alignSelf:'center',marginLeft:4}}>{PHASE_CONFIG[currentPhase]?.hint}</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${prog.pct}%`}}/></div>
              <div className="progress-label">{prog.decided} / {prog.total} sets — {prog.pct}%</div>
              {activeSS.map((ss,i)=>{
                const phasedSS = generatePhaseWorkout([ss], currentPhase)[0];
                const isOpen=openSS===ss.id,done=ssDone(selectedISO,ss.id);
                return(<div key={ss.id} className={`ss-card${done?' done-card':''}`}>
                  <div className="ss-header" onClick={()=>setOpenSS(isOpen?null:ss.id)}>
                    <div className="ss-meta">
                      <div className="ss-label-row"><span className="ss-label">{ss.label}</span><button className="btn-icon" onClick={e=>{e.stopPropagation();setSsNoteInput(getSSnote(ss));setSsNoteModal({ssId:ss.id,label:ss.label});}} title="Edit note"><Pencil size={13}/></button></div>
                      <div className="ss-note">{getSSnote(ss)}</div>
                    </div>
                    {done&&<span className="ss-done-badge">DONE ✓</span>}
                    <span className={`ss-chevron${isOpen?' open':''}`}>▼</span>
                  </div>
                  {isOpen&&(<div>
                    {ss.id!=='ssR'&&(<div className="reorder-controls"><span style={{fontSize:11,color:'var(--text3)',flex:1}}>Reorder</span>
                      <button className="reorder-btn" disabled={i===0} onClick={()=>{const a=[...supersets];[a[i],a[i-1]]=[a[i-1],a[i]];setSupersets(a);}}>&#8593;</button>
                      <button className="reorder-btn" disabled={i===supersets.length-1} onClick={()=>{const a=[...supersets];[a[i],a[i+1]]=[a[i+1],a[i]];setSupersets(a);}}>&#8595;</button>
                    </div>)}
                    {['push','pull'].map((side,si)=>{
                      const ex=phasedSS[side],sets=getSets(selectedISO,ss.id,side);
                      const nk=`${selectedISO}_${ss.id}_${side}`,en=exNotes[nk]||'';
                      return(<div key={side}>
                        {si===1&&<div className="ex-divider"/>}
                        <div className="ex-block">
                          <div className="ex-top">
                            <div style={{flex:1}}>
                              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                <span className="ex-name">{ex.name}</span>
                                <button className="btn-icon" onClick={e=>{e.stopPropagation();openEditModal(ss.id,side);}} title="Edit"><Pencil size={13}/></button>
                                {ex.slug && <button className="btn-icon" onClick={e=>{e.stopPropagation();openSwapModal(ss.id,side,ex.name,ex.slug);}} title="Swap exercise"><SwapSVG size={13}/></button>}
                              </div>
                              <div className="ex-target" style={{marginBottom:0,marginTop:2}}>Target: {ex.target}</div>
                            </div>
                            <select className="assist-select" value={ex.assist||100} onChange={async(e)=>{ await saveExOverride(ss.id,side,{assist: parseInt(e.target.value)}); }}>
                              {ASSIST_LEVELS.map(a=><option key={a} value={a}>{a}%</option>)}
                            </select>
                          </div>
                          <div className="coaching-cue" style={{marginTop:8}}>{ex.coaching}</div>
                          <div className="video-slot"><VideoSlot videoUrl={getExVideo(ss.id,side)} editHint="Tap edit to add a video."/></div>
                          <div className="sets-container">
                            {sets.map((s,idx)=>{
                              const isEditing = !s.done && !s.skipped && !s.missed;
                              return (
                                <div key={idx} className={`set-row ${s.done?'done':s.skipped?'skipped':''}`}>
                                  <div className="set-row-label">Set {idx+1}</div>
                                  <div className="set-row-input-wrap">
                                    {s.skipped ? <span className="set-skipped-text">Skipped</span> : 
                                     s.missed ? <span className="set-skipped-text">0</span> :
                                     s.done ? <span className="set-done-val">{ex.isWeighted&&s.weight?`+${s.weight}kg × `:''}{s.val}</span> :
                                     (<>
                                       {ex.isWeighted && <input type="number" inputMode="decimal" className="set-input weight-input" placeholder="kg" value={s.weight||''} onChange={e=>{
                                         const n=[...sets]; n[idx].weight=e.target.value; writeSets(selectedISO,ss.id,side,n);
                                       }}/>}
                                       <input type="number" inputMode="decimal" className="set-input" placeholder="—" value={s.val} onChange={e=>{
                                         const n=[...sets]; n[idx].val=e.target.value; writeSets(selectedISO,ss.id,side,n);
                                       }}/>
                                     </>)}
                                  </div>
                                  <div className="set-row-measure" onClick={async()=>{
                                    if(s.done)return;
                                    const newM = ex.measureType==='secs'?'reps':'secs';
                                    await saveExOverride(ss.id,side,{measureType: newM});
                                  }}>{ex.measureType||'reps'} <span style={{fontSize:8,opacity:0.5}}>▼</span></div>
                                  
                                  <div className="set-row-faces">
                                    {isEditing && [4,3,2,1].map(f=><Face key={f} type={f} active={s.feel===f} onClick={()=>{
                                      const n=[...sets]; n[idx].feel=f; writeSets(selectedISO,ss.id,side,n);
                                    }}/>)}
                                    {s.done && s.feel && <Face type={s.feel} active={true} />}
                                  </div>
                                  
                                  <button className={`set-check-btn ${s.done?'done':''}`} onClick={()=>{
                                    const n=[...sets];
                                    if(s.done) { n[idx].done=false; writeSets(selectedISO,ss.id,side,n); return; }
                                    if(s.val) { n[idx].done=true; writeSets(selectedISO,ss.id,side,n); startRestTimer(); }
                                  }}><Check size={16} strokeWidth={3}/></button>
                                </div>
                              );
                            })}
                            <div className="skip-link" onClick={async()=>{
                              const n=[...sets]; n.forEach(st=>{if(!st.done)st.skipped=true;});
                              await writeSets(selectedISO,ss.id,side,n);
                            }}>Skip remaining</div>
                          </div>
                          {en?(<><div className="ex-note-text">{en}</div><button className="ex-note-btn" style={{marginTop:4}} onClick={()=>{setExNoteInput(en);setExNoteModal({iso:selectedISO,ssId:ss.id,side});}}>Edit note</button></>)
                            :(<button className="ex-note-btn" onClick={()=>{setExNoteInput('');setExNoteModal({iso:selectedISO,ssId:ss.id,side});}}>+ Add note</button>)}
                        </div>
                      </div>);
                    })}
                  </div>)}
                </div>);
              })}
              <div className="session-note-wrap"><textarea className="session-note-input" rows={2} placeholder="Session notes…" defaultValue={sessionNotes[selectedISO]||''} onChange={e=>{noteBufferRef.current[selectedISO]=e.target.value;}} onBlur={()=>flushNote(selectedISO)}/></div>
              {!hasData(selectedISO)&&(<div style={{padding:'0 16px'}}><button className="unmark-btn" onClick={()=>unmarkTrainingDay(selectedISO)}>Remove training day</button></div>)}
              <div style={{height:80}}/>
            </>
          )}
        </>)}
        {activeTab==='history'&&(<>
          <div style={{height:4}}/>
          <div className="week-summary">
            <div style={{padding:'12px 14px',background:'var(--bg3)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,fontWeight:700}}>This week</span><span style={{fontSize:11,color:'var(--text3)'}}>{weekDates[0].full} – {weekDates[6].full}</span>
            </div>
            <div className="week-stats">{[{val:ws.sessions,label:'Sessions',color:'var(--purple)'},{val:ws.totalSets,label:'Sets done',color:'var(--blue)'},{val:`${ws.consistency}%`,label:'Consistency',color:ws.consistency>=100?'var(--green)':ws.consistency>=66?'var(--purple)':ws.consistency>=33?'var(--amber)':'var(--red)'}].map(({val,label,color})=>(<div key={label} className="week-stat"><div className="week-stat-val" style={{color}}>{val}</div><div className="week-stat-label">{label}</div></div>))}</div>
            <div style={{padding:'10px 14px 12px',borderTop:'0.5px solid var(--border)'}}>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:6,display:'flex',justifyContent:'space-between'}}><span>Weekly target (3 sessions)</span><span style={{fontWeight:600,color:ws.consistency>=100?'var(--green)':'var(--amber)'}}>{ws.sessions}/3</span></div>
              <div style={{height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',borderRadius:3,background:'var(--purple)',width:`${ws.consistency}%`}}/></div>
            </div>
            {ws.bests.length>0&&(<div style={{padding:'10px 14px 12px',borderTop:'0.5px solid var(--border)'}}>
              <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.4px',fontWeight:600,marginBottom:8}}>Best this week</div>
              {ws.bests.map(b=>(<div key={b.label} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'0.5px solid var(--border)'}}><span style={{fontSize:12,color:'var(--text2)'}}>{b.label}</span><span style={{fontSize:13,fontWeight:700,color:'var(--green)'}}>{b.best}</span></div>))}
            </div>)}
          </div>
          {history.length===0?(<div style={{textAlign:'center',padding:'40px 16px',color:'var(--text3)',fontSize:13,lineHeight:1.8}}>No sessions saved yet.<br/>Log sets and tap <strong style={{color:'var(--text2)'}}>Save session</strong>.</div>)
            :([...history].reverse().map(sess=>{
              const iso=sess.iso_date,doneCount=Object.values(sess.log??{}).flat().filter(s=>s?.done).length,skippedCount=Object.values(sess.log??{}).flat().filter(s=>s?.skipped).length,isExp=expandedSession===iso,feelLabel=sess.overall_feel?FEEL_LABELS[sess.overall_feel-1]:'';
              return(<div key={iso} className={`session-card${isExp?' expanded':''}`} onClick={()=>setExpandedSession(isExp?null:iso)}>
                <div style={{padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,fontWeight:600}}>{sess.date_label||formatDate(iso)}</span>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {feelLabel&&<span style={{fontSize:10,fontWeight:700,color:'var(--purple)',background:'#2e1d5c',padding:'2px 8px',borderRadius:20}}>{feelLabel}</span>}
                    {sess.session_number&&<span style={{fontSize:10,color:'var(--text3)'}}>S{sess.session_number}</span>}
                    <span style={{fontSize:11,color:'var(--text3)'}}>{doneCount} sets{skippedCount>0?` · ${skippedCount} skipped`:''}</span>
                    <span className={`session-chevron${isExp?' open':''}`}>▼</span>
                  </div>
                </div>
                {isExp&&(<div className="session-detail">
                  {sess.physical_flags&&(<div style={{marginTop:8,padding:'8px 10px',background:'var(--red-bg)',border:'1px solid var(--red)',borderRadius:8,fontSize:11,color:'var(--red)'}}>{sess.physical_flags}</div>)}
                  {[...INIT_SS,REHAB_SS].map(ss=>{
                    const rows=['push','pull'].flatMap(side=>{ const sets=(sess.log??{})[`${ss.id}_${side}`]??[]; const rel=sets.filter(s=>s?.done||s?.skipped||s?.missed); return rel.length?[{name:ss[side]?.name,sets:rel}]:[]; });
                    if(!rows.length) return null;
                    return(<div key={ss.id} style={{marginTop:10}}>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{ss.label}</div>
                      {rows.map(({name,sets})=>(<div key={name} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'6px 0',borderBottom:'0.5px solid var(--border)'}}>
                        <span style={{fontSize:12,color:'var(--text2)',flex:1,marginRight:8}}>{name}</span>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>{sets.map((s,i)=>(<span key={i} className={`session-set-pill ${s.missed?'missed':s.skipped?'skipped':'done'}`}>{s.missed?'0':s.skipped?'skip':`${s.weight?`+${s.weight}kg × `:''}${s.val}${s.feel?` · ${s.feel}`:''}`}</span>))}</div>
                      </div>))}
                    </div>);
                  })}
                  {sess.note&&<div style={{fontSize:11,color:'var(--text3)',marginTop:10,paddingTop:8,borderTop:'0.5px solid var(--border)',fontStyle:'italic'}}>{sess.note}</div>}
                </div>)}
              </div>);
            }))
          }
          <div style={{height:40}}/>
        </>)}
        {activeTab==='progress'&&(<>
          <div className="prog-select-wrap"><select className="prog-select" value={selectedExKey} onChange={e=>setSelectedExKey(e.target.value)}>{allExercises().map(ex=>{const key=`${ex.ssId}_${ex.side}`;return<option key={key} value={key}>{ex.name}</option>;})}</select></div>
          <div className="prog-content">{(()=>{
            const [ssId,side]=selectedExKey.split('_'),exHist=getExHistory(ssId,side),total=totalSetsDone(ssId,side);
            const best=exHist.length?Math.max(...exHist.map(p=>p.best)):0,latest=exHist.length?exHist[exHist.length-1].best:0;
            const prev=exHist.length>1?exHist[exHist.length-2].best:null,delta=prev!==null?+(latest-prev).toFixed(1):null;
            const selEx=allExercises().find(e=>`${e.ssId}_${e.side}`===selectedExKey);
            return(<>
              <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>{selEx?.name}</div>
              <div className="stat-row">{[{l:'Total sets',v:total,c:'var(--purple)'},{l:'Sessions',v:exHist.length,c:'var(--blue)'},{l:'Best',v:best||'—',c:'var(--green)'}].map(({l,v,c})=>(<div key={l} className="stat-card"><div className="stat-label">{l}</div><div className="stat-val" style={{color:c}}>{v}</div></div>))}</div>
              {delta!==null&&(<div style={{fontSize:12,fontWeight:600,color:delta>0?'var(--green)':delta<0?'var(--red)':'var(--text3)',marginBottom:12}}>{delta>=0?'+':''}{delta} vs previous session</div>)}
              {exHist.length>1?(<div className="chart-card"><div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.4px',fontWeight:600,marginBottom:12}}>Best per session</div>
                <div className="bars">{exHist.slice(-10).map((p,i,arr)=>{const max=Math.max(...arr.map(x=>x.best));const h=max?Math.max(8,Math.round(p.best/max*68)):8;const isLast=i===arr.length-1;return(<div key={i} className="bar-col"><span style={{fontSize:9,fontWeight:700,color:isLast?'var(--purple)':'var(--text3)'}}>{p.best}</span><div className="bar" style={{height:h,background:isLast?'var(--purple)':'#5b21b666'}}/><span style={{fontSize:9,color:'var(--text3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{p.date.replace(/\s?\d{4}/,'').trim().slice(0,7)}</span></div>);})}
                </div></div>)
              :exHist.length===1?(<div className="chart-card" style={{textAlign:'center',padding:24}}><div style={{fontSize:13,color:'var(--text3)'}}>Log more sessions to see your chart</div><div style={{fontSize:36,fontWeight:800,color:'var(--purple)',marginTop:8}}>{exHist[0].best}</div></div>)
              :(<div className="chart-card" style={{textAlign:'center',padding:24}}><div style={{fontSize:13,color:'var(--text3)'}}>No data yet.</div></div>)}
              {exHist.length>0&&(<div className="chart-card"><div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.4px',fontWeight:600,marginBottom:8}}>Last session — {exHist[exHist.length-1].date}</div>
                {exHist[exHist.length-1].sets.map((s,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'0.5px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'var(--text2)'}}>Set {i+1}</span>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>{s.assist&&s.assist!==100&&<span style={{fontSize:10,color:'var(--blue)',background:'#0d1f3c',padding:'2px 7px',borderRadius:10}}>{s.assist}%</span>}{s.feel&&<span style={{fontSize:10,color:'var(--text3)'}}>{s.feel}</span>}<span style={{fontSize:13,fontWeight:700,color:'var(--green)'}}>{s.weight?`+${s.weight}kg × `:''}{s.val}</span></div>
                </div>))}
              </div>)}
            </>);
          })()}</div>
          <div style={{height:40}}/>
        </>)}
        {activeTab==='builder'&&(<>
          <div style={{padding:'16px'}}>
            <div style={{fontSize:18,fontWeight:800,marginBottom:16,color:'var(--purple)'}}>Programme Builder</div>
            {supersets.map((ss,i)=>(
              <div key={ss.id} className="ss-card" style={{padding:'12px',marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <div style={{fontWeight:700,fontSize:14}}>{ss.label}</div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn-icon" disabled={i===0} onClick={()=>{const a=[...supersets];[a[i],a[i-1]]=[a[i-1],a[i]];syncProgramme(a);}}>&#8593;</button>
                    <button className="btn-icon" disabled={i===supersets.length-1} onClick={()=>{const a=[...supersets];[a[i],a[i+1]]=[a[i+1],a[i]];syncProgramme(a);}}>&#8595;</button>
                    <button className="btn-icon" onClick={()=>{const a=supersets.filter(x=>x.id!==ss.id);syncProgramme(a);}}><Trash2 size={14} color="var(--red)"/></button>
                  </div>
                </div>
                <div style={{fontSize:12,color:'var(--text2)',display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                  <span>Push: {ss.push?.name}</span>
                  <button className="btn-icon" onClick={()=>openEditModal(ss.id,'push')}><Pencil size={12}/></button>
                </div>
                <div style={{fontSize:12,color:'var(--text2)',display:'flex',justifyContent:'space-between'}}>
                  <span>Pull: {ss.pull?.name}</span>
                  <button className="btn-icon" onClick={()=>openEditModal(ss.id,'pull')}><Pencil size={12}/></button>
                </div>
              </div>
            ))}
            <button className="action-btn purple" style={{marginTop:'16px'}} onClick={()=>{
              const newId = 'ss' + Math.random().toString(36).substring(7);
              const newSS = { id: newId, label: 'New Superset', note: '', push: { name: 'New Push', sets: 3, target: '5 reps', assist: 100, measureType: 'reps', isWeighted: false, role: 'Main', coaching: '', video: null }, pull: { name: 'New Pull', sets: 3, target: '5 reps', assist: 100, measureType: 'reps', isWeighted: false, role: 'Main', coaching: '', video: null } };
              syncProgramme([...supersets, newSS]);
            }}>+ Add New Superset</button>
          </div>
          <div style={{height:40}}/>
        </>)}
      </div>
      {restTimer&&(<div className="rest-timer"><div className="rest-circle">{Math.floor(restTimer.rem/60)}:{String(restTimer.rem%60).padStart(2,'0')}</div>
        <div style={{display:'flex',gap:6,flex:1,flexWrap:'wrap'}}>{[60,90,120,180].map(o=>(<button key={o} className={`rest-opt${restTimer.sel===o?' active':''}`} onClick={()=>setRestSel(o)}>{o===60?'1m':o===90?'1m30':o===120?'2m':'3m'}</button>))}</div>
        <button onClick={dismissRest} style={{width:32,height:32,borderRadius:'50%',border:'none',background:'var(--bg3)',color:'var(--text2)',cursor:'pointer',fontSize:16}}>✕</button>
      </div>)}
      {resetModal&&(<div className="modal-backdrop"><div className="modal">
        <div className="modal-title"><span style={{display:'flex',alignItems:'center',gap:8}}><Trash2 size={16} style={{color:'var(--red)'}}/>{resetModal==='day'?'Clear day':'Reset week'}</span><button className="modal-close" onClick={()=>{setResetModal(null);setResetTargetISO(null);}}>✕</button></div>
        <div className="modal-sub" style={{marginTop:8}}>{resetModal==='day'?(`Permanently delete all logged sets and training day marker for ${formatDate(resetTargetISO)}. Cannot be undone.`):('Clear all training days and logged sets for this week. Session history is preserved.')}</div>
        <button className="action-btn" style={{background:'var(--red)',marginTop:20}} onClick={()=>resetModal==='day'?clearDay(resetTargetISO):clearWeek()}>{resetModal==='day'?'Clear this day':'Reset current week'}</button>
        <button className="secondary-btn" onClick={()=>{setResetModal(null);setResetTargetISO(null);}}>Cancel</button>
      </div></div>)}

      {editModal&&(<div className="modal-backdrop"><div className="modal">
        <div className="modal-title"><span>Edit exercise</span><button className="modal-close" onClick={()=>setEditModal(null)}>✕</button></div>
        <div style={{height:12}}/>
        <div className="modal-label">Name</div><input className="edit-input" value={editName} onChange={e=>setEditName(e.target.value)}/>
        <div className="modal-label">Target</div><input className="edit-input" value={editTarget} onChange={e=>setEditTarget(e.target.value)}/>
        <div className="modal-label">Sets</div><input className="edit-input" type="number" value={editSets} onChange={e=>setEditSets(parseInt(e.target.value)||3)}/>
        <div className="modal-label" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>Weighted Exercise</span><input type="checkbox" checked={editWeighted} onChange={e=>setEditWeighted(e.target.checked)}/></div>
        <div className="modal-label">Default assist</div><div className="band-row">{ASSIST_LEVELS.map(b=><button key={b} className={`band-edit-btn${editAssist===b?' selected':''}`} onClick={()=>setEditAssist(b)}>{b}%</button>)}</div>
        <div className="modal-label">Coaching cue</div><textarea className="edit-textarea" rows={2} value={editCoaching} onChange={e=>setEditCoaching(e.target.value)}/>
        <div className="modal-label">Video (yt:ID or url:https://…)</div><input className="edit-input" value={editVideo} onChange={e=>setEditVideo(e.target.value)} placeholder="e.g. yt:dQw4w9WgXcQ"/>
        <button className="action-btn purple" style={{marginTop:4}} onClick={async()=>{ const ov={name:editName,target:editTarget,sets:editSets,assist:editAssist,isWeighted:editWeighted,coaching:editCoaching}; await saveExOverride(editModal.ssId,editModal.side,ov,editVideo); setEditModal(null); }}>Save</button>
      </div></div>)}
      {ssNoteModal&&(<div className="modal-backdrop"><div className="modal">
        <div className="modal-title"><span>{ssNoteModal.label}</span><button className="modal-close" onClick={()=>setSsNoteModal(null)}>✕</button></div>
        <div style={{height:12}}/><input className="edit-input" value={ssNoteInput} onChange={e=>setSsNoteInput(e.target.value)} placeholder="Brief description…"/>
        <button className="action-btn purple" style={{marginTop:4}} onClick={async()=>{await saveSsNoteOverride(ssNoteModal.ssId,ssNoteInput);setSsNoteModal(null);}}>Save</button>
      </div></div>)}
      {exNoteModal&&(<div className="modal-backdrop"><div className="modal">
        <div className="modal-title"><span>{activeSS.find(s=>s.id===exNoteModal.ssId)?.[exNoteModal.side]?.name}</span><button className="modal-close" onClick={()=>setExNoteModal(null)}>✕</button></div>
        <div style={{height:12}}/><textarea className="note-textarea" value={exNoteInput} onChange={e=>setExNoteInput(e.target.value)} placeholder="Add a note…"/>
        <button className="action-btn purple" style={{marginTop:12}} onClick={async()=>{await saveExNote(exNoteModal.iso,exNoteModal.ssId,exNoteModal.side,exNoteInput);setExNoteModal(null);}}>Save</button>
      </div></div>)}
      {gateModal&&(<div className="modal-backdrop"><div className="modal">
        <div className="modal-title"><span>Unlogged sets</span><button className="modal-close" onClick={()=>setGateModal(false)}>✕</button></div>
        <div className="modal-sub">These sets haven't been logged. Mark them before saving.</div>
        <div style={{marginBottom:16}}>{Object.entries(unloggedSets(selectedISO).reduce((acc,u)=>{if(!acc[u.ssLabel])acc[u.ssLabel]=[];acc[u.ssLabel].push(u.name);return acc;},{})).map(([label,names])=>(<div key={label} style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:4}}>{label}</div>{names.map(n=><div key={n} style={{fontSize:13,color:'var(--text2)',padding:'4px 0',borderBottom:'0.5px solid var(--border)'}}>{n}</div>)}</div>))}</div>
        <button className="action-btn amber" onClick={markAllSkipped} style={{marginTop:4}}>Mark all as skipped</button>
        <button className="secondary-btn" onClick={()=>setGateModal(false)}>Go back and log them</button>
      </div></div>)}
      {feedbackModal&&(<div className="modal-backdrop"><div className="modal">
        <div className="modal-title"><span>Session saved ✓</span></div>
        <div className="modal-sub">Quick feedback helps track training quality over time.</div>
        <div className="modal-label">How did the session feel?</div>
        <div style={{display:'flex',gap:6,marginBottom:20}}>{FEEL_LABELS.map((l,i)=>(<button key={l} onClick={()=>setFeedbackFeel(i+1)} style={{flex:1,padding:'10px 4px',borderRadius:8,border:`1.5px solid ${feedbackFeel===i+1?'var(--purple)':'var(--border2)'}`,background:feedbackFeel===i+1?'var(--purple)':'transparent',color:feedbackFeel===i+1?'#fff':'var(--text2)',fontSize:10,fontWeight:600,cursor:'pointer',textAlign:'center'}}>{i+1}<br/><span style={{fontSize:9,fontWeight:400}}>{l}</span></button>))}</div>
        <div className="modal-label">Physical flags (optional)</div>
        <textarea className="note-textarea" rows={2} style={{marginBottom:16}} placeholder="e.g. right elbow on FL pull-ups" value={feedbackFlags} onChange={e=>setFeedbackFlags(e.target.value)}/>
        <div className="modal-label">Session number this week</div>
        <div style={{display:'flex',gap:8,marginBottom:20}}>{[1,2,3].map(n=>(<button key={n} onClick={()=>setFeedbackSessionNum(n)} style={{flex:1,padding:12,borderRadius:8,border:`1.5px solid ${feedbackSessionNum===n?'var(--purple)':'var(--border2)'}`,background:feedbackSessionNum===n?'#1a0f3c':'transparent',color:feedbackSessionNum===n?'var(--purple)':'var(--text2)',fontSize:14,fontWeight:700,cursor:'pointer'}}>{n}</button>))}</div>
        <button className="action-btn green" onClick={saveFeedback}>Done</button>
      </div></div>)}
      {swapModal&&(<div className="modal-backdrop" onClick={()=>setSwapModal(null)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxHeight:'80vh',overflowY:'auto'}}>
        <div className="modal-title"><span>Swap exercise</span><button className="modal-close" onClick={()=>setSwapModal(null)}>✕</button></div>
        <div style={{fontSize:12,color:'var(--text3)',marginBottom:12}}>{swapModal.exName}</div>
        {swapLoading&&<div style={{textAlign:'center',padding:24,color:'var(--text3)',fontSize:13}}>Loading…</div>}
        {!swapLoading&&['easier','lateral','harder'].map(dir=>{
          const group=swapCandidates.filter(c=>c.swap_direction===dir);
          if(!group.length) return null;
          return(<div key={dir} style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>{dir}</div>
            {group.map(c=>{
              const warn=c.athlete_notes&&(/shoulder|not testing/i.test(c.athlete_notes));
              return(<button key={c.swap_slug} onClick={()=>onSwap(swapModal.ssId,swapModal.side,c.swap_slug,c.swap_name)} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'10px 12px',marginBottom:6,borderRadius:10,border:'1px solid var(--border2)',background:'var(--bg2)',cursor:'pointer',textAlign:'left'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{warn&&<span title={c.athlete_notes} style={{marginRight:4}}>⚠</span>}{c.swap_name}</div>
                  <div style={{display:'flex',gap:6,marginTop:4}}>
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:10,background:'var(--bg3)',color:'var(--text3)',fontWeight:600}}>{c.swap_track}</span>
                    {c.current_band&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:10,background:'#0d1f3c',color:'var(--blue)',fontWeight:600}}>{c.current_band}</span>}
                  </div>
                </div>
                <span style={{fontSize:18,color:'var(--text3)'}}>›</span>
              </button>);
            })}
          </div>);
        })}
        {!swapLoading&&swapCandidates.length===0&&<div style={{textAlign:'center',padding:24,color:'var(--text3)',fontSize:13}}>No swap candidates found for this exercise.</div>}
        <button className="secondary-btn" onClick={()=>setSwapModal(null)} style={{marginTop:4}}>Cancel</button>
      </div></div>)}

      {briefingModal&&(<div className="modal-backdrop" onClick={()=>setBriefingModal(false)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxHeight:'80vh',overflowY:'auto'}}>
        <div className="modal-title">
          <span style={{display:'flex',alignItems:'center',gap:8}}><span>Session briefing</span></span>
          <button className="modal-close" onClick={()=>setBriefingModal(false)}>✕</button>
        </div>
        {briefingLoading&&(
          <div style={{textAlign:'center',padding:32,color:'var(--text3)',fontSize:13}}>
            <div style={{marginBottom:8,fontSize:18}}>⏳</div>
            Preparing your briefing…
          </div>
        )}
        {!briefingLoading&&!briefingText&&(
          <div style={{textAlign:'center',padding:32,color:'var(--text3)',fontSize:13}}>No previous session data found.</div>
        )}
        {!briefingLoading&&briefingText&&(
          <div style={{padding:'4px 0'}}>
            {briefingText.split('\n').filter(l=>l.trim()).map((line,i)=>(
              <div key={i} style={{fontSize:13,lineHeight:1.7,color:line.startsWith('⚠')?'var(--amber)':'var(--text)',padding:'6px 0',borderBottom:'0.5px solid var(--border)',display:'flex',gap:8,alignItems:'flex-start'}}>
                {line}
              </div>
            ))}
          </div>
        )}
        <button className="secondary-btn" onClick={()=>setBriefingModal(false)} style={{marginTop:16}}>Close</button>
      </div></div>)}

    </div>
  );
}

