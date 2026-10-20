
/* THE FRONT OFFICE — ALPHA 3 expansion. Load after existing inline game script. */
(()=>{
'use strict';
const extra=[
['orlando','Orlando Brown Jr.','OT',84,17,2,30],['karras','Ted Karras','C',81,9,1,33],['volson','Cordell Volson','G',73,3,1,28],['iosivas','Andrei Iosivas','WR',78,3,1,27],['gesicki','Mike Gesicki','TE',79,7,1,31],['hill','B.J. Hill','DT',81,10,2,31],['turner','DJ Turner II','CB',83,4,1,26],['battle','Jordan Battle','S',79,3,1,26],['stone','Geno Stone','S',76,6,1,27],['pratt','Germaine Pratt','LB',78,7,1,30],['mcpherson','Evan McPherson','K',82,5,2,27],['reid','Punter (sandbox)','P',70,1,1,27],['rb2','Reserve RB (sandbox)','RB',68,1,1,25],['wr4','Reserve WR (sandbox)','WR',67,1,1,24],['cb3','Reserve CB (sandbox)','CB',69,1,1,25],['edge2','Reserve EDGE (sandbox)','EDGE',72,2,1,26],['dt2','Reserve DT (sandbox)','DT',70,2,1,27],['lb2','Reserve LB (sandbox)','LB',70,2,1,26],['ot3','Reserve OT (sandbox)','OT',67,1,1,26],['g2','Reserve Guard (sandbox)','G',68,1,1,25]];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
function initialize(){
 state.alpha3=state.alpha3||{morale:72,staff:70,scheme:'balanced',training:'balanced',injuries:[],decisions:[],academy:true};
 if(!state.alpha3.rosterExpanded){for(const [id,name,pos,skill,cap,years,age] of extra){if(!state.roster.some(p=>p.id===id))state.roster.push({id,name,pos,skill,cap,years,age,role:'Rotation',illustrative:true});}state.alpha3.rosterExpanded=true;}
 state.roster.forEach(p=>{if(p.morale==null)p.morale=72;if(p.potential==null)p.potential=clamp(p.skill+(p.age<27?9:2),35,99);});
}
initialize();
const original={dashboard,roster,schedule,simulate,nextSeason};
const style=document.createElement('style');style.textContent='.a3-controls{display:flex;gap:8px;flex-wrap:wrap}.a3-controls button{flex:1;min-width:125px}.a3-stat{padding:12px;background:#202d3d;border-radius:8px}.a3-table{width:100%;border-collapse:collapse;font-size:13px}.a3-table td,.a3-table th{padding:10px 7px;text-align:left;border-bottom:1px solid #39495b}.a3-table-wrap{overflow-x:auto}.a3-note{font-size:12px;color:#bac8d7}.a3-positive{color:#5cdda7}';document.head.appendChild(style);
const options=(items,current)=>items.map(([v,l])=>`<option value="${v}" ${current===v?'selected':''}>${l}</option>`).join('');
function academy(msg){return `<p class="a3-note">🎓 <b>GM Academy:</b> ${msg}</p>`}
function decision(kind,value){
 if(state.fired||state.completed)return;
 const a=state.alpha3;
 if(kind==='scheme'){a.scheme=value;post('@CoachDesk',`The GM approved a ${value} offensive philosophy.`);}
 if(kind==='training'){a.training=value;post('@TrainingRoom',`Practice emphasis changed to ${value}.`);}
 if(kind==='staff'){a.staff=clamp(a.staff+8);state.confidence=clamp(state.confidence+2);post('@FrontOffice', 'Ownership approved additional coaching resources. Coaching expenses do not count against the NFL player salary cap.');}
 if(kind==='meeting'){a.morale=clamp(a.morale+6);state.confidence=clamp(state.confidence+1);post('@LockerRoom','A player leadership meeting improved team morale.');}
 a.decisions.push({year:state.year,week:state.week,kind,value:value||''});render();
}
window.alpha3Decision=decision;
dashboard=function(){const a=state.alpha3;return `${panel('🐅 GM COMMAND CENTER',`<div class="grid"><div class="a3-stat">Locker-room morale<br><strong>${a.morale}%</strong></div><div class="a3-stat">Coaching effectiveness<br><strong>${a.staff}%</strong></div><div class="a3-stat">Offensive philosophy<br><strong>${esc(a.scheme)}</strong></div><div class="a3-stat">Training focus<br><strong>${esc(a.training)}</strong></div></div><h3 style="margin-top:16px">This week’s decisions</h3><div class="a3-controls"><button class="btn secondary" onclick="alpha3Decision('meeting')">Hold player meeting</button><button class="btn secondary" onclick="alpha3Decision('staff')">Invest in coaching staff</button></div>${academy('Morale improves execution but cannot guarantee wins. Coaching staff compensation is separate from the NFL player salary cap.')}`)}${original.dashboard()}`};
roster=function(){const a=state.alpha3;const sorted=[...state.roster].sort((x,y)=>x.pos.localeCompare(y.pos)||y.skill-x.skill);return panel('👥 DEPTH CHART & SCOUTING',`<p class="warning">Expanded playable roster subset with illustrative ratings and financial data. Not a verified current 53-man NFL roster.</p><div class="row"><span>Players tracked: <b>${state.roster.length}</b></span><span>Team morale: <b>${a.morale}%</b></span></div><div class="a3-table-wrap"><table class="a3-table"><thead><tr><th>Player</th><th>POS</th><th>OVR</th><th>Potential</th><th>Morale</th><th>Cap*</th><th>Action</th></tr></thead><tbody>${sorted.map(p=>`<tr><td><b>${esc(p.name)}</b><div class="a3-note">Age ${p.age||'?'} · ${p.years}y left</div></td><td>${esc(p.pos)}</td><td>${p.skill}</td><td>${p.potential}</td><td>${p.morale}%</td><td>${money(p.cap)}</td><td><button class="btn danger" style="padding:6px" ${p.id==='burrow'?'disabled':''} onclick="releasePlayer('${p.id}')">Cut</button></td></tr>`).join('')}</tbody></table></div>${academy('Overall ratings and potential are modeled scouting estimates. A strong starter at one position does not compensate perfectly for a weak depth chart elsewhere. *Cap charges are illustrative.')}`)};
schedule=function(){const a=state.alpha3;return `${panel('🎮 COACHING GAME PLAN',`<div class="grid"><div><label>Offensive philosophy</label><select class="field" onchange="alpha3Decision('scheme',this.value)">${options([['balanced','Balanced'],['aggressive','Pass aggressive'],['ground','Run and protect'],['conservative','Ball control']],a.scheme)}</select></div><div><label>Practice focus</label><select class="field" onchange="alpha3Decision('training',this.value)">${options([['balanced','Balanced'],['intense','High intensity'],['recovery','Recovery / injury prevention']],a.training)}</select></div></div>${academy('Aggressive passing adds upside and turnovers; a run-first plan protects a backup quarterback. Intense practice can improve execution but increases injury risk.')}`)}${original.schedule()}`};
function positionStrength(pos){const ps=state.roster.filter(p=>p.pos===pos).sort((a,b)=>b.skill-a.skill);return ps.length?ps[0].skill:48}
simulate=function(){if(state.completed||state.fired)return;const a=state.alpha3;const qb=positionStrength('QB'),wr=positionStrength('WR'),rb=positionStrength('RB'),ot=positionStrength('OT'),def=['EDGE','DT','LB','CB','S'].reduce((s,p)=>s+positionStrength(p),0)/5;const startingQB=state.injury?Math.min(qb,62):qb;
const offense=.42*startingQB+.23*wr+.17*rb+.18*ot;const team=.55*offense+.45*def;let advantage=(team-78)*.018+(a.morale-70)*.002+(a.staff-70)*.003;
if(a.scheme==='aggressive')advantage+=startingQB>=85?.035:-.065;if(a.scheme==='ground')advantage+=startingQB<80?.045:-.01;if(a.scheme==='conservative')advantage-=.015;
if(a.training==='intense')advantage+=.035;
const injuryRisk=a.training==='recovery'?.009:a.training==='intense'?.052:.027;
if(!state.injury&&Math.random()<injuryRisk){state.injury=true;post('@JungleWire','MAJOR INJURY: Cincinnati loses its starting quarterback for the season. Backup plans are now critical.');a.morale=clamp(a.morale-9);}
const winChance=clamp(.48+advantage-(state.injury?.20:0),.08,.88);const win=Math.random()<winChance;
win?state.wins++:state.losses++;state.confidence=clamp(state.confidence+(win?3:-4));state.fans=clamp(state.fans+(win?3:-3));a.morale=clamp(a.morale+(win?2:-3)+(a.training==='recovery'?1:0));
state.roster.forEach(p=>{p.morale=clamp(p.morale+(win?2:-2));if(a.training==='intense'&&p.age<=26&&Math.random()<.045)p.skill=clamp(p.skill+1,1,99);});
const note=`${state.injury?'Backup QB':'Starting QB'} · ${a.scheme} offense · modeled win chance ${Math.round(winChance*100)}%`;
state.history.push({year:state.year,week:state.week,win,note});post('@WhoDeyDaily',`Week ${state.week}: Cincinnati ${win?'WINS':'LOSES'}. ${note}. Record: ${state.wins}-${state.losses}.`);state.week++;
if(state.week>17){state.completed=true;state.confidence=clamp(state.confidence+(state.wins>=10?10:-7));post('@QueenCitySports',`Season review: Cincinnati finishes ${state.wins}-${state.losses}. Ownership is evaluating the GM.`)}
if(state.confidence<=12&&state.losses>=7){state.fired=true;post('@BreakingNFL','Ownership has dismissed the general manager.');}
render();};
nextSeason=function(){original.nextSeason();state.alpha3.morale=clamp(state.alpha3.morale+3);state.roster.forEach(p=>{p.age=(p.age||27)+1;p.years=Math.max(0,p.years-1);});render();};
// Replace inline-handler bindings on the global object (classic-script functions are global).
window.dashboard=dashboard;window.roster=roster;window.schedule=schedule;window.simulate=simulate;window.nextSeason=nextSeason;
render();
})();
