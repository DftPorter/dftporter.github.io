const ALL_NFL_TEAMS=[['ARI','Cardinals'],['ATL','Falcons'],['BAL','Ravens'],['BUF','Bills'],['CAR','Panthers'],
  ['CHI','Bears'],['CIN','Bengals'],['CLE','Browns'],['DAL','Cowboys'],['DEN','Broncos'],['DET','Lions'],
  ['GB','Packers'],['HOU','Texans'],['IND','Colts'],['JAX','Jaguars'],['KC','Chiefs'],['LAC','Chargers'],
  ['LAR','Rams'],['LV','Raiders'],['MIA','Dolphins'],['MIN','Vikings'],['NE','Patriots'],['NO','Saints'],
  ['NYG','Giants'],['NYJ','Jets'],['PHI','Eagles'],['PIT','Steelers'],['SEA','Seahawks'],['SF','49ers'],
  ['TB','Buccaneers'],['TEN','Titans'],['WSH','Commanders']];

function escHtml(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pickTeamColor(team,useAlt){
  const lum=hex=>{ const n=parseInt(hex,16); return (0.2126*((n>>16)&255)+0.7152*((n>>8)&255)+0.0722*(n&255))/255; };
  const ok=c=>{ if(!c) return null; const h=String(c).replace('#','').trim();
    if(!/^[0-9a-f]{6}$/i.test(h)) return null; const l=lum(h); return (l>0.06&&l<0.9) ? '#'+h : null; };
  return useAlt ? ok(team?.alternateColor) : (ok(team?.color)||ok(team?.alternateColor)||null);
}
function getRecord(c){
  const r=(c.records||[]).find(x=>x.type==='total')||(c.records||[])[0];
  return r?.summary||null;
}
function fmtTime(ms){
  return new Date(ms).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
    .replace(':00','').replace(' AM','a').replace(' PM','p');
}
async function espnFetch(url){
  const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),8000);
  try{ const r=await fetch(url,{signal:ctrl.signal}); if(!r.ok) throw new Error('ESPN '+r.status); return r.json(); }
  finally{ clearTimeout(t); }
}

function setStatus(cls,text){
  const dot=document.getElementById('status-dot');
  dot.className='dot '+cls;
  document.getElementById('update-time').textContent=text;
}
function showError(msg){
  const b=document.getElementById('error-banner');
  document.getElementById('error-banner-inner').textContent=msg;
  b.style.display='block';
}
function hideError(){ document.getElementById('error-banner').style.display='none'; }

function parseGame(ev){
  const comp=ev.competitions?.[0]; if(!comp) return null;
  const home=comp.competitors?.find(c=>c.homeAway==='home');
  const away=comp.competitors?.find(c=>c.homeAway==='away');
  if(!home||!away) return null;
  const status=comp.status??ev.status;
  const state=status?.type?.state;
  const completed=!!status?.type?.completed;
  const dateMs=new Date(ev.date).getTime();
  const period=status?.period||1;
  const clock=status?.displayClock||'';
  const isRedZone=state==='in'&&!!comp.situation?.isRedZone;
  return {
    id:ev.id, dateMs, state, completed,
    period, clock, isRedZone,
    away:{abbr:away.team?.abbreviation||'—', name:away.team?.displayName||'', logo:away.team?.logo||null,
      color:pickTeamColor(away.team), score:parseInt(away.score)||0, record:getRecord(away), winner:!!away.winner},
    home:{abbr:home.team?.abbreviation||'—', name:home.team?.displayName||'', logo:home.team?.logo||null,
      color:pickTeamColor(home.team), score:parseInt(home.score)||0, record:getRecord(home), winner:!!home.winner},
  };
}

function dayLabel(ms){
  return new Date(ms).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}).toUpperCase();
}

// Games kicking off within the hour get a live countdown instead of a bare
// kickoff time, refreshed on a 1s tick alongside the score-polling interval.
function isSoon(g){ return g.state==='pre' && g.dateMs-Date.now()<=60*60*1000; }
function soonText(ms){
  const diff=Math.max(0,ms-Date.now());
  const m=Math.floor(diff/60000), s=Math.floor((diff%60000)/1000);
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function ariaLabel(g){
  const a=g.away.name||g.away.abbr, h=g.home.name||g.home.abbr;
  if(g.state==='pre') return a+' at '+h+', '+(isSoon(g)?'starts in '+soonText(g.dateMs):'kicks off '+fmtTime(g.dateMs));
  if(g.completed) return a+' '+g.away.score+', '+h+' '+g.home.score+', final'+(g.away.winner?', '+a+' won':g.home.winner?', '+h+' won':'');
  return a+' '+g.away.score+', '+h+' '+g.home.score+', quarter '+g.period+', '+g.clock+' remaining'+(g.isRedZone?', red zone':'');
}

function renderPlainCard(g,dayLabelText){
  const pre=g.state==='pre';
  const soon=isSoon(g);
  const awayScoreHtml=pre?'':'<span class="wk-plain-score'+(g.away.winner?' win':'')+'">'+g.away.score+'</span>';
  const homeScoreHtml=pre?'':'<span class="wk-plain-score'+(g.home.winner?' win':'')+'">'+g.home.score+'</span>';
  const statusText=pre?(soon?'':fmtTime(g.dateMs)):(g.completed?'Final':'Q'+g.period+' · '+g.clock);
  const countdownHtml=soon?'<span class="wk-countdown" data-start="'+g.dateMs+'">'+soonText(g.dateMs)+'</span>':'';
  return '<div class="wk-card wk-plain" role="group" aria-label="'+escHtml(ariaLabel(g))+'">'
    +'<div class="wk-daylabel">'+escHtml(dayLabelText||'')+'</div>'
    +row(g.away,awayScoreHtml)
    +row(g.home,homeScoreHtml)
    +'<div class="wk-plain-status'+(pre&&!soon?' pre':'')+'">'+(soon?countdownHtml:escHtml(statusText))+'</div>'
    +'</div>';
  function row(t,scoreHtml){
    return '<div class="wk-plain-row">'
      +(t.logo?'<img class="wk-logo'+(t.winner?'':' mono')+'" src="'+t.logo+'" alt="" loading="lazy">':'')
      +'<span class="wk-plain-abbr">'+escHtml(t.abbr)+'</span>'
      +(t.record?'<span class="wk-plain-record">'+escHtml(t.record)+'</span>':'')
      +scoreHtml+'</div>';
  }
}

function renderLiveCard(g){
  const statusText='Q'+g.period+' · '+g.clock;
  const c1=g.away.color||'#3d3d3d', c2=g.home.color||'#3d3d3d';
  return '<div class="wk-card wk-live" style="--c1:'+c1+';--c2:'+c2+'" role="group" aria-label="'+escHtml(ariaLabel(g))+'">'
    +'<div class="wk-live-status"><span class="dot"></span>'+escHtml(statusText)
    +(g.isRedZone?'<span class="rz">Red Zone</span>':'')+'</div>'
    +'<div class="wk-live-teams">'
    +team(g.away,g.away.score>g.home.score)
    +'<div class="wk-live-vs"><span class="wk-live-rule"></span></div>'
    +team(g.home,g.home.score>g.away.score)
    +'</div></div>';
  function team(t,lead){
    return '<div class="wk-live-team">'
      +(t.logo?'<img class="wk-live-wm" src="'+t.logo+'" alt="" loading="lazy">':'')
      +'<span class="wk-live-abbr">'+escHtml(t.abbr)+'</span>'
      +'<span class="wk-live-score'+(lead?' lead':'')+'">'+t.score+'</span></div>';
  }
}

let countdownFetchDone=false;
let pollTimer=null;

function render(games,weekNumber){
  countdownFetchDone=false;
  document.getElementById('wk-title').textContent='NFL — Week '+(weekNumber||'');
  const main=document.getElementById('wk-main');
  if(!games.length){ main.innerHTML='<div class="wk-loading">No games found.</div>'; return; }

  const live=games.filter(g=>g.state==='in');
  const rest=games.filter(g=>g.state!=='in').sort((a,b)=>a.dateMs-b.dateMs);

  let html='';
  if(live.length){
    html+=live.map(renderLiveCard).join('');
  }

  let lastDay=null;
  html+='<div class="wk-grid">'+rest.map(g=>{
    const dayKey=new Date(g.dateMs).toDateString();
    const label=dayKey!==lastDay?dayLabel(g.dateMs):null;
    lastDay=dayKey;
    return renderPlainCard(g,label);
  }).join('')+'</div>';

  main.innerHTML=html;

  const playing=new Set(games.flatMap(g=>[g.away.abbr,g.home.abbr]));
  const byeTeams=ALL_NFL_TEAMS.filter(([abbr])=>!playing.has(abbr));
  if(byeTeams.length&&byeTeams.length<32){
    main.insertAdjacentHTML('beforeend','<div class="wk-bye" role="note"><b>On bye:</b> '+byeTeams.map(([,name])=>escHtml(name)).join(', ')+'</div>');
  }
}

function tickCountdowns(){
  document.querySelectorAll('.wk-countdown').forEach(el=>{
    const start=parseInt(el.dataset.start,10);
    if(Date.now()>=start){
      el.textContent='00:00';
      // Fire one refetch when a countdown expires (to pick up kickoff), then
      // leave it to the normal poll cadence — avoids hammering the API if
      // ESPN hasn't flipped the game to 'in' yet (delayed kickoff, etc).
      if(!countdownFetchDone){ countdownFetchDone=true; fetchWeek(); }
      return;
    }
    el.textContent=soonText(start);
  });
}
setInterval(tickCountdowns,1000);

// Poll fast only while a game is actually live; otherwise scores rarely
// change so a half-hour cadence is plenty and saves battery/bandwidth.
async function fetchWeek(){
  clearTimeout(pollTimer);
  setStatus('loading','Fetching scores…');
  hideError();
  try{
    const d=await espnFetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    const games=(d.events||[]).map(parseGame).filter(Boolean);
    render(games,d.week?.number);
    const hasLive=games.some(g=>g.state==='in');
    setStatus('',hasLive?'Live':'Updated '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}));
    pollTimer=setTimeout(fetchWeek,hasLive?60000:30*60000);
  }catch(e){
    setStatus('error','Error');
    showError('Could not load NFL scores. Retrying shortly.');
    pollTimer=setTimeout(fetchWeek,15000);
  }
}

fetchWeek();
