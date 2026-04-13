export const SUPERSETS = [
  { id:'ss1', label:'Superset 1', note:'Expression sets — data, not performance.',
    push:{ name:'Full planche hold', sets:3, target:'4–6s', band:'Red band', role:'Expression',
      coaching:'Red band working sets. 4–5s is your baseline. Protract hard, don\'t force.' },
    pull:{ name:'Front lever touch', sets:3, target:'5–7s', band:'Red band', role:'Expression',
      coaching:'Track consistency across all 3 sessions — not just duration.' }},
  { id:'ss2', label:'Superset 2', note:'Wide / Maltese branch — fresh CNS.',
    push:{ name:'Wide straddle planche', sets:2, target:'4–6s', band:'Unassisted', role:'Branch',
      coaching:'Wide pathway is the Maltese builder. Quality hold, not duration.' },
    pull:{ name:'Wide single leg FL touch', sets:2, target:'3–4s', band:'Unassisted', role:'Branch',
      coaching:'Match recent output. Stop before form breaks.' }},
  { id:'ss3', label:'Superset 3', note:'Main working volume.',
    push:{ name:'Straddle planche press', sets:3, target:'3–5 reps', band:'Black band', role:'Main builder',
      coaching:'Black band at 4 reps is your working level. Quality over grinding.' },
    pull:{ name:'FL pull-ups', sets:3, target:'4–5 reps', band:'Red band', role:'Main builder',
      coaching:'Elbow flag — monitor closely. Red band protects load. Stop if any niggle.' }},
  { id:'ss4', label:'Superset 4', note:'Dynamic strength through range.',
    push:{ name:'Straddle planche push-ups', sets:3, target:'4–6 reps', band:'Black band', role:'Main builder',
      coaching:'Controlled tempo. Stop before form breaks.' },
    pull:{ name:'Adv tuck FL pull-up to touch', sets:3, target:'5–7 reps', band:'Unassisted', role:'Main builder',
      coaching:'Highest frequency anchor in your history. Non-negotiable.' }},
  { id:'ss5', label:'Superset 5', note:'Bridge — feel the pattern.',
    push:{ name:'Planche lean → full planche', sets:3, target:'3–5s', band:'Unassisted', role:'Bridge',
      coaching:'Drive from lean into lock. Teaches the push-through pattern.' },
    pull:{ name:'Wide front lever raises', sets:2, target:'6–8 reps', band:'Unassisted', role:'Bridge',
      coaching:'7 reps in recent sessions. Match or exceed.' }},
  { id:'ss6', label:'Superset 6', note:'Finisher — strength support.',
    push:{ name:'HSPU', sets:3, target:'max reps', band:'Unassisted', role:'Supplemental',
      coaching:'Stop 1 rep before failure.' },
    pull:{ name:'Weighted pull-ups', sets:3, target:'5 reps', band:'Unassisted', role:'Supplemental',
      coaching:'Light load. Elbow flag applies here too.' }}
]

export const BANDS = ['Unassisted','Red band','Black band','Medium band','Light band']
export const FEEL  = ['Easy','Solid','Hard','Max']
export const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
