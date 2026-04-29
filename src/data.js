// src/data.js
// Master programme data. video: null = placeholder shown in UI

export const INIT_SS = [
  {
    id: 'ss1',
    label: 'Superset 1',
    note: 'Expression sets — data, not performance.',
    push: {
      name: 'Full planche hold',
      slug: 'full_planche',
      sets: 3,
      target: '4–6s',
      assist: 80,
      measureType: 'secs',
      role: 'Expression',
      coaching: "Red band working sets. 4–5s is your baseline. Protract hard, don't force.",
      video: null,
    },
    pull: {
      name: 'Front lever touch',
      slug: 'fl_touch',
      sets: 3,
      target: '5–7s',
      assist: 80,
      measureType: 'secs',
      role: 'Expression',
      coaching: 'Track consistency across all 3 sessions — not just duration.',
      video: null,
    },
  },
  {
    id: 'ss2',
    label: 'Superset 2',
    note: 'Wide / Maltese branch.',
    push: {
      name: 'Wide straddle planche',
      slug: 'wide_straddle_planche',
      sets: 2,
      target: '4–6s',
      assist: 70,
      measureType: 'secs',
      role: 'Branch',
      coaching: 'Wide pathway is the Maltese builder. Quality hold, not duration.',
      video: null,
    },
    pull: {
      name: 'Wide FL touch',
      slug: 'wide_fl_touch',
      sets: 2,
      target: '3–4s',
      assist: 100,
      measureType: 'secs',
      role: 'Branch',
      coaching: 'SAT pathway — match recent output. Stop before form breaks.',
      video: null,
    },
  },
  {
    id: 'ss3',
    label: 'Superset 3',
    note: 'Main working volume.',
    push: {
      name: 'Straddle planche press',
      slug: 'straddle_planche_pushup',
      sets: 3,
      target: '3–5 reps',
      assist: 70,
      measureType: 'reps',
      role: 'Main builder',
      coaching: 'Black band at 4 reps is your working level. Quality over grinding.',
      video: null,
    },
    pull: {
      name: 'FL pull-ups',
      slug: 'fl_pullup',
      sets: 3,
      target: '4–6 reps',
      assist: 80,
      measureType: 'reps',
      role: 'Main builder',
      coaching: 'Right elbow — monitor closely. Red band protects load. Stop if any niggle.',
      video: null,
    },
  },
  {
    id: 'ss4',
    label: 'Superset 4',
    note: 'Dynamic strength through range.',
    push: {
      name: 'Straddle planche push-ups',
      slug: 'straddle_planche_pushup',
      sets: 3,
      target: '4–6 reps',
      assist: 70,
      measureType: 'reps',
      role: 'Main builder',
      coaching: 'Controlled tempo. Stop before form breaks.',
      video: null,
    },
    pull: {
      name: 'Adv tuck FL pull-up to touch',
      slug: 'fl_pullup',
      sets: 3,
      target: '5–7 reps',
      assist: 100,
      measureType: 'reps',
      role: 'Main builder',
      coaching: 'Highest frequency anchor in your history. Non-negotiable.',
      video: null,
    },
  },
  {
    id: 'ss5',
    label: 'Superset 5',
    note: 'Bridge.',
    push: {
      name: 'Planche lean → full planche',
      slug: 'planche_lean',
      sets: 3,
      target: '3–5s',
      assist: 100,
      measureType: 'secs',
      role: 'Bridge',
      coaching: 'Drive from lean into lock. Teaches the push-through pattern.',
      video: null,
    },
    pull: {
      name: 'Wide front lever raises',
      slug: 'fl_raise',
      sets: 2,
      target: '6–8 reps',
      assist: 100,
      measureType: 'reps',
      role: 'Bridge',
      coaching: '7 reps in recent sessions. Match or exceed.',
      video: null,
    },
  },
  {
    id: 'ss6',
    label: 'Superset 6',
    note: 'Finisher.',
    push: {
      name: 'HSPU',
      slug: 'hs_pushup',
      sets: 3,
      target: 'max reps',
      assist: 100,
      measureType: 'reps',
      role: 'Supplemental',
      coaching: 'Stop 1 rep before failure. Left shoulder — monitor.',
      video: null,
    },
    pull: {
      name: 'Weighted pull-ups',
      slug: 'weighted_pullup',
      sets: 3,
      target: '5 reps',
      assist: 100,
      measureType: 'reps',
      isWeighted: true,
      role: 'Supplemental',
      coaching: 'Light load. Right elbow flag applies here too.',
      video: null,
    },
  },
];

export const REHAB_SS = {
  id: 'ssR',
  label: 'Rehab',
  note: 'Elbow protocol.',
  push: {
    name: 'Tricep isometric',
    slug: 'tricep_isometric',
    sets: 2,
    target: '30–45s',
    assist: 100,
    measureType: 'secs',
    role: 'Rehab',
    coaching: 'Slow build, no pain. Right elbow maintenance.',
    video: null,
  },
  pull: {
    name: 'Soft tissue / band rotator',
    slug: 'band_rotator',
    sets: 2,
    target: '20–30s',
    assist: 80,
    measureType: 'secs',
    role: 'Rehab',
    coaching: 'Light band only. Maintenance, not training.',
    video: null,
  },
};

export const ASSIST_LEVELS = [100, 80, 70, 50];
export const FEEL_SCORES = [4, 3, 2, 1];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const RECOVERY = {
  push: {
    label: 'Shoulder & planche prep',
    color: '#7c3aed',
    reason_fn: (ex) => `${ex} was your hardest work last session. Keep the pattern alive without loading it.`,
    items: [
      { name: 'Shoulder circles', desc: 'Full controlled rotations, both directions. 10 forward, 10 backward per side.', type: 'reps', target: { sets: 2, reps: 10, repsLabel: 'each direction' }, video: null },
      { name: 'Band shoulder stretches', desc: 'Overhead, cross-body and internal/external rotation. Light band, posterior capsule focus.', type: 'duration', target: { sets: 1, duration: 60, label: '60s per stretch' }, video: null },
      { name: 'Planche leans', desc: "Bodyweight, no band. Protract the scapula hard and hold the lean. Feel the position, don't force it.", type: 'hold', target: { sets: 3, duration: 10, label: '3 × 10s' }, video: null },
      { name: 'Tuck planche holds', desc: 'Well below working level — activation only. Scapular depression and protraction.', type: 'hold', target: { sets: 3, duration: 5, label: '3 × 5s' }, video: null },
      { name: 'Planche rocks', desc: 'From planche lean, shift weight forward and back. Teaches the centre of mass shift pattern.', type: 'reps', target: { sets: 3, reps: 8, repsLabel: 'reps' }, video: null },
      { name: 'Supinated planche leans', desc: 'Hands supinated (fingers pointing back). Different load angle on wrist and shoulder.', type: 'hold', target: { sets: 2, duration: 8, label: '2 × 8s' }, video: null },
    ],
  },
  pull: {
    label: 'FL & lat recovery',
    color: '#16a34a',
    reason_fn: (ex) => `${ex} was your hardest work last session. Low-load FL work and soft tissue will help you recover.`,
    items: [
      { name: 'Dead hangs', desc: '30–60s hangs. Decompresses the shoulder joint. Essential after heavy FL volume.', type: 'hold', target: { sets: 3, duration: 45, label: '3 × 45s' }, video: null },
      { name: 'Tuck FL holds', desc: 'Well below working level — maintains the pattern without load.', type: 'hold', target: { sets: 4, duration: 6, label: '4 × 6s' }, video: null },
      { name: 'Tuck FL shrugs', desc: 'From tuck hang, depress and retract the scapula without pulling. Activates lat at long length.', type: 'reps', target: { sets: 3, reps: 8, repsLabel: 'slow reps' }, video: null },
      { name: 'Lat rolling', desc: 'Foam roller, side-lying. Just behind the armpit. High-load area in FL work.', type: 'duration', target: { sets: 1, duration: 90, label: '90s per side' }, video: null },
    ],
  },
  default: {
    label: 'Soft tissue & mobility',
    color: '#d97706',
    reason_fn: () => 'No clear struggle point from your last session — general recovery today.',
    items: [
      { name: 'Leg foam rolling', desc: 'Quads, hamstrings, IT band. Counteracts sitting compression — spend the most time here.', type: 'duration', target: { sets: 1, duration: 120, label: '2 min per area' }, video: null },
      { name: 'Peanut roller — neck & upper spine', desc: 'Base of skull down to mid-thoracic. 60–90s per segment.', type: 'duration', target: { sets: 1, duration: 90, label: '90s per segment' }, video: null },
      { name: 'Tricep rolling', desc: 'Lacrosse ball on the tricep belly and lateral elbow. Do this every rest day given the elbow flag.', type: 'duration', target: { sets: 1, duration: 60, label: '60s per arm' }, video: null },
      { name: 'Hip flexor stretch', desc: 'Deep lunge, 60–90s per side. Direct counter to extended sitting.', type: 'duration', target: { sets: 1, duration: 75, label: '75s per side' }, video: null },
    ],
  },
};

export const RECOVERY_EXTRAS = [
  {
    label: 'Breathwork',
    color: '#3b82f6',
    items: [
      { name: 'Diaphragmatic breathing', desc: '5 min lying supine. Resets the nervous system after high-CNS training days.' },
      { name: 'Box breathing', desc: '4s in / 4s hold / 4s out / 4s hold. Parasympathetic activation.' },
    ],
  },
  {
    label: 'Thoracic mobility',
    color: '#6b6b6b',
    items: [
      { name: 'Thoracic extension', desc: 'Over a foam roller or chair edge. Opens up the thoracic spine.' },
      { name: 'Thread the needle', desc: 'Quadruped, thread one arm under. 5 reps each side, hold at end range.' },
    ],
  },
];

export const FEEL_LABELS = ['Very poor', 'Poor', 'OK', 'Good', 'Peak'];

// ─── Mesocycle Phase Configuration ───────────────────────────────────────────
// setDelta: adjustment to the exercise's default set count (clamped min 1)
// label / color: UI pill display
// hint: coaching cue shown on the exercise row
// NOTE: assist percentages are NEVER auto-adjusted — band selection is manual
export const PHASE_CONFIG = {
  volume:   { label: 'VOL',   color: '#3b82f6', setDelta: +1, hint: 'More volume — push set count, keep quality.', arrow: '▲' },
  strength: { label: 'STR',   color: '#7c3aed', setDelta:  0, hint: 'Baseline block — hit the prescribed sets.', arrow: '●' },
  peak:     { label: 'PEAK',  color: '#d97706', setDelta: -1, hint: 'Intensity week — fewer sets, go harder.', arrow: '▼' },
  deload:   { label: 'LOAD',  color: '#6b7280', setDelta: -1, hint: 'Deload — flush the tissues, stay crisp.', arrow: '▽' },
};

/**
 * Pure function — returns a deep-cloned array of supersets with set counts and
 * target strings adjusted for the current mesocycle phase.
 * Does NOT mutate INIT_SS or the live supersets state.
 * Does NOT touch assist percentages — band selection stays manual.
 */
export function generatePhaseWorkout(supersets, phase = 'strength') {
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.strength;
  return supersets.map(ss => ({
    ...ss,
    push: ss.push ? adjustEx(ss.push, cfg) : ss.push,
    pull: ss.pull ? adjustEx(ss.pull, cfg) : ss.pull,
  }));
}

function adjustEx(ex, cfg) {
  const newSets = Math.max(1, (ex.sets || 3) + cfg.setDelta);
  return { ...ex, sets: newSets };
}

