// @format: jsx
// SprintIQ_v9_final.jsx
import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:"#00FF00", surf:"#FFFFFF", bdr:"#EAE0DE", bdr2:"#D9CECA",
  t1:"#1A0808", t2:"#7A4E4E", t3:"#B89090",
  red:"#C42B2B", redL:"#FFF0F0", redM:"#F0CCCC",
  H:"#C42B2B", Hbg:"#FFF0F0", Hbd:"#F0CCCC", Ht:"#9B1A1A",
  M:"#B06A00", Mbg:"#FFF8EE", Mbd:"#EDD5A3", Mt:"#7A4800",
  L:"#276B34", Lbg:"#F0FAF2", Lbd:"#A8D9B4", Lt:"#1A4A24",
  P:"#4B3B8C", Pbg:"#F3F0FF", Pbd:"#C4B5F4",
  B:"#1A6B8C", Bbg:"#EFF8FF", Bbd:"#A8D4E9",
};
const F   = "'DM Mono','Fira Code',Consolas,monospace";
const FUI = "'DM Sans','Outfit',system-ui,sans-serif";

// ─── PURE HELPERS ─────────────────────────────────────────────────────────────
const rk = (l) =>
  l === "HIGH"   ? { bg:C.Hbg, bd:C.Hbd, t:C.Ht, dot:C.H } :
  l === "MEDIUM" ? { bg:C.Mbg, bd:C.Mbd, t:C.Mt, dot:C.M } :
                   { bg:C.Lbg, bd:C.Lbd, t:C.Lt, dot:C.L };

const sentTrend = (v) =>
  v === "Declining" ? { col:C.H, bg:C.Hbg, bd:C.Hbd } :
  v === "Stable"    ? { col:C.M, bg:C.Mbg, bd:C.Mbd } :
                      { col:C.L, bg:C.Lbg, bd:C.Lbd };

const perfCol   = (s) => s >= 8.5 ? C.L : s >= 7 ? C.B : s >= 5.5 ? C.M : C.H;
const perfBg    = (s) => s >= 8.5 ? C.Lbg : s >= 7 ? C.Bbg : s >= 5.5 ? C.Mbg : C.Hbg;
const perfBd    = (s) => s >= 8.5 ? C.Lbd : s >= 7 ? C.Bbd : s >= 5.5 ? C.Mbd : C.Hbd;
const perfLabel = (s) => s >= 8.5 ? "Exceptional" : s >= 7 ? "Strong" : s >= 5.5 ? "Developing" : "At Risk";

const jitter  = (v, s) => Math.round(v + (Math.random() * 2 - 1) * s);
const jitterF = (v, s) => parseFloat((v + (Math.random() * 2 - 1) * s).toFixed(2));
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const calcHike = (emp) => {
  const baseZ  = emp.deptZScore;
  const hrAvg  = (emp.hrInput.culturalFit + emp.hrInput.engagement + emp.hrInput.behaviour + emp.hrInput.tone) / 4;
  const comp   = parseFloat((baseZ * 0.8 + hrAvg * 0.2).toFixed(2));
  const hike   = comp >= 9 ? 28 : comp >= 8.5 ? 22 : comp >= 8 ? 17 : comp >= 7.5 ? 12 : comp >= 7 ? 8 : comp >= 6.5 ? 4 : comp >= 6 ? 2 : 0;
  const role   = comp >= 9 ? "Promote + Hike" : comp >= 8 ? "Strong Retain + Hike" : comp >= 7 ? "Retain" : comp >= 6 ? "Monitor + Counselling" : "PIP Review";
  const roleColor = comp >= 9 ? C.L : comp >= 8 ? C.B : comp >= 7 ? C.M : C.H;
  return { composite: comp, hike, role, roleColor, hrAvg: parseFloat(hrAvg.toFixed(1)) };
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const MOODS = [
  { symbol:"😄", label:"Great",    color:"#276B34", bg:"#F0FAF2", score:5 },
  { symbol:"🙂", label:"Good",     color:"#1A6B8C", bg:"#EFF8FF", score:4 },
  { symbol:"😐", label:"Neutral",  color:"#B06A00", bg:"#FFF8EE", score:3 },
  { symbol:"😔", label:"Low",      color:"#C42B2B", bg:"#FFF0F0", score:2 },
  { symbol:"😰", label:"Stressed", color:"#7B1FA2", bg:"#F9F0FF", score:1 },
];

const MOOD_EMPLOYEES = [
  { id:"PS-2041", name:"Priya Nair",     team:"Onboarding"   },
  { id:"PS-1834", name:"Rahul Kapoor",   team:"Marketing"    },
  { id:"PS-1677", name:"Sanya Malhotra", team:"Tech Support" },
  { id:"PS-2109", name:"Arjun Nair",     team:"Operations"   },
  { id:"PS-1523", name:"Divya Menon",    team:"Strategy"     },
  { id:"PS-1342", name:"Meera Iyer",     team:"Operations"   },
  { id:"PS-2201", name:"Aditya Verma",   team:"Tech Support" },
  { id:"PS-1901", name:"Karan Shah",     team:"Onboarding"   },
  { id:"PS-1756", name:"Neha Joshi",     team:"Marketing"    },
  { id:"PS-2088", name:"Rohan Pillai",   team:"Strategy"     },
];

const MOOD_HISTORY = [
  { day:"Mon", am:[5,4,3,4,5,4,5,3,4,5], pm:[4,3,2,4,5,4,4,3,3,5] },
  { day:"Tue", am:[4,3,3,3,4,4,5,4,4,4], pm:[3,2,1,3,4,4,4,3,3,4] },
  { day:"Wed", am:[3,2,2,3,4,3,4,4,3,4], pm:[3,2,1,3,4,4,4,3,3,4] },
  { day:"Thu", am:[4,3,2,4,5,4,5,4,4,5], pm:[4,3,2,4,5,4,5,3,4,4] },
  { day:"Fri", am:[5,4,2,4,5,5,5,4,5,5], pm:[4,3,1,4,5,5,5,4,4,5] },
];

const EMPS = [
  {
    id:"PS-2041", name:"Priya Nair", role:"Senior Onboarding Manager",
    team:"Onboarding", score:84, delta:11, lvl:"HIGH", tenure:"2.1y",
    mgr:"Aryan Bose", joined:"Jan 2024",
    trend:[52,55,58,61,65,68,70,72,75,78,82,84].map((v,i) => ({ w:`W${i+1}`, v })),
    shap:[
      { l:"Caseload 2.4× avg",         v:32, n:"87 merchants vs avg 36" },
      { l:"Recognition gap",           v:28, n:"No award in 9 months" },
      { l:"Comp 16% below market",     v:21, n:"₹18L median vs ₹15.1L" },
      { l:"Negative 1:1 sentiment",    v:15, n:"Bandwidth, career, workload" },
      { l:"PTO 18 days unused",        v:8,  n:"Burnout precursor 71% exits" },
    ],
    actions:["Redistribute 30+ accounts","Comp review — close 16% gap","Assign SprintVerify lead"],
    sigs:{ eng:-28, app:-22, comp:-16, sent:-0.51 },
  },
  {
    id:"PS-1834", name:"Rahul Kapoor", role:"Marketing Lead",
    team:"Marketing", score:78, delta:7, lvl:"HIGH", tenure:"1.4y",
    mgr:"Sneha Patel", joined:"Mar 2024",
    trend:[48,50,52,56,59,62,65,68,70,73,76,78].map((v,i) => ({ w:`W${i+1}`, v })),
    shap:[
      { l:"Appraisal dropped 2 cycles", v:30, n:"8.1→7.2→6.3" },
      { l:"Stagnation 14 months",       v:24, n:"Peers promoted at 11-month median" },
      { l:"Comp 14% below market",      v:20, n:"No increment this cycle" },
      { l:"Slack activity down 31%",    v:9,  n:"vs 90-day baseline" },
    ],
    actions:["Promotion discussion by EOW","Fast-track Q3 increment","Assign SprintPG ownership"],
    sigs:{ eng:-31, app:-28, comp:-14, sent:-0.38 },
  },
  {
    id:"PS-1677", name:"Sanya Malhotra", role:"Tech Support Lead",
    team:"Tech Support", score:72, delta:5, lvl:"HIGH", tenure:"3.2y",
    mgr:"Vikash Nair", joined:"Dec 2022",
    trend:[40,43,46,50,54,57,60,63,66,68,70,72].map((v,i) => ({ w:`W${i+1}`, v })),
    shap:[
      { l:"Manager conflict signals",  v:29, n:"3 escalations in 60 days" },
      { l:"PTO 24 days unused",        v:22, n:"Highest in team" },
      { l:"SLA breach 18% vs avg 6%",  v:18, n:"Overload impacting quality" },
      { l:"Lateral transfer denied",   v:14, n:"Applied for Strategy Feb 2025" },
    ],
    actions:["Escalate to HR BP","Mandate 5 PTO days in 30 days","Revisit lateral transfer Q3"],
    sigs:{ eng:-19, app:-11, comp:-8, sent:-0.44 },
  },
  {
    id:"PS-2109", name:"Arjun Nair", role:"Operations Analyst",
    team:"Operations", score:63, delta:8, lvl:"MEDIUM", tenure:"0.8y",
    mgr:"Pooja Rao", joined:"Oct 2024",
    trend:[30,33,37,40,43,46,50,53,56,59,61,63].map((v,i) => ({ w:`W${i+1}`, v })),
    shap:[
      { l:"Onboarding 40% incomplete", v:21, n:"Peer avg 92% at 6 months" },
      { l:"Low pulse score",           v:18, n:"4.1/10 vs org 6.2" },
      { l:"No growth plan",            v:15, n:"Only 23% analysts lack one" },
    ],
    actions:["Assign mentor by EOW","Create 6-month growth plan"],
    sigs:{ eng:-22, app:-9, comp:-5, sent:-0.29 },
  },
  {
    id:"PS-1523", name:"Divya Menon", role:"Strategy Analyst",
    team:"Strategy", score:57, delta:-4, lvl:"MEDIUM", tenure:"1.9y",
    mgr:"Rohan Bhat", joined:"Jul 2024",
    trend:[62,65,63,61,59,60,61,59,58,57,57,57].map((v,i) => ({ w:`W${i+1}`, v })),
    shap:[
      { l:"Appraisal 6 weeks overdue", v:25, n:"Policy: 2 weeks max" },
      { l:"Below-peer promotion",      v:19, n:"2 juniors promoted ahead" },
    ],
    actions:["Complete appraisal in 48h","Discuss promotion timeline"],
    sigs:{ eng:-8, app:-15, comp:-3, sent:-0.18 },
  },
  {
    id:"PS-1342", name:"Meera Iyer", role:"Operations Manager",
    team:"Operations", score:31, delta:-2, lvl:"LOW", tenure:"4.1y",
    mgr:"Pooja Rao", joined:"Mar 2022",
    trend:[35,34,33,33,32,32,31,31,31,31,31,31].map((v,i) => ({ w:`W${i+1}`, v })),
    shap:[
      { l:"Strong tenure (protective)",      v:-18, n:"4+ yrs above median" },
      { l:"Consistent appraisal (protective)",v:-12, n:"8.4 avg 4 cycles" },
    ],
    actions:["Standard quarterly check-in","Nominate for mentorship"],
    sigs:{ eng:12, app:4, comp:0, sent:0.31 },
  },
  {
    id:"PS-2201", name:"Aditya Verma", role:"Tech Support Executive",
    team:"Tech Support", score:22, delta:1, lvl:"LOW", tenure:"1.6y",
    mgr:"Vikash Nair", joined:"Oct 2024",
    trend:[18,19,20,20,21,21,21,22,22,22,22,22].map((v,i) => ({ w:`W${i+1}`, v })),
    shap:[
      { l:"High engagement (protective)", v:-15, n:"8.7/10 pulse" },
      { l:"Top 10% SLA (protective)",     v:-11, n:"98.4% adherence" },
    ],
    actions:["Flag as Team Lead Q4","Nominate Q3 Spot Award"],
    sigs:{ eng:21, app:8, comp:2, sent:0.42 },
  },

  // ─── HIGH RISK · Additional ─────────────────────────────────────────────────
  {
    id:"PS-1845", name:"Ritu Agarwal", role:"Operations Lead",
    team:"Operations", score:87, delta:14, lvl:"HIGH", tenure:"3.5y",
    mgr:"Pooja Rao", joined:"Feb 2023",
    trend:[55,58,62,65,68,71,74,77,80,84,86,87].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Manager conflict signals",   v:31, n:"4 escalations in 90 days"},
      {l:"Lateral transfer denied ×2", v:26, n:"Applied to Strategy — headcount freeze"},
      {l:"Comp 14% below market",      v:22, n:"₹16.2L median vs ₹13.8L actual"},
      {l:"Caseload 1.9× avg",          v:14, n:"68 accounts vs team avg 36"},
      {l:"PTO 19 days unused",         v:9,  n:"Burnout precursor pattern"},
    ],
    actions:["HR BP mediation in 5 days","Reopen lateral transfer Q3","Comp review ₹14L floor"],
    sigs:{eng:-30,app:-20,comp:-14,sent:-0.48},
  },
  {
    id:"PS-2156", name:"Kavya Reddy", role:"Senior Operations Analyst",
    team:"Operations", score:82, delta:9, lvl:"HIGH", tenure:"2.8y",
    mgr:"Pooja Rao", joined:"Jun 2023",
    trend:[50,54,57,60,63,66,68,72,75,78,80,82].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Comp 18% below market",  v:33, n:"₹14.8L median vs ₹12.1L actual"},
      {l:"No promotion in 3 yrs",  v:26, n:"Peers promoted at 2.1-yr median"},
      {l:"Caseload elevated",      v:17, n:"74 accounts vs avg 50"},
      {l:"PTO 21 days unused",     v:10, n:"Q3 burnout risk elevated"},
    ],
    actions:["Promote to Lead by Q3","Comp adjustment — close 18% gap","Redistribute 20 accounts"],
    sigs:{eng:-25,app:-19,comp:-18,sent:-0.44},
  },
  {
    id:"PS-1972", name:"Siddharth Kumar", role:"Operations Analyst",
    team:"Operations", score:76, delta:6, lvl:"HIGH", tenure:"1.7y",
    mgr:"Pooja Rao", joined:"Nov 2024",
    trend:[44,47,50,53,56,60,63,66,69,72,74,76].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Appraisal stagnant 2 cycles", v:28, n:"7.1→7.0→6.8 declining"},
      {l:"Peer promoted ahead",         v:22, n:"2 juniors promoted in 12 months"},
      {l:"Comp 12% below market",       v:16, n:"No increment this cycle"},
      {l:"Low recognition score",       v:9,  n:"Bottom 15% peer recognition"},
    ],
    actions:["Promotion discussion EOW","Q3 fast-track increment","Assign project ownership"],
    sigs:{eng:-20,app:-15,comp:-12,sent:-0.35},
  },
  {
    id:"PS-2247", name:"Ishaan Gupta", role:"Operations Executive",
    team:"Operations", score:73, delta:6, lvl:"HIGH", tenure:"0.7y",
    mgr:"Pooja Rao", joined:"Nov 2025",
    trend:[38,41,44,47,50,54,57,61,64,68,71,73].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Onboarding 50% incomplete", v:24, n:"Peer avg 92% at 6 months"},
      {l:"Low pulse score",           v:18, n:"3.8/10 vs org 6.2"},
      {l:"No growth plan assigned",   v:14, n:"Only 23% analysts lack one"},
    ],
    actions:["Assign senior mentor immediately","Complete onboarding in 30 days","SMART 90-day goals"],
    sigs:{eng:-19,app:-10,comp:-7,sent:-0.27},
  },
  {
    id:"PS-2178", name:"Ananya Sharma", role:"Onboarding Specialist",
    team:"Onboarding", score:74, delta:8, lvl:"HIGH", tenure:"1.2y",
    mgr:"Aryan Bose", joined:"May 2025",
    trend:[42,45,48,51,54,57,60,63,66,69,72,74].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Recognition gap",       v:29, n:"No award in 8 months"},
      {l:"Comp 11% below market", v:21, n:"₹10.8L median vs ₹9.6L actual"},
      {l:"PTO 17 days unused",    v:14, n:"Burnout precursor signal"},
      {l:"Stagnation 14 months",  v:8,  n:"No role progression in 14 months"},
    ],
    actions:["Spot award nomination Q2","Comp review — close 11% gap","1:1 career mapping"],
    sigs:{eng:-18,app:-14,comp:-11,sent:-0.32},
  },
  {
    id:"PS-1914", name:"Pooja Krishnan", role:"Onboarding Manager",
    team:"Onboarding", score:80, delta:11, lvl:"HIGH", tenure:"2.4y",
    mgr:"Aryan Bose", joined:"Feb 2024",
    trend:[48,52,56,59,62,65,68,71,74,76,78,80].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Burnout signals elevated",    v:32, n:"7 consecutive high-stress weeks"},
      {l:"No comp review in 18 months", v:25, n:"Inflation-adjusted real cut: -9%"},
      {l:"Caseload 2× avg",             v:20, n:"78 merchants vs avg 40"},
      {l:"Negative 1:1 sentiment",      v:11, n:"Bandwidth, recognition, growth"},
    ],
    actions:["Mandatory 5 PTO in 30 days","Comp review by EOQ","Redistribute 35 accounts"],
    sigs:{eng:-26,app:-18,comp:-15,sent:-0.42},
  },
  {
    id:"PS-2067", name:"Rohan Mehta", role:"Tech Support Analyst",
    team:"Tech Support", score:71, delta:5, lvl:"HIGH", tenure:"0.9y",
    mgr:"Vikash Nair", joined:"Sep 2025",
    trend:[36,39,42,45,48,52,55,58,61,64,67,71].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Manager friction signals",  v:27, n:"2 escalation incidents in 45 days"},
      {l:"Onboarding 38% incomplete", v:19, n:"Peer avg 88% at 9 months"},
      {l:"Low pulse score",           v:14, n:"4.3/10 vs org 6.2"},
    ],
    actions:["Manager-HR mediation in 7 days","Complete onboarding in 21 days","Pulse follow-up"],
    sigs:{eng:-22,app:-11,comp:-8,sent:-0.30},
  },
  {
    id:"PS-2134", name:"Tanvi Desai", role:"Marketing Analyst",
    team:"Marketing", score:77, delta:7, lvl:"HIGH", tenure:"1.8y",
    mgr:"Sneha Patel", joined:"Sep 2024",
    trend:[46,49,52,55,59,62,65,68,71,73,75,77].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Appraisal dropped 2 cycles", v:30, n:"7.9→7.1→6.4"},
      {l:"Stagnation 16 months",       v:24, n:"Peers promoted at 11-month median"},
      {l:"Comp 13% below market",      v:18, n:"No increment this cycle"},
      {l:"Slack activity down 28%",    v:8,  n:"vs 90-day baseline"},
    ],
    actions:["Promotion discussion by EOW","Fast-track Q3 increment","SprintPG ownership"],
    sigs:{eng:-28,app:-22,comp:-13,sent:-0.40},
  },
  {
    id:"PS-1778", name:"Nikhil Jain", role:"Senior Strategy Analyst",
    team:"Strategy", score:85, delta:12, lvl:"HIGH", tenure:"3.1y",
    mgr:"Rohan Bhat", joined:"May 2023",
    trend:[55,58,62,65,68,72,75,78,80,82,84,85].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Promotion denied ×2",    v:34, n:"Applied Feb & Sep 2024 — both deferred"},
      {l:"Comp 20% below market",  v:28, n:"₹17L median vs ₹13.6L actual"},
      {l:"Negative peer feedback", v:16, n:"Perceived equity gap with juniors"},
      {l:"Declining engagement",   v:9,  n:"Meeting participation down 35%"},
    ],
    actions:["Immediate promotion fast-track","Comp to ₹16L minimum","Skip-level with VP Strategy"],
    sigs:{eng:-32,app:-25,comp:-20,sent:-0.52},
  },

  // ─── MEDIUM RISK · Additional ────────────────────────────────────────────────
  {
    id:"PS-2099", name:"Varun Singh", role:"Operations Analyst",
    team:"Operations", score:58, delta:4, lvl:"MEDIUM", tenure:"1.1y",
    mgr:"Pooja Rao", joined:"May 2025",
    trend:[44,45,46,47,48,49,50,52,54,55,57,58].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Appraisal overdue 5 wks", v:23, n:"Policy: 2 weeks max"},
      {l:"Below-avg pulse score",   v:16, n:"5.1/10 vs org 6.2"},
    ],
    actions:["Complete appraisal in 48h","Set SMART 90-day goals"],
    sigs:{eng:-12,app:-8,comp:-4,sent:-0.18},
  },
  {
    id:"PS-1998", name:"Kritika Patel", role:"Operations Executive",
    team:"Operations", score:61, delta:-2, lvl:"MEDIUM", tenure:"2.2y",
    mgr:"Pooja Rao", joined:"Apr 2024",
    trend:[68,66,64,63,62,63,62,62,61,61,61,61].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Slight appraisal dip",     v:19, n:"7.8→7.4 — single cycle"},
      {l:"Low growth clarity score", v:13, n:"No defined career path doc"},
    ],
    actions:["Career path discussion in Q3","Growth plan documentation"],
    sigs:{eng:-8,app:-6,comp:-2,sent:-0.14},
  },
  {
    id:"PS-1867", name:"Deepak Rao", role:"Senior Operations Executive",
    team:"Operations", score:55, delta:3, lvl:"MEDIUM", tenure:"1.6y",
    mgr:"Pooja Rao", joined:"Oct 2024",
    trend:[42,43,44,46,47,48,50,51,52,53,54,55].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"No recognition in 7 months", v:21, n:"Below team median recognition rate"},
      {l:"Stakeholder sat below avg",  v:14, n:"5.8/10 vs team 7.1"},
    ],
    actions:["Spot award Q2 consideration","Assign stakeholder-lead project"],
    sigs:{eng:-10,app:-9,comp:-3,sent:-0.16},
  },
  {
    id:"PS-1901", name:"Karan Shah", role:"Onboarding Coordinator",
    team:"Onboarding", score:62, delta:5, lvl:"MEDIUM", tenure:"0.8y",
    mgr:"Aryan Bose", joined:"Oct 2025",
    trend:[45,47,48,50,51,52,54,55,56,58,60,62].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Onboarding 45% incomplete", v:20, n:"Peer avg 92% at 6 months"},
      {l:"No mentor assigned",        v:15, n:"Only 23% coordinators lack one"},
    ],
    actions:["Assign senior mentor this week","Complete onboarding by end of cycle"],
    sigs:{eng:-11,app:-7,comp:-3,sent:-0.20},
  },
  {
    id:"PS-1934", name:"Sruthi Menon", role:"Onboarding Specialist",
    team:"Onboarding", score:57, delta:-3, lvl:"MEDIUM", tenure:"2.0y",
    mgr:"Aryan Bose", joined:"Jun 2024",
    trend:[64,63,61,60,59,59,58,57,57,57,57,57].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Appraisal overdue 4 wks", v:22, n:"Policy: 2 weeks max"},
      {l:"Peer promoted ahead",     v:16, n:"1 junior promoted in 18 months"},
    ],
    actions:["Complete appraisal within 48h","Discuss promotion timeline"],
    sigs:{eng:-7,app:-12,comp:-2,sent:-0.15},
  },
  {
    id:"PS-2112", name:"Ayesha Khan", role:"Onboarding Executive",
    team:"Onboarding", score:60, delta:2, lvl:"MEDIUM", tenure:"1.3y",
    mgr:"Aryan Bose", joined:"Feb 2025",
    trend:[50,51,52,53,54,55,56,57,58,59,60,60].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Below-peer NPS contribution", v:18, n:"6.2 vs team avg 7.4"},
      {l:"No growth plan",              v:12, n:"13 months in — no SMART goals"},
    ],
    actions:["Set SMART goals by EOW","NPS coaching session Q2"],
    sigs:{eng:-9,app:-6,comp:-1,sent:-0.12},
  },
  {
    id:"PS-1956", name:"Prakash Iyer", role:"Tech Support Analyst",
    team:"Tech Support", score:63, delta:1, lvl:"MEDIUM", tenure:"1.9y",
    mgr:"Vikash Nair", joined:"Jul 2024",
    trend:[58,58,59,59,60,60,61,62,62,62,63,63].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"SLA 12% below team avg", v:20, n:"88.4% vs team 98%+ target"},
      {l:"Low CSAT score",         v:15, n:"6.1/10 vs team 7.8"},
    ],
    actions:["SLA coaching programme","Buddy pairing with high performer"],
    sigs:{eng:-6,app:-5,comp:-1,sent:-0.10},
  },
  {
    id:"PS-2145", name:"Madhuri Bose", role:"Tech Support Executive",
    team:"Tech Support", score:56, delta:-4, lvl:"MEDIUM", tenure:"1.4y",
    mgr:"Vikash Nair", joined:"Jan 2025",
    trend:[64,63,62,61,60,59,58,57,57,56,56,56].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Declining CSAT 3 cycles", v:25, n:"7.9→7.1→6.3 — rater consistent"},
      {l:"Escalation rate rising",  v:18, n:"14% vs team avg 6%"},
    ],
    actions:["Performance support plan 30-day","Escalation root-cause audit"],
    sigs:{eng:-10,app:-14,comp:-3,sent:-0.22},
  },
  {
    id:"PS-1756", name:"Neha Joshi", role:"Marketing Specialist",
    team:"Marketing", score:59, delta:2, lvl:"MEDIUM", tenure:"2.1y",
    mgr:"Sneha Patel", joined:"Mar 2024",
    trend:[50,51,52,53,54,55,56,57,57,58,59,59].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Brand engagement below avg", v:17, n:"6.4 vs team 7.5"},
      {l:"Career clarity gap",         v:13, n:"No growth doc in 21 months"},
    ],
    actions:["Career discussion in July review","Brand ownership pilot Q3"],
    sigs:{eng:-8,app:-7,comp:-2,sent:-0.13},
  },
  {
    id:"PS-2088", name:"Rohan Pillai", role:"Strategy Analyst",
    team:"Strategy", score:52, delta:3, lvl:"MEDIUM", tenure:"0.9y",
    mgr:"Rohan Bhat", joined:"Aug 2025",
    trend:[40,41,43,44,45,46,47,48,49,50,51,52].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Appraisal 3 weeks overdue",  v:24, n:"Policy: 2 weeks max"},
      {l:"Below-peer research output", v:16, n:"Peer at 8.2 vs 6.8 raw"},
    ],
    actions:["Complete appraisal 48h","Research quality mentorship"],
    sigs:{eng:-9,app:-10,comp:-2,sent:-0.17},
  },

  // ─── LOW RISK · Additional ───────────────────────────────────────────────────
  {
    id:"PS-1723", name:"Sunita Kumar", role:"Operations Coordinator",
    team:"Operations", score:28, delta:1, lvl:"LOW", tenure:"5.2y",
    mgr:"Pooja Rao", joined:"Mar 2021",
    trend:[27,27,27,27,28,28,28,28,28,28,28,28].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Strong tenure (protective)",        v:-20, n:"5+ yrs above median"},
      {l:"Consistent appraisal (protective)", v:-14, n:"8.2 avg 5 cycles"},
      {l:"High team integration",             v:-8,  n:"Top 5% collaboration score"},
    ],
    actions:["Standard Q3 check-in","Nominate for Team Lead shadow programme"],
    sigs:{eng:18,app:6,comp:1,sent:0.38},
  },
  {
    id:"PS-1634", name:"Rajesh Pillai", role:"Senior Operations Manager",
    team:"Operations", score:24, delta:-1, lvl:"LOW", tenure:"6.8y",
    mgr:"Pooja Rao", joined:"Aug 2019",
    trend:[25,25,24,24,24,24,24,24,24,24,24,24].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Highest tenure on team (protective)", v:-24, n:"6.8y — institutional anchor"},
      {l:"Exceptional appraisal (protective)",  v:-16, n:"9.1 avg last 4 cycles"},
    ],
    actions:["Include in succession planning","Nominate for senior mentorship circle"],
    sigs:{eng:22,app:10,comp:3,sent:0.45},
  },
  {
    id:"PS-2003", name:"Vivek Chatterjee", role:"Operations Executive",
    team:"Operations", score:31, delta:2, lvl:"LOW", tenure:"1.5y",
    mgr:"Pooja Rao", joined:"Jan 2025",
    trend:[28,29,29,30,30,30,31,31,31,31,31,31].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"High engagement (protective)", v:-16, n:"8.4/10 pulse"},
      {l:"Strong SLA record",            v:-9,  n:"96.2% SLA adherence"},
    ],
    actions:["Nominate Q3 Spot Award","Flag for early Team Lead pipeline"],
    sigs:{eng:16,app:5,comp:1,sent:0.35},
  },
  {
    id:"PS-1789", name:"Karthik Nair", role:"Onboarding Manager",
    team:"Onboarding", score:26, delta:0, lvl:"LOW", tenure:"4.3y",
    mgr:"Aryan Bose", joined:"Jan 2022",
    trend:[26,26,26,26,26,26,26,26,26,26,26,26].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Long tenure (protective)",      v:-19, n:"4+ yrs above median"},
      {l:"Stable appraisal (protective)", v:-13, n:"8.0 avg 4 cycles"},
    ],
    actions:["Standard quarterly check-in","Mentorship nomination"],
    sigs:{eng:14,app:4,comp:0,sent:0.30},
  },
  {
    id:"PS-1892", name:"Sneha Iyer", role:"Onboarding Specialist",
    team:"Onboarding", score:22, delta:1, lvl:"LOW", tenure:"3.1y",
    mgr:"Aryan Bose", joined:"May 2023",
    trend:[21,21,21,21,22,22,22,22,22,22,22,22].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Top NPS contributor (protective)", v:-17, n:"9.1/10 NPS score — team highest"},
      {l:"High recognition score",          v:-10, n:"Q1 Spot Award winner"},
    ],
    actions:["Nominate for Onboarding Excellence Award","Fast-track mentor role"],
    sigs:{eng:19,app:7,comp:2,sent:0.40},
  },
  {
    id:"PS-2056", name:"Harini Menon", role:"Onboarding Executive",
    team:"Onboarding", score:35, delta:2, lvl:"LOW", tenure:"1.2y",
    mgr:"Aryan Bose", joined:"Feb 2025",
    trend:[31,32,32,33,33,34,34,34,35,35,35,35].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"High engagement (protective)", v:-13, n:"8.1/10 pulse score"},
      {l:"Fast onboarding completion",   v:-9,  n:"Completed 95% in 3 months"},
    ],
    actions:["Standard check-in Q3","Consider for mentor buddy programme"],
    sigs:{eng:13,app:4,comp:1,sent:0.28},
  },
  {
    id:"PS-1667", name:"Anand Singh", role:"Tech Support Senior",
    team:"Tech Support", score:29, delta:0, lvl:"LOW", tenure:"5.5y",
    mgr:"Vikash Nair", joined:"Nov 2020",
    trend:[29,29,29,29,29,29,29,29,29,29,29,29].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Long tenure (protective)",     v:-22, n:"5.5y — team knowledge anchor"},
      {l:"Exceptional SLA (protective)", v:-14, n:"99.1% 24-month avg"},
      {l:"Top recognition (protective)", v:-8,  n:"3 Spot Awards in 24 months"},
    ],
    actions:["Include in Leadership Readiness Programme","Succession planning candidate"],
    sigs:{eng:25,app:9,comp:2,sent:0.48},
  },
  {
    id:"PS-1821", name:"Suresh Babu", role:"Tech Support Executive",
    team:"Tech Support", score:33, delta:1, lvl:"LOW", tenure:"2.9y",
    mgr:"Vikash Nair", joined:"Jul 2023",
    trend:[31,31,32,32,32,32,33,33,33,33,33,33].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Consistent SLA (protective)", v:-15, n:"97.8% adherence 6 cycles"},
      {l:"Good CSAT (protective)",      v:-10, n:"8.2/10 CSAT score"},
    ],
    actions:["Nominate Q4 Team Lead","Standard check-in"],
    sigs:{eng:15,app:5,comp:1,sent:0.33},
  },
  {
    id:"PS-1712", name:"Rohit Kapoor", role:"Marketing Manager",
    team:"Marketing", score:27, delta:-1, lvl:"LOW", tenure:"4.7y",
    mgr:"Sneha Patel", joined:"Jul 2021",
    trend:[28,28,27,27,27,27,27,27,27,27,27,27].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"Long tenure (protective)",     v:-18, n:"4.7y above median"},
      {l:"Strong campaign track record", v:-13, n:"8.6 avg appraisal 4 cycles"},
    ],
    actions:["Standard check-in","Mentorship nomination"],
    sigs:{eng:16,app:6,comp:1,sent:0.34},
  },
  {
    id:"PS-2166", name:"Pallavi Sharma", role:"Brand Executive",
    team:"Marketing", score:31, delta:0, lvl:"LOW", tenure:"3.3y",
    mgr:"Sneha Patel", joined:"Jan 2023",
    trend:[30,30,31,31,31,31,31,31,31,31,31,31].map((v,i)=>({w:`W${i+1}`,v})),
    shap:[
      {l:"High engagement (protective)", v:-14, n:"8.8/10 pulse score"},
      {l:"Brand award winner",           v:-10, n:"Q4 Brand Champion recognition"},
    ],
    actions:["Consider for Senior Brand Executive promotion","Standard Q3 check-in"],
    sigs:{eng:18,app:7,comp:2,sent:0.39},
  },
];

// apply jitter once at load
EMPS.forEach(e => {
  const raw = jitter(e.score, 8);
  e.score = e.lvl==="HIGH" ? clamp(raw,70,95) : e.lvl==="MEDIUM" ? clamp(raw,45,68) : clamp(raw,12,39);
  e.delta = jitter(e.delta, 3);
  e.shap  = e.shap.map(s => ({ ...s, v: s.v < 0 ? clamp(jitter(s.v,3),-30,-4) : clamp(jitter(s.v,3),3,40) }));
  e.sigs  = { eng:jitter(e.sigs.eng,5), app:jitter(e.sigs.app,3), comp:jitter(e.sigs.comp,2), sent:jitterF(e.sigs.sent,0.06) };
  e.trend = e.trend.map((p,i) => i === e.trend.length-1 ? { ...p, v:e.score } : { ...p, v:clamp(jitter(p.v,4),5,100) });
});

const PERF_EMPLOYEES = [
  {
    id:"PS-2041", name:"Priya Nair", team:"Onboarding", role:"Senior Onboarding Manager", ctc:15.1,
    rawScore:7.4, zScore:8.1, mgrZScore:7.9, deptZScore:8.3,
    cycles:["8.1","8.0","7.4"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:6.2,z:7.8},{k:"Doc Accuracy",raw:8.1,z:8.3},{k:"NPS Contribution",raw:7.9,z:8.6},{k:"Cross-team",raw:6.8,z:7.5}],
    qualThemes:["Capacity","Burnout","Growth"], qualSent:"Negative",
    feedback:"Consistent delivery above SLA. Caseload saturation and unresolved comp grievances are impacting discretionary effort.",
    action:"Redistribute caseload. Initiate comp review. Assign SprintVerify lead for career visibility.",
    trend:[7.9,8.0,8.2,8.0,7.8,7.6,7.4], biasFlag:true, raterLeniency:-0.8,
    hrInput:{ culturalFit:8, engagement:5, behaviour:7, tone:6, counsellingNeeded:true, hrNote:"High performer under strain. Counselling recommended — not PIP. Culture-add." },
    mgrReviews:[
      { date:"May 2025", sentiment:"Negative", note:"Priya raised caseload concerns again. Managing 87 merchants alone. Energy clearly lower." },
      { date:"Mar 2025", sentiment:"Neutral",  note:"Strong delivery on SprintOpen migration. Comp discussion unresolved — frustrated." },
      { date:"Jan 2025", sentiment:"Positive", note:"Exceptional Q4. Led merchant onboarding for 3 enterprise accounts simultaneously." },
    ],
  },
  {
    id:"PS-1834", name:"Rahul Kapoor", team:"Marketing", role:"Marketing Lead", ctc:12.4,
    rawScore:6.3, zScore:7.2, mgrZScore:7.5, deptZScore:7.8,
    cycles:["8.1","7.2","6.3"], mgr:"Sneha Patel",
    kpis:[{k:"Campaign ROI",raw:7.8,z:8.4},{k:"Lead Quality",raw:8.2,z:8.7},{k:"Brand Engagement",raw:7.1,z:7.9},{k:"Content Output",raw:7.4,z:8.1}],
    qualThemes:["Stagnation","Recognition","Compensation"], qualSent:"Negative",
    feedback:"Output metrics top quartile. Declining raw scores reflect rater drift — not performance degradation.",
    action:"Z-score confirms high performer. Raw decline is rater bias. Initiate promotion discussion immediately.",
    trend:[7.2,7.5,7.8,8.1,7.8,7.2,6.3], biasFlag:true, raterLeniency:-1.2,
    hrInput:{ culturalFit:9, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Excellent cultural fit. Disengagement is systemic response to unfairness — not behavioural." },
    mgrReviews:[
      { date:"May 2025", sentiment:"Neutral",  note:"SprintPG campaign delivered ahead of schedule. Strong metrics. Seems distracted." },
      { date:"Feb 2025", sentiment:"Positive", note:"Campaign ROI exceeded target by 22%. Strongest performer on the team." },
      { date:"Nov 2024", sentiment:"Positive", note:"Good quarter. Cross-functional communication improved significantly." },
    ],
  },
  {
    id:"PS-1677", name:"Sanya Malhotra", team:"Tech Support", role:"Tech Support Lead", ctc:14.2,
    rawScore:6.8, zScore:7.4, mgrZScore:7.1, deptZScore:7.6,
    cycles:["7.8","7.2","6.8"], mgr:"Vikash Nair",
    kpis:[{k:"SLA Adherence",raw:5.9,z:6.8},{k:"CSAT Score",raw:7.2,z:7.9},{k:"Escalation Rate",raw:6.1,z:7.0},{k:"Knowledge Transfer",raw:8.0,z:8.5}],
    qualThemes:["Manager Conflict","Burnout","Role Ambiguity"], qualSent:"Negative",
    feedback:"SLA below average but caseload is highest on team. Knowledge transfer score is exceptional.",
    action:"HR BP intervention needed. Context-adjust KPI targets. Revisit lateral transfer.",
    trend:[7.8,7.6,7.4,7.2,7.0,6.9,6.8], biasFlag:false, raterLeniency:0.1,
    hrInput:{ culturalFit:7, engagement:4, behaviour:6, tone:5, counsellingNeeded:true, hrNote:"Urgent counselling recommended. Tone in last two check-ins was noticeably defensive." },
    mgrReviews:[
      { date:"May 2025", sentiment:"Negative", note:"Difficult month. Two escalations reached me. Tense conversation about SLA targets." },
      { date:"Mar 2025", sentiment:"Neutral",  note:"Knowledge transfer documentation outstanding. SLA still a concern." },
      { date:"Jan 2025", sentiment:"Negative", note:"Sanya's lateral transfer denied due to headcount freeze. Performance dipped since." },
    ],
  },
  {
    id:"PS-2109", name:"Arjun Nair", team:"Operations", role:"Operations Analyst", ctc:8.4,
    rawScore:5.8, zScore:6.4, mgrZScore:6.2, deptZScore:6.6,
    cycles:["6.2","5.9","5.8"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:6.1,z:6.8},{k:"Reporting",raw:5.9,z:6.5},{k:"Stakeholder Sat",raw:5.5,z:6.2},{k:"Initiative",raw:5.8,z:6.4}],
    qualThemes:["Onboarding Gap","Mentorship","Goal Clarity"], qualSent:"Neutral",
    feedback:"8 months in with 40% onboarding incomplete. Tracking below peer cohort. Absence of growth plan is proximate cause.",
    action:"Assign mentor by EOW. Complete onboarding in 30 days. Set SMART 90-day goals.",
    trend:[6.2,6.1,6.0,5.9,5.9,5.8,5.8], biasFlag:false, raterLeniency:0.3,
    hrInput:{ culturalFit:7, engagement:5, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Positive attitude, good alignment. Gap is structural — onboarding failure, not behavioural." },
    mgrReviews:[
      { date:"May 2025", sentiment:"Neutral", note:"Arjun is trying hard but the lack of onboarding structure is showing." },
      { date:"Mar 2025", sentiment:"Neutral", note:"Process accuracy improving month on month. No behavioural red flags." },
    ],
  },
  {
    id:"PS-1523", name:"Divya Menon", team:"Strategy", role:"Strategy Analyst", ctc:13.8,
    rawScore:7.1, zScore:7.9, mgrZScore:8.1, deptZScore:8.2,
    cycles:["7.8","7.5","7.1"], mgr:"Rohan Bhat",
    kpis:[{k:"Research Quality",raw:8.2,z:8.8},{k:"Deck Output",raw:7.4,z:8.1},{k:"Stakeholder Mgmt",raw:6.9,z:7.6},{k:"Strategic Thinking",raw:7.8,z:8.5}],
    qualThemes:["Appraisal Delay","Promotion Fairness","Equity"], qualSent:"Negative",
    feedback:"Strong output across KPIs. Overdue appraisal has damaged trust disproportionately.",
    action:"Complete appraisal within 48h. Brief on promotion criteria. Document and communicate formally.",
    trend:[7.4,7.6,7.8,7.7,7.5,7.2,7.1], biasFlag:false, raterLeniency:-0.2,
    hrInput:{ culturalFit:9, engagement:7, behaviour:9, tone:8, counsellingNeeded:false, hrNote:"Excellent cultural contributor. The delayed appraisal is a process failure — not a Divya issue." },
    mgrReviews:[
      { date:"May 2025", sentiment:"Neutral",  note:"Divya flagged the appraisal delay professionally. Her output this quarter has been excellent." },
      { date:"Feb 2025", sentiment:"Positive", note:"Delivered competitive landscape analysis that shaped SprintOpen pricing strategy." },
    ],
  },
  {
    id:"PS-1342", name:"Meera Iyer", team:"Operations", role:"Operations Manager", ctc:18.6,
    rawScore:8.4, zScore:8.6, mgrZScore:8.7, deptZScore:8.8,
    cycles:["8.2","8.4","8.4"], mgr:"Pooja Rao",
    kpis:[{k:"Team KPI Achievement",raw:8.8,z:9.0},{k:"Process Efficiency",raw:8.3,z:8.5},{k:"Manager Effectiveness",raw:8.1,z:8.4},{k:"Mentor Contribution",raw:8.4,z:8.7}],
    qualThemes:["Stability","Institutional Knowledge","Leadership"], qualSent:"Positive",
    feedback:"Consistent high performer. 4+ years institutional anchor. Low attrition risk, high succession potential.",
    action:"Nominate for mentorship programme. Include in succession planning. Recognition award Q3.",
    trend:[8.0,8.1,8.2,8.2,8.4,8.4,8.4], biasFlag:false, raterLeniency:0.2,
    hrInput:{ culturalFit:10, engagement:9, behaviour:10, tone:9, counsellingNeeded:false, hrNote:"Exemplary cultural carrier. Leadership potential is clear. Fast-track to Senior Manager." },
    mgrReviews:[
      { date:"May 2025", sentiment:"Positive", note:"Meera held the Operations team together during the SprintPG crunch. Exceptional." },
      { date:"Feb 2025", sentiment:"Positive", note:"Onboarded 3 new analysts while maintaining her own KPIs. Asking for more — give it." },
      { date:"Nov 2024", sentiment:"Positive", note:"Flagged a process inefficiency saving the team ~6 hours/week. Implemented herself." },
    ],
  },
  {
    id:"PS-2201", name:"Aditya Verma", team:"Tech Support", role:"Tech Support Executive", ctc:10.2,
    rawScore:8.7, zScore:8.9, mgrZScore:8.8, deptZScore:9.0,
    cycles:["8.3","8.6","8.7"], mgr:"Vikash Nair",
    kpis:[{k:"SLA Compliance",raw:9.2,z:9.4},{k:"CSAT Score",raw:8.8,z:9.0},{k:"First Call Res",raw:8.5,z:8.8},{k:"Escalation Prev",raw:8.4,z:8.7}],
    qualThemes:["High Engagement","Growth Orientation","Collaboration"], qualSent:"Positive",
    feedback:"Top of peer cohort 16 months in. 98.4% SLA. Proactively flags issues before escalation.",
    action:"Flag as Team Lead Q4. Nominate Q3 Spot Award. Initiate Team Lead readiness plan.",
    trend:[7.8,8.0,8.2,8.4,8.5,8.6,8.7], biasFlag:false, raterLeniency:0.1,
    hrInput:{ culturalFit:9, engagement:10, behaviour:9, tone:9, counsellingNeeded:false, hrNote:"Outstanding contributor. Emotionally mature. Ready for leadership responsibility." },
    mgrReviews:[
      { date:"May 2025", sentiment:"Positive", note:"Aditya identified a recurring issue pattern across 3 merchants before it became a P1." },
      { date:"Feb 2025", sentiment:"Positive", note:"Top performer. SLA 98.4%, CSAT highest in team. Formally recommended for Team Lead." },
    ],
  },

  // ─── HIGH RISK · Additional ─────────────────────────────────────────────────
  {
    id:"PS-1845", name:"Ritu Agarwal", team:"Operations", role:"Operations Lead", ctc:13.8,
    rawScore:7.2, zScore:7.9, mgrZScore:7.6, deptZScore:8.0,
    cycles:["7.8","7.5","7.2"], mgr:"Pooja Rao",
    kpis:[{k:"Process Efficiency",raw:7.4,z:8.0},{k:"Team Coordination",raw:7.8,z:8.3},{k:"SLA Oversight",raw:6.9,z:7.6},{k:"Stakeholder Sat",raw:7.1,z:7.8}],
    qualThemes:["Manager Conflict","Burnout","Lateral Mobility"], qualSent:"Negative",
    feedback:"Strong team lead metrics. Manager conflict and denied transfers are active retention risks.",
    action:"HR BP mediation. Reopen lateral transfer. Comp review to ₹14L minimum.",
    trend:[7.8,7.7,7.6,7.5,7.4,7.3,7.2], biasFlag:true, raterLeniency:-0.6,
    hrInput:{culturalFit:8, engagement:5, behaviour:7, tone:6, counsellingNeeded:true, hrNote:"Genuine performance driver. Conflict with manager is interpersonal, not behavioural. Needs mediation, not PIP."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Negative", note:"Ritu flagged the denied transfer again. Tension is visible. High performer but strained."},
      {date:"Feb 2025", sentiment:"Neutral",  note:"Good delivery on Q1 process audit. Caseload remains elevated — needs redistribution."},
    ],
  },
  {
    id:"PS-2156", name:"Kavya Reddy", team:"Operations", role:"Senior Operations Analyst", ctc:12.1,
    rawScore:7.0, zScore:7.7, mgrZScore:7.5, deptZScore:7.9,
    cycles:["7.5","7.3","7.0"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:7.2,z:7.9},{k:"Reporting",raw:7.8,z:8.4},{k:"Initiative",raw:6.8,z:7.5},{k:"Cross-team",raw:6.9,z:7.6}],
    qualThemes:["Compensation","Promotion Fairness","Burnout"], qualSent:"Negative",
    feedback:"Consistent high-quality output. Compensation gap and no promotion in 3 years are primary risk drivers.",
    action:"Promote to Lead by Q3. Comp adjustment. Redistribute caseload.",
    trend:[7.5,7.4,7.3,7.2,7.1,7.0,7.0], biasFlag:false, raterLeniency:0.2,
    hrInput:{culturalFit:8, engagement:5, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"No behavioural concerns. Attrition risk is systemic: comp + promotion stagnation. Fix structurally."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral",  note:"Kavya mentioned she'd been approached by another firm. High deliverables but clearly weighing options."},
      {date:"Feb 2025", sentiment:"Positive", note:"Led Q4 process efficiency audit. Saved 4 hrs/week across 3 workflows. Excellent initiative."},
    ],
  },
  {
    id:"PS-1972", name:"Siddharth Kumar", team:"Operations", role:"Operations Analyst", ctc:9.8,
    rawScore:6.8, zScore:7.5, mgrZScore:7.3, deptZScore:7.7,
    cycles:["7.1","7.0","6.8"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:6.9,z:7.6},{k:"Reporting",raw:7.1,z:7.8},{k:"Stakeholder Sat",raw:6.5,z:7.2},{k:"Initiative",raw:6.8,z:7.5}],
    qualThemes:["Stagnation","Recognition","Compensation"], qualSent:"Negative",
    feedback:"Output is above-median for tenure. Peer promotions and flat recognition have damaged engagement.",
    action:"Promotion discussion EOW. Q3 fast-track increment. Assign project ownership.",
    trend:[7.1,7.0,7.0,6.9,6.9,6.8,6.8], biasFlag:true, raterLeniency:-0.9,
    hrInput:{culturalFit:7, engagement:5, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Engagement dip is reactive — not a character issue. Correct the structural inequity and retention is recoverable."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral",  note:"Siddharth is disengaged. Peers were promoted and he wasn't — he's noticed."},
      {date:"Mar 2025", sentiment:"Positive", note:"Delivered clean Q4 reconciliation report. No errors. Good instincts."},
    ],
  },
  {
    id:"PS-2247", name:"Ishaan Gupta", team:"Operations", role:"Operations Executive", ctc:7.2,
    rawScore:5.9, zScore:6.6, mgrZScore:6.4, deptZScore:6.8,
    cycles:["6.1","6.0","5.9"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:5.8,z:6.5},{k:"Reporting",raw:6.2,z:6.9},{k:"Stakeholder Sat",raw:5.7,z:6.4},{k:"Initiative",raw:5.8,z:6.5}],
    qualThemes:["Onboarding Gap","No Mentor","Growth Clarity"], qualSent:"Neutral",
    feedback:"7 months in with onboarding incomplete. Gap is structural, not behavioural. Absence of mentor is proximate cause.",
    action:"Assign senior mentor immediately. Complete onboarding in 30 days. SMART 90-day goals.",
    trend:[6.1,6.0,6.0,5.9,5.9,5.9,5.9], biasFlag:false, raterLeniency:0.2,
    hrInput:{culturalFit:7, engagement:5, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Positive attitude. Good cultural fit. Structural onboarding gap — not a risk to address punitively."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral", note:"Ishaan is enthusiastic but lacks structural support. Onboarding is clearly incomplete."},
      {date:"Mar 2025", sentiment:"Neutral", note:"No major issues. Needs clearer goals — I haven't set them yet. On me."},
    ],
  },
  {
    id:"PS-2178", name:"Ananya Sharma", team:"Onboarding", role:"Onboarding Specialist", ctc:9.6,
    rawScore:6.7, zScore:7.4, mgrZScore:7.2, deptZScore:7.6,
    cycles:["7.2","7.0","6.7"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:7.1,z:7.8},{k:"Doc Accuracy",raw:6.9,z:7.6},{k:"NPS Contribution",raw:6.8,z:7.5},{k:"Cross-team",raw:6.4,z:7.1}],
    qualThemes:["Recognition","Compensation","Burnout"], qualSent:"Negative",
    feedback:"Strong 1-year performance. PTO accumulation and comp gap are early burnout indicators.",
    action:"Spot award Q2. Comp review. 1:1 career mapping session.",
    trend:[7.2,7.1,7.0,6.9,6.8,6.7,6.7], biasFlag:false, raterLeniency:0.1,
    hrInput:{culturalFit:8, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Good cultural contributor. Recognition gap is a structural failure. Award + comp review should stabilise."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral",  note:"Ananya flagged that she hasn't been recognized in 8 months. Accurate — I'll raise it with HR."},
      {date:"Mar 2025", sentiment:"Positive", note:"Outstanding Q4 merchant NPS. 3 enterprise accounts onboarded cleanly."},
    ],
  },
  {
    id:"PS-1914", name:"Pooja Krishnan", team:"Onboarding", role:"Onboarding Manager", ctc:14.0,
    rawScore:7.1, zScore:7.8, mgrZScore:7.6, deptZScore:8.0,
    cycles:["7.7","7.4","7.1"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:7.4,z:8.0},{k:"Doc Accuracy",raw:7.8,z:8.4},{k:"Team Mgmt",raw:6.9,z:7.6},{k:"NPS",raw:7.1,z:7.8}],
    qualThemes:["Burnout","Compensation","Caseload"], qualSent:"Negative",
    feedback:"7-consecutive-week stress pattern. Caseload 2× avg. Comp gap compounding burnout.",
    action:"Mandatory PTO. Comp review by EOQ. Redistribute 35 accounts.",
    trend:[7.7,7.5,7.4,7.3,7.2,7.1,7.1], biasFlag:false, raterLeniency:-0.3,
    hrInput:{culturalFit:9, engagement:5, behaviour:8, tone:6, counsellingNeeded:true, hrNote:"Strong manager. Burnout is from structural caseload, not capability failure. Counselling + systemic fix — not PIP."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Negative", note:"Pooja said she's running on empty. Caseload redistribution needed urgently."},
      {date:"Feb 2025", sentiment:"Positive", note:"Led SprintOpen merchant migration smoothly. Strong leadership under pressure."},
    ],
  },
  {
    id:"PS-2067", name:"Rohan Mehta", team:"Tech Support", role:"Tech Support Analyst", ctc:8.8,
    rawScore:5.8, zScore:6.5, mgrZScore:6.3, deptZScore:6.7,
    cycles:["6.2","6.0","5.8"], mgr:"Vikash Nair",
    kpis:[{k:"SLA Adherence",raw:6.0,z:6.8},{k:"CSAT Score",raw:5.9,z:6.7},{k:"First Call Res",raw:5.8,z:6.6},{k:"Escalation Rate",raw:5.5,z:6.3}],
    qualThemes:["Manager Conflict","Onboarding Gap","Low Engagement"], qualSent:"Negative",
    feedback:"Below-peer metrics in context of active manager friction. Onboarding gap is proximate cause.",
    action:"Manager-HR mediation. Complete onboarding in 21 days. Pulse re-check in 30 days.",
    trend:[6.2,6.1,6.0,5.9,5.9,5.8,5.8], biasFlag:true, raterLeniency:-0.7,
    hrInput:{culturalFit:6, engagement:4, behaviour:7, tone:5, counsellingNeeded:true, hrNote:"Manager relationship is the root issue. Onboarding failure secondary. Mediation before PIP."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Negative", note:"Two incidents with Rohan this month. I think we need HR to mediate."},
      {date:"Mar 2025", sentiment:"Neutral",  note:"Performance tracking below peer. Onboarding still not complete — I haven't prioritized it. Will fix."},
    ],
  },
  {
    id:"PS-2134", name:"Tanvi Desai", team:"Marketing", role:"Marketing Analyst", ctc:11.4,
    rawScore:6.4, zScore:7.2, mgrZScore:7.5, deptZScore:7.8,
    cycles:["7.9","7.1","6.4"], mgr:"Sneha Patel",
    kpis:[{k:"Campaign ROI",raw:7.6,z:8.2},{k:"Lead Quality",raw:7.4,z:8.0},{k:"Content Output",raw:6.8,z:7.5},{k:"Brand Engagement",raw:7.1,z:7.8}],
    qualThemes:["Stagnation","Compensation","Recognition"], qualSent:"Negative",
    feedback:"Output quality high. Raw score decline is rater drift — not performance degradation. Z-score confirms strong performer.",
    action:"Promotion discussion EOW. Q3 increment. SprintPG ownership assignment.",
    trend:[7.4,7.2,7.0,6.8,6.6,6.4,6.4], biasFlag:true, raterLeniency:-1.1,
    hrInput:{culturalFit:8, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Strong cultural fit. Decline is rater bias, not performance. Address promotion + comp systemically."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral",  note:"Tanvi delivered SprintPG content on time. She asked about promotions — again."},
      {date:"Feb 2025", sentiment:"Positive", note:"Campaign metrics top quartile. If we don't promote her, someone else will."},
    ],
  },
  {
    id:"PS-1778", name:"Nikhil Jain", team:"Strategy", role:"Senior Strategy Analyst", ctc:13.6,
    rawScore:7.3, zScore:8.1, mgrZScore:8.2, deptZScore:8.4,
    cycles:["7.9","7.6","7.3"], mgr:"Rohan Bhat",
    kpis:[{k:"Research Quality",raw:8.1,z:8.7},{k:"Deck Output",raw:7.6,z:8.2},{k:"Stakeholder Mgmt",raw:7.0,z:7.7},{k:"Strategic Thinking",raw:7.8,z:8.4}],
    qualThemes:["Promotion Fairness","Compensation","Equity"], qualSent:"Negative",
    feedback:"Top-quartile output. Two denied promotions with no rationale communicated. Active flight risk.",
    action:"Immediate promotion fast-track. Comp to ₹16L floor. Skip-level with VP Strategy.",
    trend:[7.9,7.7,7.5,7.4,7.3,7.3,7.3], biasFlag:false, raterLeniency:-0.4,
    hrInput:{culturalFit:9, engagement:5, behaviour:9, tone:7, counsellingNeeded:false, hrNote:"Outstanding contributor. Promotion denials without explanation are organisational failures. Corrective action needed immediately."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Negative", note:"Nikhil told me directly he's interviewing elsewhere. Third time asking about promotion. I have no answer for him."},
      {date:"Feb 2025", sentiment:"Positive", note:"Competitive analysis deck for SprintPG pricing was best work I've seen in this team."},
    ],
  },

  // ─── MEDIUM RISK · Additional ────────────────────────────────────────────────
  {
    id:"PS-2099", name:"Varun Singh", team:"Operations", role:"Operations Analyst", ctc:8.6,
    rawScore:6.1, zScore:6.8, mgrZScore:6.6, deptZScore:7.0,
    cycles:["6.3","6.2","6.1"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:6.4,z:7.1},{k:"Reporting",raw:6.1,z:6.8},{k:"Stakeholder Sat",raw:5.9,z:6.6},{k:"Initiative",raw:5.8,z:6.5}],
    qualThemes:["Appraisal Delay","Goal Clarity"], qualSent:"Neutral",
    feedback:"Solid early-tenure employee. Overdue appraisal is the primary signal to address.",
    action:"Complete appraisal in 48h. Set SMART 90-day goals.",
    trend:[6.3,6.3,6.2,6.2,6.1,6.1,6.1], biasFlag:false, raterLeniency:0.1,
    hrInput:{culturalFit:7, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Good attitude. No behavioural flags. Overdue appraisal is a process failure — not a Varun issue."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral", note:"Varun has been waiting for his appraisal for 5 weeks. I need to schedule this."},
      {date:"Mar 2025", sentiment:"Neutral", note:"Decent progress on process documentation. No standouts but no red flags."},
    ],
  },
  {
    id:"PS-1998", name:"Kritika Patel", team:"Operations", role:"Operations Executive", ctc:10.3,
    rawScore:7.4, zScore:8.0, mgrZScore:7.8, deptZScore:8.1,
    cycles:["7.8","7.6","7.4"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:7.8,z:8.3},{k:"Reporting",raw:7.4,z:8.0},{k:"Stakeholder Sat",raw:7.2,z:7.8},{k:"Initiative",raw:7.0,z:7.7}],
    qualThemes:["Career Path","Growth Clarity"], qualSent:"Neutral",
    feedback:"Consistent performer. Slight dip from one cycle — monitor next quarter. Career planning overdue.",
    action:"Career path discussion Q3. Growth plan documentation.",
    trend:[7.8,7.7,7.6,7.5,7.5,7.4,7.4], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:8, engagement:7, behaviour:8, tone:8, counsellingNeeded:false, hrNote:"Stable, positive contributor. No concerns. Career planning gap is manageable."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral",  note:"Kritika is doing well. No career discussion yet — my oversight."},
      {date:"Mar 2025", sentiment:"Positive", note:"Strong month. Proactively flagged a process bottleneck before it became a problem."},
    ],
  },
  {
    id:"PS-1867", name:"Deepak Rao", team:"Operations", role:"Senior Operations Executive", ctc:11.2,
    rawScore:6.5, zScore:7.2, mgrZScore:7.0, deptZScore:7.4,
    cycles:["6.7","6.6","6.5"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:6.8,z:7.4},{k:"Reporting",raw:6.6,z:7.3},{k:"Stakeholder Sat",raw:6.4,z:7.1},{k:"Team Contrib",raw:6.1,z:6.8}],
    qualThemes:["Recognition Gap","Stakeholder Relations"], qualSent:"Neutral",
    feedback:"Steady performer without recent recognition. Stakeholder satisfaction dip is isolated.",
    action:"Spot award Q2 consideration. Assign stakeholder-lead project for visibility.",
    trend:[6.7,6.7,6.6,6.6,6.5,6.5,6.5], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:7, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"No significant concerns. Recognition gap is manageable. Low flight risk at this stage."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral", note:"Deepak is reliable but not prominent. He'd benefit from a higher-visibility project."},
      {date:"Mar 2025", sentiment:"Neutral", note:"Decent quarter. Stakeholder satisfaction slightly below peer — working on it."},
    ],
  },
  {
    id:"PS-1901", name:"Karan Shah", team:"Onboarding", role:"Onboarding Coordinator", ctc:7.8,
    rawScore:5.8, zScore:6.5, mgrZScore:6.3, deptZScore:6.7,
    cycles:["6.0","5.9","5.8"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:5.9,z:6.6},{k:"Doc Accuracy",raw:6.1,z:6.8},{k:"NPS",raw:5.6,z:6.3},{k:"Cross-team",raw:5.5,z:6.2}],
    qualThemes:["Onboarding Gap","Mentorship","Goal Clarity"], qualSent:"Neutral",
    feedback:"8 months in with onboarding 45% complete. Tracking below peer cohort. No mentor assigned.",
    action:"Assign senior mentor this week. Complete onboarding by end of cycle.",
    trend:[6.0,5.9,5.9,5.9,5.8,5.8,5.8], biasFlag:false, raterLeniency:0.2,
    hrInput:{culturalFit:7, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Positive attitude. Structural gap — onboarding failure. Not a performance issue."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral", note:"Karan needs a mentor. I haven't assigned one — will do this week."},
      {date:"Mar 2025", sentiment:"Neutral", note:"Below-peer tracking but attitude is good. Structure is the gap."},
    ],
  },
  {
    id:"PS-1934", name:"Sruthi Menon", team:"Onboarding", role:"Onboarding Specialist", ctc:10.8,
    rawScore:7.1, zScore:7.8, mgrZScore:7.6, deptZScore:7.9,
    cycles:["7.5","7.3","7.1"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:7.4,z:8.0},{k:"Doc Accuracy",raw:7.2,z:7.9},{k:"NPS",raw:6.9,z:7.6},{k:"Cross-team",raw:6.8,z:7.5}],
    qualThemes:["Appraisal Delay","Promotion Equity"], qualSent:"Neutral",
    feedback:"Strong output. Overdue appraisal and peer promotion ahead have damaged morale.",
    action:"Complete appraisal within 48h. Discuss promotion timeline.",
    trend:[7.5,7.4,7.3,7.2,7.2,7.1,7.1], biasFlag:false, raterLeniency:-0.1,
    hrInput:{culturalFit:8, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Overdue appraisal is a process failure. Sruthi's performance does not warrant any development concern."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral",  note:"Sruthi asked about her appraisal for the second time. I must schedule this immediately."},
      {date:"Mar 2025", sentiment:"Positive", note:"Excellent month. NPS contribution best on team this quarter."},
    ],
  },
  {
    id:"PS-2112", name:"Ayesha Khan", team:"Onboarding", role:"Onboarding Executive", ctc:8.2,
    rawScore:6.2, zScore:6.9, mgrZScore:6.7, deptZScore:7.1,
    cycles:["6.4","6.3","6.2"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:6.4,z:7.1},{k:"Doc Accuracy",raw:6.3,z:7.0},{k:"NPS",raw:6.1,z:6.8},{k:"Cross-team",raw:6.0,z:6.7}],
    qualThemes:["NPS Gap","Goal Clarity"], qualSent:"Neutral",
    feedback:"Below-peer NPS. No growth plan after 13 months. Structure is missing, not motivation.",
    action:"Set SMART goals by EOW. NPS coaching session Q2.",
    trend:[6.4,6.4,6.3,6.3,6.2,6.2,6.2], biasFlag:false, raterLeniency:0.1,
    hrInput:{culturalFit:7, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"Good cultural fit. No concerns. Goals gap is manageable."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral", note:"Ayesha is doing fine. I haven't set structured goals — will do this cycle."},
      {date:"Mar 2025", sentiment:"Neutral", note:"NPS slightly below team. Attitude is positive, will respond to coaching."},
    ],
  },
  {
    id:"PS-1956", name:"Prakash Iyer", team:"Tech Support", role:"Tech Support Analyst", ctc:9.4,
    rawScore:6.5, zScore:7.2, mgrZScore:7.0, deptZScore:7.4,
    cycles:["6.8","6.6","6.5"], mgr:"Vikash Nair",
    kpis:[{k:"SLA Adherence",raw:6.1,z:6.9},{k:"CSAT Score",raw:6.3,z:7.0},{k:"First Call Res",raw:6.8,z:7.5},{k:"Escalation Rate",raw:6.7,z:7.4}],
    qualThemes:["SLA Gap","CSAT Improvement"], qualSent:"Neutral",
    feedback:"SLA and CSAT below team average. Gradual improvement trend — structured coaching is the lever.",
    action:"SLA coaching programme. Buddy pairing with high performer.",
    trend:[6.8,6.7,6.6,6.6,6.5,6.5,6.5], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:7, engagement:6, behaviour:8, tone:7, counsellingNeeded:false, hrNote:"No behavioural issues. Performance gaps are skill-based — coaching is the right intervention."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral", note:"Prakash is putting in effort. SLA still below target but trending better."},
      {date:"Mar 2025", sentiment:"Neutral", note:"First call resolution has improved. CSAT still needs work."},
    ],
  },
  {
    id:"PS-2145", name:"Madhuri Bose", team:"Tech Support", role:"Tech Support Executive", ctc:10.1,
    rawScore:6.3, zScore:7.0, mgrZScore:6.8, deptZScore:7.2,
    cycles:["7.1","6.7","6.3"], mgr:"Vikash Nair",
    kpis:[{k:"SLA Adherence",raw:6.4,z:7.1},{k:"CSAT Score",raw:6.2,z:6.9},{k:"First Call Res",raw:6.3,z:7.0},{k:"Escalation Rate",raw:6.1,z:6.8}],
    qualThemes:["Declining CSAT","Escalation Rate"], qualSent:"Neutral",
    feedback:"Three-cycle CSAT decline. Escalation rate rising. 30-day support plan is appropriate first intervention.",
    action:"Performance support plan 30-day. Escalation root-cause audit.",
    trend:[7.1,6.9,6.7,6.6,6.4,6.3,6.3], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:6, engagement:5, behaviour:7, tone:6, counsellingNeeded:true, hrNote:"Declining trend over 3 cycles. Early counselling recommended — not PIP yet. Root cause may be team dynamics."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Negative", note:"Escalation rate is a concern. CSAT trending down. Need HR to help with support plan."},
      {date:"Mar 2025", sentiment:"Neutral",  note:"Some improvement in first call resolution. CSAT still a concern."},
    ],
  },
  {
    id:"PS-1756", name:"Neha Joshi", team:"Marketing", role:"Marketing Specialist", ctc:11.8,
    rawScore:6.9, zScore:7.6, mgrZScore:7.4, deptZScore:7.8,
    cycles:["7.1","7.0","6.9"], mgr:"Sneha Patel",
    kpis:[{k:"Campaign ROI",raw:7.2,z:7.8},{k:"Lead Quality",raw:7.0,z:7.7},{k:"Brand Engagement",raw:6.7,z:7.4},{k:"Content Output",raw:6.6,z:7.3}],
    qualThemes:["Career Clarity","Brand Engagement Gap"], qualSent:"Neutral",
    feedback:"Steady performer. Brand engagement slightly below average. No career plan documented in 21 months.",
    action:"Career discussion in July review. Brand ownership pilot Q3.",
    trend:[7.1,7.1,7.0,7.0,6.9,6.9,6.9], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:8, engagement:7, behaviour:8, tone:8, counsellingNeeded:false, hrNote:"Good contributor. Career planning is the only gap. Low attrition risk currently."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Neha delivered SprintPG email campaign ahead of deadline. Solid contributor."},
      {date:"Mar 2025", sentiment:"Neutral",  note:"Good work this quarter. We haven't had a career discussion — I'll schedule one."},
    ],
  },
  {
    id:"PS-2088", name:"Rohan Pillai", team:"Strategy", role:"Strategy Analyst", ctc:10.6,
    rawScore:6.4, zScore:7.1, mgrZScore:7.0, deptZScore:7.3,
    cycles:["6.7","6.5","6.4"], mgr:"Rohan Bhat",
    kpis:[{k:"Research Quality",raw:6.8,z:7.4},{k:"Deck Output",raw:6.5,z:7.2},{k:"Stakeholder Mgmt",raw:6.3,z:7.0},{k:"Strategic Thinking",raw:6.4,z:7.1}],
    qualThemes:["Appraisal Delay","Research Output"], qualSent:"Neutral",
    feedback:"Below-peer research output. Appraisal 3 weeks overdue — structural failure, not performance.",
    action:"Complete appraisal 48h. Research quality mentorship.",
    trend:[6.7,6.6,6.5,6.5,6.4,6.4,6.4], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:7, engagement:6, behaviour:7, tone:7, counsellingNeeded:false, hrNote:"No concerns. Overdue appraisal is manager-side process failure. Rohan is tracking normally for 9-month tenure."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Neutral", note:"Rohan is progressing. I owe him an appraisal — overdue by 3 weeks now."},
      {date:"Mar 2025", sentiment:"Neutral", note:"Research quality is below senior peers but improving month over month."},
    ],
  },

  // ─── LOW RISK · Additional ───────────────────────────────────────────────────
  {
    id:"PS-1723", name:"Sunita Kumar", team:"Operations", role:"Operations Coordinator", ctc:14.4,
    rawScore:8.2, zScore:8.5, mgrZScore:8.6, deptZScore:8.7,
    cycles:["8.0","8.1","8.2"], mgr:"Pooja Rao",
    kpis:[{k:"Process Efficiency",raw:8.4,z:8.7},{k:"Team Coordination",raw:8.1,z:8.4},{k:"SLA Oversight",raw:8.2,z:8.5},{k:"Stakeholder Sat",raw:8.0,z:8.3}],
    qualThemes:["Stability","Institutional Knowledge"], qualSent:"Positive",
    feedback:"5-year institutional anchor. Consistent high performance. Low attrition risk.",
    action:"Standard Q3 check-in. Nominate for Team Lead shadow programme.",
    trend:[7.8,7.9,8.0,8.0,8.1,8.2,8.2], biasFlag:false, raterLeniency:0.2,
    hrInput:{culturalFit:9, engagement:9, behaviour:9, tone:9, counsellingNeeded:false, hrNote:"Exemplary contributor. No concerns. Succession candidate."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Sunita is the Operations backbone. Outstanding quarter."},
      {date:"Feb 2025", sentiment:"Positive", note:"Handled the SprintPG migration coordination with zero issues."},
    ],
  },
  {
    id:"PS-1634", name:"Rajesh Pillai", team:"Operations", role:"Senior Operations Manager", ctc:21.0,
    rawScore:9.1, zScore:9.2, mgrZScore:9.0, deptZScore:9.1,
    cycles:["8.9","9.0","9.1"], mgr:"Pooja Rao",
    kpis:[{k:"Process Efficiency",raw:9.2,z:9.4},{k:"Team KPI Achievement",raw:9.0,z:9.2},{k:"Stakeholder Sat",raw:8.9,z:9.1},{k:"Strategic Execution",raw:9.0,z:9.2}],
    qualThemes:["Leadership","Institutional Knowledge","Succession"], qualSent:"Positive",
    feedback:"6.8-year anchor. Consistent 9+ performance. Primary succession candidate for Operations Director.",
    action:"Include in succession planning. Nominate for senior mentorship circle.",
    trend:[8.7,8.8,8.9,9.0,9.0,9.1,9.1], biasFlag:false, raterLeniency:0.1,
    hrInput:{culturalFit:10, engagement:10, behaviour:10, tone:10, counsellingNeeded:false, hrNote:"The team's institutional memory. Fast-track succession planning immediately."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Rajesh is irreplaceable. Q1 efficiency gains directly attributable to his process design."},
      {date:"Feb 2025", sentiment:"Positive", note:"Led cross-team process alignment during SprintOpen. Saved ₹12L in efficiency gains."},
    ],
  },
  {
    id:"PS-2003", name:"Vivek Chatterjee", team:"Operations", role:"Operations Executive", ctc:9.1,
    rawScore:7.9, zScore:8.4, mgrZScore:8.2, deptZScore:8.5,
    cycles:["7.7","7.8","7.9"], mgr:"Pooja Rao",
    kpis:[{k:"Process Accuracy",raw:8.1,z:8.5},{k:"SLA Adherence",raw:7.9,z:8.3},{k:"Initiative",raw:7.7,z:8.2},{k:"Team Contrib",raw:7.8,z:8.3}],
    qualThemes:["High Engagement","Growth Orientation"], qualSent:"Positive",
    feedback:"Strong 1.5-year trajectory. High engagement. Early pipeline for Team Lead role.",
    action:"Nominate Q3 Spot Award. Flag for early Team Lead pipeline.",
    trend:[7.5,7.6,7.7,7.8,7.8,7.9,7.9], biasFlag:false, raterLeniency:0.1,
    hrInput:{culturalFit:9, engagement:9, behaviour:9, tone:8, counsellingNeeded:false, hrNote:"Outstanding early-career contributor. No concerns. High retention confidence."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Vivek's initiative this quarter was exceptional. Proactively identified a bottleneck — saved 3 hrs/week."},
      {date:"Mar 2025", sentiment:"Positive", note:"Consistent output. SLA 96.2%. Strong team presence."},
    ],
  },
  {
    id:"PS-1789", name:"Karthik Nair", team:"Onboarding", role:"Onboarding Manager", ctc:16.8,
    rawScore:8.0, zScore:8.3, mgrZScore:8.4, deptZScore:8.5,
    cycles:["7.8","7.9","8.0"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:8.2,z:8.5},{k:"Team Management",raw:8.0,z:8.3},{k:"NPS Contribution",raw:7.9,z:8.2},{k:"Cross-team",raw:7.8,z:8.1}],
    qualThemes:["Stability","Leadership","Institutional Knowledge"], qualSent:"Positive",
    feedback:"4.3-year anchor. Consistent performer. Key to onboarding team stability.",
    action:"Standard quarterly check-in. Mentorship nomination.",
    trend:[7.6,7.7,7.8,7.9,7.9,8.0,8.0], biasFlag:false, raterLeniency:0.1,
    hrInput:{culturalFit:9, engagement:8, behaviour:9, tone:9, counsellingNeeded:false, hrNote:"Reliable, culturally strong. No concerns. Continue with standard engagement."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Karthik keeps the team grounded. Strong quarter on SLA metrics."},
      {date:"Feb 2025", sentiment:"Positive", note:"Mentored 2 new joiners through onboarding effectively."},
    ],
  },
  {
    id:"PS-1892", name:"Sneha Iyer", team:"Onboarding", role:"Onboarding Specialist", ctc:12.2,
    rawScore:8.6, zScore:8.8, mgrZScore:8.7, deptZScore:8.9,
    cycles:["8.3","8.5","8.6"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:8.8,z:9.0},{k:"NPS Contribution",raw:9.1,z:9.3},{k:"Doc Accuracy",raw:8.4,z:8.6},{k:"Cross-team",raw:8.1,z:8.4}],
    qualThemes:["High Engagement","Recognition","Growth"], qualSent:"Positive",
    feedback:"Top NPS contributor. Q1 Spot Award winner. Strong 3-year trajectory.",
    action:"Nominate for Onboarding Excellence Award. Fast-track mentor role.",
    trend:[8.1,8.2,8.3,8.4,8.5,8.6,8.6], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:9, engagement:9, behaviour:9, tone:9, counsellingNeeded:false, hrNote:"Outstanding. Team NPS leader. Promote to Senior Specialist by Q4."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Sneha's NPS score is the best on the team. Customers specifically mention her."},
      {date:"Feb 2025", sentiment:"Positive", note:"Spot Award fully deserved. She's raised the bar for the entire team."},
    ],
  },
  {
    id:"PS-2056", name:"Harini Menon", team:"Onboarding", role:"Onboarding Executive", ctc:7.6,
    rawScore:7.6, zScore:8.1, mgrZScore:7.9, deptZScore:8.2,
    cycles:["7.3","7.5","7.6"], mgr:"Aryan Bose",
    kpis:[{k:"Merchant SLA",raw:7.8,z:8.2},{k:"Doc Accuracy",raw:7.6,z:8.0},{k:"NPS",raw:7.5,z:7.9},{k:"Cross-team",raw:7.4,z:7.8}],
    qualThemes:["High Engagement","Fast Learner"], qualSent:"Positive",
    feedback:"Strong early-career trajectory. 95% onboarding in 3 months. High retention confidence.",
    action:"Standard check-in Q3. Consider for mentor buddy programme.",
    trend:[7.1,7.2,7.3,7.4,7.5,7.6,7.6], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:8, engagement:8, behaviour:9, tone:8, counsellingNeeded:false, hrNote:"Strong start. Culturally well-adjusted. No concerns."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Harini's progress in 3 months has been impressive. Great attitude."},
      {date:"Mar 2025", sentiment:"Positive", note:"Completed 95% onboarding faster than most peers at same stage."},
    ],
  },
  {
    id:"PS-1667", name:"Anand Singh", team:"Tech Support", role:"Tech Support Senior", ctc:17.5,
    rawScore:8.9, zScore:9.0, mgrZScore:8.9, deptZScore:9.1,
    cycles:["8.7","8.8","8.9"], mgr:"Vikash Nair",
    kpis:[{k:"SLA Compliance",raw:9.2,z:9.4},{k:"CSAT Score",raw:8.8,z:9.0},{k:"First Call Res",raw:8.7,z:8.9},{k:"Escalation Prev",raw:8.9,z:9.1}],
    qualThemes:["Exceptional Performance","Leadership","Succession"], qualSent:"Positive",
    feedback:"5.5-year team anchor. 99.1% SLA. Three Spot Awards. Primary succession candidate for Tech Support Lead.",
    action:"Include in Leadership Readiness Programme. Succession planning candidate.",
    trend:[8.5,8.6,8.7,8.8,8.8,8.9,8.9], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:10, engagement:10, behaviour:10, tone:10, counsellingNeeded:false, hrNote:"Exemplary. Should have been on leadership track 18 months ago. Move fast."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Anand is the team's gold standard. Every new joiner should shadow him."},
      {date:"Feb 2025", sentiment:"Positive", note:"Saved a P1 escalation single-handedly. 3rd Spot Award in 24 months — fully deserved."},
    ],
  },
  {
    id:"PS-1821", name:"Suresh Babu", team:"Tech Support", role:"Tech Support Executive", ctc:11.8,
    rawScore:7.8, zScore:8.2, mgrZScore:8.1, deptZScore:8.4,
    cycles:["7.5","7.7","7.8"], mgr:"Vikash Nair",
    kpis:[{k:"SLA Compliance",raw:8.0,z:8.3},{k:"CSAT Score",raw:7.9,z:8.2},{k:"First Call Res",raw:7.7,z:8.0},{k:"Escalation Prev",raw:7.6,z:7.9}],
    qualThemes:["Consistent Performance","Team Collaboration"], qualSent:"Positive",
    feedback:"Consistent 3-year performer. 97.8% SLA. Strong CSAT. Team Lead Q4 candidate.",
    action:"Nominate Q4 Team Lead. Standard check-in.",
    trend:[7.3,7.4,7.5,7.6,7.7,7.8,7.8], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:8, engagement:8, behaviour:8, tone:8, counsellingNeeded:false, hrNote:"Solid contributor. No concerns. Natural Team Lead candidate."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Suresh has been mentoring 2 new joiners informally. Recommend making it official."},
      {date:"Mar 2025", sentiment:"Positive", note:"SLA 97.8% again. Consistent delivery. Good interpersonal skills."},
    ],
  },
  {
    id:"PS-1712", name:"Rohit Kapoor", team:"Marketing", role:"Marketing Manager", ctc:19.2,
    rawScore:8.6, zScore:8.7, mgrZScore:8.8, deptZScore:8.9,
    cycles:["8.4","8.5","8.6"], mgr:"Sneha Patel",
    kpis:[{k:"Campaign ROI",raw:8.8,z:9.0},{k:"Lead Quality",raw:8.5,z:8.7},{k:"Brand Engagement",raw:8.4,z:8.6},{k:"Team Management",raw:8.7,z:8.9}],
    qualThemes:["Leadership","Campaign Excellence","Stability"], qualSent:"Positive",
    feedback:"4.7-year anchor. Consistent campaign excellence. 8.6 avg appraisal 4 cycles. Key retention asset.",
    action:"Standard check-in. Mentorship nomination.",
    trend:[8.2,8.3,8.4,8.5,8.5,8.6,8.6], biasFlag:false, raterLeniency:0.1,
    hrInput:{culturalFit:9, engagement:9, behaviour:9, tone:9, counsellingNeeded:false, hrNote:"Pillar of the Marketing team. No concerns. Continue engagement and recognition."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Rohit's campaign ROI was highest in 4 years. Strong leader and mentor."},
      {date:"Feb 2025", sentiment:"Positive", note:"Led SprintPG brand launch. Exceeded all targets. Requested him for VP briefing."},
    ],
  },
  {
    id:"PS-2166", name:"Pallavi Sharma", team:"Marketing", role:"Brand Executive", ctc:12.6,
    rawScore:8.0, zScore:8.3, mgrZScore:8.2, deptZScore:8.5,
    cycles:["7.7","7.9","8.0"], mgr:"Sneha Patel",
    kpis:[{k:"Campaign ROI",raw:8.2,z:8.5},{k:"Brand Engagement",raw:8.1,z:8.4},{k:"Content Output",raw:7.9,z:8.2},{k:"Lead Quality",raw:7.7,z:8.0}],
    qualThemes:["High Engagement","Brand Excellence"], qualSent:"Positive",
    feedback:"Q4 Brand Champion. 3.3-year consistent growth trajectory. Strong engagement indicators.",
    action:"Consider for Senior Brand Executive promotion. Standard Q3 check-in.",
    trend:[7.5,7.6,7.7,7.8,7.9,8.0,8.0], biasFlag:false, raterLeniency:0.0,
    hrInput:{culturalFit:9, engagement:9, behaviour:9, tone:8, counsellingNeeded:false, hrNote:"High performer. Q4 Brand Champion. Promotion to Senior Brand Executive overdue."},
    mgrReviews:[
      {date:"May 2025", sentiment:"Positive", note:"Pallavi's Brand Champion work is setting a new standard. Promote her this cycle."},
      {date:"Mar 2025", sentiment:"Positive", note:"Outstanding brand campaign execution. Customer NPS improved 12% this quarter."},
    ],
  },
];

const HC_TEAMS = [
  { team:"Operations",   fte:35, intern:10, color:C.red },
  { team:"Onboarding",   fte:30, intern:15, color:"#D94F4F" },
  { team:"Tech Support", fte:25, intern:10, color:"#E07070" },
  { team:"Marketing",    fte:18, intern:5,  color:"#E89090" },
  { team:"Strategy",     fte:12, intern:5,  color:"#F0B0B0" },
];

const HC_GROWTH = [
  {m:"Jun",n:91},{m:"Jul",n:96},{m:"Aug",n:98},{m:"Sep",n:102},
  {m:"Oct",n:105},{m:"Nov",n:108},{m:"Dec",n:111},{m:"Jan",n:116},
  {m:"Feb",n:120},{m:"Mar",n:127},{m:"Apr",n:138},{m:"May",n:165},
];

const OPEN_ROLES = [
  { role:"Onboarding Manager",  team:"Onboarding",   days:34, priority:"HIGH",   context:"HIGH-risk senior already present. Manager gap amplifies stress on remaining leads." },
  { role:"Senior Ops Analyst",  team:"Operations",   days:21, priority:"HIGH",   context:"Operations at 35 FTE. Analyst gap cascades to caseload pressure across team." },
  { role:"Tech Support Lead",   team:"Tech Support", days:47, priority:"HIGH",   context:"47 days open — longest unfilled. Team already has HIGH flight risk." },
  { role:"Marketing Executive", team:"Marketing",    days:12, priority:"MEDIUM", context:"Marketing Lead is HIGH risk. Junior hire without stable lead adds onboarding overhead." },
  { role:"Strategy Associate",  team:"Strategy",     days:8,  priority:"MEDIUM", context:"Low immediate risk. Strategy MEDIUM analyst has an overdue appraisal." },
];

const INTERN_COHORTS = [
  { cohort:"Cohort A — Jan 2025", count:18, teams:"Operations (7), Onboarding (8), Strategy (3)", endDate:"Jun 2025", conversion:4,
    members:[
      {name:"Aarav Sharma",  team:"Operations"}, {name:"Zara Khan",     team:"Operations"},
      {name:"Dev Patel",     team:"Operations"}, {name:"Nisha Gupta",   team:"Operations"},
      {name:"Kiran Iyer",    team:"Operations"}, {name:"Mihir Mehta",   team:"Operations"},
      {name:"Aditi Rao",     team:"Operations"},
      {name:"Sakshi Nair",   team:"Onboarding"}, {name:"Roshan Kumar",  team:"Onboarding"},
      {name:"Yash Verma",    team:"Onboarding"}, {name:"Tanvi Pillai",  team:"Onboarding"},
      {name:"Preet Singh",   team:"Onboarding"}, {name:"Riya Bose",     team:"Onboarding"},
      {name:"Aryan Menon",   team:"Onboarding"}, {name:"Diya Sharma",   team:"Onboarding"},
      {name:"Isha Reddy",    team:"Strategy"},   {name:"Kabir Joshi",   team:"Strategy"},
      {name:"Payal Gupta",   team:"Strategy"},
    ],
  },
  { cohort:"Cohort B — Mar 2025", count:15, teams:"Onboarding (7), Tech Support (5), Marketing (3)", endDate:"Aug 2025", conversion:3,
    members:[
      {name:"Aisha Malhotra", team:"Onboarding"}, {name:"Veer Kapoor",  team:"Onboarding"},
      {name:"Meghna Iyer",    team:"Onboarding"}, {name:"Raj Kumar",    team:"Onboarding"},
      {name:"Jiya Nair",      team:"Onboarding"}, {name:"Arnav Desai",  team:"Onboarding"},
      {name:"Sneha Pillai",   team:"Onboarding"},
      {name:"Ayaan Verma",    team:"Tech Support"},{name:"Ritu Sharma",  team:"Tech Support"},
      {name:"Shiv Patel",     team:"Tech Support"},{name:"Kyra Singh",   team:"Tech Support"},
      {name:"Neil Gupta",     team:"Tech Support"},
      {name:"Leena Rao",      team:"Marketing"},  {name:"Rahul Joshi",  team:"Marketing"},
      {name:"Divya Mehta",    team:"Marketing"},
    ],
  },
  { cohort:"Cohort C — May 2025", count:12, teams:"Operations (3), Tech Support (5), Marketing (2), Strategy (2)", endDate:"Oct 2025", conversion:null,
    members:[
      {name:"Sid Kumar",     team:"Operations"},  {name:"Ananya Bose",   team:"Operations"},
      {name:"Raj Nair",      team:"Operations"},
      {name:"Tara Verma",    team:"Tech Support"},{name:"Arya Reddy",   team:"Tech Support"},
      {name:"Ishan Menon",   team:"Tech Support"},{name:"Natasha Singh", team:"Tech Support"},
      {name:"Vivaan Patel",  team:"Tech Support"},
      {name:"Roshni Kumar",  team:"Marketing"},   {name:"Tej Sharma",    team:"Marketing"},
      {name:"Priya Gupta",   team:"Strategy"},    {name:"Varun Iyer",    team:"Strategy"},
    ],
  },
];

const BANDS = [
  { band:"HIGH",   count:12, prob:0.68, col:C.H, bg:C.Hbg, bd:C.Hbd },
  { band:"MEDIUM", count:28, prob:0.31, col:C.M, bg:C.Mbg, bd:C.Mbd },
  { band:"LOW",    count:80, prob:0.08, col:C.L, bg:C.Lbg, bd:C.Lbd },
];

const DIRECT_COSTS = [
  { item:"Job posting (Naukri / LinkedIn)", low:15,  high:40,  src:"Naukri Gold pricing" },
  { item:"Background verification",         low:3.5, high:8,   src:"AuthBridge rates" },
  { item:"Recruiter time — 60 hrs",         low:18,  high:30,  src:"₹6–8L recruiter salary" },
  { item:"Interview time — 4 rounds",       low:24,  high:48,  src:"2 interviewers × 3 hrs" },
];

const INDIRECT_COSTS = [
  { item:"Notice period productivity loss",   low:42, high:50,  src:"8.3% of ₹6L CTC" },
  { item:"Ramp-up loss (60–90 days at 50%)", low:75, high:125, src:"Gallup GWR 2024" },
  { item:"Manager time diverted — 40 hrs",   low:20, high:45,  src:"Manager salary basis" },
  { item:"Knowledge transfer gap",            low:30, high:42,  src:"SHRM 5% of CTC" },
];

const TEAM_PERF = [
  { team:"Strategy",    rawAvg:7.5, zAvg:8.2, compliance:91, biasRisk:"Low" },
  { team:"Operations",  rawAvg:7.1, zAvg:7.8, compliance:84, biasRisk:"Medium" },
  { team:"Marketing",   rawAvg:6.8, zAvg:7.8, compliance:76, biasRisk:"High" },
  { team:"Onboarding",  rawAvg:6.9, zAvg:7.6, compliance:71, biasRisk:"High" },
  { team:"Tech Support",rawAvg:7.3, zAvg:8.0, compliance:68, biasRisk:"Medium" },
];

const PERF_CYCLE_AVG = [
  {cycle:"Q1 FY25",raw:7.1,z:7.8},{cycle:"Q2 FY25",raw:7.0,z:7.7},
  {cycle:"Q3 FY25",raw:6.9,z:7.6},{cycle:"Q4 FY25",raw:7.2,z:7.9},
  {cycle:"Q1 FY26",raw:7.0,z:7.7},{cycle:"Q2 FY26",raw:7.1,z:7.8},
  {cycle:"Q3 FY26",raw:6.8,z:7.6},
];

const ENG_TEAMS = [
  {
    team:"Operations", mgr:"Pooja Rao", enps:34, enpsDelta:-8, trend:"Declining",
    pulseScore:5.8, participationRate:78, mgrScore:58, mgrDelta:-6,
    enpsTrend:[{m:"Dec",v:48},{m:"Jan",v:44},{m:"Feb",v:41},{m:"Mar",v:38},{m:"Apr",v:36},{m:"May",v:34}],
    themes:[
      {theme:"Workload Distribution", sentiment:"Negative", count:14, delta:-0.4, quote:"Caseload has doubled since Q1 without headcount change."},
      {theme:"Career Progression",   sentiment:"Negative", count:9,  delta:-0.3, quote:"No clarity on promotion timelines for analysts."},
      {theme:"Manager Transparency", sentiment:"Neutral",  count:6,  delta:0.1,  quote:"Communication is okay but goals feel unclear."},
    ],
    radar:[{s:"Workload",v:38},{s:"Growth",v:44},{s:"Manager",v:62},{s:"Recognition",v:41},{s:"Clarity",v:55}],
  },
  {
    team:"Onboarding", mgr:"Aryan Bose", enps:21, enpsDelta:-14, trend:"Declining",
    pulseScore:4.6, participationRate:71, mgrScore:49, mgrDelta:-11,
    enpsTrend:[{m:"Dec",v:44},{m:"Jan",v:38},{m:"Feb",v:32},{m:"Mar",v:28},{m:"Apr",v:24},{m:"May",v:21}],
    themes:[
      {theme:"Burnout & Capacity",  sentiment:"Negative", count:18, delta:-0.7, quote:"PTO accumulating — no one can step away."},
      {theme:"Recognition Gap",     sentiment:"Negative", count:12, delta:-0.5, quote:"High performers feel invisible."},
      {theme:"Process Bottlenecks", sentiment:"Negative", count:8,  delta:-0.2, quote:"Manual checks slow every cycle."},
    ],
    radar:[{s:"Workload",v:22},{s:"Growth",v:38},{s:"Manager",v:51},{s:"Recognition",v:28},{s:"Clarity",v:44}],
  },
  {
    team:"Tech Support", mgr:"Vikash Nair", enps:18, enpsDelta:-9, trend:"Declining",
    pulseScore:4.9, participationRate:68, mgrScore:41, mgrDelta:-15,
    enpsTrend:[{m:"Dec",v:38},{m:"Jan",v:34},{m:"Feb",v:30},{m:"Mar",v:26},{m:"Apr",v:21},{m:"May",v:18}],
    themes:[
      {theme:"Manager Relationship", sentiment:"Negative", count:11, delta:-0.6, quote:"Escalation patterns suggest friction."},
      {theme:"Role Clarity",         sentiment:"Negative", count:7,  delta:-0.3, quote:"Responsibilities overlap lead and exec."},
      {theme:"SLA Pressure",         sentiment:"Negative", count:9,  delta:-0.4, quote:"Targets feel unrealistic."},
    ],
    radar:[{s:"Workload",v:31},{s:"Growth",v:42},{s:"Manager",v:33},{s:"Recognition",v:46},{s:"Clarity",v:35}],
  },
  {
    team:"Marketing", mgr:"Sneha Patel", enps:42, enpsDelta:-5, trend:"Stable",
    pulseScore:6.1, participationRate:83, mgrScore:74, mgrDelta:2,
    enpsTrend:[{m:"Dec",v:50},{m:"Jan",v:48},{m:"Feb",v:46},{m:"Mar",v:45},{m:"Apr",v:43},{m:"May",v:42}],
    themes:[
      {theme:"Campaign Ownership",    sentiment:"Positive", count:8, delta:0.3,  quote:"Team feels ownership of SprintPG."},
      {theme:"Promotion Timeline",    sentiment:"Negative", count:5, delta:-0.4, quote:"Lead not promoted despite results."},
      {theme:"Cross-team Visibility", sentiment:"Neutral",  count:4, delta:0.1,  quote:"Output feels undervalued externally."},
    ],
    radar:[{s:"Workload",v:58},{s:"Growth",v:52},{s:"Manager",v:71},{s:"Recognition",v:55},{s:"Clarity",v:68}],
  },
  {
    team:"Strategy", mgr:"Rohan Bhat", enps:55, enpsDelta:3, trend:"Improving",
    pulseScore:6.8, participationRate:91, mgrScore:82, mgrDelta:4,
    enpsTrend:[{m:"Dec",v:48},{m:"Jan",v:50},{m:"Feb",v:51},{m:"Mar",v:52},{m:"Apr",v:54},{m:"May",v:55}],
    themes:[
      {theme:"Intellectual Stimulation", sentiment:"Positive", count:7, delta:0.5,  quote:"Project variety is high."},
      {theme:"Appraisal Fairness",       sentiment:"Negative", count:4, delta:-0.3, quote:"Overdue appraisal creating perception issues."},
      {theme:"Team Cohesion",            sentiment:"Positive", count:5, delta:0.4,  quote:"Collaboration cited as strength."},
    ],
    radar:[{s:"Workload",v:72},{s:"Growth",v:78},{s:"Manager",v:81},{s:"Recognition",v:69},{s:"Clarity",v:76}],
  },
];

const ENG_ORG_TREND = [
  {m:"Dec",v:46},{m:"Jan",v:43},{m:"Feb",v:40},{m:"Mar",v:38},{m:"Apr",v:36},{m:"May",v:34}
];

const TEAMS_LIST = ["All Teams", ...Array.from(new Set(PERF_EMPLOYEES.map(e => e.team)))];

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
function KPICard({ label, value, sub, accent, topBorder }) {
  return (
    <div style={{ background:C.surf, border:`1.5px solid ${topBorder||C.bdr}`, borderTop:`3px solid ${accent||C.red}`, borderRadius:8, padding:"16px 18px", display:"flex", flexDirection:"column", gap:5 }}>
      <span style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.t3, letterSpacing:"0.07em", textTransform:"uppercase" }}>{label}</span>
      <span style={{ fontFamily:F, fontSize:28, fontWeight:700, color:accent||C.t1, lineHeight:1 }}>{value}</span>
      {sub && <span style={{ fontFamily:FUI, fontSize:11, color:C.t3 }}>{sub}</span>}
    </div>
  );
}

function Badge({ lvl }) {
  const { bg, bd, t } = rk(lvl);
  return (
    <span style={{ background:bg, border:`1px solid ${bd}`, color:t, fontFamily:F, fontSize:9, fontWeight:700, letterSpacing:"0.1em", padding:"3px 8px", borderRadius:4 }}>
      {lvl}
    </span>
  );
}

function SL({ children }) {
  return (
    <div style={{ fontFamily:F, fontSize:9, fontWeight:600, color:C.t3, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${C.bdr}` }}>
      {children}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:18, boxShadow:"0 1px 4px rgba(196,43,43,0.05)", ...style }}>
      {children}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 12px", fontFamily:FUI, fontSize:11, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight:700, color:C.t1, marginBottom:3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color||C.t2 }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</div>
      ))}
    </div>
  );
}

function Spinner({ color = C.P }) {
  return (
    <span style={{ display:"inline-block", width:13, height:13, borderRadius:"50%", border:`2px solid ${color}33`, borderTopColor:color, animation:"spin 0.8s linear infinite", verticalAlign:"middle", flexShrink:0 }}/>
  );
}

function Slider({ label, min, max, step, value, onChange, format, note }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.t2 }}>{label}</span>
        <span style={{ fontFamily:F, fontSize:14, fontWeight:700, color:C.red }}>{format(value)}</span>
      </div>
      <div style={{ position:"relative", height:28, display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", left:0, right:0, top:"50%", transform:"translateY(-50%)", height:6, background:C.bdr, borderRadius:3, pointerEvents:"none" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:C.red, borderRadius:3 }}/>
        </div>
        <div style={{ position:"absolute", left:`calc(${pct}% - 10px)`, top:"50%", transform:"translateY(-50%)", width:20, height:20, borderRadius:"50%", background:C.red, border:"2.5px solid #fff", boxShadow:"0 1px 6px rgba(196,43,43,0.5)", pointerEvents:"none", zIndex:1 }}/>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position:"absolute", left:0, right:0, top:0, bottom:0, width:"100%", height:"100%", opacity:0, cursor:"pointer", margin:0, padding:0, zIndex:2 }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
        <span style={{ fontFamily:F, fontSize:9, color:C.t3 }}>{format(min)}</span>
        <span style={{ fontFamily:F, fontSize:9, color:C.t3 }}>{format(max)}</span>
      </div>
      {note && <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginTop:5, lineHeight:1.5 }}>{note}</div>}
    </div>
  );
}

// ─── MOOD SURVEY ──────────────────────────────────────────────────────────────
function MoodSurveyWidget({ onComplete }) {
  const hour = new Date().getHours();
  const session = hour < 14 ? "morning" : "evening";
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    const m = MOODS.find(m => m.label === selected);
    return (
      <div style={{ background:m.bg, border:`2px solid ${m.color}33`, borderRadius:10, padding:"20px 24px", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:8 }}>{m.symbol}</div>
        <div style={{ fontFamily:FUI, fontSize:14, fontWeight:700, color:m.color }}>Logged — {m.label}</div>
        <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:4 }}>
          Next: {session === "morning" ? "7:00 PM check-out" : "Tomorrow 10:00 AM"}.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:C.surf, border:`2px solid ${C.B}`, borderRadius:10, padding:"20px 24px", boxShadow:"0 2px 16px rgba(26,107,140,0.1)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:F, fontSize:9, color:C.B, letterSpacing:"0.12em", fontWeight:700, marginBottom:4 }}>
            DAILY MOOD SURVEY · {session === "morning" ? "10:00 AM CHECK-IN" : "7:00 PM CHECK-OUT"}
          </div>
          <div style={{ fontFamily:FUI, fontSize:15, fontWeight:700, color:C.t1 }}>How are you feeling right now?</div>
          <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:3 }}>Compulsory · 10 seconds · Anonymous to team, visible to HR</div>
        </div>
        <div style={{ background:C.Bbg, border:`1px solid ${C.Bbd}`, borderRadius:6, padding:"6px 12px", textAlign:"center" }}>
          <div style={{ fontFamily:F, fontSize:9, color:C.B, marginBottom:2 }}>{session === "morning" ? "MORNING" : "EVENING"}</div>
          <div style={{ fontFamily:FUI, fontSize:11, fontWeight:700, color:C.B }}>CHECK-IN</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:16 }}>
        {MOODS.map(m => (
          <button key={m.label} onClick={() => setSelected(m.label)}
            style={{ flex:1, padding:"14px 8px", borderRadius:10, cursor:"pointer", border:`2px solid ${selected===m.label ? m.color : C.bdr}`, background:selected===m.label ? m.bg : "#FAFAFA", transition:"all 0.2s", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:28, lineHeight:1 }}>{m.symbol}</span>
            <span style={{ fontFamily:FUI, fontSize:10, fontWeight:selected===m.label?700:400, color:selected===m.label?m.color:C.t3 }}>{m.label}</span>
          </button>
        ))}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)}
        placeholder="Optional: anything specific on your mind? (HR only)"
        style={{ width:"100%", padding:"10px 12px", fontFamily:FUI, fontSize:11, color:C.t1, background:C.bg, border:`1.5px solid ${C.bdr}`, borderRadius:6, resize:"none", lineHeight:1.6, outline:"none", height:56, marginBottom:12 }}/>
      <button onClick={() => { if (!selected) return; setSubmitted(true); onComplete && onComplete({ mood:selected, note, session }); }}
        disabled={!selected}
        style={{ width:"100%", fontFamily:FUI, fontSize:12, fontWeight:700, padding:"11px 0", borderRadius:6, cursor:selected?"pointer":"default", background:selected?C.B:"#ccc", color:"#fff", border:"none", transition:"background 0.2s" }}>
        Submit Check-in
      </button>
    </div>
  );
}

function MoodDashboard() {
  const [view, setView] = useState("today");
  const [surveyDone, setSurveyDone] = useState(false);

  const todayAM = MOOD_EMPLOYEES.map((e, i) => ({ ...e, mood:MOODS[Math.max(0,Math.min(4,5-MOOD_HISTORY[4].am[i]))], submitted:i < 8 }));
  const todayPM = MOOD_EMPLOYEES.map((e, i) => ({ ...e, mood:MOODS[Math.max(0,Math.min(4,5-MOOD_HISTORY[4].pm[i]))], submitted:i < 6 }));
  const avgAM   = parseFloat((MOOD_HISTORY[4].am.reduce((s,v)=>s+v,0)/MOOD_HISTORY[4].am.length).toFixed(1));
  const avgPM   = parseFloat((MOOD_HISTORY[4].pm.reduce((s,v)=>s+v,0)/MOOD_HISTORY[4].pm.length).toFixed(1));
  const weekAvg = MOOD_HISTORY.map(d => ({ day:d.day, am:parseFloat((d.am.reduce((s,v)=>s+v,0)/d.am.length).toFixed(1)), pm:parseFloat((d.pm.reduce((s,v)=>s+v,0)/d.pm.length).toFixed(1)) }));
  const atRisk  = todayAM.filter(e => e.submitted && e.mood.score <= 2);

  return (
    <div>
      {!surveyDone && <div style={{ marginBottom:16 }}><MoodSurveyWidget onComplete={() => setSurveyDone(true)}/></div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        <KPICard label="Morning Avg" value={`${avgAM}/5`} sub="Today 10 AM" accent={avgAM>=4?C.L:avgAM>=3?C.B:C.H} topBorder={avgAM>=4?C.Lbd:avgAM>=3?C.Bbd:C.Hbd}/>
        <KPICard label="Evening Avg" value={`${avgPM}/5`} sub="Today 7 PM"  accent={avgPM>=4?C.L:avgPM>=3?C.B:C.H} topBorder={avgPM>=4?C.Lbd:avgPM>=3?C.Bbd:C.Hbd}/>
        <KPICard label="Pending Check-ins" value={MOOD_EMPLOYEES.length - todayPM.filter(e=>e.submitted).length} sub="Yet to submit evening" accent={C.M} topBorder={C.Mbd}/>
        <KPICard label="Stress Flags" value={atRisk.length} sub="Score ≤2 · HR attention" accent={atRisk.length>0?C.H:C.L} topBorder={atRisk.length>0?C.Hbd:C.Lbd}/>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:14 }}>
        {[{id:"today",l:"Today's Responses"},{id:"week",l:"Week Trend"},{id:"heatmap",l:"Team Heatmap"}].map(({id,l}) => (
          <button key={id} onClick={() => setView(id)}
            style={{ fontFamily:FUI, fontSize:11, fontWeight:600, padding:"7px 16px", borderRadius:6, cursor:"pointer", border:`1.5px solid ${view===id?C.B:C.bdr}`, background:view===id?C.Bbg:"transparent", color:view===id?C.B:C.t2, transition:"all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {view === "today" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[{label:"Morning (10 AM)", data:todayAM},{label:"Evening (7 PM)", data:todayPM}].map(({label, data}) => (
            <Card key={label}>
              <SL>{label} · {data.filter(e=>e.submitted).length}/{data.length} SUBMITTED</SL>
              <div style={{ marginBottom:12 }}>
                <div style={{ height:6, background:C.bdr, borderRadius:3 }}>
                  <div style={{ width:`${(data.filter(e=>e.submitted).length/data.length)*100}%`, height:"100%", background:C.B, borderRadius:3 }}/>
                </div>
                <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginTop:4 }}>{data.filter(e=>!e.submitted).length} pending</div>
              </div>
              {data.map(emp => (
                <div key={emp.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", border:`1px solid ${emp.submitted&&emp.mood.score<=2?C.Hbd:C.bdr}`, background:emp.submitted&&emp.mood.score<=2?C.Hbg:"transparent", borderRadius:6, marginBottom:6 }}>
                  <div>
                    <div style={{ fontFamily:FUI, fontSize:12, fontWeight:600, color:C.t1 }}>{emp.name}</div>
                    <div style={{ fontFamily:FUI, fontSize:10, color:C.t2 }}>{emp.team}</div>
                  </div>
                  {emp.submitted ? (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {emp.mood.score <= 2 && <span style={{ fontFamily:F, fontSize:9, color:C.H, fontWeight:700 }}>⚠ FLAG</span>}
                      <span style={{ fontSize:22 }}>{emp.mood.symbol}</span>
                      <span style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:emp.mood.color }}>{emp.mood.label}</span>
                    </div>
                  ) : (
                    <span style={{ fontFamily:F, fontSize:10, color:C.t3, fontStyle:"italic" }}>Pending</span>
                  )}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {view === "week" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Card>
            <SL>TEAM MOOD TREND · MON–FRI</SL>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekAvg} margin={{top:4,right:8,left:-20,bottom:0}}>
                <CartesianGrid stroke={C.bdr} strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="day" tick={{fontFamily:F,fontSize:9,fill:C.t3}} axisLine={false} tickLine={false}/>
                <YAxis domain={[1,5]} tick={{fontFamily:F,fontSize:9,fill:C.t3}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="am" name="Morning" stroke={C.B} strokeWidth={2.5} dot={{r:4,fill:C.B}}/>
                <Line type="monotone" dataKey="pm" name="Evening" stroke={C.M} strokeWidth={2} strokeDasharray="5 3" dot={{r:3,fill:C.M}}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SL>STRESS FLAGS THIS WEEK</SL>
            {[
              { name:"Sanya Malhotra", team:"Tech Support", flags:4, days:"Mon PM, Tue AM, Tue PM, Wed AM", note:"Consistent low mood — manager conflict escalating" },
              { name:"Priya Nair",     team:"Onboarding",   flags:2, days:"Wed AM, Wed PM",                note:"Mid-week dip — caseload pressure" },
              { name:"Rahul Kapoor",   team:"Marketing",    flags:2, days:"Tue PM, Wed AM",                note:"Promotion anxiety signal" },
            ].map(e => (
              <div key={e.name} style={{ border:`1.5px solid ${C.Hbd}`, background:C.Hbg, borderRadius:7, padding:"11px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                  <div>
                    <div style={{ fontFamily:FUI, fontSize:12, fontWeight:700, color:C.t1 }}>{e.name}</div>
                    <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, marginTop:2 }}>{e.team}</div>
                  </div>
                  <div style={{ fontFamily:F, fontSize:18, fontWeight:700, color:C.H }}>{e.flags}<span style={{ fontSize:9, fontFamily:FUI, color:C.t3, marginLeft:2 }}>flags</span></div>
                </div>
                <div style={{ fontFamily:F, fontSize:10, color:C.t3, marginBottom:4 }}>{e.days}</div>
                <div style={{ fontFamily:FUI, fontSize:10, color:C.Ht, lineHeight:1.5, fontStyle:"italic" }}>{e.note}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {view === "heatmap" && (
        <Card>
          <SL>MOOD HEATMAP · TEAM × DAY × SESSION</SL>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:3 }}>
              <thead>
                <tr>
                  <th style={{ fontFamily:F, fontSize:9, color:C.t3, padding:"4px 8px", textAlign:"left" }}>TEAM</th>
                  {MOOD_HISTORY.map(d => (
                    <th key={d.day} colSpan={2} style={{ fontFamily:F, fontSize:9, color:C.t3, padding:"4px 8px", textAlign:"center" }}>{d.day}</th>
                  ))}
                </tr>
                <tr>
                  <th/>
                  {MOOD_HISTORY.map(d => [
                    <th key={d.day+"am"} style={{ fontFamily:F, fontSize:8, color:C.t3, padding:"2px 8px", textAlign:"center" }}>AM</th>,
                    <th key={d.day+"pm"} style={{ fontFamily:F, fontSize:8, color:C.t3, padding:"2px 8px", textAlign:"center" }}>PM</th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {["Operations","Onboarding","Tech Support","Marketing","Strategy"].map(team => {
                  const idxs = MOOD_EMPLOYEES.map((e,i) => e.team===team ? i : -1).filter(i=>i>=0);
                  return (
                    <tr key={team}>
                      <td style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.t1, padding:"6px 8px", whiteSpace:"nowrap" }}>{team}</td>
                      {MOOD_HISTORY.map(d => {
                        const am = idxs.length ? parseFloat((idxs.reduce((s,i)=>s+d.am[i],0)/idxs.length).toFixed(1)) : 3;
                        const pm = idxs.length ? parseFloat((idxs.reduce((s,i)=>s+d.pm[i],0)/idxs.length).toFixed(1)) : 3;
                        return [am, pm].map((val, vi) => {
                          const bg  = val>=4?"#D4EDDA":val>=3?"#FFF8EE":val>=2?"#FFE4D4":"#FFD0D0";
                          const col = val>=4?C.L:val>=3?C.M:C.H;
                          return (
                            <td key={d.day+(vi?"pm":"am")} style={{ background:bg, borderRadius:4, padding:"8px 12px", textAlign:"center" }}>
                              <div style={{ fontFamily:F, fontSize:13, fontWeight:700, color:col }}>{val.toFixed(1)}</div>
                            </td>
                          );
                        });
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:14, flexWrap:"wrap" }}>
            {[{bg:"#D4EDDA",col:C.L,label:"4–5 Great"},{bg:"#FFF8EE",col:C.M,label:"3 Neutral"},{bg:"#FFE4D4",col:C.H,label:"2 Low"},{bg:"#FFD0D0",col:C.H,label:"1 Stressed"}].map(({bg,col,label}) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:14, height:14, background:bg, borderRadius:2 }}/>
                <span style={{ fontFamily:FUI, fontSize:10, color:C.t2 }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ATTRITION TAB ────────────────────────────────────────────────────────────
function ShapBar({ l, v, n }) {
  const protective = v < 0;
  const abs   = Math.abs(v);
  const color = protective ? C.L : abs >= 25 ? C.H : C.M;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, gap:8 }}>
        <span style={{ fontFamily:FUI, fontSize:11, color:C.t2, lineHeight:1.4, flex:1 }}>{l}</span>
        <span style={{ fontFamily:F, fontSize:12, fontWeight:700, color, flexShrink:0 }}>{protective ? "" : "+"}{v}</span>
      </div>
      <div style={{ background:C.bdr, borderRadius:3, height:5 }}>
        <div style={{ width:`${Math.min((abs/35)*100,100)}%`, height:"100%", background:color, borderRadius:3 }}/>
      </div>
      <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginTop:4, lineHeight:1.4 }}>{n}</div>
    </div>
  );
}

function AttrDetailPanel({ emp }) {
  const cols  = rk(emp.lvl);
  const up    = emp.delta > 0;
  const first = emp.trend[0].v;
  const last  = emp.trend[emp.trend.length-1].v;
  return (
    <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, height:"100%", overflowY:"auto", padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, paddingBottom:16, borderBottom:`1px solid ${C.bdr}` }}>
        <div>
          <div style={{ fontFamily:FUI, fontSize:16, fontWeight:700, color:C.t1 }}>{emp.name}</div>
          <div style={{ fontFamily:FUI, fontSize:12, color:C.t2, marginTop:3 }}>{emp.role} · {emp.team}</div>
          <div style={{ fontFamily:F, fontSize:10, color:C.t3, marginTop:3 }}>{emp.id} · Joined {emp.joined} · Mgr: {emp.mgr}</div>
          <div style={{ marginTop:8 }}><Badge lvl={emp.lvl}/></div>
        </div>
        <div style={{ background:cols.bg, border:`1.5px solid ${cols.bd}`, borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:72 }}>
          <div style={{ fontFamily:F, fontSize:30, fontWeight:700, color:cols.dot, lineHeight:1 }}>{emp.score}</div>
          <div style={{ fontFamily:F, fontSize:11, color:up?C.H:C.L, marginTop:2 }}>{up?"↑":"↓"}{Math.abs(emp.delta)} <span style={{ color:C.t3 }}>12w</span></div>
        </div>
      </div>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.t3, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>12-WEEK TREND</div>
        <ResponsiveContainer width="100%" height={70}>
          <LineChart data={emp.trend} margin={{top:4,right:4,left:-30,bottom:0}}>
            <YAxis domain={[Math.max(0,first-12), Math.min(100,last+8)]} hide/>
            <XAxis dataKey="w" tick={{fontFamily:F,fontSize:8,fill:C.t3}} axisLine={false} tickLine={false} interval={2}/>
            <Tooltip content={<ChartTip/>}/>
            <Line type="monotone" dataKey="v" stroke={cols.dot} strokeWidth={2} dot={false} activeDot={{r:4,fill:cols.dot,stroke:C.surf,strokeWidth:2}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginBottom:18 }}>
        <SL>SHAP EXPLAINABILITY</SL>
        {emp.shap.map((s, i) => <ShapBar key={i} {...s}/>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>
        {[
          {label:"Engagement Δ", val:emp.sigs.eng,  unit:"/100"},
          {label:"Appraisal Δ",  val:emp.sigs.app,  unit:"%"},
          {label:"Comp Gap",     val:emp.sigs.comp, unit:"%"},
          {label:"Sentiment",    val:emp.sigs.sent, unit:""},
        ].map(({ label, val, unit }) => (
          <div key={label} style={{ background:C.bg, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"10px 12px" }}>
            <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginBottom:4 }}>{label}</div>
            <div style={{ fontFamily:F, fontSize:14, fontWeight:700, color:val>0?C.L:val<0?C.H:C.t2 }}>{val>0?"+":""}{val}{unit}</div>
          </div>
        ))}
      </div>
      <SL>RECOMMENDED INTERVENTIONS</SL>
      {emp.actions.map((a, i) => (
        <div key={i} style={{ display:"flex", gap:12, marginBottom:10, alignItems:"flex-start" }}>
          <div style={{ minWidth:22, height:22, borderRadius:4, background:C.redL, border:`1px solid ${C.redM}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, fontSize:10, fontWeight:700, color:C.red }}>{i+1}</div>
          <span style={{ fontFamily:FUI, fontSize:11, color:C.t1, lineHeight:1.55 }}>{a}</span>
        </div>
      ))}
    </div>
  );
}

function AttritionTab({ teamFilter, onClearFilter }) {
  const [filter, setFilter] = useState("all");
  const [sel, setSel]       = useState(null);

  const list = useMemo(() => {
    const base = teamFilter ? EMPS.filter(e => e.team === teamFilter) : EMPS;
    return filter === "all" ? base : base.filter(e => e.lvl === filter);
  }, [filter, teamFilter]);

  return (
    <div>
      {teamFilter && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.redL, border:`1.5px solid ${C.redM}`, borderRadius:7, padding:"10px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:F, fontSize:10, color:C.red }}>●</span>
            <span style={{ fontFamily:FUI, fontSize:12, fontWeight:600, color:C.red }}>Team: <strong>{teamFilter}</strong> · {list.length} employees</span>
          </div>
          <button onClick={onClearFilter} style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.red, background:"transparent", border:`1px solid ${C.redM}`, borderRadius:4, padding:"4px 10px", cursor:"pointer" }}>✕ Clear</button>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <KPICard label="Total Headcount"    value="165" sub="120 FTE · 45 interns" accent={C.t1}/>
        <KPICard label="High Flight Risk"   value="12"  sub="7.3% · score ≥70"    accent={C.H} topBorder={C.Hbd}/>
        <KPICard label="Exits / 90d"        value="8"   sub="Avg warning: 74 days" accent={C.M} topBorder={C.Mbd}/>
        <KPICard label="Stable Cohort"      value="127" sub="77% · score below 40" accent={C.L} topBorder={C.Lbd}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", marginBottom:3 }}>FLIGHT-RISK CONTROL TOWER</div>
          <div style={{ fontFamily:FUI, fontSize:19, fontWeight:700, color:C.t1 }}>Stop being surprised by resignations.</div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {["all","HIGH","MEDIUM","LOW"].map(f => {
            const active = filter === f;
            const col    = f === "all" ? C.red : rk(f).dot;
            const bg     = f === "all" ? C.redL : rk(f).bg;
            return (
              <button key={f} onClick={() => { setFilter(f); setSel(null); }}
                style={{ fontFamily:F, fontSize:9, padding:"6px 12px", borderRadius:5, cursor:"pointer", letterSpacing:"0.08em", border:`1.5px solid ${active?col:C.bdr}`, background:active?bg:"transparent", color:active?col:C.t3, fontWeight:active?700:400 }}>
                {f.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:sel?"1fr 1fr":"1fr", gap:12, minHeight:440 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {list.length === 0 && (
            <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:24, textAlign:"center", fontFamily:FUI, fontSize:13, color:C.t2 }}>No matches.</div>
          )}
          {list.map(emp => {
            const cols  = rk(emp.lvl);
            const isSel = sel?.id === emp.id;
            const up    = emp.delta > 0;
            return (
              <div key={emp.id} onClick={() => setSel(isSel ? null : emp)}
                style={{ background:isSel?C.redL:C.surf, border:`1.5px solid ${isSel?C.red:C.bdr}`, borderLeft:`4px solid ${cols.dot}`, borderRadius:8, padding:"13px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ minWidth:48, height:48, borderRadius:8, background:cols.bg, border:`1.5px solid ${cols.bd}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontFamily:F, fontSize:15, fontWeight:700, color:cols.dot, lineHeight:1 }}>{emp.score}</span>
                    <span style={{ fontFamily:F, fontSize:9, color:up?C.H:C.L, marginTop:1 }}>{up?"↑":"↓"}{Math.abs(emp.delta)}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.t1 }}>{emp.name}</div>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:2 }}>{emp.role} · <span style={{ color:C.red }}>{emp.team}</span></div>
                    <div style={{ fontFamily:F, fontSize:10, color:C.t3, marginTop:2 }}>{emp.tenure} · {emp.id}</div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                  <Badge lvl={emp.lvl}/>
                  <span style={{ fontFamily:FUI, fontSize:10, color:C.t3 }}>{emp.shap.length} drivers</span>
                </div>
              </div>
            );
          })}
        </div>
        {sel && <AttrDetailPanel emp={sel}/>}
      </div>
    </div>
  );
}

// ─── HEADCOUNT TAB ────────────────────────────────────────────────────────────
function HeadcountTab({ navigateToTeam }) {
  const [hoverTeam, setHoverTeam]       = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);
  const [expandedCohort, setExpandedCohort] = useState(null);
  const totalFTE    = HC_TEAMS.reduce((s,t) => s+t.fte, 0);
  const totalIntern = HC_TEAMS.reduce((s,t) => s+t.intern, 0);
  const atRiskByTeam = useMemo(() => {
    const map = {};
    EMPS.forEach(e => {
      if (e.lvl === "HIGH" || e.lvl === "MEDIUM") {
        if (!map[e.team]) map[e.team] = [];
        map[e.team].push(e);
      }
    });
    return map;
  }, []);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <KPICard label="Total FTE"      value="120"  sub="Across 5 teams"        accent={C.red}/>
        <KPICard label="Active Interns" value="45"   sub="3 cohorts"             accent={C.M} topBorder={C.Mbd}/>
        <KPICard label="Open Roles"     value="5"    sub="3 high priority"       accent={C.H} topBorder={C.Hbd}/>
        <KPICard label="12-Month Growth"value="+81%" sub="91 → 165 headcount"   accent={C.L} topBorder={C.Lbd}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card>
          <SL>HEADCOUNT BY TEAM · CLICK TO VIEW ATTRITION</SL>
          {HC_TEAMS.map(t => {
            const total    = t.fte + t.intern;
            const ftePct   = (t.fte   / (totalFTE + totalIntern)) * 100;
            const intPct   = (t.intern / (totalFTE + totalIntern)) * 100;
            const hov      = hoverTeam === t.team;
            const atRisk   = atRiskByTeam[t.team] || [];
            const highCount = atRisk.filter(e => e.lvl === "HIGH").length;
            const medCount  = atRisk.filter(e => e.lvl === "MEDIUM").length;
            return (
              <div key={t.team}
                onMouseEnter={() => setHoverTeam(t.team)}
                onMouseLeave={() => setHoverTeam(null)}
                onClick={() => navigateToTeam(t.team)}
                style={{ background:hov?C.redL:"transparent", border:`1px solid ${hov?C.redM:C.bdr}`, borderRadius:6, padding:"10px 12px", marginBottom:6, cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7, alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:FUI, fontSize:12, fontWeight:hov?700:500, color:hov?C.red:C.t1 }}>{t.team}</span>
                    {highCount > 0 && <span style={{ fontFamily:F, fontSize:9, fontWeight:700, color:C.H, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:3, padding:"1px 5px" }}>{highCount} HIGH</span>}
                    {medCount  > 0 && <span style={{ fontFamily:F, fontSize:9, fontWeight:700, color:C.M, background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:3, padding:"1px 5px" }}>{medCount} MED</span>}
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontFamily:F, fontSize:10, color:C.t2 }}>{t.fte} FTE</span>
                    <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>{t.intern} interns</span>
                    <span style={{ fontFamily:F, fontSize:11, fontWeight:700, color:C.t1 }}>{total}</span>
                    {hov && <span style={{ fontFamily:FUI, fontSize:10, color:C.red, fontWeight:700 }}>View →</span>}
                  </div>
                </div>
                <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", gap:1 }}>
                  <div style={{ width:`${ftePct}%`, background:t.color, borderRadius:"4px 0 0 4px" }}/>
                  <div style={{ width:`${intPct}%`, background:t.color+"66", borderRadius:"0 4px 4px 0" }}/>
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <SL>HEADCOUNT GROWTH · JUN 2024 – MAY 2025</SL>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={HC_GROWTH} margin={{top:4,right:8,left:-18,bottom:0}}>
              <CartesianGrid stroke={C.bdr} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="m" tick={{fontFamily:F,fontSize:9,fill:C.t3}} axisLine={false} tickLine={false}/>
              <YAxis domain={[80,180]} tick={{fontFamily:F,fontSize:9,fill:C.t3}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="n" name="Headcount" stroke={C.red} strokeWidth={2.5}
                dot={(p) => <circle key={p.index} cx={p.cx} cy={p.cy} r={p.index===HC_GROWTH.length-1?5:3} fill={p.index===HC_GROWTH.length-1?C.red:C.redM} stroke={C.surf} strokeWidth={1.5}/>}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SL>OPEN ROLES</SL>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 60px 80px 28px", borderBottom:`1.5px solid ${C.bdr}`, paddingBottom:8, marginBottom:4 }}>
            {["Role","Team","Days","Priority",""].map((h,i) => <div key={i} style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.06em" }}>{h}</div>)}
          </div>
          {OPEN_ROLES.map((r, i) => {
            const isExp    = expandedRole === i;
            const urgent   = r.days > 30;
            const teamRisk = atRiskByTeam[r.team] || [];
            return (
              <div key={i} style={{ marginBottom:6 }}>
                <div onClick={() => setExpandedRole(isExp ? null : i)}
                  style={{ display:"grid", gridTemplateColumns:"2fr 1fr 60px 80px 28px", padding:"10px", border:`1px solid ${isExp?C.redM:C.bdr}`, background:isExp?C.redL:"transparent", borderRadius:isExp?"6px 6px 0 0":6, cursor:"pointer", alignItems:"center" }}>
                  <div style={{ fontFamily:FUI, fontSize:12, fontWeight:600, color:isExp?C.red:C.t1 }}>{r.role}</div>
                  <div style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>{r.team}</div>
                  <div style={{ fontFamily:F, fontSize:12, fontWeight:700, color:urgent?C.H:C.t2 }}>{r.days}d</div>
                  <div><Badge lvl={r.priority}/></div>
                  <div style={{ fontFamily:F, fontSize:11, color:C.red, textAlign:"center", transition:"transform 0.2s", transform:isExp?"rotate(90deg)":"rotate(0deg)" }}>▶</div>
                </div>
                {isExp && (
                  <div style={{ background:C.redL, border:`1px solid ${C.redM}`, borderTop:"none", borderRadius:"0 0 6px 6px", padding:"12px 14px" }}>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginBottom:10, lineHeight:1.6, fontStyle:"italic" }}>{r.context}</div>
                    {teamRisk.map(emp => {
                      const ec = rk(emp.lvl);
                      return (
                        <div key={emp.id} style={{ background:C.surf, border:`1px solid ${ec.bd}`, borderLeft:`3px solid ${ec.dot}`, borderRadius:5, padding:"9px 12px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontFamily:FUI, fontSize:12, fontWeight:600, color:C.t1 }}>{emp.name}</div>
                            <div style={{ fontFamily:FUI, fontSize:10, color:C.t2 }}>{emp.role}</div>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                            <div style={{ fontFamily:F, fontSize:20, fontWeight:700, color:ec.dot }}>{emp.score}</div>
                            <Badge lvl={emp.lvl}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
        <Card>
          <SL>INTERN COHORTS · CONVERSION PIPELINE</SL>
          {INTERN_COHORTS.map((c, i) => (
            <div key={i} style={{ border:`1.5px solid ${i===2?C.bdr:C.redM}`, background:i===2?C.bg:C.redL, borderRadius:7, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <div>
                  <div style={{ fontFamily:FUI, fontSize:12, fontWeight:700, color:i===2?C.t2:C.red }}>{c.cohort}</div>
                  <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginTop:2 }}>{c.teams}</div>
                </div>
                <div style={{ fontFamily:F, fontSize:20, fontWeight:700, color:i===2?C.t3:C.red }}>{c.count}</div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:FUI, fontSize:10, color:C.t2 }}>Ends: <strong>{c.endDate}</strong></div>
                {c.conversion !== null
                  ? <div style={{ background:C.Lbg, border:`1px solid ${C.Lbd}`, borderRadius:4, padding:"3px 8px", fontFamily:F, fontSize:10, color:C.L, fontWeight:600 }}>{c.conversion} candidates</div>
                  : <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, fontStyle:"italic" }}>Assessment pending</div>}
              </div>
              <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${C.bdr}` }}>
                <button onClick={() => setExpandedCohort(expandedCohort === i ? null : i)}
                  style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.t2, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  {expandedCohort === i ? "▲ Hide members" : `▼ ${c.count} members`}
                </button>
                {expandedCohort === i && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
                    {c.members.map((m, j) => (
                      <span key={j} style={{ fontFamily:FUI, fontSize:10, background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:3, padding:"2px 8px", color:C.t2 }}>
                        {m.name} <span style={{ color:C.t3 }}>· {m.team}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── COST TAB ─────────────────────────────────────────────────────────────────
function CostAtRiskTab() {
  const [attrRate, setAttrRate]     = useState(17.5);
  const [intRate,  setIntRate]      = useState(31);
  const [retained, setRetained]     = useState(0);
  const FTE = 120, REPLACE = 3.5;
  const exits   = Math.round(FTE * attrRate / 100);
  const cost    = parseFloat((exits * REPLACE).toFixed(1));
  const saving  = parseFloat((exits * (intRate/100) * REPLACE).toFixed(1));
  const risk90  = parseFloat(((8 - retained) * REPLACE).toFixed(1));
  const modified = attrRate !== 17.5 || intRate !== 31 || retained !== 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:C.surf, border:`2px solid ${C.red}`, borderRadius:10, padding:22 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:F, fontSize:9, color:C.red, letterSpacing:"0.12em", fontWeight:700, marginBottom:5 }}>SCENARIO SIMULATOR</div>
            <div style={{ fontFamily:FUI, fontSize:16, fontWeight:700, color:C.t1 }}>Adjust assumptions. Numbers update live.</div>
          </div>
          {modified && (
            <button onClick={() => { setAttrRate(17.5); setIntRate(31); setRetained(0); }}
              style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.t2, background:C.bg, border:`1px solid ${C.bdr}`, borderRadius:5, padding:"6px 14px", cursor:"pointer" }}>↺ Reset</button>
          )}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:28 }}>
          <Slider label="Annual Attrition Rate"     min={10} max={35} step={0.5} value={attrRate}  onChange={setAttrRate}  format={v=>`${v}%`}      note="Nasscom 2024: 15–22% for Indian fintechs."/>
          <Slider label="Intervention Success Rate" min={10} max={60} step={1}   value={intRate}   onChange={setIntRate}   format={v=>`${v}%`}      note="Deloitte HCT 2024 baseline: 31%."/>
          <Slider label="HIGH-Risk Retained (90d)"  min={0}  max={8}  step={1}   value={retained}  onChange={setRetained}  format={v=>`${v} of 8`} note={`Saves ₹${(retained*REPLACE).toFixed(1)}L.`}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:6, paddingTop:18, borderTop:`1px solid ${C.bdr}` }}>
          {[
            { label:"Cost at Risk · 90d",   val:risk90, sub:`${8-retained} exits × ₹3.5L` },
            { label:"Annual Churn Cost",     val:cost,   sub:`${exits} exits at ${attrRate}%` },
            { label:"Est. Annual Saving",    val:saving, sub:`${parseFloat((exits*(intRate/100)).toFixed(1))} exits prevented` },
          ].map(({ label, val, sub }) => (
            <div key={label} style={{ background:C.bg, border:`1px solid ${C.bdr}`, borderRadius:8, padding:"14px 16px" }}>
              <div style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.t3, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:F, fontSize:24, fontWeight:700, color:C.red }}>₹{val}L</div>
              <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, marginTop:5 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:C.redL, border:`1.5px solid ${C.redM}`, borderRadius:8, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.red }}>Net Year-1 ROI — ₹{saving}L saved on ₹0 incremental spend</div>
          <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:3 }}>Zoho People is already licensed. SprintIQ activates intelligence on data PaySprint already owns.</div>
        </div>
        <div style={{ background:C.red, color:"#fff", fontFamily:F, fontSize:15, fontWeight:700, padding:"10px 20px", borderRadius:6 }}>∞ ROI</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card>
          <SL>EXIT FORECAST BY RISK BAND</SL>
          {BANDS.map(b => {
            const exp  = (b.count * b.prob).toFixed(1);
            const pct  = Math.round(b.prob * 100);
            return (
              <div key={b.band} style={{ background:b.bg, border:`1.5px solid ${b.bd}`, borderRadius:7, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <span style={{ fontFamily:F, fontSize:10, fontWeight:700, color:b.col }}>{b.band} RISK</span>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:3 }}>{b.count} employees · {pct}% prob</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:b.col }}>{exp}</div>
                    <div style={{ fontFamily:FUI, fontSize:10, color:C.t3 }}>exp. exits</div>
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.7)", borderRadius:3, height:4, marginTop:10 }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:b.col, borderRadius:3, opacity:0.7 }}/>
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <SL>REPLACEMENT COST · PER EXIT</SL>
          <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", marginBottom:8 }}>DIRECT COSTS</div>
          {DIRECT_COSTS.map((d, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"7px 0", borderBottom:`1px dashed ${C.bdr}` }}>
              <div>
                <div style={{ fontFamily:FUI, fontSize:11, color:C.t1 }}>{d.item}</div>
                <div style={{ fontFamily:FUI, fontSize:9, color:C.t3 }}>{d.src}</div>
              </div>
              <div style={{ fontFamily:F, fontSize:11, color:C.t2, whiteSpace:"nowrap", marginLeft:12 }}>₹{d.low}K–₹{d.high}K</div>
            </div>
          ))}
          <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", margin:"14px 0 8px" }}>INDIRECT COSTS</div>
          {INDIRECT_COSTS.map((d, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"7px 0", borderBottom:`1px dashed ${C.bdr}` }}>
              <div>
                <div style={{ fontFamily:FUI, fontSize:11, color:C.t1 }}>{d.item}</div>
                <div style={{ fontFamily:FUI, fontSize:9, color:C.t3 }}>{d.src}</div>
              </div>
              <div style={{ fontFamily:F, fontSize:11, color:C.t2, whiteSpace:"nowrap", marginLeft:12 }}>₹{d.low}K–₹{d.high}K</div>
            </div>
          ))}
          <div style={{ background:C.redL, border:`1.5px solid ${C.redM}`, borderRadius:6, padding:"10px 14px", marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:FUI, fontSize:11, fontWeight:700, color:C.t1 }}>Blended Replacement Cost</div>
              <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, marginTop:2 }}>120–180% of CTC (SHRM 2023)</div>
            </div>
            <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:C.red, marginLeft:16 }}>₹3.5L</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── ENGAGEMENT TAB ───────────────────────────────────────────────────────────
function OrgInsightStrip() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function fetchInsight() {
    setLoading(true); setError(null);
    const summary = ENG_TEAMS.map(t => {
      const neg = t.themes.filter(th => th.sentiment === "Negative").map(th => th.theme).join(", ");
      return `${t.team}: eNPS ${t.enps} (${t.trend}), pulse ${t.pulseScore}/10, negative themes: ${neg || "none"}`;
    }).join("\n");
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:300, messages:[{ role:"user", content:`SprintIQ GenAI for PaySprint HR.\n${summary}\nWrite a 2-sentence executive summary. Name specific teams. State urgency clearly. Return ONLY the summary text — no labels, no preamble.` }] }),
      });
      const data = await res.json();
      setInsight(data.content?.[0]?.text?.trim() || null);
    } catch {
      setError("Could not generate summary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInsight(); }, []);

  return (
    <div style={{ marginTop:14, background:C.Pbg, border:`1.5px solid ${C.Pbd}`, borderRadius:8, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14 }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontFamily:F, fontSize:9, color:C.P, letterSpacing:"0.1em", fontWeight:700 }}>SPRINTIQ GENAI · ENGAGEMENT SUMMARY</span>
          {loading && <Spinner color={C.P}/>}
        </div>
        {loading  && <div style={{ fontFamily:FUI, fontSize:11, color:C.t3, fontStyle:"italic" }}>Synthesising signals…</div>}
        {error    && <div style={{ fontFamily:FUI, fontSize:11, color:C.H }}>{error}</div>}
        {insight  && <div style={{ fontFamily:FUI, fontSize:12, color:C.t1, lineHeight:1.7 }}>{insight}</div>}
      </div>
      {!loading && (
        <button onClick={fetchInsight} style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.P, flexShrink:0, background:"transparent", border:`1px solid ${C.Pbd}`, borderRadius:4, padding:"4px 12px", cursor:"pointer", whiteSpace:"nowrap", marginTop:2 }}>↺ Refresh</button>
      )}
    </div>
  );
}

function EngDetailPanel({ team: t, onNav }) {
  const st      = sentTrend(t.trend);
  const atRisk  = EMPS.filter(e => e.team === t.team && (e.lvl === "HIGH" || e.lvl === "MEDIUM"));
  return (
    <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, overflowY:"auto", padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.bdr}` }}>
        <div>
          <div style={{ fontFamily:FUI, fontSize:16, fontWeight:700, color:C.t1 }}>{t.team}</div>
          <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:3 }}>Mgr: <strong>{t.mgr}</strong> · {t.participationRate}% participation</div>
        </div>
        <div style={{ background:st.bg, border:`1.5px solid ${st.bd}`, borderRadius:10, padding:"10px 16px", textAlign:"center", minWidth:80 }}>
          <div style={{ fontFamily:F, fontSize:28, fontWeight:700, color:st.col, lineHeight:1 }}>{t.enps}</div>
          <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginTop:2 }}>eNPS</div>
          <div style={{ fontFamily:F, fontSize:10, fontWeight:700, color:t.enpsDelta<0?C.H:C.L, marginTop:2 }}>{t.enpsDelta>0?"+":""}{t.enpsDelta}</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={65}>
        <LineChart data={t.enpsTrend} margin={{top:4,right:4,left:-30,bottom:0}}>
          <YAxis domain={[0,80]} hide/>
          <XAxis dataKey="m" tick={{fontFamily:F,fontSize:8,fill:C.t3}} axisLine={false} tickLine={false}/>
          <Tooltip content={<ChartTip/>}/>
          <Line type="monotone" dataKey="v" name="eNPS" stroke={st.col} strokeWidth={2} dot={false} activeDot={{r:4,fill:st.col,stroke:C.surf,strokeWidth:2}}/>
        </LineChart>
      </ResponsiveContainer>
      <div style={{ marginTop:14, marginBottom:16 }}>
        <ResponsiveContainer width="100%" height={160}>
          <RadarChart data={t.radar} margin={{top:10,right:20,bottom:10,left:20}}>
            <PolarGrid stroke={C.bdr}/>
            <PolarAngleAxis dataKey="s" tick={{fontFamily:F,fontSize:9,fill:C.t2}}/>
            <Radar dataKey="v" stroke={st.col} fill={st.col} fillOpacity={0.15} strokeWidth={2}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <SL>SENTIMENT THEMES</SL>
      {t.themes.map((th, i) => {
        const neg = th.sentiment === "Negative";
        const pos = th.sentiment === "Positive";
        const col = neg ? C.H : pos ? C.L : C.M;
        const bg  = neg ? C.Hbg : pos ? C.Lbg : C.Mbg;
        const bd  = neg ? C.Hbd : pos ? C.Lbd : C.Mbd;
        return (
          <div key={i} style={{ background:bg, border:`1px solid ${bd}`, borderRadius:6, padding:"10px 12px", marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:FUI, fontSize:12, fontWeight:700, color:C.t1 }}>{th.theme}</span>
                <span style={{ fontFamily:F, fontSize:9, color:col, background:C.surf, border:`1px solid ${bd}`, borderRadius:3, padding:"1px 6px" }}>{th.sentiment}</span>
              </div>
              <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>{th.count}</span>
            </div>
            <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, lineHeight:1.5, fontStyle:"italic" }}>"{th.quote}"</div>
          </div>
        );
      })}
      {atRisk.length > 0 && (
        <div style={{ background:C.redL, border:`1.5px solid ${C.redM}`, borderRadius:6, padding:"10px 14px", marginTop:14 }}>
          <div style={{ fontFamily:F, fontSize:9, color:C.red, letterSpacing:"0.08em", marginBottom:8, fontWeight:600 }}>AT-RISK EMPLOYEES</div>
          {atRisk.map(emp => {
            const ec = rk(emp.lvl);
            return (
              <div key={emp.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div>
                  <span style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.t1 }}>{emp.name}</span>
                  <span style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginLeft:8 }}>{emp.role}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:F, fontSize:13, fontWeight:700, color:ec.dot }}>{emp.score}</span>
                  <Badge lvl={emp.lvl}/>
                </div>
              </div>
            );
          })}
          <button onClick={() => onNav(t.team)} style={{ marginTop:8, width:"100%", fontFamily:FUI, fontSize:11, fontWeight:600, color:C.red, background:"transparent", border:`1px solid ${C.redM}`, borderRadius:5, padding:"7px 0", cursor:"pointer" }}>
            View full attrition detail →
          </button>
        </div>
      )}
    </div>
  );
}

function EngagementTab({ navigateToTeam }) {
  const [sel,     setSel]     = useState(null);
  const [mgrView, setMgrView] = useState(false);

  const orgEnps    = Math.round(ENG_TEAMS.reduce((s,t) => s + t.enps, 0) / ENG_TEAMS.length);
  const declining  = ENG_TEAMS.filter(t => t.trend === "Declining").length;
  const sentFlags  = ENG_TEAMS.reduce((s,t) => s + t.themes.filter(th => th.sentiment === "Negative").length, 0);
  const mgrFlagged = ENG_TEAMS.filter(t => t.mgrScore < 55).length;

  const sorted    = [...ENG_TEAMS].sort((a,b) => {
    if (a.trend==="Declining" && b.trend!=="Declining") return -1;
    if (b.trend==="Declining" && a.trend!=="Declining") return 1;
    return a.enps - b.enps;
  });
  const mgrSorted = [...ENG_TEAMS].sort((a,b) => a.mgrScore - b.mgrScore);
  const orgTrend  = ENG_ORG_TREND;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <KPICard label="Org eNPS"         value={orgEnps}       sub="Down 12pts since Dec"        accent={C.H} topBorder={C.Hbd}/>
        <KPICard label="Teams Declining"  value={`${declining}/5`} sub="Onboarding, Tech Support, Ops" accent={C.H} topBorder={C.Hbd}/>
        <KPICard label="Sentiment Flags"  value={sentFlags}     sub="Negative themes"             accent={C.M} topBorder={C.Mbd}/>
        <KPICard label="Managers Flagged" value={mgrFlagged}    sub="Effectiveness below 55"      accent={C.M} topBorder={C.Mbd}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", marginBottom:3 }}>ENGAGEMENT INTELLIGENCE</div>
          <div style={{ fontFamily:FUI, fontSize:19, fontWeight:700, color:C.t1 }}>Sentiment is the signal before the resignation.</div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {[{id:false,label:"By Team"},{id:true,label:"By Manager"}].map(({id,label}) => (
            <button key={label} onClick={() => { setMgrView(id); setSel(null); }}
              style={{ fontFamily:F, fontSize:9, padding:"6px 14px", borderRadius:5, cursor:"pointer", letterSpacing:"0.08em", border:`1.5px solid ${mgrView===id?C.red:C.bdr}`, background:mgrView===id?C.redL:"transparent", color:mgrView===id?C.red:C.t3, fontWeight:mgrView===id?700:400 }}>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:sel?"1fr 1fr":"1fr", gap:12, minHeight:480 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <Card style={{ padding:"14px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em" }}>ORG eNPS TREND · DEC 2024 – MAY 2025</div>
              <div style={{ fontFamily:F, fontSize:11, fontWeight:700, color:C.H }}>↓ {Math.abs(orgEnps-46)}pts in 6 months</div>
            </div>
            <ResponsiveContainer width="100%" height={55}>
              <LineChart data={orgTrend} margin={{top:2,right:8,left:-30,bottom:0}}>
                <YAxis domain={[20,60]} hide/>
                <XAxis dataKey="m" tick={{fontFamily:F,fontSize:8,fill:C.t3}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="v" name="Org eNPS" stroke={C.H} strokeWidth={2} dot={false} activeDot={{r:4,fill:C.H,stroke:C.surf,strokeWidth:2}}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          {!mgrView && sorted.map(t => {
            const st       = sentTrend(t.trend);
            const isSel    = sel?.team === t.team;
            const negCount = t.themes.filter(th => th.sentiment === "Negative").length;
            return (
              <div key={t.team} onClick={() => setSel(isSel ? null : t)}
                style={{ background:isSel?C.redL:C.surf, border:`1.5px solid ${isSel?C.red:C.bdr}`, borderLeft:`4px solid ${st.col}`, borderRadius:8, padding:"13px 16px", cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.t1 }}>{t.team}</span>
                      <span style={{ fontFamily:F, fontSize:9, fontWeight:700, color:st.col, background:st.bg, border:`1px solid ${st.bd}`, borderRadius:3, padding:"1px 6px" }}>{t.trend.toUpperCase()}</span>
                      {negCount > 0 && <span style={{ fontFamily:F, fontSize:9, color:C.H, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:3, padding:"1px 6px" }}>{negCount} neg</span>}
                    </div>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>Mgr: {t.mgr} · Pulse: <strong style={{ color:t.pulseScore<5.5?C.H:t.pulseScore<6?C.M:C.L }}>{t.pulseScore}/10</strong> · {t.participationRate}%</div>
                    <div style={{ display:"flex", gap:3, marginTop:8 }}>
                      {t.radar.map(r => (
                        <div key={r.s} style={{ flex:1 }}>
                          <div style={{ fontFamily:F, fontSize:8, color:C.t3, marginBottom:2, textAlign:"center" }}>{r.s.slice(0,3)}</div>
                          <div style={{ height:4, background:C.bdr, borderRadius:2 }}>
                            <div style={{ width:`${r.v}%`, height:"100%", background:r.v<40?C.H:r.v<60?C.M:C.L, borderRadius:2 }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", marginLeft:16, flexShrink:0 }}>
                    <div style={{ fontFamily:F, fontSize:26, fontWeight:700, color:st.col, lineHeight:1 }}>{t.enps}</div>
                    <div style={{ fontFamily:F, fontSize:10, color:t.enpsDelta<0?C.H:C.L, marginTop:2 }}>{t.enpsDelta>0?"+":""}{t.enpsDelta}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {mgrView && mgrSorted.map(t => {
            const isSel    = sel?.team === t.team;
            const scoreCol = t.mgrScore>=70?C.L : t.mgrScore>=50?C.M : C.H;
            const scoreBg  = t.mgrScore>=70?C.Lbg : t.mgrScore>=50?C.Mbg : C.Hbg;
            const scoreBd  = t.mgrScore>=70?C.Lbd : t.mgrScore>=50?C.Mbd : C.Hbd;
            const atRisk   = EMPS.filter(e => e.team===t.team && (e.lvl==="HIGH"||e.lvl==="MEDIUM"));
            const st       = sentTrend(t.trend);
            return (
              <div key={t.team} onClick={() => setSel(isSel ? null : t)}
                style={{ background:isSel?C.redL:C.surf, border:`1.5px solid ${isSel?C.red:C.bdr}`, borderLeft:`4px solid ${scoreCol}`, borderRadius:8, padding:"13px 16px", cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.t1 }}>{t.mgr}</div>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:2 }}>{t.team} · eNPS {t.enps}</div>
                    <div style={{ display:"flex", gap:8, marginTop:6 }}>
                      {atRisk.length > 0 && <span style={{ fontFamily:F, fontSize:9, color:C.H, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:3, padding:"1px 6px" }}>{atRisk.length} at-risk</span>}
                      <span style={{ fontFamily:F, fontSize:9, color:st.col, background:st.bg, border:`1px solid ${st.bd}`, borderRadius:3, padding:"1px 6px" }}>{t.trend}</span>
                    </div>
                  </div>
                  <div style={{ background:scoreBg, border:`1.5px solid ${scoreBd}`, borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
                    <div style={{ fontFamily:F, fontSize:24, fontWeight:700, color:scoreCol, lineHeight:1 }}>{t.mgrScore}</div>
                    <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginTop:2 }}>Effectiveness</div>
                    <div style={{ fontFamily:F, fontSize:10, color:t.mgrDelta<0?C.H:C.L, marginTop:1 }}>{t.mgrDelta>0?"+":""}{t.mgrDelta}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {sel && <EngDetailPanel team={sel} onNav={navigateToTeam}/>}
      </div>
      <OrgInsightStrip/>
    </div>
  );
}

// ─── PERFORMANCE TAB ──────────────────────────────────────────────────────────
function PerfDetailPanel({ emp }) {
  const zCol = perfCol(emp.zScore);
  const biasDiff = parseFloat((emp.zScore - emp.rawScore).toFixed(1));
  return (
    <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, overflowY:"auto", padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${C.bdr}` }}>
        <div>
          <div style={{ fontFamily:FUI, fontSize:15, fontWeight:700, color:C.t1 }}>{emp.name}</div>
          <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:3 }}>{emp.role} · {emp.team} · CTC ₹{emp.ctc}L</div>
          <div style={{ fontFamily:F, fontSize:10, color:C.t3, marginTop:3 }}>{emp.id} · Mgr: {emp.mgr}</div>
          <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
            {emp.biasFlag && <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:4, padding:"3px 10px" }}><span style={{ fontFamily:F, fontSize:9, color:C.H, fontWeight:700 }}>⚠ RATER BIAS · Δ{biasDiff>0?"+":""}{biasDiff}</span></div>}
            {emp.hrInput.counsellingNeeded && <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:4, padding:"3px 10px" }}><span style={{ fontFamily:F, fontSize:9, color:C.M, fontWeight:700 }}>🧠 COUNSELLING NEEDED</span></div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ background:perfBg(emp.rawScore), border:`1.5px solid ${perfBd(emp.rawScore)}`, borderRadius:8, padding:"8px 12px", textAlign:"center", minWidth:52 }}>
            <div style={{ fontFamily:F, fontSize:20, fontWeight:700, color:perfCol(emp.rawScore), lineHeight:1 }}>{emp.rawScore}</div>
            <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginTop:2 }}>Raw</div>
          </div>
          <div style={{ background:perfBg(emp.zScore), border:`2px solid ${perfBd(emp.zScore)}`, borderRadius:8, padding:"8px 12px", textAlign:"center", minWidth:52 }}>
            <div style={{ fontFamily:F, fontSize:20, fontWeight:700, color:zCol, lineHeight:1 }}>{emp.zScore}</div>
            <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginTop:2 }}>Z-Score</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <ResponsiveContainer width="100%" height={55}>
          <LineChart data={emp.trend.map((v,i)=>({i:i+1,v}))} margin={{top:4,right:4,left:-30,bottom:0}}>
            <YAxis domain={[4,10]} hide/>
            <XAxis dataKey="i" tick={{fontFamily:F,fontSize:8,fill:C.t3}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip/>}/>
            <Line type="monotone" dataKey="v" name="Score" stroke={zCol} strokeWidth={2} dot={false} activeDot={{r:4,fill:zCol,stroke:C.surf,strokeWidth:2}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SL>Z-SCORE CALIBRATION CHAIN</SL>
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[{l:"Raw Score",v:emp.rawScore},{l:"Mgr Z",v:emp.mgrZScore},{l:"Dept Z",v:emp.deptZScore}].map(({l,v}) => (
          <div key={l} style={{ flex:1, background:C.bg, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px", textAlign:"center" }}>
            <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginBottom:3 }}>{l}</div>
            <div style={{ fontFamily:F, fontSize:16, fontWeight:700, color:perfCol(v) }}>{v}</div>
          </div>
        ))}
      </div>

      <SL>KPIs · RAW vs Z-SCORE</SL>
      {emp.kpis.map((k, i) => {
        const diff = parseFloat((k.z - k.raw).toFixed(1));
        return (
          <div key={i} style={{ marginBottom:9 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontFamily:FUI, fontSize:11, color:C.t1 }}>{k.k}</span>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>Raw {k.raw}</span>
                <span style={{ fontFamily:F, fontSize:10, color:diff>=0?C.L:C.H, fontWeight:700 }}>→ Z {k.z}</span>
                {Math.abs(diff) > 0.3 && <span style={{ fontFamily:F, fontSize:8, color:diff>0?C.L:C.H, background:diff>0?C.Lbg:C.Hbg, border:`1px solid ${diff>0?C.Lbd:C.Hbd}`, borderRadius:3, padding:"1px 4px" }}>{diff>0?"+":""}{diff}</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:2, height:4 }}>
              <div style={{ flex:k.raw/10, background:perfCol(k.raw), borderRadius:2, opacity:0.45 }}/>
              <div style={{ flex:(10-k.raw)/10, background:C.bdr, borderRadius:2 }}/>
            </div>
            <div style={{ display:"flex", gap:2, height:4, marginTop:2 }}>
              <div style={{ flex:k.z/10, background:perfCol(k.z), borderRadius:2 }}/>
              <div style={{ flex:(10-k.z)/10, background:C.bdr, borderRadius:2 }}/>
            </div>
          </div>
        );
      })}

      <SL>HR SOFT SCORES</SL>
      {[{l:"Cultural Fit",v:emp.hrInput.culturalFit},{l:"Engagement",v:emp.hrInput.engagement},{l:"Behaviour",v:emp.hrInput.behaviour},{l:"Tone",v:emp.hrInput.tone}].map(({l,v}) => (
        <div key={l} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontFamily:FUI, fontSize:11, color:C.t1 }}>{l}</span>
            <span style={{ fontFamily:F, fontSize:11, fontWeight:700, color:v>=8?C.L:v>=6?C.B:C.M }}>{v}/10</span>
          </div>
          <div style={{ background:C.bdr, borderRadius:3, height:4 }}>
            <div style={{ width:`${v*10}%`, height:"100%", background:v>=8?C.L:v>=6?C.B:C.M, borderRadius:3 }}/>
          </div>
        </div>
      ))}
      <div style={{ background:C.bg, border:`1px solid ${C.bdr}`, borderRadius:5, padding:"8px 12px", marginBottom:14, fontFamily:FUI, fontSize:10, color:C.t2, lineHeight:1.6, fontStyle:"italic" }}>"{emp.hrInput.hrNote}"</div>

      <SL>MANAGER REVIEWS</SL>
      {emp.mgrReviews.map((r, i) => {
        const neg = r.sentiment === "Negative";
        const pos = r.sentiment === "Positive";
        const col = neg?C.H:pos?C.L:C.M;
        const bg  = neg?C.Hbg:pos?C.Lbg:C.Mbg;
        const bd  = neg?C.Hbd:pos?C.Lbd:C.Mbd;
        return (
          <div key={i} style={{ border:`1px solid ${bd}`, background:bg, borderRadius:5, padding:"9px 11px", marginBottom:7 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontFamily:F, fontSize:9, fontWeight:700, color:col }}>{r.sentiment}</span>
              <span style={{ fontFamily:FUI, fontSize:10, color:C.t3 }}>{r.date}</span>
            </div>
            <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, lineHeight:1.6, fontStyle:"italic" }}>"{r.note}"</div>
          </div>
        );
      })}

      <div style={{ marginTop:10, background:C.Pbg, border:`1.5px solid ${C.Pbd}`, borderRadius:6, padding:"10px 12px" }}>
        <div style={{ fontFamily:F, fontSize:9, color:C.P, letterSpacing:"0.08em", marginBottom:5, fontWeight:700 }}>GENAI PRESCRIPTION</div>
        <div style={{ fontFamily:FUI, fontSize:11, color:C.t1, lineHeight:1.65, fontWeight:600 }}>{emp.action}</div>
      </div>
    </div>
  );
}

function AppraisalRecommendations() {
  const [sel, setSel]                 = useState(null);
  const [overrides, setOverrides]     = useState({});
  const [overrideOpen, setOverrideOpen] = useState(null);
  const [overrideNote, setOverrideNote] = useState("");

  const sorted = [...PERF_EMPLOYEES].sort((a,b) => calcHike(b).composite - calcHike(a).composite);

  const applyOverride = (id, hike, role, note) => {
    setOverrides(o => ({ ...o, [id]:{ hike, role, note, overridden:true } }));
    setOverrideOpen(null);
    setOverrideNote("");
  };

  return (
    <div>
      <div style={{ background:C.Pbg, border:`1.5px solid ${C.Pbd}`, borderRadius:8, padding:"14px 20px", marginBottom:16, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:F, fontSize:9, color:C.P, letterSpacing:"0.12em", fontWeight:700, marginBottom:4 }}>COMPOSITE SCORE FORMULA</div>
          <div style={{ fontFamily:F, fontSize:12, color:C.t1 }}>Composite = (Dept Z-Score × 80%) + (HR Soft Score × 20%)</div>
        </div>
        <div style={{ height:32, width:1, background:C.Pbd }}/>
        <div>
          <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginBottom:3 }}>Z calibration</div>
          <div style={{ fontFamily:FUI, fontSize:11, color:C.t1 }}>Department-wise → Manager-wise</div>
        </div>
        <div style={{ height:32, width:1, background:C.Pbd }}/>
        <div>
          <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginBottom:3 }}>HR Soft Score</div>
          <div style={{ fontFamily:FUI, fontSize:11, color:C.t1 }}>Cultural Fit · Engagement · Behaviour · Tone</div>
        </div>
        <div style={{ marginLeft:"auto", background:C.P, color:"#fff", fontFamily:F, fontSize:10, padding:"6px 14px", borderRadius:5 }}>HR can override any recommendation</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:sel?"1fr 1fr":"1fr", gap:12, minHeight:500 }}>
        <div>
          <SL>ALL EMPLOYEES · RANKED BY COMPOSITE SCORE</SL>
          {sorted.map((emp, idx) => {
            const rec          = calcHike(emp);
            const ov           = overrides[emp.id];
            const displayHike  = ov ? ov.hike : rec.hike;
            const displayRole  = ov ? ov.role  : rec.role;
            const displayColor = ov ? C.P : rec.roleColor;
            const isSel        = sel?.id === emp.id;
            return (
              <div key={emp.id} onClick={() => setSel(isSel ? null : emp)}
                style={{ background:isSel?C.Pbg:C.surf, border:`1.5px solid ${isSel?C.P:C.bdr}`, borderLeft:`4px solid ${displayColor}`, borderRadius:8, padding:"12px 16px", cursor:"pointer", marginBottom:6, transition:"all 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:F, fontSize:10, color:C.t3, minWidth:20 }}>#{idx+1}</span>
                      <span style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.t1 }}>{emp.name}</span>
                      {emp.hrInput.counsellingNeeded && <span style={{ fontFamily:F, fontSize:9, color:C.M, background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:3, padding:"1px 6px" }}>🧠 Counselling</span>}
                      {ov && <span style={{ fontFamily:F, fontSize:9, color:C.P, background:C.Pbg, border:`1px solid ${C.Pbd}`, borderRadius:3, padding:"1px 6px" }}>HR Override</span>}
                    </div>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>{emp.role} · {emp.team}</div>
                    <div style={{ display:"flex", gap:12, marginTop:5, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>CTC: <strong style={{ color:C.t1 }}>₹{emp.ctc}L</strong></span>
                      <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>Composite: <strong style={{ color:perfCol(rec.composite) }}>{rec.composite}</strong></span>
                      <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>HR Soft: <strong style={{ color:C.B }}>{rec.hrAvg}/10</strong></span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0, marginLeft:12 }}>
                    <div style={{ textAlign:"center", background:displayHike>0?C.Lbg:C.bg, border:`1.5px solid ${displayHike>0?C.Lbd:C.bdr}`, borderRadius:8, padding:"8px 12px", minWidth:60 }}>
                      <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:displayHike>0?C.L:C.t3, lineHeight:1 }}>{displayHike}%</div>
                      <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginTop:1 }}>Hike</div>
                      <div style={{ fontFamily:F, fontSize:10, color:C.L, marginTop:1 }}>+₹{parseFloat((emp.ctc*(displayHike/100)).toFixed(1))}L</div>
                    </div>
                    <div style={{ textAlign:"center", background:C.bg, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:"8px 10px", maxWidth:120 }}>
                      <div style={{ fontFamily:FUI, fontSize:10, fontWeight:700, color:displayColor, lineHeight:1.3 }}>{displayRole}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sel && (() => {
          const rec         = calcHike(sel);
          const ov          = overrides[sel.id];
          const displayHike = ov ? ov.hike : rec.hike;
          const displayRole = ov ? ov.role  : rec.role;
          const sameTeam    = PERF_EMPLOYEES.filter(e => e.team === sel.team && e.id !== sel.id);
          return (
            <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, overflowY:"auto", padding:20 }}>
              <div style={{ borderBottom:`1px solid ${C.bdr}`, paddingBottom:14, marginBottom:14 }}>
                <div style={{ fontFamily:FUI, fontSize:15, fontWeight:700, color:C.t1 }}>{sel.name}</div>
                <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:3 }}>{sel.role} · {sel.team} · CTC ₹{sel.ctc}L</div>
                <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  {ov && <span style={{ fontFamily:F, fontSize:9, color:C.P, background:C.Pbg, border:`1px solid ${C.Pbd}`, borderRadius:3, padding:"2px 8px" }}>HR Override Active</span>}
                  {sel.hrInput.counsellingNeeded && <span style={{ fontFamily:F, fontSize:9, color:C.M, background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:3, padding:"2px 8px" }}>🧠 Counselling Recommended</span>}
                </div>
              </div>

              <SL>COMPOSITE SCORE BREAKDOWN</SL>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                {[{l:"Dept Z-Score",v:sel.deptZScore,w:"80%"},{l:"HR Soft Score",v:rec.hrAvg,w:"20%"},{l:"Composite",v:rec.composite,w:"Final"}].map(({l,v,w}) => (
                  <div key={l} style={{ background:perfBg(v), border:`1.5px solid ${perfBd(v)}`, borderRadius:7, padding:"10px 12px", textAlign:"center" }}>
                    <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginBottom:4 }}>{l}</div>
                    <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:perfCol(v), lineHeight:1 }}>{v}</div>
                    <div style={{ fontFamily:F, fontSize:9, color:C.t3, marginTop:2 }}>weight: {w}</div>
                  </div>
                ))}
              </div>

              <SL>HIKE RECOMMENDATION</SL>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                <div style={{ background:C.Lbg, border:`1.5px solid ${C.Lbd}`, borderRadius:8, padding:"14px", textAlign:"center" }}>
                  <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginBottom:6 }}>RECOMMENDED HIKE</div>
                  <div style={{ fontFamily:F, fontSize:32, fontWeight:700, color:displayHike>0?C.L:C.t3, lineHeight:1 }}>{displayHike}%</div>
                  <div style={{ fontFamily:FUI, fontSize:11, color:C.L, marginTop:4 }}>₹{sel.ctc}L → ₹{parseFloat((sel.ctc*(1+displayHike/100)).toFixed(1))}L</div>
                </div>
                <div style={{ background:C.bg, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:"14px", textAlign:"center", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginBottom:6 }}>ROLE RECOMMENDATION</div>
                  <div style={{ fontFamily:FUI, fontSize:14, fontWeight:700, color:rec.roleColor, lineHeight:1.3 }}>{displayRole}</div>
                  {sel.hrInput.counsellingNeeded && <div style={{ fontFamily:FUI, fontSize:10, color:C.M, marginTop:8, background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:4, padding:"4px 8px" }}>🧠 Counselling Session Required</div>}
                </div>
              </div>

              <SL>DEPT COMPARISON · {sel.team.toUpperCase()}</SL>
              <div style={{ marginBottom:14 }}>
                {[sel,...sameTeam].sort((a,b) => calcHike(b).composite - calcHike(a).composite).map((e, i) => {
                  const er   = calcHike(e);
                  const isMe = e.id === sel.id;
                  return (
                    <div key={e.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"7px 10px", background:isMe?C.Pbg:"transparent", border:`1px solid ${isMe?C.Pbd:C.bdr}`, borderRadius:5, marginBottom:4 }}>
                      <span style={{ fontFamily:F, fontSize:9, color:C.t3, minWidth:16 }}>#{i+1}</span>
                      <span style={{ fontFamily:FUI, fontSize:11, fontWeight:isMe?700:400, color:isMe?C.P:C.t1, flex:1 }}>{e.name}{isMe?" (this employee)":""}</span>
                      <span style={{ fontFamily:F, fontSize:11, fontWeight:700, color:perfCol(er.composite) }}>{er.composite}</span>
                      <span style={{ fontFamily:F, fontSize:11, color:er.hike>0?C.L:C.t3, fontWeight:700 }}>{er.hike}% hike</span>
                    </div>
                  );
                })}
              </div>

              <SL>MANAGER REVIEWS · {sel.mgr.toUpperCase()}</SL>
              {sel.mgrReviews.map((r, i) => {
                const neg = r.sentiment === "Negative";
                const pos = r.sentiment === "Positive";
                const col = neg?C.H:pos?C.L:C.M;
                const bg  = neg?C.Hbg:pos?C.Lbg:C.Mbg;
                const bd  = neg?C.Hbd:pos?C.Lbd:C.Mbd;
                return (
                  <div key={i} style={{ border:`1px solid ${bd}`, background:bg, borderRadius:6, padding:"10px 12px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <span style={{ fontFamily:F, fontSize:10, fontWeight:700, color:col }}>{r.sentiment}</span>
                      <span style={{ fontFamily:FUI, fontSize:10, color:C.t3 }}>{r.date}</span>
                    </div>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, lineHeight:1.65, fontStyle:"italic" }}>"{r.note}"</div>
                  </div>
                );
              })}

              <div style={{ marginTop:14, border:`1.5px solid ${C.Pbd}`, background:C.Pbg, borderRadius:7, padding:"12px 14px" }}>
                <div style={{ fontFamily:F, fontSize:9, color:C.P, letterSpacing:"0.08em", marginBottom:8, fontWeight:700 }}>HR OVERRIDE</div>
                {overrideOpen === sel.id ? (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                      <div>
                        <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, marginBottom:4 }}>Override Hike %</div>
                        <select id="ovHike" defaultValue={displayHike} style={{ width:"100%", padding:"8px 10px", fontFamily:FUI, fontSize:12, border:`1px solid ${C.bdr}`, borderRadius:5, background:C.surf }}>
                          {[0,2,4,6,8,10,12,15,17,20,22,25,28,30].map(v => <option key={v} value={v}>{v}%</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, marginBottom:4 }}>Override Role</div>
                        <select id="ovRole" defaultValue={displayRole} style={{ width:"100%", padding:"8px 10px", fontFamily:FUI, fontSize:12, border:`1px solid ${C.bdr}`, borderRadius:5, background:C.surf }}>
                          {["Promote + Hike","Strong Retain + Hike","Retain","Monitor + Counselling","PIP Review"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <textarea value={overrideNote} onChange={e => setOverrideNote(e.target.value)}
                      placeholder="HR justification (required)…"
                      style={{ width:"100%", padding:"8px 10px", fontFamily:FUI, fontSize:11, border:`1px solid ${C.bdr}`, borderRadius:5, resize:"none", height:56, outline:"none", marginBottom:10 }}/>
                    <div style={{ display:"flex", gap:8 }}>
                      <button
                        onClick={() => {
                          const h = parseInt(document.getElementById("ovHike").value);
                          const r = document.getElementById("ovRole").value;
                          applyOverride(sel.id, h, r, overrideNote);
                        }}
                        disabled={!overrideNote.trim()}
                        style={{ flex:1, fontFamily:FUI, fontSize:11, fontWeight:700, padding:"8px", borderRadius:5, cursor:overrideNote.trim()?"pointer":"default", background:overrideNote.trim()?C.P:"#ccc", color:"#fff", border:"none" }}>
                        Apply Override
                      </button>
                      <button onClick={() => setOverrideOpen(null)} style={{ fontFamily:FUI, fontSize:11, padding:"8px 14px", borderRadius:5, cursor:"pointer", background:"transparent", border:`1px solid ${C.bdr}`, color:C.t2 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>
                      {ov ? <><strong style={{ color:C.P }}>Override active:</strong> {ov.hike}% · {ov.role}<br/><span style={{ fontStyle:"italic", fontSize:10 }}>"{ov.note}"</span></> : "No active override. AI recommendation stands."}
                    </div>
                    <button onClick={() => setOverrideOpen(sel.id)} style={{ fontFamily:FUI, fontSize:11, fontWeight:600, padding:"7px 14px", borderRadius:5, cursor:"pointer", background:C.P, color:"#fff", border:"none", flexShrink:0, marginLeft:12 }}>
                      {ov ? "Edit Override" : "Override"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function EmployeeListPanel({ onSelect, selectedId }) {
  const [search,     setSearch]     = useState("");
  const [teamFilter, setTeamFilter] = useState("All Teams");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...PERF_EMPLOYEES]
      .filter(e => teamFilter === "All Teams" || e.team === teamFilter)
      .filter(e => !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.team.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
      .sort((a,b) => b.zScore - a.zScore);
  }, [search, teamFilter]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontFamily:F, fontSize:13, color:C.t3, pointerEvents:"none" }}>⌕</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role, team or ID…"
          style={{ width:"100%", padding:"9px 12px 9px 32px", fontFamily:FUI, fontSize:11, color:C.t1, background:C.surf, border:`1.5px solid ${search?C.B:C.bdr}`, borderRadius:6, outline:"none" }}/>
        {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontFamily:F, fontSize:12, color:C.t3 }}>✕</button>}
      </div>
      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
        {TEAMS_LIST.map(t => {
          const active = teamFilter === t;
          return (
            <button key={t} onClick={() => setTeamFilter(t)}
              style={{ fontFamily:F, fontSize:9, padding:"5px 11px", borderRadius:20, cursor:"pointer", letterSpacing:"0.06em", border:`1.5px solid ${active?C.B:C.bdr}`, background:active?C.Bbg:"transparent", color:active?C.B:C.t3, fontWeight:active?700:400 }}>
              {t.toUpperCase()}{t !== "All Teams" && ` ${PERF_EMPLOYEES.filter(e=>e.team===t).length}`}
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily:FUI, fontSize:10, color:C.t3 }}>
        {filtered.length === PERF_EMPLOYEES.length ? `All ${filtered.length} employees` : `${filtered.length} of ${PERF_EMPLOYEES.length}`}
        {teamFilter !== "All Teams" && ` · ${teamFilter}`}
        {search && ` · "${search}"`}
      </div>
      {filtered.length === 0 && (
        <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:22, marginBottom:8 }}>🔍</div>
          <div style={{ fontFamily:FUI, fontSize:13, color:C.t2 }}>No matches.</div>
          <button onClick={() => { setSearch(""); setTeamFilter("All Teams"); }} style={{ marginTop:8, fontFamily:FUI, fontSize:11, color:C.B, background:"transparent", border:"none", cursor:"pointer", fontWeight:600 }}>Clear filters</button>
        </div>
      )}
      {filtered.map(emp => {
        const isSel    = selectedId === emp.id;
        const zCol     = perfCol(emp.zScore);
        const zBg      = perfBg(emp.zScore);
        const zBd      = perfBd(emp.zScore);
        const rec      = calcHike(emp);
        const flight   = EMPS.find(e => e.id === emp.id);
        const biasDiff = parseFloat((emp.zScore - emp.rawScore).toFixed(1));
        return (
          <div key={emp.id} onClick={() => onSelect(isSel ? null : emp)}
            style={{ background:isSel?C.Bbg:C.surf, border:`1.5px solid ${isSel?C.B:C.bdr}`, borderLeft:`4px solid ${zCol}`, borderRadius:8, padding:"13px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.t1 }}>{emp.name}</span>
                <span style={{ fontFamily:F, fontSize:9, fontWeight:700, color:zCol, background:zBg, border:`1px solid ${zBd}`, borderRadius:3, padding:"1px 6px" }}>{perfLabel(emp.zScore)}</span>
                {emp.biasFlag && <span style={{ fontFamily:F, fontSize:9, color:C.H, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:3, padding:"1px 6px" }}>⚠ Bias</span>}
                {emp.hrInput.counsellingNeeded && <span style={{ fontFamily:F, fontSize:9, color:C.M, background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:3, padding:"1px 6px" }}>🧠</span>}
                {flight && flight.lvl === "HIGH" && <span style={{ fontFamily:F, fontSize:9, color:C.H, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:3, padding:"1px 6px" }}>✈ Flight Risk</span>}
              </div>
              <div style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>{emp.role} · <span style={{ color:C.B }}>{emp.team}</span></div>
              <div style={{ display:"flex", gap:10, marginTop:4, flexWrap:"wrap" }}>
                <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>Z: <strong style={{ color:zCol }}>{emp.zScore}</strong></span>
                <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>Composite: <strong style={{ color:perfCol(rec.composite) }}>{rec.composite}</strong></span>
                <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>Hike: <strong style={{ color:C.L }}>{rec.hike}%</strong></span>
              </div>
              <div style={{ display:"flex", gap:3, marginTop:6 }}>
                {emp.kpis.map(k => (
                  <div key={k.k} style={{ flex:1 }}>
                    <div style={{ fontFamily:F, fontSize:7, color:C.t3, marginBottom:2, textAlign:"center", overflow:"hidden", whiteSpace:"nowrap" }}>{k.k.split(" ")[0]}</div>
                    <div style={{ height:4, background:C.bdr, borderRadius:2 }}>
                      <div style={{ width:`${k.z*10}%`, height:"100%", background:perfCol(k.z), borderRadius:2 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign:"right", marginLeft:16, flexShrink:0 }}>
              <div style={{ background:zBg, border:`1.5px solid ${zBd}`, borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
                <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:zCol, lineHeight:1 }}>{emp.zScore}</div>
                <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginTop:1 }}>Z-Score</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamViewPanel() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamSearch,   setTeamSearch]   = useState("");
  const [sel,          setSel]          = useState(null);

  const teamEmployees = useMemo(() => {
    if (!selectedTeam) return [];
    const q = teamSearch.toLowerCase().trim();
    return [...PERF_EMPLOYEES]
      .filter(e => e.team === selectedTeam)
      .filter(e => !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
      .sort((a,b) => b.zScore - a.zScore);
  }, [selectedTeam, teamSearch]);

  const teamStat = selectedTeam ? TEAM_PERF.find(t => t.team === selectedTeam) : null;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:14 }}>
        {TEAM_PERF.map(t => {
          const active    = selectedTeam === t.team;
          const biasCol   = t.biasRisk==="High"?C.H : t.biasRisk==="Medium"?C.M : C.L;
          const empCount  = PERF_EMPLOYEES.filter(e => e.team === t.team).length;
          return (
            <div key={t.team} onClick={() => { setSelectedTeam(active?null:t.team); setSel(null); setTeamSearch(""); }}
              style={{ background:active?C.Bbg:C.surf, border:`1.5px solid ${active?C.B:C.bdr}`, borderTop:`3px solid ${perfCol(t.zAvg)}`, borderRadius:8, padding:"12px 14px", cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ fontFamily:FUI, fontSize:12, fontWeight:700, color:active?C.B:C.t1, marginBottom:6 }}>{t.team}</div>
              <div style={{ fontFamily:F, fontSize:20, fontWeight:700, color:perfCol(t.zAvg), lineHeight:1 }}>{t.zAvg}</div>
              <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginTop:2 }}>Z-Avg · {empCount} employees</div>
              <div style={{ marginTop:8, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:F, fontSize:8, color:biasCol, fontWeight:700 }}>{t.biasRisk.toUpperCase()} BIAS</span>
                <span style={{ fontFamily:F, fontSize:9, color:t.compliance>=80?C.L:t.compliance>=65?C.M:C.H }}>{t.compliance}% done</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTeam && teamStat && (
        <div>
          <div style={{ background:C.Bbg, border:`1.5px solid ${C.Bbd}`, borderRadius:8, padding:"12px 18px", marginBottom:12, display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ fontFamily:FUI, fontSize:14, fontWeight:700, color:C.B }}>{selectedTeam}</div>
            {[
              {l:"Raw Avg",         v:teamStat.rawAvg,                                  c:perfCol(teamStat.rawAvg)},
              {l:"Z-Score Avg",     v:teamStat.zAvg,                                    c:perfCol(teamStat.zAvg)},
              {l:"Bias Correction", v:`+${parseFloat((teamStat.zAvg-teamStat.rawAvg).toFixed(1))}`, c:C.L},
              {l:"Completion",      v:`${teamStat.compliance}%`,                         c:teamStat.compliance>=80?C.L:teamStat.compliance>=65?C.M:C.H},
              {l:"Bias Risk",       v:teamStat.biasRisk,                                c:teamStat.biasRisk==="High"?C.H:teamStat.biasRisk==="Medium"?C.M:C.L},
            ].map(({l,v,c}) => (
              <div key={l}>
                <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginBottom:2 }}>{l}</div>
                <div style={{ fontFamily:F, fontSize:15, fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ position:"relative", marginBottom:10 }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontFamily:F, fontSize:13, color:C.t3, pointerEvents:"none" }}>⌕</span>
            <input type="text" value={teamSearch} onChange={e => setTeamSearch(e.target.value)} placeholder={`Search within ${selectedTeam}…`}
              style={{ width:"100%", padding:"9px 12px 9px 32px", fontFamily:FUI, fontSize:11, color:C.t1, background:C.surf, border:`1.5px solid ${teamSearch?C.B:C.bdr}`, borderRadius:6, outline:"none" }}/>
            {teamSearch && <button onClick={() => setTeamSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontFamily:F, fontSize:12, color:C.t3 }}>✕</button>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:sel?"1fr 1fr":"1fr", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {teamEmployees.length === 0 && (
                <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:20, textAlign:"center", fontFamily:FUI, fontSize:12, color:C.t2 }}>No matches.</div>
              )}
              {teamEmployees.map(emp => {
                const isSel    = sel?.id === emp.id;
                const zCol     = perfCol(emp.zScore);
                const zBg      = perfBg(emp.zScore);
                const zBd      = perfBd(emp.zScore);
                const rec      = calcHike(emp);
                return (
                  <div key={emp.id} onClick={() => setSel(isSel?null:emp)}
                    style={{ background:isSel?C.Bbg:C.surf, border:`1.5px solid ${isSel?C.B:C.bdr}`, borderLeft:`4px solid ${zCol}`, borderRadius:8, padding:"13px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.t1 }}>{emp.name}</span>
                        <span style={{ fontFamily:F, fontSize:9, fontWeight:700, color:zCol, background:zBg, border:`1px solid ${zBd}`, borderRadius:3, padding:"1px 6px" }}>{perfLabel(emp.zScore)}</span>
                        {emp.biasFlag && <span style={{ fontFamily:F, fontSize:9, color:C.H, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:3, padding:"1px 6px" }}>⚠ Bias</span>}
                        {emp.hrInput.counsellingNeeded && <span style={{ fontFamily:F, fontSize:9, color:C.M, background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:3, padding:"1px 6px" }}>🧠</span>}
                      </div>
                      <div style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>{emp.role}</div>
                      <div style={{ display:"flex", gap:10, marginTop:4 }}>
                        <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>Z: <strong style={{ color:zCol }}>{emp.zScore}</strong></span>
                        <span style={{ fontFamily:F, fontSize:10, color:C.t3 }}>Hike: <strong style={{ color:C.L }}>{rec.hike}%</strong></span>
                      </div>
                    </div>
                    <div style={{ background:zBg, border:`1.5px solid ${zBd}`, borderRadius:8, padding:"8px 12px", textAlign:"center", marginLeft:14, flexShrink:0 }}>
                      <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:zCol, lineHeight:1 }}>{emp.zScore}</div>
                      <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginTop:1 }}>Z-Score</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {sel && <PerfDetailPanel emp={sel}/>}
          </div>
        </div>
      )}

      {!selectedTeam && (
        <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:"28px 24px", textAlign:"center" }}>
          <div style={{ fontSize:22, marginBottom:8 }}>👆</div>
          <div style={{ fontFamily:FUI, fontSize:13, color:C.t2 }}>Select a team above to explore employees.</div>
        </div>
      )}
    </div>
  );
}

function BiasAnalysisPanel() {
  const MGR_LENIENCY = [
    { mgr:"Vikash Nair",  team:"Tech Support", leniency:+0.3, employees:2 },
    { mgr:"Pooja Rao",    team:"Operations",   leniency:+0.5, employees:2 },
    { mgr:"Rohan Bhat",   team:"Strategy",     leniency:-0.2, employees:1 },
    { mgr:"Aryan Bose",   team:"Onboarding",   leniency:-0.8, employees:1 },
    { mgr:"Sneha Patel",  team:"Marketing",    leniency:-1.2, employees:1 },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card>
          <SL>RATER LENIENCY · BY MANAGER</SL>
          {MGR_LENIENCY.map(m => {
            const harsh = m.leniency < 0;
            const abs   = Math.abs(m.leniency);
            const col   = abs>0.8?C.H : abs>0.4?C.M : C.L;
            const bg    = abs>0.8?C.Hbg : abs>0.4?C.Mbg : C.Lbg;
            const bd    = abs>0.8?C.Hbd : abs>0.4?C.Mbd : C.Lbd;
            return (
              <div key={m.mgr} style={{ border:`1px solid ${bd}`, background:bg, borderRadius:6, padding:"10px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div>
                    <div style={{ fontFamily:FUI, fontSize:12, fontWeight:700, color:C.t1 }}>{m.mgr}</div>
                    <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, marginTop:2 }}>{m.team} · {m.employees} reports</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:F, fontSize:18, fontWeight:700, color:col }}>{m.leniency>0?"+":""}{m.leniency}</div>
                    <div style={{ fontFamily:FUI, fontSize:9, color:col, fontWeight:600 }}>{harsh?"Harsh Rater":"Lenient Rater"}</div>
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.5)", height:5, borderRadius:3 }}>
                  <div style={{ width:`${Math.min(abs/1.5*100,100)}%`, height:"100%", background:col, borderRadius:3, marginLeft:harsh?"auto":0 }}/>
                </div>
                <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, marginTop:6 }}>
                  {harsh ? `${abs.toFixed(1)} pts below norm — may suppress high performers.` : `${abs.toFixed(1)} pts above norm — may inflate comp.`}
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <SL>ORG SCORE TREND · RAW vs Z-SCORE</SL>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={PERF_CYCLE_AVG} margin={{top:4,right:8,left:-10,bottom:0}}>
              <CartesianGrid stroke={C.bdr} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="cycle" tick={{fontFamily:F,fontSize:8,fill:C.t3}} axisLine={false} tickLine={false}/>
              <YAxis domain={[5.5,9.5]} tick={{fontFamily:F,fontSize:9,fill:C.t3}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Line type="monotone" dataKey="raw" name="Raw Avg"     stroke={C.M} strokeWidth={2}   dot={{r:3,fill:C.M}} strokeDasharray="5 3"/>
              <Line type="monotone" dataKey="z"   name="Z-Score Avg" stroke={C.B} strokeWidth={2.5} dot={{r:3,fill:C.B}}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop:12, background:C.Bbg, border:`1px solid ${C.Bbd}`, borderRadius:6, padding:"10px 14px", fontFamily:FUI, fontSize:11, color:C.t1, lineHeight:1.6 }}>
            Z-score consistently runs <strong>+0.7 above raw scores</strong>. Decisions on raw scores alone systematically undervalue talent.
          </div>
        </Card>
      </div>
      <Card>
        <SL>BIAS IMPACT ON INDIVIDUALS · FLAGGED EMPLOYEES</SL>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {PERF_EMPLOYEES.filter(e => e.biasFlag).map(emp => {
            const biasDiff  = parseFloat((emp.zScore - emp.rawScore).toFixed(1));
            const underrated = biasDiff > 0;
            const flight     = EMPS.find(e => e.id === emp.id);
            return (
              <div key={emp.id} style={{ border:`1.5px solid ${C.Hbd}`, background:C.Hbg, borderRadius:7, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontFamily:FUI, fontSize:13, fontWeight:700, color:C.t1 }}>{emp.name}</div>
                    <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, marginTop:2 }}>{emp.role} · {emp.team}</div>
                    {flight && flight.lvl === "HIGH" && <div style={{ marginTop:4, fontFamily:F, fontSize:9, color:C.H, fontWeight:600 }}>⚠ Also HIGH flight risk</div>}
                  </div>
                  <span style={{ fontFamily:F, fontSize:9, color:C.H, fontWeight:700, background:C.surf, border:`1px solid ${C.Hbd}`, borderRadius:3, padding:"2px 7px" }}>
                    {underrated ? "UNDERRATED" : "OVERRATED"}
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                  {[{l:"Raw",v:emp.rawScore,c:perfCol(emp.rawScore)},{l:"Z-Score",v:emp.zScore,c:perfCol(emp.zScore)},{l:"Correction",v:(biasDiff>0?"+":"")+biasDiff,c:underrated?C.L:C.H}].map(({l,v,c}) => (
                    <div key={l} style={{ background:"rgba(255,255,255,0.7)", borderRadius:5, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontFamily:FUI, fontSize:9, color:C.t3, marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:F, fontSize:16, fontWeight:700, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, lineHeight:1.6, fontStyle:"italic", marginBottom:8 }}>"{emp.feedback}"</div>
                <div style={{ background:C.Pbg, border:`1px solid ${C.Pbd}`, borderRadius:4, padding:"7px 10px", fontFamily:FUI, fontSize:10, color:C.P, fontWeight:600 }}>{emp.action}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function PerformanceTab() {
  const [perfTab, setPerfTab] = useState("all");
  const [sel,     setSel]     = useState(null);

  const biasCount        = PERF_EMPLOYEES.filter(e => e.biasFlag).length;
  const avgZ             = parseFloat((PERF_EMPLOYEES.reduce((s,e)=>s+e.zScore,0)/PERF_EMPLOYEES.length).toFixed(1));
  const cycleCompliance  = Math.round(PERF_EMPLOYEES.filter(e=>e.cycles[2]!==null).length/PERF_EMPLOYEES.length*100);
  const counsellingCount = PERF_EMPLOYEES.filter(e=>e.hrInput.counsellingNeeded).length;

  const PERF_TABS = [
    {id:"all",       label:"All Employees"},
    {id:"teams",     label:"By Team"},
    {id:"appraisal", label:"Appraisal & Hike"},
    {id:"bias",      label:"Bias Analysis"},
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        <KPICard label="Org Avg Z-Score"         value={avgZ}               sub="Bias-corrected average"      accent={C.B} topBorder={C.Bbd}/>
        <KPICard label="Rater Bias Flags"        value={biasCount}          sub="Raw vs Z gap > 0.5"          accent={C.H} topBorder={C.Hbd}/>
        <KPICard label="Counselling Recommended" value={counsellingCount}   sub="HR flagged for 1:1 session"  accent={C.M} topBorder={C.Mbd}/>
        <KPICard label="Cycle Compliance"        value={`${cycleCompliance}%`} sub="Q3 FY26 appraisals done" accent={C.L} topBorder={C.Lbd}/>
      </div>

      <div style={{ marginBottom:14, background:C.Bbg, border:`1.5px solid ${C.Bbd}`, borderRadius:6, padding:"12px 16px" }}>
        <div style={{ fontFamily:F, fontSize:10, color:C.B, fontWeight:700, marginBottom:6 }}>Z-SCORE NORMALISATION — HOW SPRINTIQ REMOVES RATER BIAS</div>
        <div style={{ fontFamily:FUI, fontSize:11, color:C.t2, lineHeight:1.7 }}>
          Raw scores carry rater bias (Harvard KS: 58–72% of a rating reflects the rater, not the employee). SprintIQ applies a two-stage Z-score calibration:
          (1) within each manager's cohort to remove leniency/harshness bias, then (2) within each department for cross-team comparability.
          The final composite blends Dept Z-Score (80%) with HR Soft Score (20% — covering Cultural Fit, Engagement, Behaviour, and Tone).
          HR retains full override authority over every AI recommendation.
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", marginBottom:3 }}>PERFORMANCE & FEEDBACK INTELLIGENCE · PAYSPRINT</div>
          <div style={{ fontFamily:FUI, fontSize:19, fontWeight:700, color:C.t1 }}>Every appraisal cycle becomes an intelligence event.</div>
        </div>
        <div style={{ display:"flex", background:C.bg, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:3, gap:2, flexWrap:"wrap" }}>
          {PERF_TABS.map(({ id, label }) => {
            const active  = perfTab === id;
            const isBias  = id === "bias";
            const isAppr  = id === "appraisal";
            return (
              <button key={id} onClick={() => { setPerfTab(id); setSel(null); }}
                style={{ fontFamily:FUI, fontSize:11, fontWeight:active?700:500, padding:"7px 14px", borderRadius:6, cursor:"pointer", border:"none", background:active?(isBias?C.Hbg:isAppr?C.Pbg:C.Bbg):"transparent", color:active?(isBias?C.H:isAppr?C.P:C.B):C.t2, transition:"all 0.15s", display:"flex", alignItems:"center", gap:6 }}>
                {label}
                {id === "bias"     && <span style={{ fontFamily:F, fontSize:8, background:C.Hbg, border:`1px solid ${C.Hbd}`, color:C.H, borderRadius:3, padding:"1px 5px" }}>{biasCount}</span>}
                {id === "appraisal"&& <span style={{ fontFamily:F, fontSize:8, background:C.Pbg, border:`1px solid ${C.Pbd}`, color:C.P, borderRadius:3, padding:"1px 5px" }}>NEW</span>}
              </button>
            );
          })}
        </div>
      </div>

      {perfTab === "all" && (
        <div style={{ display:"grid", gridTemplateColumns:sel?"1fr 1fr":"1fr", gap:12, minHeight:480 }}>
          <EmployeeListPanel onSelect={setSel} selectedId={sel?.id}/>
          {sel && <PerfDetailPanel emp={sel}/>}
        </div>
      )}
      {perfTab === "teams"     && <TeamViewPanel/>}
      {perfTab === "appraisal" && <AppraisalRecommendations/>}
      {perfTab === "bias"      && <BiasAnalysisPanel/>}

      <div style={{ marginTop:14, background:C.bg, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, lineHeight:1.6 }}>
          <strong style={{ color:C.t1 }}>Source:</strong> Harvard Kennedy School — 58–72% of appraisal reflects rater characteristics. SHRM best practice for multi-rater calibration.
        </div>
        <div style={{ fontFamily:F, fontSize:9, color:C.t3, whiteSpace:"nowrap", marginLeft:16, fontStyle:"italic" }}>Phase 2 · Weeks 7–12 · SprintIQ</div>
      </div>
    </div>
  );
}

// ─── NLP PANEL ────────────────────────────────────────────────────────────────
const NLP_EXAMPLES = [
  { label:"Priya — 1:1", text:"Priya seemed distracted during our check-in today. She mentioned the merchant caseload is unmanageable and that she's been working weekends. Brought up the comp review again — says she hasn't heard back in three months. Didn't seem engaged when we discussed the Q3 roadmap. PTO is piling up but she says she can't step away. I'm genuinely worried she's burning out." },
  { label:"Sanya — note", text:"Had a difficult conversation with Sanya about the escalation last week. She feels the SLA targets are unrealistic given current team size, and expressed frustration that her lateral transfer request was denied without explanation. There was clear tension when I mentioned Vikash's feedback. She mentioned she's evaluating her options." },
  { label:"Aditya — check-in", text:"Great check-in with Aditya today. He's fully ramped, SLA compliance is top of team, and he proactively flagged two merchant issues before they escalated. Mentioned he's genuinely enjoying the work and wants to move toward a team lead role by Q4. No concerns at all." },
];

function NLPPanel() {
  const [text,    setText]    = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  async function analyse() {
    if (!text.trim() || loading) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:700,
          system:`You are SprintIQ's NLP engine for Indian fintech HR. Return ONLY valid JSON:
{"sentiment_score":<float 0-1>,"sentiment_label":"<Negative|Neutral|Positive>","risk_signal":"<High|Moderate|Low>","themes":[{"theme":"<name>","sentiment":"<Negative|Neutral|Positive>","evidence":"<phrase from text>"}],"summary":"<one sentence>","action":"<one specific recommendation>"}`,
          messages:[{ role:"user", content:text }],
        }),
      });
      const data = await res.json();
      const raw  = data.content?.[0]?.text || "";
      setResult(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch {
      setError("Analysis failed — check network or try again.");
    } finally {
      setLoading(false);
    }
  }

  const sc  = (s) => s==="Negative"?C.H : s==="Positive"?C.L : C.M;
  const sbg = (s) => s==="Negative"?C.Hbg : s==="Positive"?C.Lbg : C.Mbg;
  const sbd = (s) => s==="Negative"?C.Hbd : s==="Positive"?C.Lbd : C.Mbd;

  return (
    <div style={{ background:C.surf, border:`2px solid ${C.P}`, borderRadius:10, padding:20, boxShadow:"0 2px 16px rgba(75,59,140,0.08)", marginTop:14 }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:F, fontSize:9, color:C.P, letterSpacing:"0.12em", fontWeight:700, marginBottom:4 }}>GENAI PRESCRIPTION ENGINE · LIVE NLP</div>
        <div style={{ fontFamily:FUI, fontSize:15, fontWeight:700, color:C.t1 }}>Paste any 1:1 note. Watch SprintIQ classify it live.</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        <span style={{ fontFamily:FUI, fontSize:10, color:C.t3, alignSelf:"center", marginRight:4 }}>Try:</span>
        {NLP_EXAMPLES.map(ex => (
          <button key={ex.label} onClick={() => setText(ex.text)}
            style={{ fontFamily:FUI, fontSize:10, fontWeight:600, padding:"5px 12px", borderRadius:4, cursor:"pointer", background:text===ex.text?C.Pbg:"transparent", border:`1px solid ${text===ex.text?C.Pbd:C.bdr}`, color:text===ex.text?C.P:C.t2 }}>
            {ex.label}
          </button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:result?"1fr 1fr":"1fr", gap:14, alignItems:"start" }}>
        <div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste a 1:1 note, manager observation, or check-in…"
            style={{ width:"100%", height:140, padding:"12px 14px", fontFamily:FUI, fontSize:11, color:C.t1, background:C.bg, border:`1.5px solid ${C.bdr}`, borderRadius:6, resize:"vertical", lineHeight:1.6, outline:"none" }}/>
          <button onClick={analyse} disabled={!text.trim()||loading}
            style={{ marginTop:10, width:"100%", fontFamily:FUI, fontSize:12, fontWeight:700, padding:"11px 0", borderRadius:6, cursor:text.trim()&&!loading?"pointer":"default", background:text.trim()&&!loading?C.P:"#ccc", color:"#fff", border:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading ? <><span style={{ animation:"spin 1s linear infinite", fontSize:14 }}>⟳</span>Analysing…</> : "▶  Run NLP Analysis"}
          </button>
          {error && <div style={{ marginTop:8, fontFamily:FUI, fontSize:11, color:C.H, background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:5, padding:"8px 12px" }}>{error}</div>}
        </div>
        {result && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div style={{ background:sbg(result.sentiment_label), border:`1.5px solid ${sbd(result.sentiment_label)}`, borderRadius:7, padding:"12px 14px" }}>
                <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", marginBottom:6 }}>SENTIMENT</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
                  <span style={{ fontFamily:F, fontSize:28, fontWeight:700, color:sc(result.sentiment_label), lineHeight:1 }}>{result.sentiment_score.toFixed(2)}</span>
                  <span style={{ fontFamily:F, fontSize:10, color:sc(result.sentiment_label) }}>/1.00</span>
                </div>
                <div style={{ background:"rgba(255,255,255,0.6)", borderRadius:3, height:5 }}>
                  <div style={{ width:`${result.sentiment_score*100}%`, height:"100%", background:sc(result.sentiment_label), borderRadius:3 }}/>
                </div>
                <div style={{ fontFamily:F, fontSize:10, fontWeight:700, color:sc(result.sentiment_label), marginTop:6 }}>{result.sentiment_label}</div>
              </div>
              <div style={{ background:result.risk_signal==="High"?C.Hbg:result.risk_signal==="Low"?C.Lbg:C.Mbg, border:`1.5px solid ${result.risk_signal==="High"?C.Hbd:result.risk_signal==="Low"?C.Lbd:C.Mbd}`, borderRadius:7, padding:"12px 14px", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center" }}>
                <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", marginBottom:8 }}>RISK SIGNAL</div>
                <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:result.risk_signal==="High"?C.H:result.risk_signal==="Low"?C.L:C.M }}>{result.risk_signal.toUpperCase()}</div>
              </div>
            </div>
            {result.themes.map((th, i) => (
              <div key={i} style={{ background:sbg(th.sentiment), border:`1px solid ${sbd(th.sentiment)}`, borderRadius:5, padding:"8px 10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontFamily:FUI, fontSize:11, fontWeight:700, color:C.t1 }}>{th.theme}</span>
                  <span style={{ fontFamily:F, fontSize:9, color:sc(th.sentiment), fontWeight:600 }}>{th.sentiment}</span>
                </div>
                <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, fontStyle:"italic" }}>"{th.evidence}"</div>
              </div>
            ))}
            <div style={{ background:C.Pbg, border:`1px solid ${C.Pbd}`, borderRadius:6, padding:"10px 12px" }}>
              <div style={{ fontFamily:F, fontSize:9, color:C.P, letterSpacing:"0.08em", marginBottom:5 }}>AI INSIGHT</div>
              <div style={{ fontFamily:FUI, fontSize:11, color:C.t1, lineHeight:1.55, marginBottom:8 }}>{result.summary}</div>
              <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.08em", marginBottom:5 }}>RECOMMENDED ACTION</div>
              <div style={{ fontFamily:FUI, fontSize:11, color:C.P, fontWeight:600, lineHeight:1.55 }}>{result.action}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DOC VERIFICATION TAB ─────────────────────────────────────────────────────
function DocVerificationTab() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragging,      setDragging]      = useState(false);
  const [analysing,     setAnalysing]     = useState(false);
  const [results,       setResults]       = useState(null);
  const [subTab,        setSubTab]        = useState("docs");
  const [libsReady,     setLibsReady]     = useState(false);
  const [libsError,     setLibsError]     = useState(false);
  const [fileProgress,  setFileProgress]  = useState({});
  const [profile, setProfile] = useState({
    isIntern:      false,
    hasWorkEx:     false,
    jobCount:      1,
    hasMasters:    false,
    gradSemesters: 8,
  });

  // Load PDF.js + Tesseract.js from CDN once on mount
  useEffect(() => {
    const loadScript = (src) => new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const el = document.createElement("script");
      el.src = src; el.onload = res; el.onerror = rej;
      document.head.appendChild(el);
    });
    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js"),
    ]).then(() => {
      if (window.pdfjsLib)
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      if (!window.pdfjsLib && !window.Tesseract) setLibsError(true);
      setLibsReady(true);
    }).catch(() => { setLibsError(true); setLibsReady(true); });
  }, []);

  const requiredDocs = useMemo(() => {
    const docs = [];
    docs.push({ id:"10th",        label:"10th Marksheet",          category:"Education",       required:true,  note:null });
    docs.push({ id:"12th",        label:"12th Marksheet",          category:"Education",       required:true,  note:null });
    for (let i = 1; i <= profile.gradSemesters; i++)
      docs.push({ id:`grad_sem_${i}`, label:`Graduation — Semester ${i} Marksheet`, category:"Graduation", required:true, note:null });
    docs.push({ id:"degree_cert", label:"Degree Certificate", category:"Education", required:!profile.isIntern, note:profile.isIntern ? "Intern — may not yet be issued. Provisional/enrollment proof acceptable." : null });
    if (profile.hasMasters)
      docs.push({ id:"masters_sem1", label:"Masters — Semester 1 Marksheet", category:"Masters", required:false, note:"Optional" });
    if (profile.hasWorkEx) {
      for (let j = 0; j < profile.jobCount; j++) {
        const suf = profile.jobCount > 1 ? ` (Job ${j+1})` : "";
        docs.push({ id:`joining_${j}`,  label:`Joining Letter${suf}`,         category:"Work Experience", required:true, note:null });
        docs.push({ id:`exp_cert_${j}`, label:`Experience Certificate${suf}`, category:"Work Experience", required:true, note:null });
        docs.push({ id:`salary_${j}`,   label:`Salary Slips${suf}`,           category:"Work Experience", required:true, note:null });
      }
    }
    return docs;
  }, [profile]);

  // Extract full text from a file using PDF.js (text PDFs) or Tesseract (images / scanned PDFs)
  const extractText = async (file, onProgress) => {
    const isPDF   = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = /\.(jpe?g|png|bmp|webp|tiff?)$/i.test(file.name);
    try {
      if (isPDF && window.pdfjsLib) {
        const buf = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
        let text = "";
        for (let p = 1; p <= pdf.numPages; p++) {
          const page    = await pdf.getPage(p);
          const content = await page.getTextContent();
          text += content.items.map(i => i.str).join(" ") + "\n";
          onProgress(Math.round((p / pdf.numPages) * (window.Tesseract ? 60 : 95)));
        }
        // Scanned PDF: very little selectable text — OCR the first page via canvas
        if (text.trim().length < 80 && window.Tesseract) {
          const page     = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas   = document.createElement("canvas");
          canvas.width  = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
          onProgress(70);
          const ocr = await window.Tesseract.recognize(canvas, "eng", {
            logger: m => { if (m.status === "recognizing text") onProgress(70 + Math.round(m.progress * 25)); },
          });
          text = ocr.data.text;
        }
        onProgress(100);
        return text;
      }
      if (isImage && window.Tesseract) {
        const url = URL.createObjectURL(file);
        const ocr = await window.Tesseract.recognize(url, "eng", {
          logger: m => { if (m.status === "recognizing text") onProgress(Math.round(m.progress * 95)); },
        });
        URL.revokeObjectURL(url);
        onProgress(100);
        return ocr.data.text;
      }
      // Fallback for .doc/.docx: read as plain text (limited but captures some keywords)
      const txt = await file.text().catch(() => "");
      onProgress(100);
      return txt;
    } catch {
      onProgress(100);
      return "";
    }
  };

  // Match extracted document text to a required-doc ID using content heuristics
  const matchContent = (raw, docId) => {
    const t = raw.toLowerCase();
    if (!t.trim()) return false;
    if (docId === "10th")
      return /(secondary school|ssc\b|s\.s\.c|class\s*x\b|class\s*10\b|10th|tenth standard|matriculation|high school certificate)/i.test(t)
          && !/(higher secondary|class\s*xii|class\s*12\b|hsc\b|12th)/i.test(t);
    if (docId === "12th")
      return /(higher secondary|hsc\b|h\.s\.c|class\s*xii|class\s*12\b|12th|twelfth|intermediate certificate|senior secondary)/i.test(t);
    if (docId === "degree_cert")
      return /(bachelor of|degree certificate|conferred.*degree|awarded.*degree|convocation|provisional degree)/i.test(t)
          && !/(semester|mark\s*sheet|grade card|transcript)/i.test(t);
    if (docId === "masters_sem1")
      return /(master of|m\.tech\b|m\.e\b|m\.b\.a\b|mba\b|mtech\b|m\.sc\b|msc\b|m\.com\b)/i.test(t)
          && /(semester.{0,15}(1\b|i\b|first)|first.{0,15}semester|1st\s*sem\b|sem\s*i\b|sem\s*1\b)/i.test(t);
    if (docId.startsWith("grad_sem_")) {
      const n    = parseInt(docId.split("_").pop());
      const ords = ["","first","second","third","fourth","fifth","sixth","seventh","eighth"];
      const hasGrad = /(b\.?tech\b|b\.?e\b|b\.?sc\b|b\.?com\b|b\.?a\b|bachelor|engineering program|b\.?arch\b|b\.?pharm\b|undergraduate)/i.test(t);
      const hasSem  = new RegExp(
        `(semester.{0,15}${n}\\b|${n}\\s*(st|nd|rd|th)?.{0,10}semester|sem.{0,5}${n}\\b|${ords[n]}.{0,10}semester)`, "i"
      ).test(t);
      return hasGrad && hasSem && !/(master|mba\b|msc\b|mtech\b)/i.test(t);
    }
    if (docId.startsWith("joining_"))
      return /(joining\s*(date|letter|report)|date\s*of\s*joining|you\s*are\s*(appointed|selected|offered)|appointment\s*letter|offer\s*of\s*(employment|appointment|position)|we\s*are\s*pleased\s*to\s*(offer|inform)|reporting\s*(date|on))/i.test(t);
    if (docId.startsWith("exp_cert_"))
      return /(experience\s*certificate|relieving\s*letter|this\s*is\s*to\s*certify.{0,200}(worked|employed|served|associated)|service\s*certificate|employment\s*certificate|has\s*been\s*(employed|working)|was\s*employed\s*with)/i.test(t);
    if (docId.startsWith("salary_"))
      return /(salary\s*slip|pay\s*slip|payslip|pay\s*stub|earnings\s*statement|gross\s*(salary|pay)|net\s*(salary|pay)|basic\s*(salary|pay)|salary\s*statement|monthly\s*(salary|pay)|payment\s*for\s*the\s*month)/i.test(t);
    return false;
  };

  // Main async analysis — extract text from every file, then classify
  const analyse = async () => {
    if (!window.pdfjsLib && !window.Tesseract) {
      alert("OCR libraries failed to load. Check your internet connection and refresh the page.");
      return;
    }
    setAnalysing(true);
    setFileProgress({});

    const extractedTexts = {};
    for (const file of uploadedFiles) {
      setFileProgress(p => ({ ...p, [file.name]: { status:"extracting", pct:0 } }));
      const text = await extractText(file, pct =>
        setFileProgress(p => ({ ...p, [file.name]: { status:"extracting", pct } }))
      );
      extractedTexts[file.name] = text;
      setFileProgress(p => ({ ...p, [file.name]: { status:"done", pct:100, chars:text.trim().length } }));
    }

    // For multi-job work-ex, pool all files matching each doc type and assign by index
    const pool = {
      joining:  uploadedFiles.filter(f => matchContent(extractedTexts[f.name] || "", "joining_0")),
      exp_cert: uploadedFiles.filter(f => matchContent(extractedTexts[f.name] || "", "exp_cert_0")),
      salary:   uploadedFiles.filter(f => matchContent(extractedTexts[f.name] || "", "salary_0")),
    };

    const analyzed = requiredDocs.map(doc => {
      // Work-experience docs: pull from pool by job index
      if (doc.id.startsWith("joining_")) {
        const j = parseInt(doc.id.split("_")[1]);
        const f = pool.joining[j];
        return f
          ? { ...doc, status:"Received", file:f.name, remark:`Joining/appointment language found in "${f.name}"` }
          : { ...doc, status:"Missing",  file:null,   remark:"No joining letter content detected. Request from candidate." };
      }
      if (doc.id.startsWith("exp_cert_")) {
        const j = parseInt(doc.id.split("_")[2]);
        const f = pool.exp_cert[j];
        return f
          ? { ...doc, status:"Received", file:f.name, remark:`Experience/relieving certificate content found in "${f.name}"` }
          : { ...doc, status:"Missing",  file:null,   remark:"No experience certificate content detected. Request from candidate." };
      }
      if (doc.id.startsWith("salary_")) {
        const j = parseInt(doc.id.split("_")[1]);
        const f = pool.salary[j];
        return f
          ? { ...doc, status:"Received", file:f.name, remark:`Salary slip content found in "${f.name}"` }
          : { ...doc, status:"Missing",  file:null,   remark:"No salary slip content detected. Request from candidate." };
      }

      // All other docs: find first file whose content matches
      const matched = uploadedFiles.find(f => matchContent(extractedTexts[f.name] || "", doc.id));
      if (!doc.required) {
        return matched
          ? { ...doc, status:"Received (Optional)", file:matched.name, remark:`Identified via content in "${matched.name}"` }
          : { ...doc, status:"Not Submitted",        file:null,          remark:doc.note || "Optional — not submitted" };
      }
      if (matched)
        return { ...doc, status:"Received", file:matched.name, remark:`Content matched in "${matched.name}"` };
      if (doc.id === "degree_cert" && profile.isIntern)
        return { ...doc, status:"Pending", file:null, remark:"Intern candidate — degree may not yet be conferred. Provisional certificate or enrollment proof is acceptable." };
      // If OCR extracted very little text, flag differently so user knows it may be a scan/quality issue
      const anyLowQuality = uploadedFiles.some(f => (extractedTexts[f.name] || "").trim().length < 40);
      return {
        ...doc, status:"Missing", file:null,
        remark: anyLowQuality
          ? "Document not identified. Some uploads had very little extractable text — ensure files are clear and not password-protected."
          : "Document content not found in any uploaded file. Request from candidate.",
      };
    });

    const checks = buildConsistencyChecks(analyzed);
    setResults({ docs:analyzed, checks, extractedTexts });
    setAnalysing(false);
  };

  const buildConsistencyChecks = (analyzed) => {
    const checks  = [];
    const missing = analyzed.filter(d => d.status === "Missing");
    checks.push(
      missing.length === 0
        ? { check:"Overall Document Completeness", status:"Complete",   severity:"LOW",    detail:`All ${analyzed.filter(d=>d.required).length} required documents identified via content analysis. Candidate file is ready for next stage.` }
        : { check:"Overall Document Completeness", status:"Incomplete", severity:"HIGH",   detail:`${missing.length} required document(s) not found: ${missing.slice(0,3).map(d=>d.label).join(", ")}${missing.length>3?` + ${missing.length-3} more`:""}. Do not proceed without these.` }
    );
    const gradDocs = analyzed.filter(d => d.category === "Graduation");
    const recGrad  = gradDocs.filter(d => d.status === "Received");
    if (gradDocs.length > 0) {
      checks.push(
        recGrad.length === gradDocs.length
          ? { check:"Graduation Marksheets — Completeness", status:"Consistent",   severity:"LOW",    detail:`All ${gradDocs.length} semester marksheets identified across uploaded documents.` }
          : recGrad.length > 0
            ? { check:"Graduation Marksheets — Completeness", status:"Inconsistent", severity:"HIGH",   detail:`Only ${recGrad.length} of ${gradDocs.length} semesters detected. Missing: ${gradDocs.filter(d=>d.status==="Missing").map(d=>`Sem ${d.id.split("_").pop()}`).join(", ")}.` }
            : { check:"Graduation Marksheets — Completeness", status:"Not Verified", severity:"MEDIUM", detail:"No graduation semester content identified. Files may be scanned at low quality or mislabelled — request re-upload." }
      );
    }
    if (profile.isIntern) {
      const deg = analyzed.find(d => d.id === "degree_cert");
      checks.push({
        check:"Intern Status — Degree Certificate",
        status:   deg?.status === "Received" ? "Note" : "Pending",
        severity: "MEDIUM",
        detail:   deg?.status === "Received"
          ? "Degree certificate content detected despite intern status. Confirm graduation has already been conferred; otherwise this may be a provisional copy."
          : "Active intern — degree may not yet be issued. Enrollment proof or provisional certificate is acceptable at this stage.",
      });
    }
    if (profile.hasWorkEx) {
      const workDocs = analyzed.filter(d => d.category === "Work Experience");
      const missWork = workDocs.filter(d => d.status === "Missing");
      checks.push(
        missWork.length === 0
          ? { check:"Work Experience Documents", status:"Consistent",   severity:"LOW",  detail:`All work experience documents for ${profile.jobCount} job(s) verified via document content.` }
          : { check:"Work Experience Documents", status:"Inconsistent", severity:"HIGH", detail:`${missWork.length} work experience document(s) not found: ${missWork.map(d=>d.label).join(", ")}. Cannot verify claimed employment history.` }
      );
      if (profile.jobCount > 1)
        checks.push({ check:"Multi-Job Tenure Consistency", status:"Review", severity:"MEDIUM", detail:`${profile.jobCount} employer documents submitted. Manually verify joining/relieving dates across experience certificates for timeline gaps or overlaps against the CV.` });
    }
    if (profile.hasMasters) {
      const m = analyzed.find(d => d.id === "masters_sem1");
      checks.push({
        check:"Masters Education — Marksheet",
        status:   m?.status === "Received (Optional)" ? "Submitted" : "Not Submitted",
        severity: "LOW",
        detail:   m?.status === "Received (Optional)"
          ? `Masters Semester 1 marksheet identified in "${m.file}". Verify institution and programme match CV.`
          : "Masters Semester 1 marksheet not uploaded. Optional — no action required unless the role mandates verified postgraduate credentials.",
      });
    }
    return checks;
  };

  const handleFiles = (files) => {
    const arr = Array.from(files);
    setUploadedFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !names.has(f.name))];
    });
  };
  const removeFile = (name) => setUploadedFiles(prev => prev.filter(f => f.name !== name));

  const statusStyle = (s) => ({
    "Received":           { bg:C.Lbg, bd:C.Lbd, col:C.L, label:"Received"            },
    "Received (Optional)":{ bg:C.Bbg, bd:C.Bbd, col:C.B, label:"Received (Optional)" },
    "Missing":            { bg:C.Hbg, bd:C.Hbd, col:C.H, label:"Missing"             },
    "Not Submitted":      { bg:C.Mbg, bd:C.Mbd, col:C.M, label:"Not Submitted"       },
    "Pending":            { bg:C.Mbg, bd:C.Mbd, col:C.M, label:"Pending"             },
  }[s] || { bg:C.bg, bd:C.bdr, col:C.t2, label:s });

  const consistencyStatusStyle = (s) => ({
    "Complete":     { bg:C.Lbg,    bd:C.Lbd,    col:C.L  },
    "Consistent":   { bg:C.Lbg,    bd:C.Lbd,    col:C.L  },
    "Submitted":    { bg:C.Bbg,    bd:C.Bbd,    col:C.B  },
    "Incomplete":   { bg:C.Hbg,    bd:C.Hbd,    col:C.H  },
    "Inconsistent": { bg:C.Hbg,    bd:C.Hbd,    col:C.H  },
    "Not Verified": { bg:C.Mbg,    bd:C.Mbd,    col:C.M  },
    "Review":       { bg:C.Mbg,    bd:C.Mbd,    col:C.M  },
    "Note":         { bg:C.Pbg,    bd:C.Pbd,    col:C.P  },
    "Pending":      { bg:C.Mbg,    bd:C.Mbd,    col:C.M  },
    "Not Submitted":{ bg:"#F5F5F5",bd:"#DDD",   col:"#999"},
  }[s] || { bg:C.bg, bd:C.bdr, col:C.t2 });

  const severityStyle = (s) => ({
    "HIGH":   { bg:C.Hbg, bd:C.Hbd, col:C.H },
    "MEDIUM": { bg:C.Mbg, bd:C.Mbd, col:C.M },
    "LOW":    { bg:C.Lbg, bd:C.Lbd, col:C.L },
  }[s] || { bg:C.bg, bd:C.bdr, col:C.t2 });

  const totalRequired = requiredDocs.filter(d => d.required).length;
  const catGroups     = results ? [...new Set(results.docs.map(d => d.category))] : [];
  const doneCount     = Object.values(fileProgress).filter(p => p.status === "done").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontFamily:FUI, fontSize:14, fontWeight:700, color:C.t1 }}>Document Verification — AI Analysis</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
            <div style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>OCR-powered content extraction · reads actual document text, not just filenames</div>
            <span style={{ fontFamily:F, fontSize:8, color:libsError ? C.H : libsReady ? C.L : C.M, background:libsError ? C.Hbg : libsReady ? C.Lbg : C.Mbg, border:`1px solid ${libsError ? C.Hbd : libsReady ? C.Lbd : C.Mbd}`, borderRadius:3, padding:"1px 6px" }}>
              {libsError ? "OCR Load Failed" : libsReady ? "OCR Ready" : "Loading OCR…"}
            </span>
          </div>
        </div>
        {results && (
          <button onClick={() => { setResults(null); setUploadedFiles([]); setFileProgress({}); }}
            style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.t2, background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:6, padding:"6px 14px", cursor:"pointer" }}>
            Reset
          </button>
        )}
      </div>

      {/* Candidate profile config */}
      <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:"14px 18px" }}>
        <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.1em", marginBottom:10 }}>CANDIDATE PROFILE</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:14, alignItems:"flex-end" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.t2 }}>Graduation Semesters</div>
            <div style={{ display:"flex", gap:4 }}>
              {[6,8].map(n => (
                <button key={n} onClick={() => setProfile(p => ({...p, gradSemesters:n}))}
                  style={{ fontFamily:F, fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:4, cursor:"pointer", border:`1.5px solid ${profile.gradSemesters===n ? C.red : C.bdr}`, background:profile.gradSemesters===n ? C.redL : C.bg, color:profile.gradSemesters===n ? C.red : C.t2 }}>
                  {n} Sems
                </button>
              ))}
            </div>
          </div>
          {[{ key:"isIntern", label:"Active Intern" }, { key:"hasMasters", label:"Has Masters" }, { key:"hasWorkEx", label:"Work Experience" }].map(({ key, label }) => (
            <div key={key} style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <div style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.t2 }}>{label}</div>
              <button onClick={() => setProfile(p => ({...p, [key]:!p[key]}))}
                style={{ fontFamily:F, fontSize:10, fontWeight:600, padding:"4px 12px", borderRadius:4, cursor:"pointer", border:`1.5px solid ${profile[key] ? C.L : C.bdr}`, background:profile[key] ? C.Lbg : C.bg, color:profile[key] ? C.L : C.t2 }}>
                {profile[key] ? "Yes" : "No"}
              </button>
            </div>
          ))}
          {profile.hasWorkEx && (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <div style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.t2 }}>No. of Jobs</div>
              <div style={{ display:"flex", gap:4 }}>
                {[1,2,3,4].map(n => (
                  <button key={n} onClick={() => setProfile(p => ({...p, jobCount:n}))}
                    style={{ fontFamily:F, fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:4, cursor:"pointer", border:`1.5px solid ${profile.jobCount===n ? C.B : C.bdr}`, background:profile.jobCount===n ? C.Bbg : C.bg, color:profile.jobCount===n ? C.B : C.t2 }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginLeft:"auto", background:C.Hbg, border:`1px solid ${C.Hbd}`, borderRadius:5, padding:"6px 14px", textAlign:"center" }}>
            <div style={{ fontFamily:F, fontSize:8, color:C.t3, letterSpacing:"0.08em" }}>REQUIRED DOCS</div>
            <div style={{ fontFamily:F, fontSize:18, fontWeight:700, color:C.red }}>{totalRequired}</div>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      {!results && !analysing && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          style={{ background:dragging ? C.Hbg : C.surf, border:`2px dashed ${dragging ? C.red : C.bdr2}`, borderRadius:8, padding:"32px 20px", textAlign:"center", transition:"all 0.2s" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
          <div style={{ fontFamily:FUI, fontSize:12, fontWeight:600, color:C.t1, marginBottom:4 }}>Drag & drop candidate documents here</div>
          <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginBottom:14 }}>PDF (text or scanned), JPG, PNG — marksheets, certificates, salary slips, experience letters</div>
          <label style={{ fontFamily:FUI, fontSize:11, fontWeight:600, color:C.red, background:C.redL, border:`1.5px solid ${C.redM}`, borderRadius:5, padding:"8px 18px", cursor:"pointer" }}>
            Browse Files
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.bmp,.doc,.docx" style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
          </label>
        </div>
      )}

      {/* File list + analyse button (pre-analysis) */}
      {uploadedFiles.length > 0 && !results && !analysing && (
        <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.1em" }}>QUEUED FILES — {uploadedFiles.length}</div>
            <label style={{ fontFamily:FUI, fontSize:10, fontWeight:600, color:C.B, cursor:"pointer" }}>
              + Add More
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.bmp,.doc,.docx" style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
            </label>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
            {uploadedFiles.map(f => (
              <div key={f.name} style={{ display:"flex", alignItems:"center", gap:5, background:C.Bbg, border:`1px solid ${C.Bbd}`, borderRadius:4, padding:"4px 8px" }}>
                <span style={{ fontFamily:F, fontSize:9, color:C.B }}>{f.name}</span>
                <button onClick={() => removeFile(f.name)} style={{ background:"none", border:"none", color:C.t3, cursor:"pointer", fontSize:13, lineHeight:1, padding:0 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ background:C.Mbg, border:`1px solid ${C.Mbd}`, borderRadius:5, padding:"7px 12px", marginBottom:12, fontFamily:FUI, fontSize:10, color:C.Mt }}>
            OCR will read the text inside each document. Scanned images may take 20–60 s per file. Ensure documents are not password-protected.
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={analyse} disabled={!libsReady}
              style={{ fontFamily:FUI, fontSize:12, fontWeight:700, color:"#fff", background:libsReady ? C.red : C.t3, border:"none", borderRadius:6, padding:"10px 26px", cursor:libsReady?"pointer":"not-allowed" }}>
              {libsError ? "Analyse Documents (OCR unavailable)" : libsReady ? "Analyse Documents" : "Loading OCR libraries…"}
            </button>
          </div>
        </div>
      )}

      {uploadedFiles.length === 0 && !results && !analysing && (
        <div style={{ textAlign:"center", fontFamily:FUI, fontSize:11, color:C.t3 }}>
          Upload documents above, then click <strong>Analyse Documents</strong>
        </div>
      )}

      {/* Extraction progress (shown while analysing) */}
      {analysing && (
        <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.1em" }}>EXTRACTING DOCUMENT CONTENT</div>
            <div style={{ fontFamily:F, fontSize:9, color:C.t2 }}>{doneCount} / {uploadedFiles.length} complete</div>
          </div>
          {uploadedFiles.map(f => {
            const p = fileProgress[f.name] || { status:"queued", pct:0, chars:0 };
            return (
              <div key={f.name} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontFamily:F, fontSize:9, color:C.t1, maxWidth:"70%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                  <span style={{ fontFamily:F, fontSize:9, color:p.status==="done" ? C.L : p.status==="extracting" ? C.B : C.t3 }}>
                    {p.status === "done" ? `Done · ${p.chars} chars` : p.status === "extracting" ? `${p.pct}%` : "Queued"}
                  </span>
                </div>
                <div style={{ height:3, background:C.bdr, borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${p.pct}%`, background:p.status==="done" ? C.L : C.red, transition:"width 0.25s", borderRadius:2 }}/>
                </div>
              </div>
            );
          })}
          {doneCount < uploadedFiles.length && (
            <div style={{ fontFamily:FUI, fontSize:10, color:C.t3, marginTop:8, fontStyle:"italic" }}>
              Scanned PDFs and images may take 30–60 s each for OCR…
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            {[
              { label:"Required",      value:results.docs.filter(d=>d.required).length,                                     col:C.t1, bg:C.surf },
              { label:"Received",      value:results.docs.filter(d=>d.status==="Received").length,                          col:C.L,  bg:C.Lbg },
              { label:"Missing",       value:results.docs.filter(d=>d.status==="Missing").length,                           col:C.H,  bg:C.Hbg },
              { label:"Pending/Other", value:results.docs.filter(d=>["Pending","Not Submitted"].includes(d.status)).length, col:C.M,  bg:C.Mbg },
            ].map(({ label, value, col, bg }) => (
              <div key={label} style={{ flex:1, background:bg, border:`1.5px solid ${C.bdr}`, borderRadius:7, padding:"10px 14px" }}>
                <div style={{ fontFamily:F, fontSize:8, color:C.t3, letterSpacing:"0.1em", marginBottom:3 }}>{label.toUpperCase()}</div>
                <div style={{ fontFamily:F, fontSize:22, fontWeight:700, color:col }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", borderBottom:`1.5px solid ${C.bdr}`, marginBottom:14 }}>
            {[{ id:"docs", label:"Document Status" }, { id:"consistency", label:"CV Consistency Check" }].map(({ id, label }) => {
              const active     = subTab === id;
              const issueCount = id === "consistency" ? results.checks.filter(c => c.severity === "HIGH").length : 0;
              return (
                <button key={id} onClick={() => setSubTab(id)}
                  style={{ fontFamily:FUI, fontSize:11, fontWeight:600, padding:"10px 16px", background:"transparent", border:"none", cursor:"pointer", borderBottom:active ? `2.5px solid ${C.red}` : "2.5px solid transparent", color:active ? C.red : C.t2 }}>
                  {label}
                  {issueCount > 0 && (
                    <span style={{ marginLeft:5, background:C.Hbg, border:`1px solid ${C.Hbd}`, color:C.H, fontFamily:F, fontSize:8, borderRadius:3, padding:"1px 5px" }}>
                      {issueCount} Issue{issueCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {subTab === "docs" && (
            <div style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:8, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"38% 20% 1fr", background:C.bg, borderBottom:`1.5px solid ${C.bdr}`, padding:"7px 16px" }}>
                {["Document", "Status", "Remarks"].map(h => (
                  <div key={h} style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.1em", fontWeight:600 }}>{h}</div>
                ))}
              </div>
              {catGroups.map((cat, ci) => {
                const catDocs = results.docs.filter(d => d.category === cat);
                return (
                  <div key={cat}>
                    <div style={{ background:C.bg, borderBottom:`1px solid ${C.bdr}`, borderTop:ci > 0 ? `1.5px solid ${C.bdr2}` : "none", padding:"6px 16px", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:F, fontSize:9, color:C.t3, letterSpacing:"0.1em", fontWeight:600 }}>{cat.toUpperCase()}</span>
                      <span style={{ fontFamily:F, fontSize:8, color:C.t3 }}>({catDocs.length} doc{catDocs.length !== 1 ? "s" : ""})</span>
                    </div>
                    {catDocs.map((doc, i) => {
                      const ss = statusStyle(doc.status);
                      const isLastRow = i === catDocs.length - 1 && ci === catGroups.length - 1;
                      return (
                        <div key={doc.id} style={{ display:"grid", gridTemplateColumns:"38% 20% 1fr", padding:"10px 16px", borderBottom:isLastRow ? "none" : `1px solid ${C.bdr}`, alignItems:"center" }}>
                          <div style={{ fontFamily:FUI, fontSize:11, color:C.t1, fontWeight:doc.required ? 600 : 400 }}>
                            {doc.label}
                            {!doc.required && <span style={{ fontFamily:F, fontSize:8, color:C.t3, marginLeft:5 }}>(optional)</span>}
                          </div>
                          <div>
                            <span style={{ fontFamily:F, fontSize:9, fontWeight:600, color:ss.col, background:ss.bg, border:`1px solid ${ss.bd}`, borderRadius:4, padding:"2px 7px" }}>{ss.label}</span>
                          </div>
                          <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, lineHeight:1.45 }}>{doc.remark}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {subTab === "consistency" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {results.checks.map((check, i) => {
                const ss = consistencyStatusStyle(check.status);
                const sv = severityStyle(check.severity);
                return (
                  <div key={i} style={{ background:C.surf, border:`1.5px solid ${C.bdr}`, borderRadius:7, padding:"12px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div style={{ fontFamily:FUI, fontSize:11, fontWeight:700, color:C.t1 }}>{check.check}</div>
                      <div style={{ display:"flex", gap:5, flexShrink:0, marginLeft:12 }}>
                        <span style={{ fontFamily:F, fontSize:8, fontWeight:600, color:ss.col, background:ss.bg, border:`1px solid ${ss.bd}`, borderRadius:3, padding:"2px 7px" }}>{check.status}</span>
                        <span style={{ fontFamily:F, fontSize:8, fontWeight:600, color:sv.col, background:sv.bg, border:`1px solid ${sv.bd}`, borderRadius:3, padding:"2px 7px" }}>{check.severity}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:FUI, fontSize:10, color:C.t2, lineHeight:1.55 }}>{check.detail}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function SprintIQ() {
  const [tab,        setTab]        = useState("attrition");
  const [teamFilter, setTeamFilter] = useState(null);

  const navigateToTeam  = (team) => { setTeamFilter(team); setTab("attrition"); };
  const clearTeamFilter = ()     => setTeamFilter(null);

  const TABS = [
    { id:"attrition",        label:"Attrition Intelligence" },
    { id:"performance",      label:"Performance Evaluation" },
    { id:"mood",             label:"Daily Mood Survey"      },
    { id:"headcount",        label:"Headcount"              },
    { id:"cost",             label:"Cost at Risk"           },
    { id:"engagement",       label:"Engagement"             },
    { id:"docVerification",  label:"Doc Verification"       },
  ];

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FUI }}>
      {/* Top bar */}
      <div style={{ background:C.red, padding:"0 28px", display:"flex", justifyContent:"space-between", alignItems:"center", height:52 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
          <span style={{ fontFamily:F, fontSize:17, fontWeight:700, color:"#fff", letterSpacing:"0.04em" }}>Sprint<span style={{ opacity:0.65 }}>IQ</span></span>
          <span style={{ fontFamily:FUI, fontSize:10, color:"rgba(255,255,255,0.55)", letterSpacing:"0.1em" }}>HR INTELLIGENCE PLATFORM</span>
        </div>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          {[{l:"Model",v:"XGBoost v2.3"},{l:"AUC",v:"0.847"},{l:"Updated",v:"4 min ago"}].map(({l,v}) => (
            <div key={l} style={{ textAlign:"right" }}>
              <div style={{ fontFamily:F, fontSize:8, color:"rgba(255,255,255,0.45)", letterSpacing:"0.07em" }}>{l}</div>
              <div style={{ fontFamily:F, fontSize:11, color:"rgba(255,255,255,0.9)", fontWeight:500 }}>{v}</div>
            </div>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#6EE7A0", boxShadow:"0 0 0 3px rgba(110,231,160,0.3)" }}/>
            <span style={{ fontFamily:F, fontSize:10, color:"rgba(255,255,255,0.8)" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:C.surf, borderBottom:`1.5px solid ${C.bdr}`, padding:"0 28px", display:"flex", justifyContent:"space-between", alignItems:"center", overflowX:"auto" }}>
        <div style={{ display:"flex" }}>
          {TABS.map(t => {
            const active    = tab === t.id;
            const accentCol = (t.id === "performance" || t.id === "mood") ? C.B : C.red;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== "attrition") setTeamFilter(null); }}
                style={{ fontFamily:FUI, fontSize:11, fontWeight:600, padding:"14px 16px", background:"transparent", border:"none", cursor:"pointer", borderBottom:active?`2.5px solid ${accentCol}`:"2.5px solid transparent", color:active?accentCol:C.t2, transition:"all 0.15s", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
                {t.label}
                {t.id === "attrition" && teamFilter && <span style={{ fontFamily:F, fontSize:8, color:C.red, background:C.redL, border:`1px solid ${C.redM}`, borderRadius:3, padding:"1px 5px" }}>● {teamFilter}</span>}
                {t.id === "mood"      && <span style={{ fontFamily:F, fontSize:8, color:C.B, background:C.Bbg, border:`1px solid ${C.Bbd}`, borderRadius:3, padding:"1px 5px" }}>10AM</span>}
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:C.L }}/>
          <span style={{ fontFamily:FUI, fontSize:11, color:C.t2 }}>PaySprint · 120 FTE · May 2025</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"22px 28px", maxWidth:1320, margin:"0 auto" }}>
        {tab === "attrition"       && <AttritionTab teamFilter={teamFilter} onClearFilter={clearTeamFilter}/>}
        {tab === "performance"     && <><PerformanceTab/><NLPPanel/></>}
        {tab === "mood"            && <MoodDashboard/>}
        {tab === "headcount"       && <HeadcountTab navigateToTeam={navigateToTeam}/>}
        {tab === "cost"            && <CostAtRiskTab/>}
        {tab === "engagement"      && <EngagementTab navigateToTeam={navigateToTeam}/>}
        {tab === "docVerification" && <DocVerificationTab/>}
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1.5px solid ${C.bdr}`, background:C.surf, padding:"12px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ background:C.red, color:"#fff", fontFamily:F, fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:3 }}>SPRINTIQ</div>
          <span style={{ fontFamily:FUI, fontSize:10, color:C.t3 }}>Internal · PaySprint · v0.9 · Pilot</span>
        </div>
        <span style={{ fontFamily:FUI, fontSize:10, color:C.t3, fontStyle:"italic" }}>HR augmentation, not replacement. Every action stays with a human.</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.bdr2}; border-radius:3px; }
        input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; width:100%; height:100%; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:transparent; cursor:pointer; }
        input[type=range]::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:transparent; border:none; cursor:pointer; }
        input[type=range]:focus { outline:none; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
