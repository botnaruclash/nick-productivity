import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const KEY = "grindlog-v3";
const PROFILE_KEY = "grindlog-profile-v1";
const loadProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null"); } catch { return null; } };
const saveProfile = (p) => localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const persist = (d) => localStorage.setItem(KEY, JSON.stringify(d));

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
  { id:"work",         label:"Work",         icon:"⚡", color:"#0070f3" },
  { id:"calisthenics", label:"Calisthenics",  icon:"💪", color:"#ee0000" },
  { id:"swimming",     label:"Înot",          icon:"🏊", color:"#0070f3" },
  { id:"climbing",     label:"Climbing",      icon:"🧗", color:"#00b341" },
  { id:"violin",       label:"Vioară",        icon:"🎻", color:"#7928ca" },
  { id:"church",       label:"Biserică",      icon:"⛪", color:"#f5a623" },
  { id:"morning",      label:"Rutină dim.",   icon:"🌅", color:"#f5a623" },
  { id:"evening",      label:"Rutină seară",  icon:"🌆", color:"#f5a623" },
  { id:"other",        label:"Altceva",       icon:"◆",  color:"#888" },
];

const MOODS = ["💀","😐","🙂","😤","🔥"];
const MOOD_LABELS = ["Mort","Ok","Bine","Motivat","Full tank"];

const SCHEDULE = {
  0:[{time:"06:00-07:00",label:"Rutină dimineață"},{time:"08:30-13:00",label:"Biserică",fixed:true},{time:"13:00-21:00",label:"Work + Recuperare"},{time:"21:00-22:00",label:"Rutină seară"},{time:"22:00",label:"Somn"}],
  1:[{time:"06:00-07:00",label:"Rutină dimineață"},{time:"07:00-10:00",label:"Calisthenics",fixed:true},{time:"10:00-21:00",label:"Work 6h+"},{time:"21:00-22:00",label:"Rutină seară"},{time:"22:00",label:"Somn"}],
  2:[{time:"06:00-07:00",label:"Rutină dimineață"},{time:"07:00-10:00",label:"Calisthenics",fixed:true},{time:"10:00-16:30",label:"Work"},{time:"16:30-18:00",label:"Vioară",fixed:true},{time:"18:00-21:00",label:"Work"},{time:"21:00-22:00",label:"Rutină seară"},{time:"22:00",label:"Somn"}],
  3:[{time:"06:00-07:00",label:"Rutină dimineață"},{time:"07:00-11:00",label:"Înot",fixed:true},{time:"11:00-16:30",label:"Work"},{time:"16:30-20:00",label:"Climbing",fixed:true},{time:"20:00-21:00",label:"Work"},{time:"21:00-22:00",label:"Rutină seară"},{time:"22:00",label:"Somn"}],
  4:[{time:"06:00-07:00",label:"Rutină dimineață"},{time:"07:00-10:00",label:"Calisthenics",fixed:true},{time:"10:00-12:30",label:"Work"},{time:"12:30-14:30",label:"Vioară",fixed:true},{time:"14:30-21:00",label:"Work"},{time:"21:00-22:00",label:"Rutină seară"},{time:"22:00",label:"Somn"}],
  5:[{time:"06:00-07:00",label:"Rutină dimineață"},{time:"07:00-10:00",label:"Calisthenics",fixed:true},{time:"10:00-21:00",label:"Work 6h+"},{time:"21:00-22:00",label:"Rutină seară"},{time:"22:00",label:"Somn"}],
  6:[{time:"06:00-07:00",label:"Rutină dimineață"},{time:"07:00-11:00",label:"Înot",fixed:true},{time:"12:00-15:30",label:"Climbing",fixed:true},{time:"15:30-21:00",label:"Work"},{time:"21:00-22:00",label:"Rutină seară"},{time:"22:00",label:"Somn"}],
};

const DAY_SHORT = ["Du","Lu","Ma","Mi","Jo","Vi","Sâ"];
const DAY_NAMES = ["Duminică","Luni","Marți","Miercuri","Joi","Vineri","Sâmbătă"];
const AVATARS = ["🧑","👦","🧔","👨","🧑‍💻","👨‍💻","🦁","🐺","🔥","⚡","💎","👑"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().split("T")[0];
const fmtDur = (m) => { if(!m) return "0m"; const h=Math.floor(m/60),mn=m%60; return h>0?`${h}h${mn>0?" "+mn+"m":""}`:mn+"m"; };
const getType = (id) => ACTIVITY_TYPES.find(a=>a.id===id)||ACTIVITY_TYPES[ACTIVITY_TYPES.length-1];
const fmtDate = (k) => new Date(k).toLocaleDateString("ro-RO",{day:"numeric",month:"short"});

// midnight reset check
const getMidnightKey = () => new Date().toISOString().split("T")[0];

// ─── STYLES — VERCEL ─────────────────────────────────────────────────────────
const V = {
  bg:        "#000000",
  surface:   "#0a0a0a",
  border:    "#1a1a1a",
  borderDark:"#2a2a2a",
  text:      "#ededed",
  textSub:   "#888888",
  textMute:  "#555555",
  blue:      "#3b82f6",
  green:     "#22c55e",
  red:       "#ef4444",
  amber:     "#f59e0b",
};

const S = {
  input: { width:"100%",background:"#111",border:"1px solid #1a1a1a",borderRadius:8,padding:"10px 13px",color:"#ededed",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color .15s" },
  btn:(c="#ededed")=>({ background:c,border:"none",borderRadius:8,padding:"10px 20px",color:c==="#ededed"?"#000":"#fff",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",letterSpacing:"-0.01em" }),
  ghost:{ background:"transparent",border:"1px solid #1a1a1a",borderRadius:8,padding:"10px 20px",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit" },
  card:{ background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:14,padding:22,marginBottom:14 },
  label:{ fontSize:11,color:"#555",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6,display:"block",fontWeight:500 },
  gold:"#f59e0b",
};


// ─── STREAK CALCULATOR ───────────────────────────────────────────────────────
function calcStreak(data) {
  const keys = Object.keys(data).sort().reverse();
  if(keys.length===0) return 0;
  let streak=0;
  const today=new Date();
  for(let i=0;i<365;i++){
    const d=new Date(today);
    d.setDate(d.getDate()-i);
    const k=d.toISOString().split("T")[0];
    const dd=data[k];
    const hasActivity=dd&&((dd.activities||[]).length>0||(dd.sleep||[]).length>0||(dd.food||[]).length>0);
    if(hasActivity) streak++;
    else if(i>0) break; // allow today to be empty but break on any past gap
  }
  return streak;
}

// ─── STARS ───────────────────────────────────────────────────────────────────
function Stars({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(s=>(
        <button key={s} onClick={()=>onChange&&onChange(s)} style={{background:"none",border:"none",cursor:onChange?"pointer":"default",fontSize:20,color:s<=value?"#f59e0b":"#222",padding:0,transform:s<=value?"scale(1.1)":"scale(1)",transition:"all .15s"}}>★</button>
      ))}
    </div>
  );
}

// ─── SLEEP TRACKER ────────────────────────────────────────────────────────────
function SleepTracker({ entries, onAdd, onDelete }) {
  const [hours, setHours] = useState(8);
  const [label, setLabel] = useState("noapte");
  const total = entries.reduce((s,e)=>s+e.hours,0);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:28,fontWeight:700,color:"#5A6EBF"}}>{total.toFixed(1)}h</div>
          <div style={{fontSize:11,color:"#444",marginTop:2}}>total somn azi</div>
        </div>
        <div style={{fontSize:36}}>🌙</div>
      </div>

      <div style={{marginBottom:14}}>
        <span style={S.label}>Ore dormite: <span style={{color:"#5A6EBF",fontWeight:700}}>{hours}h</span></span>
        <input type="range" min={0.5} max={12} step={0.5} value={hours}
          onChange={e=>setHours(parseFloat(e.target.value))}
          style={{width:"100%",accentColor:"#5A6EBF",marginBottom:8}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#333"}}>
          <span>0.5h</span><span>6h</span><span>12h</span>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {["noapte","siestă","altul"].map(l=>(
          <button key={l} onClick={()=>setLabel(l)} style={{
            flex:1,padding:"8px 0",borderRadius:8,fontFamily:"inherit",fontSize:12,cursor:"pointer",
            border:label===l?"1px solid #5A6EBF":"1px solid #1e1e1e",
            background:label===l?"#5A6EBF18":"transparent",
            color:label===l?"#5A6EBF":"#444",
          }}>{l}</button>
        ))}
      </div>

      <button onClick={()=>onAdd({id:Date.now(),hours,label,time:new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"})})}
        style={{...S.btn("#5A6EBF"),color:"#fff",width:"100%",marginBottom:12}}>
        + Adaugă somn
      </button>

      {entries.map(e=>(
        <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"#0a0a0a",borderRadius:8,marginBottom:6,border:"1px solid #1a1a1a"}}>
          <span style={{fontSize:13,color:"#0070f3"}}>🌙 {e.hours}h <span style={{color:"#444",fontSize:11}}>· {e.label}</span></span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:11,color:"#555"}}>{e.time}</span>
            <button onClick={()=>onDelete(e.id)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:14}}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── WATER TRACKER ────────────────────────────────────────────────────────────
function WaterTracker({ ml, onAdd }) {
  const liters = (ml/1000).toFixed(2);
  const options = [
    {label:"300ml",val:300},{label:"500ml",val:500},
    {label:"750ml",val:750},{label:"1.5L",val:1500},
  ];
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:32,fontWeight:700,color:"#0070f3"}}>{liters}L</div>
          <div style={{fontSize:11,color:"#444",marginTop:2}}>băut azi · reset automat la miezul nopții</div>
        </div>
        <div style={{fontSize:36}}>💧</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {options.map(o=>(
          <button key={o.val} onClick={()=>onAdd(o.val)} style={{
            padding:"14px 0",borderRadius:10,fontFamily:"inherit",fontSize:14,
            fontWeight:600,cursor:"pointer",border:"1px solid #1a1a1a",
            background:"#0a0a0a",color:"#0070f3",transition:"all .2s",
          }}>+ {o.label}</button>
        ))}
      </div>
      {ml>0&&(
        <div style={{marginTop:16,height:6,background:"#141414",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(ml/3000*100,100)}%`,background:"#0070f3",borderRadius:3,transition:"width .4s"}}/>
        </div>
      )}
    </div>
  );
}

// ─── FOOD LOG ────────────────────────────────────────────────────────────────
function FoodLog({ entries, onAdd, onDelete, activities }) {
  const [text,setText]=useState("");
  const [grams,setGrams]=useState("");
  const [analyses,setAnalyses]=useState([]);
  const [loading,setLoading]=useState(false);

  const analyzeNutrition = async () => {
    if(entries.length===0) return;
    setLoading(true);
    const foodList = entries.map(e=>`${e.text} - ${e.grams}g`).join("\n");
    const sportList = activities.filter(a=>["calisthenics","swimming","climbing"].includes(a.type))
      .map(a=>`${getType(a.type).label} ${fmtDur(a.duration)}${a.steps?" "+a.steps+" pasi":""}`).join(", ")||"niciun sport azi";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`Ești nutriționist sportiv pentru un tânăr de 18 ani, ~70kg, activ fizic. Analizează mâncarea și oferă EXACT în acest format (fiecare pe linie nouă):
CALORII: ~Xkcal
PROTEINE: ~Xg
CARBOHIDRAȚI: ~Xg
GRĂSIMI: ~Xg
POTASIU: ~Xmg
STATUS: deficit/surplus/echilibru față de efort
LIPSĂ: ce nutrienți lipsesc
RECOMANDARE: o propoziție concretă
Fii direct, în română, fără introducere.`,
          messages:[{role:"user",content:`Mâncare:\n${foodList}\nSport azi: ${sportList}\nAnaliză:`}],
        }),
      });
      const d=await res.json();
      let result;
      if(d.error) result="API error: "+d.error.message;
      else if(d.content&&d.content.length>0) result=d.content.map(c=>c.text||"").join("").trim();
      else result="Raspuns gol de la API. Incearca din nou.";
      const ts=new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"});
      setAnalyses(prev=>[{id:Date.now(),text:result,time:ts},...prev]);
    } catch(e) {
      const ts=new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"});
      setAnalyses(prev=>[{id:Date.now(),text:"Eroare retea: "+e.message,time:ts},...prev]);
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Ce ai mâncat..." style={{...S.input,flex:2}}/>
        <input value={grams} onChange={e=>setGrams(e.target.value)} placeholder="g" type="number" style={{...S.input,width:70,flex:"none"}}/>
        <button onClick={()=>{if(text&&grams){onAdd({id:Date.now(),text,grams:parseInt(grams),time:new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"})});setText("");setGrams("");}}} style={{...S.btn("#C9614C"),color:"#fff",padding:"11px 16px"}}>+</button>
      </div>
      {entries.map(e=>(
        <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#0a0a0a",borderRadius:8,marginBottom:6,border:"1px solid #1a1a1a"}}>
          <div style={{fontSize:13,color:"#ccc"}}>{e.text} <span style={{color:"#C9614C",fontSize:11}}>{e.grams}g</span></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:11,color:"#555"}}>{e.time}</span>
            <button onClick={()=>onDelete(e.id)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:14}}>×</button>
          </div>
        </div>
      ))}
      {entries.length>0&&(
        <button onClick={analyzeNutrition} disabled={loading} style={{...S.btn("#C9614C"),color:"#fff",width:"100%",marginTop:12,opacity:loading?.6:1}}>
          {loading?"Se analizează...":"Analiză nutrițională AI"}
        </button>
      )}
      {analyses.map((a,i)=>(
        <div key={a.id} style={{marginTop:12,background:"#0a0a0a",border:"1px solid #f5a62333",borderRadius:10,padding:14}}>
          <div style={{fontSize:10,color:"#555",marginBottom:8,letterSpacing:1}}>ANALIZĂ · {a.time}{i===0&&<span style={{color:"#C9614C",marginLeft:8}}>· cea mai recentă</span>}</div>
          <div style={{fontSize:13,color:"#bbb",lineHeight:2,whiteSpace:"pre-wrap",fontVariantNumeric:"tabular-nums"}}>{a.text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── SPORT ANALYSIS ──────────────────────────────────────────────────────────
function SportAnalysis({ activities, sleep, food, sportNotes, onAddNote, onDeleteNote }) {
  const [noteText,setNoteText]=useState("");
  const [analyses,setAnalyses]=useState([]);
  const [loading,setLoading]=useState(false);
  const sportActs = activities.filter(a=>["calisthenics","swimming","climbing"].includes(a.type));

  const analyze = async () => {
    setLoading(true);
    const sportActsSummary = sportActs.map(a=>getType(a.type).label+": "+fmtDur(a.duration)+", rating "+a.rating+"/5, mood "+MOOD_LABELS[a.mood]+(a.steps?", "+a.steps+" pasi":"")+(a.comment?", \""+a.comment+"\"":"")).join("\n")||"(fara activitati sport logate)";
    const notesSummary = (sportNotes||[]).map(n=>`[${n.time}] ${n.text}`).join("\n")||"(fara notite sport)";
    const sleepTotal = sleep.reduce((s,e)=>s+e.hours,0);
    const foodList = food.map(f=>`${f.text} ${f.grams}g`).join(", ")||"nimic logat";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`Ești antrenor sportiv pentru un tânăr de 18 ani din Chișinău care face calisthenics, înot și climbing. Programul lui: Calisthenics Lu/Ma/Jo/Vi 07-10, Înot Mi/Sâ 07-11, Climbing Mi 16:30 și Sâ 12:00. Analizează efortul fizic al zilei bazat pe activitățile logate și notițele lui și oferă:
1) Scor efort fizic (1-10) și dacă e prea mult, ok sau cam lenos
2) Recomandări concrete: câți pași mai are de făcut, dacă poate face o siestă, ce trebuie ajustat
3) Cum afectează somnul și mâncarea recuperarea
4) Un singur sfat pentru mâine
Fii direct, ca un antrenor dur. Max 130 cuvinte. Română.`,
          messages:[{role:"user",content:`Activități sport logate:\n${sportActsSummary}\n\nNotițe sportive:\n${notesSummary}\n\nSomn: ${sleepTotal}h\nMâncare: ${foodList}\n\nAnaliză:`}],
        }),
      });
      const d=await res.json();
      let result;
      if(d.error) result="API error: "+d.error.message;
      else if(d.content&&d.content.length>0) result=d.content.map(c=>c.text||"").join("").trim();
      else result="Raspuns gol. Incearca din nou.";
      const ts=new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"});
      setAnalyses(prev=>[{id:Date.now(),text:result,time:ts},...prev]);
    } catch(e) {
      const ts=new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"});
      setAnalyses(prev=>[{id:Date.now(),text:"Eroare retea: "+e.message,time:ts},...prev]);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Sport notes journal */}
      <div style={{marginBottom:16}}>
        <span style={{...S.label,color:"#6DBE6D"}}>Jurnal sport — scrie ce ai făcut</span>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input value={noteText} onChange={e=>setNoteText(e.target.value)}
            placeholder="ex: 50 pull-ups, 10k pasi, am înotat 1h..."
            style={S.input} onKeyDown={e=>{if(e.key==="Enter"&&noteText){onAddNote({id:Date.now(),text:noteText,time:new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"})});setNoteText("");}}}/>
          <button onClick={()=>{if(noteText){onAddNote({id:Date.now(),text:noteText,time:new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"})});setNoteText("");}}} style={{...S.btn("#6DBE6D"),padding:"11px 16px"}}>+</button>
        </div>
        {(sportNotes||[]).map(n=>(
          <div key={n.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#0a0a0a",borderRadius:8,marginBottom:6,border:"1px solid #1a1a1a"}}>
            <span style={{fontSize:13,color:"#ccc"}}>{n.text}</span>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:11,color:"#333"}}>{n.time}</span>
              <button onClick={()=>onDeleteNote(n.id)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:14}}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Sport activities from log */}
      {sportActs.length>0&&(
        <div style={{marginBottom:16}}>
          <span style={S.label}>Activități logate</span>
          {sportActs.map(a=>{
            const t=getType(a.type);
            return(
              <div key={a.id} style={{padding:"9px 13px",background:"#0a0a0a",borderRadius:10,marginBottom:7,border:`1px solid ${t.color}22`,borderLeft:`3px solid ${t.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:t.color,fontWeight:600,fontSize:13}}>{t.icon} {t.label}</span>
                  <span style={{fontSize:12,color:"#555"}}>{fmtDur(a.duration)}</span>
                </div>
                {a.steps&&<div style={{fontSize:11,color:"#444",marginTop:3}}>👟 {a.steps.toLocaleString()} pași</div>}
              </div>
            );
          })}
        </div>
      )}

      <button onClick={analyze} disabled={loading} style={{...S.btn("#6DBE6D"),width:"100%",marginBottom:4,opacity:loading?.6:1}}>
        {loading?"Se analizează...":"Analiză efort fizic AI"}
      </button>
      <div style={{fontSize:11,color:"#333",textAlign:"center",marginBottom:12}}>Poți analiza de mai multe ori pe zi</div>

      {analyses.map((a,i)=>(
        <div key={a.id} style={{marginTop:10,background:"#0a0a0a",border:"1px solid #00b34122",borderRadius:10,padding:14}}>
          <div style={{fontSize:10,color:"#555",marginBottom:8,letterSpacing:1}}>ANALIZĂ · {a.time}{i===0&&<span style={{color:"#6DBE6D",marginLeft:8}}>· cea mai recentă</span>}</div>
          <div style={{fontSize:13,color:"#bbb",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{a.text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ACTIVITY FORM ────────────────────────────────────────────────────────────
function ActivityForm({ onSave, onCancel }) {
  const [type,setType]=useState("work");
  const [duration,setDuration]=useState("");
  const [steps,setSteps]=useState("");
  const [rating,setRating]=useState(3);
  const [mood,setMood]=useState(2);
  const [motivation,setMotivation]=useState(3);
  const [comment,setComment]=useState("");
  const [customTitle,setCustomTitle]=useState("");
  const t=getType(type);

  return (
    <div style={{...S.card,border:`1px solid ${t.color}33`,marginBottom:16,background:"#000"}}>
      <div style={{marginBottom:16}}>
        <span style={S.label}>Activitate</span>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {ACTIVITY_TYPES.map(a=>(
            <button key={a.id} onClick={()=>setType(a.id)} style={{padding:"7px 12px",borderRadius:50,fontFamily:"inherit",border:type===a.id?`1px solid ${a.color}`:"1px solid #1e1e1e",background:type===a.id?`${a.color}18`:"transparent",color:type===a.id?a.color:"#444",fontSize:12,cursor:"pointer",transition:"all .2s"}}>{a.icon} {a.label}</button>
          ))}
        </div>
      </div>
      {type==="other"&&(
        <div style={{marginBottom:16}}>
          <span style={S.label}>Titlu activitate *</span>
          <input value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="ex: Plimbare, Brawl Stars, Film..." style={S.input}/>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div><span style={S.label}>Durata (min)</span><input type="number" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="ex: 120" style={S.input}/></div>
        {["calisthenics","swimming","climbing"].includes(type)&&<div><span style={S.label}>Pași</span><input type="number" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="ex: 8000" style={S.input}/></div>}
      </div>
      <div style={{marginBottom:16}}><span style={S.label}>Calitate</span><Stars value={rating} onChange={setRating}/></div>

      <div style={{marginBottom:16}}>
        <span style={S.label}>Motivație — {["Mort","Scăzut","Mediu","Ridicat","Full tank"][motivation-1]}</span>
        <input type="range" min={1} max={5} value={motivation} onChange={e=>setMotivation(parseInt(e.target.value))} style={{width:"100%",accentColor:"#C9A84C"}}/>
      </div>
      <div style={{marginBottom:16}}><span style={S.label}>Comentariu</span><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Ce ai făcut, cum a mers..." rows={3} style={{...S.input,resize:"none",lineHeight:1.6}}/></div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>{if(!duration)return;if(type==="other"&&!customTitle)return;onSave({id:Date.now(),type,duration:parseInt(duration),steps:steps?parseInt(steps):null,rating,mood,motivation,comment,customTitle:type==="other"?customTitle:null,time:new Date().toLocaleTimeString("ro-RO",{hour:"2-digit",minute:"2-digit"}),timestamp:Date.now()});}} style={S.btn(t.color)}>Salvează</button>
        <button onClick={onCancel} style={S.ghost}>Anulează</button>
      </div>
    </div>
  );
}

// ─── ACTIVITY CARD ────────────────────────────────────────────────────────────
function ActivityCard({ activity, onDelete }) {
  const t=getType(activity.type);
  return (
    <div style={{background:"#0a0a0a",borderLeft:`3px solid ${t.color}`,borderRadius:14,padding:"18px 18px",marginBottom:10,border:"1px solid #1a1a1a",borderLeftColor:t.color}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:19}}>{t.icon}</span>
          <div>
            <div style={{color:t.color,fontWeight:600,fontSize:14,letterSpacing:"-0.01em"}}>{activity.customTitle||t.label}</div>
            <div style={{color:"#555",fontSize:12,marginTop:2}}>{activity.time} · {fmtDur(activity.duration)}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Stars value={activity.rating}/>
          <button onClick={()=>onDelete(activity.id)} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:16,padding:"2px 6px"}}>×</button>
        </div>
      </div>
      {activity.steps&&<div style={{marginTop:7,fontSize:12,color:"#555"}}>👟 {activity.steps.toLocaleString()} pași</div>}
      {activity.comment&&<div style={{marginTop:9,fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.5,borderTop:"1px solid #141414",paddingTop:9}}>"{activity.comment}"</div>}
      <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,color:"#2a2a2a"}}>Motivație</span>
        {[1,2,3,4,5].map(i=><div key={i} style={{width:13,height:3,borderRadius:2,background:i<=activity.motivation?"#ededed":"#222"}}/>)}
      </div>
    </div>
  );
}

// ─── AI COACH ─────────────────────────────────────────────────────────────────
function AICoach({ dayData }) {
  const [insight,setInsight]=useState("");
  const [loading,setLoading]=useState(false);
  const acts=dayData.activities||[];

  const analyze = async () => {
    setLoading(true);setInsight("");
    const actSummary=acts.map(a=>getType(a.type).label+": "+fmtDur(a.duration)+", rating "+a.rating+"/5, mood "+MOOD_LABELS[a.mood]+", motivatie "+a.motivation+"/5"+(a.steps?", "+a.steps+" pasi":"")+(a.comment?", \""+a.comment+"\"":"")).join("\n");
    const sleepTotal=(dayData.sleep||[]).reduce((s,e)=>s+e.hours,0);
    const foodList=(dayData.food||[]).map(f=>`${f.text} ${f.grams}g`).join(", ")||"nimic";
    const waterL=((dayData.water||0)/1000).toFixed(2);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`Ești coach de productivitate dur și sincer pentru un tânăr de 18 ani din Chișinău. Obiectiv: €100k vara asta prin vânzări B2B (AI lead triage pentru real estate). Program: Calisthenics Lu/Ma/Jo/Vi 07-10, Înot Mi/Sâ 07-11, Vioară Ma 16:30 și Jo 12:30, Climbing Mi 16:30 și Sâ 12:00, Biserică Du 08:30. Minimum 6h work/zi. Sistem: 10min staring at wall + 2h deep work repeat. Analizează ziua complet și oferă: 1) Evaluare sinceră (2 propoziții) 2) Ce a mers bine 3) Ce schimbi imediat 4) Recomandare pentru mâine. Fii direct, fără bullshit. Română. Max 150 cuvinte.`,messages:[{role:"user",content:`Activități:\n${actSummary||"niciuna"}\nSomn: ${sleepTotal}h\nApă: ${waterL}L\nMâncare: ${foodList}\n\nFeedback sincer:`}]})});
      const d=await res.json();
      if(d.error) setInsight("API error: "+d.error.message);
      else if(d.content&&d.content.length>0) setInsight(d.content.map(c=>c.text||"").join("").trim());
      else setInsight("Raspuns gol. Incearca din nou.");
    } catch(e) { setInsight("Eroare retea: "+e.message); }
    setLoading(false);
  };

  return (
    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:insight?16:0}}>
        <div>
          <div style={{fontSize:11,color:"#C9A84C",letterSpacing:2,textTransform:"uppercase"}}>AI Coach</div>
          <div style={{fontSize:13,color:"#555",marginTop:2}}>Feedback complet al zilei</div>
        </div>
        <button onClick={analyze} disabled={loading} style={{...S.btn(),fontSize:12,padding:"9px 15px",opacity:loading?.6:1}}>{loading?"...":"Analizează"}</button>
      </div>
      {insight&&<div style={{background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:10,padding:16,fontSize:13,color:"#ededed",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{insight}</div>}
    </div>
  );
}


// ─── PROGRESS PERCENT ────────────────────────────────────────────────────────
function ProgressPercent() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const duration = 10000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(Math.floor((elapsed / duration) * 100), 100);
      setPct(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);
  return (
    <div style={{fontSize:11,color:"#555",letterSpacing:"0.12em",fontVariantNumeric:"tabular-nums",fontFamily:"Inter,-apple-system,sans-serif"}}>
      {String(pct).padStart(3," ")}%
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function Onboarding({ name, onDone }) {
  const [opacity, setOpacity] = useState(0);
  const [screenOpacity, setScreenOpacity] = useState(1);
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = [
    { title: "Nick Productivity", sub: "Sistemul tău de optimizare." },
    { title: "Every day matters.", sub: "Consecvența construiește progresul." },
    { title: "€100k is no easy task.", sub: "Rămâi concentrat pe execuție." },
  ];

  useEffect(() => {
    // Sequence: msg1 0-3s, msg2 3-6s, msg3 6-10s, fadeout at 10s
    const timings = [
      { at: 0,    action: () => { setMsgIndex(0); setOpacity(0); } },
      { at: 50,   action: () => setOpacity(1) },
      { at: 2500, action: () => setOpacity(0) },
      { at: 3000, action: () => { setMsgIndex(1); setOpacity(0); } },
      { at: 3050, action: () => setOpacity(1) },
      { at: 5500, action: () => setOpacity(0) },
      { at: 6000, action: () => { setMsgIndex(2); setOpacity(0); } },
      { at: 6050, action: () => setOpacity(1) },
      { at: 9500, action: () => setOpacity(0) },
      { at: 9800, action: () => setScreenOpacity(0) },
      { at: 10500,action: () => onDone() },
    ];

    const timers = timings.map(t => setTimeout(t.action, t.at));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000", zIndex:9999,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      opacity: screenOpacity, transition:"opacity 0.6s ease",
      fontFamily:"'DM Sans', -apple-system, 'SF Pro Display', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;700&amp;display=swap" rel="stylesheet"/>

      {/* Message block */}
      <div style={{
        textAlign:"center", padding:"0 40px",
        opacity: opacity,
        transition:"opacity 0.5s ease",
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%, -50%)", width:"100%", boxSizing:"border-box",
      }}>
        <div style={{
          fontSize: "clamp(26px, 7vw, 36px)",
          fontWeight: 700, color: "#FFFFFF",
          letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 14,
        }}>
          {messages[msgIndex].title}
        </div>
        <div style={{
          fontSize: "clamp(13px, 3.5vw, 15px)",
          color: "#888", fontWeight: 300, letterSpacing: "0.3px",
        }}>
          {messages[msgIndex].sub}
        </div>
      </div>

      {/* Progress bar + percentage */}
      <div style={{
        position:"absolute", bottom:"20%", left:"50%", transform:"translateX(-50%)",
        width:"180px", textAlign:"center",
      }}>
        <ProgressPercent/>
        <div style={{height:"1px", background:"#333", borderRadius:1, overflow:"hidden", marginTop:10}}>
          <div style={{
            height:"100%", background:"#ffffff",
            animation:"progressFill 10s linear forwards",
            borderRadius:1,
          }}/>
        </div>
      </div>

      <style>{`
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}


// ─── CREATE PROFILE ──────────────────────────────────────────────────────────
function CreateProfile({ onSave }) {
  const [name,setName]=useState("");
  const [avatar,setAvatar]=useState("🔥");
  const [goal,setGoal]=useState("100000");

  return(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",fontFamily:"'DM Sans','Helvetica Neue',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:"100%"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:10,color:"#0070f3",letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Grind Log</div>
          <div style={{fontSize:28,fontWeight:700,color:"#ededed",marginBottom:8}}>Creează-ți profilul</div>
          <div style={{fontSize:13,color:"#888"}}>O singură dată. Datele se salvează local.</div>
        </div>

        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,color:"#888",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Avatar</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:4}}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setAvatar(a)} style={{
                width:48,height:48,borderRadius:12,fontSize:24,border:"none",cursor:"pointer",
                background:avatar===a?"#C9A84C22":"#0d0d0d",
                outline:avatar===a?"2px solid #C9A84C":"2px solid transparent",
                transition:"all .2s",
              }}>{a}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Nume</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Prenumele tău..."
            style={{width:"100%",background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:10,padding:"13px 16px",color:"#ededed",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>

        <div style={{marginBottom:36}}>
          <div style={{fontSize:11,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Obiectiv financiar (€)</div>
          <input value={goal} onChange={e=>setGoal(e.target.value)} type="number" placeholder="100000"
            style={{width:"100%",background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:10,padding:"13px 16px",color:"#0070f3",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",fontWeight:700}}/>
        </div>

        <button onClick={()=>{if(!name.trim())return;const p={name:name.trim(),avatar,goal:parseInt(goal)||100000,createdAt:Date.now()};saveProfile(p);onSave(p);}}
          style={{width:"100%",padding:16,background:"linear-gradient(135deg,#C9A84C,#E8C56A)",border:"none",borderRadius:12,color:"#ededed",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:"inherit",letterSpacing:.5,opacity:name.trim()?1:.4}}>
          Începe →
        </button>
      </div>
    </div>
  );
}

// ─── PROFILE VIEW ─────────────────────────────────────────────────────────────
function ProfileView({ profile, onUpdate, data, onResetDay, onResetAll }) {
  const [editing,setEditing]=useState(false);
  const [name,setName]=useState(profile.name);
  const [avatar,setAvatar]=useState(profile.avatar);
  const [goal,setGoal]=useState(profile.goal||100000);
  const [confirmReset,setConfirmReset]=useState(null); // "day" | "all"

  const streak=calcStreak(data);
  const totalDays=Object.keys(data).length;
  const allActs=Object.values(data).flatMap(d=>d.activities||[]);
  const totalWorkH=Math.round(allActs.filter(a=>a.type==="work").reduce((s,a)=>s+a.duration,0)/60);

  const save=()=>{const p={...profile,name,avatar,goal:parseInt(goal)||100000};onUpdate(p);setEditing(false);};

  return(
    <div>
      {/* Profile card */}
      <div style={{...S.card,textAlign:"center",padding:"28px 20px",marginBottom:14,position:"relative"}}>
        <button onClick={()=>setEditing(!editing)} style={{position:"absolute",top:16,right:16,background:"none",border:"1px solid #1e1e1e",borderRadius:8,color:"#555",fontSize:12,cursor:"pointer",padding:"5px 10px",fontFamily:"inherit"}}>
          {editing?"Anulează":"Editează"}
        </button>

        {editing?(
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:11,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Avatar</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
              {AVATARS.map(a=>(
                <button key={a} onClick={()=>setAvatar(a)} style={{width:42,height:42,borderRadius:10,fontSize:21,border:"none",cursor:"pointer",background:avatar===a?"#3b82f622":"#111",outline:avatar===a?"2px solid #0070f3":"2px solid transparent",transition:"all .15s"}}>{a}</button>
              ))}
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Nume</div>
              <input value={name} onChange={e=>setName(e.target.value)} style={S.input}/>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Obiectiv (€)</div>
              <input value={goal} onChange={e=>setGoal(e.target.value)} type="number" style={{...S.input,color:"#ededed",fontWeight:700}}/>
            </div>
            <button onClick={save} style={{...S.btn(),width:"100%"}}>Salvează</button>
          </div>
        ):(
          <>
            <div style={{fontSize:56,marginBottom:12}}>{profile.avatar}</div>
            <div style={{fontSize:22,fontWeight:700,color:"#ededed",marginBottom:4}}>{profile.name}</div>
            <div style={{fontSize:13,color:"#C9A84C",fontWeight:600}}>€{(profile.goal||100000).toLocaleString()} obiectiv</div>
          </>
        )}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {label:"Streak",value:`${streak}🔥`,color:"#E05C3A"},
          {label:"Zile logate",value:totalDays,color:"#C9A84C"},
          {label:"Ore work",value:`${totalWorkH}h`,color:"#6DBE6D"},
        ].map((s,i)=>(
          <div key={i} style={{background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"#444",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:s.color||"#ededed"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Streak visualization - last 7 days */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{fontSize:11,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Ultimele 7 zile</div>
        <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
          {Array.from({length:7}).map((_,i)=>{
            const d=new Date(); d.setDate(d.getDate()-(6-i));
            const k=d.toISOString().split("T")[0];
            const dd=data[k];
            const active=dd&&((dd.activities||[]).length>0||(dd.sleep||[]).length>0||(dd.food||[]).length>0);
            const workH=dd?(dd.activities||[]).filter(a=>a.type==="work").reduce((s,a)=>s+a.duration,0)/60:0;
            const isToday=i===6;
            return(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{height:40,background:"#0a0a0a",borderRadius:6,marginBottom:5,display:"flex",alignItems:"flex-end",overflow:"hidden",border:`1px solid ${isToday?"#C9A84C33":"#1a1a1a"}`}}>
                  <div style={{width:"100%",background:workH>=6?"#C9A84C":active?"#C9A84C55":"transparent",height:`${Math.min(workH/8*100,100)}%`,borderRadius:4,transition:"height .3s",minHeight:active?4:0}}/>
                </div>
                <div style={{fontSize:9,color:isToday?"#C9A84C":"#333"}}>{DAY_SHORT[d.getDay()]}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:12,marginTop:12,justifyContent:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#444"}}><div style={{width:8,height:8,borderRadius:2,background:"#C9A84C"}}/> 6h+ work</div>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#444"}}><div style={{width:8,height:8,borderRadius:2,background:"#C9A84C55"}}/> activ</div>
        </div>
      </div>

      {/* Reset buttons */}
      <div style={{...S.card}}>
        <div style={{fontSize:11,color:"#444",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Zone periculoase</div>

        {confirmReset==="day"?(
          <div style={{marginBottom:12,padding:14,background:"#ef444411",border:"1px solid #ef444433",borderRadius:10}}>
            <div style={{fontSize:13,color:"#E05C3A",marginBottom:12}}>Ștergi toate datele de azi. Ești sigur?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{onResetDay();setConfirmReset(null);}} style={{...S.btn("#E05C3A"),color:"#fff",flex:1,padding:"10px 0"}}>Da, șterge</button>
              <button onClick={()=>setConfirmReset(null)} style={{...S.ghost,flex:1,padding:"10px 0"}}>Anulează</button>
            </div>
          </div>
        ):(
          <button onClick={()=>setConfirmReset("day")} style={{...S.ghost,width:"100%",marginBottom:10,color:"#E05C3A",borderColor:"#E05C3A33",padding:"12px 0"}}>
            Reset ziua de azi
          </button>
        )}

        {confirmReset==="all"?(
          <div style={{padding:14,background:"#ef444411",border:"1px solid #ef444433",borderRadius:10}}>
            <div style={{fontSize:13,color:"#ff4444",marginBottom:4}}>Ștergi TOT istoricul. Ireversibil.</div>
            <div style={{fontSize:11,color:"#555",marginBottom:12}}>Profilul tău rămâne salvat.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{onResetAll();setConfirmReset(null);}} style={{...S.btn("#ff4444"),color:"#fff",flex:1,padding:"10px 0"}}>Șterge tot</button>
              <button onClick={()=>setConfirmReset(null)} style={{...S.ghost,flex:1,padding:"10px 0"}}>Anulează</button>
            </div>
          </div>
        ):(
          <button onClick={()=>setConfirmReset("all")} style={{...S.ghost,width:"100%",color:"#ff4444",borderColor:"#ff000033",padding:"12px 0"}}>
            Reset complet
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCHEDULE VIEW ────────────────────────────────────────────────────────────
function timeToMin(t) {
  const [h,m]=t.split(":").map(Number);
  return h*60+(m||0);
}
function getCurrentBlockIndex(blocks) {
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  let idx=-1;
  for(let i=0;i<blocks.length;i++){
    const startStr=blocks[i].time.split("-")[0].trim();
    if(timeToMin(startStr)<=nowMin) idx=i;
  }
  return idx;
}
function ScheduleView() {
  const dow=new Date().getDay();
  const [day,setDay]=useState(dow);
  const blocks=SCHEDULE[day]||[];
  const isToday=day===dow;
  const activeIdx=isToday?getCurrentBlockIndex(blocks):-1;
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {DAY_SHORT.map((d,i)=>(
          <button key={i} onClick={()=>setDay(i)} style={{minWidth:40,height:40,borderRadius:10,border:day===i?"1px solid #C9A84C":"1px solid #1e1e1e",background:day===i?"#C9A84C18":"transparent",color:day===i?"#C9A84C":"#444",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:day===i?700:400,position:"relative"}}>
            {d}{i===dow&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:"#C9A84C"}}/>}
          </button>
        ))}
      </div>
      <div style={{fontSize:13,color:"#ededed",marginBottom:16,fontWeight:600}}>{DAY_NAMES[day]}{isToday&&<span style={{color:"#555",fontWeight:400,fontSize:12}}> · acum</span>}</div>
      <div style={{position:"relative",paddingLeft:20}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:1,background:"#1a1a1a"}}/>
        {blocks.map((b,i)=>{
          const isActive=i===activeIdx;
          return(
            <div key={i} style={{display:"flex",gap:14,marginBottom:isActive?20:14,position:"relative",
              background:isActive?"#3b82f60a":"transparent",
              borderRadius:isActive?10:0,padding:isActive?"10px 10px 10px 0":"0",
              marginLeft:isActive?"-10px":0,paddingLeft:isActive?"10px":0}}>
              <div style={{position:"absolute",left:isActive?-14:-20,top:isActive?16:6,
                width:isActive?14:8,height:isActive?14:8,borderRadius:"50%",
                background:isActive?"#0070f3":b.fixed?"#00000033":"#eaeaea",
                border:`2px solid ${isActive?"#0070f3":b.fixed?"#00000066":"#d4d4d4"}`,
                boxShadow:isActive?"0 0 10px #C9A84C88":"none",zIndex:1}}/>
              <div style={{minWidth:90,fontSize:12,paddingTop:2,fontVariantNumeric:"tabular-nums",
                color:isActive?"#3b82f6":b.fixed?"#888":"#444",fontWeight:isActive?700:400}}>{b.time}</div>
              <div style={{fontSize:13,paddingTop:2,
                color:"#888",
                fontWeight:400}}>
                {b.label}
                {isActive&&<div style={{fontSize:10,color:"#0070f3",letterSpacing:1.5,textTransform:"uppercase",marginTop:3}}>▶ agora</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ data }) {
  const today=new Date();
  const [viewDate,setViewDate]=useState(new Date(today.getFullYear(),today.getMonth(),1));
  const year=viewDate.getFullYear(),month=viewDate.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  const getDayKey=(d)=>`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const getScore=(d)=>{
    const k=getDayKey(d),dd=data[k];
    if(!dd||!(dd.activities||[]).length) return null;
    const wm=(dd.activities||[]).filter(a=>a.type==="work").reduce((s,a)=>s+a.duration,0);
    const avg=(dd.activities||[]).reduce((s,a)=>s+a.rating,0)/(dd.activities||[]).length;
    if(wm>=360&&avg>=4) return "gold";
    if(wm>=240||avg>=3) return "good";
    return "ok";
  };
  const SC={gold:"#f5a623",good:"#00b341",ok:"#666"};
  const todayStr=today.toISOString().split("T")[0];
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={()=>setViewDate(new Date(year,month-1,1))} style={{...S.ghost,padding:"8px 14px"}}>←</button>
        <div style={{fontSize:14,fontWeight:600,color:"#e0e0e0",textTransform:"capitalize"}}>{viewDate.toLocaleDateString("ro-RO",{month:"long",year:"numeric"})}</div>
        <button onClick={()=>setViewDate(new Date(year,month+1,1))} style={{...S.ghost,padding:"8px 14px"}}>→</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
        {["Du","Lu","Ma","Mi","Jo","Vi","Sâ"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:"#333",padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>;
          const isToday=getDayKey(d)===todayStr,score=getScore(d);
          return(
            <div key={i} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:13,fontWeight:isToday?700:400,border:isToday?"1px solid #C9A84C":"1px solid transparent",background:score?`${SC[score]}22`:"#0d0d0d",color:isToday?"#C9A84C":score?SC[score]:"#444",position:"relative"}}>
              {d}
              {score&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:SC[score]}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STATS VIEW ───────────────────────────────────────────────────────────────
const CustomTooltip = ({active,payload,label,unit}) => {
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"#000",border:"1px solid #1a1a1a",borderRadius:8,padding:"8px 12px",fontSize:12}}>
      <div style={{color:"#555",marginBottom:4}}>{label}</div>
      <div style={{color:"#ededed",fontWeight:700}}>{payload[0]?.value}{unit}</div>
    </div>
  );
};

function StatsView({ data }) {
  const days=Object.keys(data).sort().slice(-30);

  const chartData = days.map(k=>{
    const dd=data[k]||{};
    const acts=dd.activities||[];
    const workMin=acts.filter(a=>a.type==="work").reduce((s,a)=>s+a.duration,0);
    const sleepH=(dd.sleep||[]).reduce((s,e)=>s+e.hours,0);
    const waterL=parseFloat(((dd.water||0)/1000).toFixed(2));
    const sportActs=acts.filter(a=>["calisthenics","swimming","climbing"].includes(a.type));
    const sportScore=sportActs.length?Math.min(10,Math.round(sportActs.reduce((s,a)=>s+a.duration,0)/30)):0;
    return { date:fmtDate(k), work:parseFloat((workMin/60).toFixed(1)), sleep:sleepH, water:waterL, sport:sportScore };
  });

  if(chartData.length===0) return(
    <div style={{textAlign:"center",padding:"60px 20px",color:"#2a2a2a",fontSize:13}}>Nicio zi logată încă.</div>
  );

  const charts=[
    {key:"work",label:"Work",color:"#C9A84C",unit:"h",desc:"Ore de work pe zi"},
    {key:"sleep",label:"Somn",color:"#5A6EBF",unit:"h",desc:"Ore de somn pe zi"},
    {key:"water",label:"Apă",color:"#3A9BE0",unit:"L",desc:"Litri de apă pe zi"},
    {key:"sport",label:"Efort fizic",color:"#6DBE6D",unit:"/10",desc:"Scor efort fizic (1-10)"},
  ];

  return (
    <div>
      {charts.map(c=>(
        <div key={c.key} style={{...S.card}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:c.color,letterSpacing:2,textTransform:"uppercase"}}>{c.label}</div>
            <div style={{fontSize:12,color:"#444",marginTop:2}}>{c.desc}</div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{top:5,right:5,bottom:0,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:"#444"}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:10,fill:"#444"}} tickLine={false} axisLine={false}/>
              <Tooltip content={<CustomTooltip unit={c.unit}/>}/>
              <Line type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={2} dot={{fill:c.color,r:3,strokeWidth:0}} activeDot={{r:5,fill:c.color}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function HistoryView({ data }) {
  const [range,setRange]=useState(7);
  const today=new Date();
  const days=Array.from({length:range},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()-i);return d.toISOString().split("T")[0];}).filter(k=>data[k]&&((data[k].activities||[]).length>0||(data[k].sleep||[]).length>0));

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[1,7,30].map(r=>(
          <button key={r} onClick={()=>setRange(r)} style={{flex:1,padding:"10px 0",borderRadius:10,fontFamily:"inherit",border:range===r?"1px solid #C9A84C":"1px solid #1e1e1e",background:range===r?"#C9A84C18":"transparent",color:range===r?"#C9A84C":"#444",fontSize:13,cursor:"pointer",fontWeight:range===r?700:400}}>{r===1?"Azi":`${r}z`}</button>
        ))}
      </div>
      {days.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#2a2a2a",fontSize:13}}>Nicio zi în perioada selectată.</div>}
      {days.map(k=>{
        const dd=data[k]||{};
        const acts=dd.activities||[];
        const workMin=acts.filter(a=>a.type==="work").reduce((s,a)=>s+a.duration,0);
        const totalMin=acts.reduce((s,a)=>s+a.duration,0);
        const sleepH=(dd.sleep||[]).reduce((s,e)=>s+e.hours,0);
        const waterL=((dd.water||0)/1000).toFixed(2);
        const avg=acts.length?(acts.reduce((s,a)=>s+a.rating,0)/acts.length).toFixed(1):"-";
        const label=new Date(k).toLocaleDateString("ro-RO",{weekday:"short",day:"numeric",month:"short"});
        const isToday=k===todayKey();
        return(
          <div key={k} style={{...S.card,border:isToday?"1px solid #C9A84C33":"1px solid #1a1a1a"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontWeight:600,color:isToday?"#3b82f6":"#ededed",fontSize:14}}>{label}{isToday?" · Azi":""}</div>
              <div style={{fontSize:12,color:"#C9A84C"}}>★ {avg}</div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:10}}>
              <span style={{fontSize:12,color:"#C9A84C"}}>⚡ {fmtDur(workMin)}</span>
              <span style={{fontSize:12,color:"#5A6EBF"}}>🌙 {sleepH}h</span>
              <span style={{fontSize:12,color:"#3A9BE0"}}>💧 {waterL}L</span>
              <span style={{fontSize:12,color:"#555"}}>⏱ {fmtDur(totalMin)}</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {acts.map(a=>{const t=getType(a.type);return(<span key={a.id} style={{fontSize:11,padding:"3px 10px",borderRadius:50,background:`${t.color}15`,color:t.color,border:`1px solid ${t.color}30`}}>{t.icon} {fmtDur(a.duration)}</span>);})}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [data,setData]=useState(load);
  const [profile,setProfile]=useState(loadProfile);
  const [showOnboarding,setShowOnboarding]=useState(true);
  const [tab,setTab]=useState("today");
  const [subTab,setSubTab]=useState("activities");
  const [showForm,setShowForm]=useState(false);

  // Show create profile screen if no profile
  if(!profile) return <CreateProfile onSave={(p)=>{saveProfile(p);setProfile(p);}}/>;

  // midnight water reset
  useEffect(()=>{
    const k=todayKey();
    const dd=data[k]||{};
    if(dd.waterDate&&dd.waterDate!==k){
      const updated={...data,[k]:{...dd,water:0,waterDate:k}};
      setData(updated);persist(updated);
    }
  },[]);

  const key=todayKey();
  const todayData=data[key]||{activities:[],sleep:[],food:[],water:0,waterDate:key};
  const acts=todayData.activities||[];
  const workMin=acts.filter(a=>a.type==="work").reduce((s,a)=>s+a.duration,0);

  const update=(updates)=>{const u={...data,[key]:{...todayData,...updates}};setData(u);persist(u);};
  const saveActivity=(a)=>{update({activities:[...acts,a]});setShowForm(false);};
  const delActivity=(id)=>update({activities:acts.filter(a=>a.id!==id)});
  const addSleep=(e)=>update({sleep:[...(todayData.sleep||[]),e]});
  const delSleep=(id)=>update({sleep:(todayData.sleep||[]).filter(e=>e.id!==id)});
  const addWater=(ml)=>update({water:(todayData.water||0)+ml,waterDate:key});
  const addFood=(f)=>update({food:[...(todayData.food||[]),f]});
  const delFood=(id)=>update({food:(todayData.food||[]).filter(f=>f.id!==id)});
  const addSportNote=(n)=>update({sportNotes:[...(todayData.sportNotes||[]),n]});
  const delSportNote=(id)=>update({sportNotes:(todayData.sportNotes||[]).filter(n=>n.id!==id)});

  const updateProfile=(p)=>{saveProfile(p);setProfile(p);};
  const resetDay=()=>{const u={...data};delete u[key];setData(u);persist(u);};
  const resetAll=()=>{const empty={};setData(empty);persist(empty);};

  const todayLabel=new Date().toLocaleDateString("ro-RO",{weekday:"long",day:"numeric",month:"long"});

  const TABS=[{id:"today",label:"Azi"},{id:"schedule",label:"Program"},{id:"stats",label:"Stats"},{id:"history",label:"Istoric"},{id:"profile",label:"Profil"}];
  const SUB_TABS=[{id:"activities",label:"Activități"},{id:"sleep",label:"Somn"},{id:"water",label:"Apă"},{id:"food",label:"Mâncare"},{id:"sport",label:"Sport AI"}];

  return(
    <div style={{minHeight:"100vh",background:"#000000",color:"#ededed",fontFamily:"Inter,-apple-system,sans-serif",maxWidth:"100%",margin:"0 auto",padding:"0 0 90px",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
      <style>{`
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        button:hover { opacity: 0.8; }
        input:focus { border-color: #3b82f6 !important; outline: none; }
        textarea:focus { border-color: #3b82f6 !important; outline: none; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{padding:"20px 20px 0",borderBottom:`1px solid ${"#1a1a1a"}`,paddingBottom:16,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:600,color:"#ededed",letterSpacing:"-0.02em"}}>Nick Productivity</span>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"#555",display:"flex",alignItems:"center",gap:3}}>{calcStreak(data)}<span style={{fontSize:14}}>🔥</span></span>
            <div style={{width:28,height:28,borderRadius:"50%",background:"#0a0a0a",border:`1px solid ${"#1a1a1a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer"}} onClick={()=>setTab("profile")}>{profile.avatar}</div>
          </div>
        </div>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.04em",color:"#ededed",marginBottom:4,textTransform:"capitalize"}}>{todayLabel}</div>
        <div style={{fontSize:13,color:"#555",fontWeight:400}}>Hey {profile.name}</div>
      </div>

      <div style={{padding:"0 16px"}}>

      {/* ── MAIN TABS ── */}
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:`1px solid ${"#1a1a1a"}`,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"10px 14px",background:"transparent",border:"none",
            borderBottom:tab===t.id?`2px solid ${"#ededed"}`:"2px solid transparent",
            color:tab===t.id?"#ededed":"#555",fontWeight:tab===t.id?600:400,
            fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",
            marginBottom:-1,letterSpacing:"-0.01em",transition:"color .15s",background:"transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TODAY ── */}
      {tab==="today"&&(
        <>
          {/* Stats 2x2 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22}}>
            {[
              {label:"Work azi",value:fmtDur(workMin),sub:workMin>=360?"target atins ✓":"target 6h",accent:workMin>=360?"#3b82f6":null},
              {label:"Somn",value:(todayData.sleep||[]).reduce((s,e)=>s+e.hours,0)+"h",sub:"ore totale",accent:null},
              {label:"Apă",value:((todayData.water||0)/1000).toFixed(2)+"L",sub:"hidratare",accent:null},
              {label:"Mese",value:(todayData.food||[]).length,sub:"logate azi",accent:null},
            ].map((s,i)=>(
              <div key={i} style={{background:"#0a0a0a",border:"1px solid "+(s.accent?"#3b82f622":"#1a1a1a"),borderRadius:14,padding:"18px 16px",position:"relative",overflow:"hidden"}}>
                {s.accent&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"#3b82f6",borderRadius:"14px 14px 0 0"}}/>}
                <div style={{fontSize:10,color:"#444",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10,fontWeight:500}}>{s.label}</div>
                <div style={{fontSize:28,fontWeight:700,color:s.accent||"#ededed",letterSpacing:"-0.03em",lineHeight:1,marginBottom:6}}>{s.value}</div>
                <div style={{fontSize:11,color:"#333"}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Work progress bar */}
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:"#555",fontWeight:500}}>Work · target 6h</span>
              <span style={{fontSize:12,color:workMin>=360?"#22c55e":"#555",fontWeight:600}}>{Math.round(Math.min(workMin/360*100,100))}%</span>
            </div>
            <div style={{height:4,background:"#111",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(workMin/360*100,100)}%`,background:workMin>=360?"#22c55e":"#3b82f6",borderRadius:2,transition:"width .4s"}}/>
            </div>
          </div>

          {/* Sub tabs */}
          <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:2}}>
            {SUB_TABS.map(t=>(
              <button key={t.id} onClick={()=>setSubTab(t.id)} style={{
                padding:"7px 16px",borderRadius:8,fontFamily:"inherit",fontSize:12,cursor:"pointer",
                border:`1px solid ${subTab===t.id?"#ededed":"#1a1a1a"}`,
                background:subTab===t.id?"#ededed":"transparent",
                color:subTab===t.id?"#000":"#555",
                whiteSpace:"nowrap",fontWeight:subTab===t.id?600:400,
                letterSpacing:"-0.01em",transition:"all .15s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Activities */}
          {subTab==="activities"&&(
            <>
              {showForm?<ActivityForm onSave={saveActivity} onCancel={()=>setShowForm(false)}/>:(
                <button onClick={()=>setShowForm(true)} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #2a2a2a",borderRadius:12,color:"#555",fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:16,fontWeight:500,letterSpacing:"-0.01em",background:"#0a0a0a"}}>+ Adaugă activitate</button>
              )}
              {acts.length>0&&(
                <>
                  <div style={{fontSize:11,color:"#555",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10,fontWeight:500}}>Azi · {acts.length}</div>
                  {[...acts].reverse().map(a=><ActivityCard key={a.id} activity={a} onDelete={delActivity}/>)}
                </>
              )}
              {acts.length===0&&!showForm&&(
                <div style={{textAlign:"center",padding:"40px 0",color:"#555",fontSize:13}}>
                  <div style={{fontSize:32,marginBottom:10}}>◇</div>
                  Nicio activitate logată.
                </div>
              )}
              <div style={{marginTop:12}}><AICoach dayData={todayData}/></div>
            </>
          )}
          {subTab==="sleep"&&<div style={S.card}><div style={{...S.label,color:"#3b82f6"}}>Somn</div><SleepTracker entries={todayData.sleep||[]} onAdd={addSleep} onDelete={delSleep}/></div>}
          {subTab==="water"&&<div style={S.card}><div style={{...S.label,color:"#3b82f6"}}>Hidratare</div><WaterTracker ml={todayData.water||0} onAdd={addWater}/></div>}
          {subTab==="food"&&<div style={S.card}><div style={{...S.label,color:"#f59e0b"}}>Mâncare</div><FoodLog entries={todayData.food||[]} onAdd={addFood} onDelete={delFood} activities={acts}/></div>}
          {subTab==="sport"&&<div style={S.card}><div style={{...S.label,color:"#3b82f6"}}>Analiză sport AI</div><SportAnalysis activities={acts} sleep={todayData.sleep||[]} food={todayData.food||[]} sportNotes={todayData.sportNotes||[]} onAddNote={addSportNote} onDeleteNote={delSportNote}/></div>}
        </>
      )}

      {tab==="schedule"&&<div style={{padding:"0 16px"}}><div style={S.card}><div style={{...S.label}}>Program de referință</div><ScheduleView/></div></div>}
      {tab==="stats"&&<div style={{padding:"0 16px"}}><StatsView data={data}/></div>}
      {tab==="history"&&<div style={{padding:"0 16px"}}><HistoryView data={data}/></div>}
      {tab==="profile"&&<div style={{padding:"0 16px"}}><ProfileView profile={profile} onUpdate={updateProfile} data={data} onResetDay={resetDay} onResetAll={resetAll}/></div>}

      </div>

      {showOnboarding&&<Onboarding name={profile?.name||""} onDone={()=>setShowOnboarding(false)}/>}
    </div>
  );
}
