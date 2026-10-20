
/* THE FRONT OFFICE — ALPHA 4.1
   Install after alpha3.js and alpha4.js.
   Fictional league calendar and ratings; not live NFL data.
*/
(()=>{'use strict';
if(typeof state==='undefined' || !state.alpha4 || !state.alpha3){console.error('Alpha 4.1 requires Alpha 3 and Alpha 4');return;}
const L=state.alpha4, A=state.alpha3;
const cap=(x,a,b)=>Math.max(a,Math.min(b,x));
const rand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const nameSafe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const club=id=>L.clubs.find(c=>c.id===id);
const teamIds=L.clubs.map(t=>t.id);
// Schedule: 17 rounds of a 32-team round robin, with one common league-wide
// pause in week 10. This is an integrity-first FICTIONAL calendar, not NFL schedule.
function makeRounds(ids){const a=[...ids];const rounds=[];for(let r=0;r<17;r++){const games=[];for(let i=0;i<16;i++)games.push([a[i],a[31-i]]);rounds.push(games);a.splice(1,0,a.pop());}return rounds;}
const rounds=makeRounds(teamIds);
const fixtures=Array.from({length:18},(_,i)=>i===9?[]:rounds[i<9?i:i-1]);
function pairFor(id,week){return (fixtures[week-1]||[]).find(p=>p.includes(id));}
function opponents(id,week){const p=pairFor(id,week);return p?p.find(x=>x!==id):null;}
function resultFor(week,id){return (L.ledger||[]).find(g=>g.week===week&&(g.home===id||g.away===id));}
function recordGame(week,home,away,hs,as,origin){L.ledger ||= [];
 if(resultFor(week,home)||resultFor(week,away))return false;
 L.ledger.push({week,home,away,hs,as,origin});return true;
}
function calculateRecords(){L.clubs.forEach(c=>{c.w=0;c.l=0;c.t=0;});for(const g of L.ledger||[]){const h=club(g.home),a=club(g.away);if(!h||!a)continue;if(g.hs===g.as){h.t++;a.t++;}else if(g.hs>g.as){h.w++;a.l++;}else{a.w++;h.l++;}}}
function strength(t){return ((t.off||75)+(t.def||75))/2;}
function playCPU(week,home,away,origin='sim'){const h=club(home),a=club(away);if(!h||!a)return;const margin=(strength(h)-strength(a))/4;let hs=cap(Math.round(21+margin+rand(-14,14)),0,55);let as=cap(Math.round(21-margin+rand(-14,14)),0,55);if(hs===as)hs+=3;recordGame(week,home,away,hs,as,origin);}
function initialize(){if(L.alpha41Initialized)return;
 L.ledger=[];
 // Existing Bengals games are authoritative. The Alpha 3 week-one result
 // lacks a named opponent; assign a fictional opponent only for ledger repair.
 const played=Math.min(17,Math.max(0,state.week-1));
 for(let week=1;week<=played;week++){
  const h=state.history.find(g=>g.year===state.year&&g.week===week);
  if(!h)continue;
  let opponent=week===2?'PIT':opponents('CIN',week);
  if(!opponent)opponent='BAL';
  const match=(h.note||'').match(/Cincinnati\s+(\d+)\s*[–-]\s*(\d+)/);
  const hs=match?Number(match[1]):(h.win?24:17),as=match?Number(match[2]):(h.win?17:24);
  recordGame(week,'CIN',opponent,hs,as,'legacy');
  // Fill every other franchise for the same week, except its opponent.
  const free=teamIds.filter(id=>id!=='CIN'&&id!==opponent);
  for(let i=free.length-1;i>0;i--){const j=rand(0,i);[free[i],free[j]]=[free[j],free[i]];}
  for(let i=0;i+1<free.length;i+=2)playCPU(week,free[i],free[i+1],'reconstructed');
 }
 // Keep all legacy results visible, but flag reconstructed opponents.
 L.alpha41Initialized=true;L.year=state.year;calculateRecords();
}
initialize();
function qbRating(){const qbs=state.roster.filter(p=>p.pos==='QB').sort((a,b)=>b.skill-a.skill);return state.injury?(qbs[1]?.skill||62):(qbs[0]?.skill||62);}
function best(pos){return state.roster.filter(p=>p.pos===pos).reduce((m,p)=>Math.max(m,p.skill||0),60);}
function possessions(attack,defend,scheme){let score=0,drives=[];for(let i=0;i<11;i++){
 let execution=attack-defend+rand(-31,31);
 if(scheme==='aggressive')execution+=rand(-9,9);
 if(scheme==='ground')execution+=rand(-5,5);
 const touchdown=execution>12,fg=!touchdown&&execution>-5,turnover=execution< -21;
 const pts=touchdown?(Math.random()<.94?7:6):fg?3:0;
 score+=pts;drives.push({points:pts,type:touchdown?'TD':fg?'FG':turnover?'TO':'PUNT'});
 }return {score,drives};}
function simulateWeek(){if(state.completed||state.fired)return;
 const week=state.week;if(week>18)return;
 if(week===10){state.week++;post('@LeagueDesk','League calendar pause: no games this week in the fictional prototype schedule.');render();return;}
 const matchup=pairFor('CIN',week),oppId=opponents('CIN',week)||'PIT',opp=club(oppId);
 if(!opp){alert('League opponent unavailable.');return;}
 const attack=.38*qbRating()+.22*best('WR')+.17*best('RB')+.14*best('OT')+.09*best('TE')+(A.staff-70)*.06;
 const defense=['EDGE','DT','LB','CB','S'].reduce((s,p)=>s+best(p),0)/5;
 const cin=possessions(attack,opp.def,A.scheme),other=possessions(opp.off,defense,'balanced');
 // Ties in regulation go to overtime; possession results decide the outcome.
 let ot=0;while(cin.score===other.score&&ot<8){ot++;const c=possessions(attack,opp.def,A.scheme).drives[0].points;const o=possessions(opp.off,defense,'balanced').drives[0].points;cin.score+=c;other.score+=o;}
 // A regular-season tie is allowed if overtime remains even.
 const win=cin.score>other.score,loss=cin.score<other.score,tie=!win&&!loss;
 recordGame(week,'CIN',oppId,cin.score,other.score,'played');
 // Simulate the remaining 15 fixtures, with no duplicate club games.
 const used=new Set(['CIN',oppId]);
 const remaining=teamIds.filter(id=>!used.has(id));
 for(let i=remaining.length-1;i>0;i--){const j=rand(0,i);[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
 for(let i=0;i+1<remaining.length;i+=2)playCPU(week,remaining[i],remaining[i+1]);
 calculateRecords();
 state.wins=club('CIN').w;state.losses=club('CIN').l;
 state.confidence=cap(state.confidence+(win?3:loss?-4:0),0,100);
 state.fans=cap(state.fans+(win?3:loss?-3:0),0,100);
 A.morale=cap(A.morale+(win?2:loss?-3:0),0,100);
 state.roster.forEach(p=>p.morale=cap((p.morale??70)+(win?2:loss?-2:0),0,100));
 state.history.push({year:state.year,week,win,note:`Cincinnati ${cin.score} – ${other.score} ${opp.name} · ${A.scheme} offense${tie?' · TIE':''}`});
 post('@WhoDeyDaily',`Week ${week}: Cincinnati ${cin.score}–${other.score} ${opp.name}. Record ${state.wins}–${state.losses}.`);
 state.week++;L.week=state.week;
 if(state.week>18){state.completed=true;post('@LeagueDesk',`Regular season complete: Cincinnati ${state.wins}–${state.losses}.`);}
 if(state.confidence<=12&&state.losses>=7){state.fired=true;post('@BreakingNFL','Ownership has dismissed the general manager.');}
 render();
}
function leaguePanel41(){const confs=['AFC','NFC'];return `<div class="panel"><h2>🌎 LIVING LEAGUE · ${state.year}</h2><p class="muted small">Fictional calendar. Legacy weeks reconstructed; scores are not real NFL results. Week 10 is a league-wide prototype bye.</p>${confs.map(conf=>`<h3>${conf}</h3><div style="overflow-x:auto"><table class="a3-table"><thead><tr><th>Club</th><th>W–L–T</th><th>GM style</th></tr></thead><tbody>${L.clubs.filter(c=>c.division.startsWith(conf)).sort((a,b)=>(b.w+.5*b.t)/(b.w+b.l+b.t||1)-(a.w+.5*a.t)/(a.w+a.l+a.t||1)).map(c=>`<tr><td>${nameSafe(c.name)}</td><td>${c.w}–${c.l}–${c.t}</td><td>${nameSafe(c.personality)}</td></tr>`).join('')}</tbody></table></div>`).join('')}</div>`;}
// Replace the Alpha 4 schedule renderer, which otherwise shows an old
// unsynchronized league table and stale next-opponent preview.
const originalSeason=window.schedule;
window.schedule=function(){const week=state.week,opp=opponents('CIN',week),t=club(opp);const preview=`<div class="panel"><h2>📅 LEAGUE CALENDAR · WEEK ${week}</h2><p>${week===10?'League-wide prototype bye':`Cincinnati vs ${nameSafe(t?.name||'TBD')} · ${t?.w||0}–${t?.l||0}`}</p><p class="muted small">Results come from simulated scoring possessions. This is not the official NFL schedule.</p></div>`;
 // Preserve coaching controls from Alpha 3 by using its original markup
 // through the existing schedule, but hide the superseded Alpha 4 tables.
 const html=originalSeason();
 const idx=html.indexOf('<div class="panel"><h2>🌎 LIVING NFL');
 const trimmed=idx>=0?html.slice(0,idx):html;
 return preview+trimmed+leaguePanel41();
};
window.simulate=simulateWeek;
// The old history remains stored, but remove visible model probabilities.
const originalRender=window.render;
window.render=function(){originalRender();document.querySelectorAll('*').forEach(el=>{
 if(el.children.length===0&&el.textContent?.includes('modeled win chance'))el.textContent=el.textContent.replace(/\s*·?\s*modeled win chance\s*\d+%/gi,'');
 });};
// Make new year clean without deleting the previous franchise record.
const priorNext=window.nextSeason;
window.nextSeason=function(){priorNext();L.ledger=[];L.alpha41Initialized=true;L.year=state.year;L.week=state.week;calculateRecords();window.render();};
window.render();
})();
