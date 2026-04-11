export const SUPERSETS = [
  { id:"ss1", label:"Superset 1", note:"Expression sets — data, not performance.",
    push:{ name:"Full planche hold", sets:3, target:"4–6s", band:"Red band", role:"Expression", coaching:"Red band working sets. 4–5s is your current baseline. Protract hard." },
    pull:{ name:"Full touch front lever", sets:3, target:"5–7s", band:"Red band", role:"Expression", coaching:"Track consistency across sessions — not just duration." }},
  { id:"ss2", label:"Superset 2", note:"Main press + pull volume.",
    push:{ name:"Straddle planche press", sets:3, target:"3–5 reps", band:"Black band", role:"Main builder", coaching:"Black band at 4 reps is your working level." },
    pull:{ name:"FL pull-ups", sets:3, target:"4–5 reps", band:"Red band", role:"Main builder", coaching:"Elbow flag — stop if any niggle." }},
  { id:"ss3", label:"Superset 3", note:"Dynamic strength through range.",
    push:{ name:"Straddle planche push-ups", sets:3, target:"4–6 reps", band:"Black band", role:"Main builder", coaching:"Controlled tempo. Stop before form breaks." },
    pull:{ name:"Adv tuck FL pull-up to touch", sets:3, target:"5–7 reps", band:"Unassisted", role:"Main builder", coaching:"Highest frequency anchor in your history. Non-negotiable." }},
  { id:"ss4", label:"Superset 4", note:"Wide / Maltese branch.",
    push:{ name:"Wide straddle planche", sets:2, target:"4–6s", band:"Unassisted", role:"Branch", coaching:"Wide pathway is the Maltese builder." },
    pull:{ name:"Wide single leg touch FL", sets:2, target:"3–4s", band:"Unassisted", role:"Branch", coaching:"Match your recent output." }},
  { id:"ss5", label:"Superset 5", note:"Bridge + raises.",
    push:{ name:"Planche lean → full planche", sets:3, target:"3–5s", band:"Unassisted", role:"Bridge", coaching:"Drive from lean into lock." },
    pull:{ name:"Wide front lever raises", sets:2, target:"6–8 reps", band:"Unassisted", role:"Bridge", coaching:"7 reps in recent sessions. Match or exceed." }},
  { id:"ss6", label:"Elbow care + HSPU", note:"Non-negotiable while niggles persist.",
    push:{ name:"HSPU", sets:3, target:"max reps", band:"Unassisted", role:"Supplemental", coaching:"Stop 1 rep before failure." },
    pull:{ name:"Tricep isometric", sets:2, target:"30–45s", band:"Unassisted", role:"Rehab", coaching:"From B14 rehab protocol. Every session." }}
]

export const BANDS = ["Unassisted","Red band","Black band","Medium band","Light band"]
export const FEEL  = ["Easy","Solid","Hard","Max"]
export const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
