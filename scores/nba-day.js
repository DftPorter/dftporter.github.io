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
// The live card's diagonal split doubles as a lead indicator, same as the main
// dashboard's hero: away's (left) share of the card tracks its share of the
// score. Smoothed (+1 each) so a 1-0 start isn't a shutout of the frame, and
// clamped to 34–66% so the seam can never cross either score column.
function computeSplit(awayScore,homeScore){
  if(typeof awayScore!=='number'||typeof homeScore!=='number'||(!awayScore&&!homeScore)) return 50;
  const share=(awayScore+1)/(awayScore+homeScore+2);
  return Math.round(Math.max(.34,Math.min(.66,share))*100);
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

// Basketball periods: 1–4 are quarters, anything beyond is overtime (OT, 2OT…).
function periodLabel(p,state,detail){
  if(detail&&/half/i.test(detail)) return 'Half';
  if(p<=4) return 'Q'+p;
  return (p===5?'':(p-4)+'')+'OT';
}

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
  const detail=status?.type?.shortDetail||'';
  return {
    id:ev.id, dateMs, state, completed, period, clock, detail,
    away:{abbr:away.team?.abbreviation||'—', name:away.team?.displayName||'', logo:away.team?.logo||null,
      color:pickTeamColor(away.team), score:parseInt(away.score)||0, record:getRecord(away), winner:!!away.winner},
    home:{abbr:home.team?.abbreviation||'—', name:home.team?.displayName||'', logo:home.team?.logo||null,
      color:pickTeamColor(home.team), score:parseInt(home.score)||0, record:getRecord(home), winner:!!home.winner},
  };
}

// Games tipping off within the hour get a live countdown instead of a bare
// start time, refreshed on a 1s tick alongside the score-polling interval.
function isSoon(g){ return g.state==='pre' && g.dateMs-Date.now()<=60*60*1000; }
function soonText(ms){
  const diff=Math.max(0,ms-Date.now());
  const m=Math.floor(diff/60000), s=Math.floor((diff%60000)/1000);
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function liveStatusText(g){
  const p=periodLabel(g.period,g.state,g.detail);
  return p==='Half'?'Halftime':p+(g.clock?' · '+g.clock:'');
}
function ariaLabel(g){
  const a=g.away.name||g.away.abbr, h=g.home.name||g.home.abbr;
  if(g.state==='pre') return a+' at '+h+', '+(isSoon(g)?'starts in '+soonText(g.dateMs):'tips off '+fmtTime(g.dateMs));
  if(g.completed) return a+' '+g.away.score+', '+h+' '+g.home.score+', final'+(g.away.winner?', '+a+' won':g.home.winner?', '+h+' won':'');
  return a+' '+g.away.score+', '+h+' '+g.home.score+', '+liveStatusText(g);
}

function renderPlainCard(g){
  const pre=g.state==='pre';
  const soon=isSoon(g);
  const awayScoreHtml=pre?'':'<span class="wk-plain-score'+(g.away.winner?' win':'')+'">'+g.away.score+'</span>';
  const homeScoreHtml=pre?'':'<span class="wk-plain-score'+(g.home.winner?' win':'')+'">'+g.home.score+'</span>';
  const statusText=pre?(soon?'':fmtTime(g.dateMs)):(g.completed?'Final':liveStatusText(g));
  const countdownHtml=soon?'<span class="wk-countdown" data-start="'+g.dateMs+'">'+soonText(g.dateMs)+'</span>':'';
  return '<div class="wk-card wk-plain" role="group" aria-label="'+escHtml(ariaLabel(g))+'">'
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
  const isFinal=g.completed;
  const c1=g.away.color||'#3d3d3d', c2=g.home.color||'#3d3d3d';
  const splitPct=computeSplit(g.away.score,g.home.score);
  const statusText=isFinal?'Final':liveStatusText(g);
  return '<div class="wk-card wk-live'+(isFinal?' wk-final':'')+'" style="--c1:'+c1+';--c2:'+c2+';--split:'+splitPct+'%" role="group" aria-label="'+escHtml(ariaLabel(g))+'">'
    +'<div class="wk-live-status">'+(isFinal?'':'<span class="dot"></span>')+escHtml(statusText)+'</div>'
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

// Set true the one time a countdown's expiry triggers an extra fetch (see
// tickCountdowns below), and never reset — including by the render() that
// fetch itself causes. It used to get cleared at the top of every render(),
// which included the render from this very fetch: as long as ESPN hadn't
// flipped the game live yet, the still-expired countdown re-armed the flag
// and fired another fetch a second later, forever (a visible flash every
// second from the full re-render, until the game finally went live).
let countdownFetchDone=false;
let pollTimer=null;

// Same estimate-based approach as the main dashboard and NFL Week: ESPN gives
// us no "game ended at" timestamp (only the tip-off time, g.dateMs), so this
// estimates the final buzzer as tip-off plus a typical NBA game length, then
// stays large for a further buffer on top of that. Stable across page
// reloads, unlike tracking "when we first saw this go final" (which resets
// to "just now" on every refresh).
const NBA_AVG_GAME_DURATION_MS=135*60*1000; // ~2h15m
const HERO_STAY_BUFFER_MS=2*60*60*1000; // stay large for 2 hours past the estimated final buzzer
function estimatedFinalMs(tipoffMs){ return tipoffMs+NBA_AVG_GAME_DURATION_MS; }
function heroFinalWindowOk(g){
  return g.completed && Date.now()<=estimatedFinalMs(g.dateMs)+HERO_STAY_BUFFER_MS;
}

function render(games,feedDate){
  // ESPN's scoreboard returns the next date that has games, not necessarily
  // today — label the page with the date the feed actually gave us.
  const d=feedDate?new Date(feedDate.slice(0,4)+'-'+feedDate.slice(4,6)+'-'+feedDate.slice(6,8)+'T12:00:00'):new Date();
  const isToday=d.toDateString()===new Date().toDateString();
  document.getElementById('wk-title').textContent='NBA — '+(isToday?'Today':
    d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}));
  const main=document.getElementById('wk-main');
  if(!games.length){ main.innerHTML='<div class="wk-loading">No games scheduled today.</div>'; return; }

  const live=games.filter(g=>g.state==='in'||heroFinalWindowOk(g))
    .sort((a,b)=>{
      const rank=g=>g.state==='in'?0:1;
      const r=rank(a)-rank(b);
      return r||(estimatedFinalMs(b.dateMs)-estimatedFinalMs(a.dateMs));
    });
  const rest=games.filter(g=>!(g.state==='in'||heroFinalWindowOk(g))).sort((a,b)=>a.dateMs-b.dateMs);

  let html=live.map(renderLiveCard).join('');
  html+='<div class="wk-grid">'+rest.map(renderPlainCard).join('')+'</div>';
  main.innerHTML=html;
}

function tickCountdowns(){
  document.querySelectorAll('.wk-countdown').forEach(el=>{
    const start=parseInt(el.dataset.start,10);
    if(Date.now()>=start){
      el.textContent='00:00';
      // One refetch when a countdown expires, then defer to the normal poll
      // cadence — avoids hammering the API on a delayed tip-off.
      if(!countdownFetchDone){ countdownFetchDone=true; fetchDay(); }
      return;
    }
    el.textContent=soonText(start);
  });
}
setInterval(tickCountdowns,1000);

// Poll fast only while a game is actually live; otherwise a half-hour cadence
// is plenty and saves battery/bandwidth.
async function fetchDay(){
  clearTimeout(pollTimer);
  setStatus('loading','Fetching scores…');
  hideError();
  try{
    const d=await espnFetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
    const games=(d.events||[]).map(parseGame).filter(Boolean);
    render(games,(d.day?.date||'').replace(/-/g,''));
    const hasLive=games.some(g=>g.state==='in');
    setStatus('',hasLive?'Live':'Updated '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}));
    pollTimer=setTimeout(fetchDay,hasLive?60000:30*60000);
  }catch(e){
    setStatus('error','Error');
    showError('Could not load NBA scores. Retrying shortly.');
    pollTimer=setTimeout(fetchDay,15000);
  }
}

fetchDay();
