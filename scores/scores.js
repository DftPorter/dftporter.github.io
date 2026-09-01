const TEAMS = {
  eagles:   { name:'Eagles',   sport:'NFL', color:'#3d7a6c', logo:'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/phi.png', path:'football/nfl',   teamId:'21'    },
  sixers:   { name:'76ers',    sport:'NBA', color:'#2e8fd6', logo:'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/phi.png', path:'basketball/nba', teamId:'20',    liftLogo:true },
  flyers:   { name:'Flyers',   sport:'NHL', color:'#F74902', logo:'https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/phi.png', path:'hockey/nhl',     teamId:'15'    },
  phillies: { name:'Phillies', sport:'MLB', color:'#E81828', logo:'https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/phi.png', path:'baseball/mlb',   teamId:'22',    liftLogo:true },
  union:    { name:'Union',    sport:'MLS', color:'#b49759', logo:'https://a.espncdn.com/i/teamlogos/soccer/500/10739.png',       path:'soccer/usa.1',   teamId:'10739' },
};
const TEAM_ORDER = ['eagles','sixers','flyers','phillies','union'];

const TEAM_LOGO_BY_NAME={Sixers:'sixers',Eagles:'eagles',Flyers:'flyers',Phillies:'phillies',Union:'union'};
const NEWS_FEEDS = [
  { team:'Sixers',   color:'#2e8fd6', url:'https://www.libertyballers.com/rss/index.xml'      },
  { team:'Eagles',   color:'#3d7a6c', url:'https://www.bleedinggreennation.com/rss/index.xml' },
  { team:'Flyers',   color:'#F74902', url:'https://www.broadstreethockey.com/rss/index.xml'   },
  { team:'Phillies', color:'#E81828', url:'https://www.thegoodphight.com/rss/index.xml'       },
  { team:'Union',    color:'#b49759', url:'https://phillysoccerpage.net/feed/'                },
];

function fmtShort(ms){ return new Date(ms).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtFull(ms){
  const d = new Date(ms);
  return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+', '+
         d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
}
function fmtTime(ms){
  return new Date(ms).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
    .replace(':00','').replace(' AM','a').replace(' PM','p');
}
// Compact next-game line: "9:40p @ ARI" today, "Sun 1p vs WSH" this week,
// "Sep 7 1p vs DAL" beyond, "Oct 22 vs MIL" when the opener is months out.
function fmtNextShort(ms,isHome,oppAbbr){
  const d=new Date(ms), now=new Date();
  const opp=(isHome?'vs ':'@ ')+oppAbbr;
  const days=Math.round((d-now)/86400000);
  if(d.toDateString()===now.toDateString()) return fmtTime(ms)+' '+opp;
  if(days>14) return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' '+opp;
  const when=days<6
    ? d.toLocaleDateString('en-US',{weekday:'short'})
    : d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  return when+' '+fmtTime(ms)+' '+opp;
}
function parseScore(s){
  if(s==null) return 0;
  if(typeof s==='object') return s.value??(parseInt(s.displayValue)||0);
  return parseInt(s)||0;
}
async function espnFetch(url){
  const ctrl=new AbortController();
  const t=setTimeout(()=>ctrl.abort(),8000);
  try{
    const r=await fetch(url,{signal:ctrl.signal});
    if(!r.ok) throw new Error('ESPN '+r.status);
    return r.json();
  } finally{ clearTimeout(t); }
}

function parseEvent(ev, teamId){
  const comp = ev.competitions?.[0];
  if(!comp) return null;
  const us   = comp.competitors?.find(c=>String(c.team?.id)===String(teamId));
  const them = comp.competitors?.find(c=>String(c.team?.id)!==String(teamId));
  if(!us||!them) return null;
  const status    = comp.status??ev.status;
  const state     = status?.type?.state;
  const completed = !!status?.type?.completed;
  const detail    = status?.type?.shortDetail||'';
  const dateMs    = new Date(ev.date).getTime();
  const now       = Date.now();
  const isHome    = us.homeAway==='home';
  const oppAbbr   = (them.team?.abbreviation||'OPP').toUpperCase();
  const oppId     = String(them.team?.id||'');
  const phiScore  = (completed||state==='in') ? parseScore(us.score)   : null;
  const oppScore  = (completed||state==='in') ? parseScore(them.score) : null;
  const getRecord = c=>{ if(!c?.record) return null; if(typeof c.record==='string') return c.record||null; return (c.record.find(r=>r.type==='total')||c.record.find(r=>r.type==='ytd')||c.record[0])?.displayValue||null; };
  const phiRecord = getRecord(us);
  const oppRecord = getRecord(them);
  const venue     = comp.venue ? comp.venue.fullName+', '+comp.venue.address?.city : null;
  const gameNote  = comp.notes?.[0]?.headline||null;
  const isPlayoff = gameNote ? /playoff|play.?in|postseason|round|series/i.test(gameNote) : false;
  const seriesSummary = comp.series?.summary||ev.series?.summary||null;
  const geoBcasts=(comp.geoBroadcasts||[]).slice().sort((a,b)=>(a.type?.shortName==='TV'?0:1)-(b.type?.shortName==='TV'?0:1));
  const broadcast=(geoBcasts.length?geoBcasts.map(b=>b.media?.shortName).filter(Boolean):comp.broadcasts?.flatMap(b=>b.names||[]).filter(Boolean)||[]).slice(0,3).join(', ')||null;
  const situation = state==='in' ? (comp.situation?.shortDownDistanceText||null) : null;
  const possession = state==='in' ? (comp.situation?.possessionText||null) : null;
  const featuredStatus =
    state==='in'                              ? 'live'     :
    completed                                 ? 'final'    :
    state==='pre' && dateMs<=now              ? 'starting' :
    state==='pre' && dateMs<=now+2*60*60*1000 ? 'upcoming' :
    state==='pre'                             ? 'final'    : 'offseason';
  const note =
    state==='in'                ? detail :
    featuredStatus==='starting' ? 'Starting now…' :
    state==='pre'               ? fmtFull(dateMs) :
                                  detail||'Final';
  return { featuredStatus, isHome, oppAbbr, oppId, phiScore, oppScore, phiRecord, oppRecord, venue, dateMs, note, completed, gameNote, isPlayoff, seriesSummary, broadcast, situation, possession };
}

function nextSeasonNote(path){
  const now=new Date(), yr=now.getFullYear(), m=now.getMonth();
  if(path.startsWith('football/nfl')){
    const sep1=new Date(yr,8,1);
    const thu=new Date(sep1);
    thu.setDate(1+(4-sep1.getDay()+7)%7);
    return 'Next season starts ~'+thu.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  }
  if(path.startsWith('baseball/mlb')){
    if(m>=10||m===0) return 'Spring Training starts February';
    if(m===1)        return 'Spring Training underway';
    if(m===2)        return 'Regular season starts late March';
    return null;
  }
  if(path.startsWith('basketball/nba')) return 'Next season starts ~October '+(m>=9?yr+1:yr);
  if(path.startsWith('hockey/nhl'))     return 'Next season starts ~October '+(m>=9?yr+1:yr);
  if(path.startsWith('soccer'))         return 'Next season starts ~February '+(m>=1?yr+1:yr);
  return null;
}

// Schedule cache — sessionStorage with 1-hour TTL
const SCHEDULE_TTL = 60 * 60 * 1000;
function getCachedSchedule(key){
  try{
    const raw = sessionStorage.getItem('sched:'+key);
    if(!raw) return null;
    const {ts, data} = JSON.parse(raw);
    if(Date.now() - ts > SCHEDULE_TTL) return null;
    return data;
  } catch(e){ return null; }
}
function setCachedSchedule(key, data){
  try{ sessionStorage.setItem('sched:'+key, JSON.stringify({ts:Date.now(), data})); } catch(e){}
}

const OPP_LOGO_TTL = 30*24*60*60*1000;
const oppLogoCache = {};
(()=>{
  try{
    const ver = localStorage.getItem('oppLogosVer');
    if(ver !== '4') { localStorage.removeItem('oppLogos'); localStorage.setItem('oppLogosVer','4'); }
    const stored = JSON.parse(localStorage.getItem('oppLogos')||'{}');
    const now = Date.now();
    Object.entries(stored).forEach(([id,entry])=>{
      if(now-entry.ts<OPP_LOGO_TTL) oppLogoCache[id]=entry.url;
    });
  } catch(e){}
})();
function saveOppLogos(){
  try{
    const now=Date.now(), out={};
    Object.entries(oppLogoCache).forEach(([id,url])=>{ out[id]={url,ts:now}; });
    localStorage.setItem('oppLogos',JSON.stringify(out));
  } catch(e){}
}
function oppLogoUrl(path, oppId, oppAbbr){
  if(!oppId) return null;
  const sport = path.startsWith('football')  ? 'nfl'
    : path.startsWith('basketball') ? 'nba'
    : path.startsWith('hockey')     ? 'nhl'
    : path.startsWith('baseball')   ? 'mlb'
    : 'soccer';
  const cacheKey = sport + ':' + oppId;
  if(oppLogoCache[cacheKey]!==undefined) return oppLogoCache[cacheKey];
  const isSoccerLogo = sport === 'soccer';
  const slug = (!isSoccerLogo && oppAbbr) ? oppAbbr.toLowerCase() : oppId;
  const subdir = (!isSoccerLogo && oppAbbr) ? 'scoreboard/' : '';
  const url = 'https://a.espncdn.com/i/teamlogos/'+sport+'/500/'+subdir+slug+'.png';
  oppLogoCache[cacheKey]=url;
  saveOppLogos();
  return url;
}

const oppRecordCache = {};
async function fetchOppRecord(path, oppId){
  const sport=path.split('/')[0];
  const cacheKey=sport+':'+oppId;
  if(!oppId||oppRecordCache[cacheKey]!==undefined) return oppRecordCache[cacheKey]||null;
  try{
    const base='https://site.api.espn.com/apis/site/v2/sports/'+path;
    const d=await espnFetch(base+'/teams/'+oppId+'/schedule').catch(()=>null);
    const events=d?.events||d?.team?.events||[];
    const last=[...events].reverse().find(e=>e.competitions?.[0]?.status?.type?.completed);
    const comp=last?.competitions?.[0];
    const them=comp?.competitors?.find(c=>String(c.team?.id)===String(oppId));
    const getRecord=c=>{ if(!c?.record) return null; if(typeof c.record==='string') return c.record||null; return (c.record.find(r=>r.type==='total')||c.record.find(r=>r.type==='ytd')||c.record[0])?.displayValue||null; };
    oppRecordCache[cacheKey]=getRecord(them);
  } catch(e){ oppRecordCache[cacheKey]=null; }
  return oppRecordCache[cacheKey]||null;
}

let mlsRecords = {};
let mlsRecordsFetchedAt = 0;
const MLS_RECORDS_TTL = 30 * 60 * 1000;
async function fetchMlsRecords(){
  try{
    const d=await espnFetch('https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings');
    const entries=d.children?.flatMap(c=>c.standings?.entries||[])||[];
    const updated={};
    entries.forEach(e=>{
      const overall=e.stats?.find(s=>s.name==='overall')?.displayValue;
      if(e.team?.id&&overall) updated[String(e.team.id)]=overall;
    });
    mlsRecords=updated;
    mlsRecordsFetchedAt=Date.now();
  } catch(err){ console.warn('MLS standings fetch failed',err); }
}
fetchMlsRecords();

async function fetchTeamData(key){
  const {path,teamId}=TEAMS[key];
  const base='https://site.api.espn.com/apis/site/v2/sports/'+path;
  const isSoccer=path.startsWith('soccer');
  let liveGame=null;
  let schRes = getCachedSchedule(key);
  if(!schRes){
    if(isSoccer){
      const [sbBoard, teamInfo] = await Promise.all([
        espnFetch(base+'/scoreboard?dates='+(new Date().getFullYear())+'0101-'+(new Date().getFullYear())+'1231&limit=300').catch(()=>null),
        espnFetch(base+'/teams/'+teamId+'/schedule').catch(()=>null),
      ]);
      if(sbBoard?.events){
        schRes = {
          season: teamInfo?.season||sbBoard.leagues?.[0]?.season||{type:2},
          team:   teamInfo?.team||{id:teamId},
          events: sbBoard.events.filter(e=>e.competitions?.[0]?.competitors?.some(c=>String(c.team?.id)===String(teamId))),
        };
      }
    } else {
      schRes = await espnFetch(base+'/teams/'+teamId+'/schedule').catch(()=>null);
    }
    if(schRes) setCachedSchedule(key, schRes);
  }
  const sbRes=await espnFetch(base+'/scoreboard').catch(()=>null);
  const now=Date.now();
  const seasonType=schRes?.season?.type;
  const isOffseason=(typeof seasonType==='object'?seasonType?.type:seasonType)===4;
  const rawEvents=schRes?.events||schRes?.team?.events||[];
  const schedEvents=[...rawEvents].sort((a,b)=>new Date(a.date)-new Date(b.date));

  const recentGames=[];
  let lastCompleted=null, nextGame=null;
  for(const ev of schedEvents){
    const p=parseEvent(ev,teamId);
    if(!p) continue;
    if(p.completed){ lastCompleted=p; recentGames.push(p); }
    else if(!nextGame&&!p.completed){ if(p.dateMs>now-30*60*1000) nextGame=p; }
  }

  if(!nextGame){
    // The team-schedule endpoint sometimes stops at the end of the current
    // season type (e.g. preseason) and omits the next one's opener, even
    // though it's only days away — pull a dated range directly as a backstop.
    const spanDays = isOffseason ? 35 : 21;
    const endDt = new Date(now + spanDays*24*60*60*1000);
    const startStr = new Date(now).toISOString().slice(0,10).replace(/-/g,'');
    const endStr = endDt.toISOString().slice(0,10).replace(/-/g,'');
    const sb = await espnFetch(base+'/scoreboard?dates='+startStr+'-'+endStr+'&limit=300').catch(()=>null);
    if(sb?.events){
      const teamEvents=sb.events.filter(e=>e.competitions?.[0]?.competitors?.some(c=>String(c.team?.id)===String(teamId)));
      for(const ev of teamEvents.sort((a,b)=>new Date(a.date)-new Date(b.date))){
        const p = parseEvent(ev, teamId);
        if(p && !p.completed && p.dateMs > now - 30*60*1000){ nextGame = p; break; }
      }
    }
  }
  if(!lastCompleted && !isOffseason){
    const backGames=[];
    for(let daysBack=1; daysBack<=7; daysBack++){
      const dt=new Date(now-daysBack*24*60*60*1000);
      const dateStr=dt.toISOString().slice(0,10).replace(/-/g,'');
      const sb=await espnFetch(base+'/scoreboard?dates='+dateStr).catch(()=>null);
      if(!sb?.events) continue;
      for(const ev of sb.events){
        const p=parseEvent(ev,teamId);
        if(p&&p.completed) backGames.push(p);
      }
      if(backGames.length>=4) break;
    }
    if(backGames.length){
      backGames.sort((a,b)=>a.dateMs-b.dateMs);
      recentGames.push(...backGames);
      lastCompleted=backGames[backGames.length-1];
    }
  }
  if(sbRes?.events){
    for(const ev of sbRes.events){
      const p=parseEvent(ev,teamId);
      if(p){ liveGame=p; if(p.featuredStatus==='live') break; }
    }
  }

  const sbCompleted=liveGame?.completed?liveGame:null;
  if(sbCompleted&&(!lastCompleted||sbCompleted.dateMs>lastCompleted.dateMs)){
    lastCompleted=sbCompleted;
    if(!recentGames.some(g=>g.dateMs===sbCompleted.dateMs)) recentGames.push(sbCompleted);
    try{ sessionStorage.removeItem('sched:'+key); }catch(e){}
    if(nextGame&&Math.abs(nextGame.dateMs-sbCompleted.dateMs)<2*60*60*1000) nextGame=null;
  }

  const activeLive=liveGame?.featuredStatus==='live'?liveGame:null;
  const nextIsClose=nextGame&&(nextGame.dateMs-now)<=2*60*60*1000;
  const nextIsNear=nextGame&&(nextGame.dateMs-now)<=7*24*60*60*1000;

  const seasonTypeNum=typeof seasonType==='object'?seasonType?.type:seasonType;
  const isPlayoffSeason=seasonTypeNum===3;
  const isEliminated=!isOffseason&&isPlayoffSeason&&!nextGame&&!!lastCompleted;
  const isRegularSeason=seasonTypeNum===2;
  const missedPlayoffs=!isOffseason&&isRegularSeason&&!nextGame&&!!lastCompleted;
  const effectiveOffseason=isOffseason||isEliminated||missedPlayoffs;

  const featured=effectiveOffseason?null:
    activeLive?activeLive:
    nextIsClose?nextGame:
    lastCompleted?lastCompleted:
    nextIsNear?nextGame:null;
  const fs=effectiveOffseason?'offseason':
    !featured?'offseason':
    activeLive?'live':
    nextIsClose&&nextGame?'upcoming':
    lastCompleted?featured.featuredStatus:
    nextIsNear?'upcoming':
    'offseason';

  const showRecords=fs!=='offseason';
  const phiRecordFallback=lastCompleted?.phiRecord||null;
  const oppRecordFallback=(featured&&!featured.oppRecord&&featured.oppId&&fs!=='offseason')
    ?await fetchOppRecord(path,featured.oppId).catch(()=>null):null;
  const soccerPhiRecord=isSoccer?(mlsRecords[String(teamId)]||schRes?.team?.recordSummary||phiRecordFallback||null):null;
  const soccerOppRecord=isSoccer?(mlsRecords[featured?.oppId||'']||null):null;

  let streak=null, form=null;
  const allParsed=[...schedEvents].reverse().map(ev=>parseEvent(ev,teamId)).filter(p=>p?.completed);
  if(allParsed.length){
    const outcomes=allParsed.map(p=>p.phiScore>p.oppScore?'W':p.phiScore<p.oppScore?'L':'D');
    let count=1;
    for(let i=1;i<outcomes.length;i++){ if(outcomes[i]===outcomes[0]) count++; else break; }
    streak=outcomes[0]+count;
    form=outcomes.slice(0,5).reverse();   // oldest → most recent
  }

  const completedDateMs=lastCompleted?.dateMs||0;
  const lastResult=lastCompleted?{
    opp:lastCompleted.oppAbbr, home:lastCompleted.isHome,
    phiScore:lastCompleted.phiScore, oppScore:lastCompleted.oppScore,
    date:fmtShort(lastCompleted.dateMs), dateMs:lastCompleted.dateMs,
  }:null;

  return {
    featuredStatus:fs,
    completedDateMs,
    teamRecord:showRecords?(soccerPhiRecord||featured?.phiRecord||phiRecordFallback||null):null,
    featured:featured?{
      isHome:    featured.isHome||false,
      oppAbbr:   featured.oppAbbr||'OPP',
      oppId:     featured.oppId||null,
      oppLogo:   oppLogoUrl(path, featured.oppId||null, featured.oppAbbr||null),
      phiScore:  featured.phiScore,
      oppScore:  featured.oppScore,
      note:      featured.note,
      venue:     featured.venue||null,
      gameNote:  featured.gameNote||null,
      isPlayoff: featured.isPlayoff||false,
      seriesSummary: featured.seriesSummary||null,
      broadcast: featured.broadcast||null,
      situation: featured.situation||null,
      possession: featured.possession||null,
      phiRecord: showRecords?(soccerPhiRecord||featured.phiRecord||phiRecordFallback||null):null,
      oppRecord: showRecords?(soccerOppRecord||featured.oppRecord||oppRecordFallback||null):null,
    }:null,
    lastResult,
    nextGame:nextGame&&fs!=='starting'&&fs!=='live'
      ?fmtNextShort(nextGame.dateMs,nextGame.isHome,nextGame.oppAbbr):null,
    nextGameIsPlayoff:!!(nextGame?.isPlayoff),
    nextGameToday:nextGame?new Date(nextGame.dateMs).toDateString()===new Date().toDateString():false,
    featuredDateMs:featured?.dateMs||0,
    nextGameDateMs:nextGame?.dateMs||0,
    streak:effectiveOffseason?null:streak,
    form:effectiveOffseason?null:form,
    standing:effectiveOffseason?null:(schRes?.team?.standingSummary||null),
    offseasonNote:fs==='offseason'?(nextGame&&!nextIsNear?(seasonTypeNum===1?'Preseason':'Season')+' opens '+new Date(nextGame.dateMs).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):nextSeasonNote(path)):null,
    isPreseason:!effectiveOffseason&&seasonTypeNum===1,
  };
}

// ── News ──
const RSS_PROXY='https://api.rss2json.com/v1/api.json?rss_url=';
let newsCache={items:[],byTeam:{},fetchedAt:0};
const NEWS_TTL=5*60*1000;
function parseRssDate(str){ if(!str) return 0; return new Date(str.replace(' ','T')+'Z').getTime()||0; }
function escHtml(s){ const d=document.createElement('div'); d.textContent=String(s||''); return d.innerHTML; }
function fmtPlayoffNote(note){
  if(!note) return 'Playoffs';
  return note.replace(/^\s*(NBA|NFL|NHL|MLB|MLS|WNBA)\s+/i,'').replace(/\s*-\s*/g,' · ').trim();
}
function safeUrl(s){ try{ const u=new URL(s); return (u.protocol==='https:'||u.protocol==='http:') ? s : '#'; }catch(e){ return '#'; } }
function timeAgo(dateStr){
  const diff=Date.now()-parseRssDate(dateStr);
  if(diff<0||diff<60000) return 'just now';
  const mins=Math.floor(diff/60000);
  if(mins<60) return mins+'m ago';
  const hrs=Math.round(mins/60);
  if(hrs<24) return hrs+'h ago';
  return Math.floor(hrs/24)+'d ago';
}
let newsFailed=false;
function fetchWithTimeout(url,ms){
  const ac=new AbortController();
  const t=setTimeout(()=>ac.abort(),ms);
  return fetch(url,{signal:ac.signal}).finally(()=>clearTimeout(t));
}
async function fetchNews(){
  if(Date.now()-newsCache.fetchedAt<NEWS_TTL) return newsCache.items;
  try{
    const results=await Promise.all(NEWS_FEEDS.map(async feed=>{
      const d=await fetchWithTimeout(RSS_PROXY+encodeURIComponent(feed.url)+'&_='+Math.floor(Date.now()/300000),9000)
        .then(r=>r.json()).catch(()=>null);
      return (d?.items||[]).slice(0,5).map(item=>({title:item.title?.trim(),link:item.link,pubDate:item.pubDate,team:feed.team,color:feed.color}));
    }));
    const allItems=results.flat().filter(i=>i.title&&i.pubDate).sort((a,b)=>parseRssDate(b.pubDate)-parseRssDate(a.pubDate));
    const byTeam={};
    allItems.forEach(item=>{ if(!byTeam[item.team]) byTeam[item.team]=[]; if(byTeam[item.team].length<4) byTeam[item.team].push(item); });
    const merged=allItems.slice(0,9);
    newsFailed=!merged.length;
    newsCache={items:merged,byTeam,fetchedAt:Date.now()};
    return merged;
  } catch(err){ console.warn('News fetch failed',err); newsFailed=true; return newsCache.items; }
}

// ── Snapshot cache (paint last known state instantly on cold open) ──
const SNAPSHOT_TTL=12*60*60*1000;
function saveSnapshot(sorted,newsItems,t){
  try{ localStorage.setItem('snapshot',JSON.stringify({ts:Date.now(),time:t,sorted,newsItems})); }catch(e){}
}
function paintSnapshot(){
  try{
    const s=JSON.parse(localStorage.getItem('snapshot')||'null');
    if(!s||Date.now()-s.ts>SNAPSHOT_TTL||!s.sorted?.length) return false;
    renderAll(s.sorted,s.newsItems||[]);
    hasPaint=true;
    setStatus('loading','Updated '+s.time);
    return true;
  }catch(e){ return false; }
}

// ── Rendering ──
const _cardData={};

let hasPaint=false;
function showSkeletons(){
  document.getElementById('cards-container').innerHTML=TEAM_ORDER.map(()=>
    '<div class="sk-card"><div class="sk" style="width:55%;height:22px"></div><div class="sk" style="width:70%;height:11px"></div>'
    +'<div class="sk" style="width:45%;height:40px"></div><div class="sk" style="width:80%"></div></div>').join('');
}
let lastOkTime=null;
function setStatus(state,text){
  document.getElementById('status-dot').className='dot'+(state!=='ok'?' '+state:'');
  document.getElementById('update-time').textContent=text;
  const a11y=document.getElementById('a11y-status');
  if(a11y&&state==='ok') a11y.textContent=text;
}
function showError(msg){ document.getElementById('error-banner').style.display='block'; document.getElementById('error-banner-inner').textContent='⚠ '+msg; }
function hideError(){ document.getElementById('error-banner').style.display='none'; }

function daysUntil(ms){
  if(!ms) return null;
  const d=Math.ceil((ms-Date.now())/86400000);
  return d>0?d:null;
}

function renderHero(key,data){
  const t=TEAMS[key], f=data.featured;
  const phiS=f.phiScore??0, oppS=f.oppScore??0;
  const phiLeads=phiS>oppS, oppLeads=oppS>phiS;
  const lift=cls=>t.liftLogo?cls+' lift':cls;
  const phiSide='<div class="hero-side">'
    +'<div class="'+lift('hero-wm')+'" style="background-image:url('+t.logo+')"></div>'
    +'<div class="hero-abbr">PHI</div>'
    +'<div class="hero-score'+(phiLeads?' leading':'')+'" id="hero-phi-score">'+phiS+'</div>'
    +(f.phiRecord?'<div class="hero-record">'+escHtml(f.phiRecord)+'</div>':'')
    +'</div>';
  const oppSide='<div class="hero-side">'
    +(f.oppLogo?'<div class="hero-wm" style="background-image:url('+f.oppLogo+')"></div>':'')
    +'<div class="hero-abbr">'+escHtml(f.oppAbbr)+'</div>'
    +'<div class="hero-score'+(oppLeads?' leading':'')+'">'+oppS+'</div>'
    +(f.oppRecord?'<div class="hero-record">'+escHtml(f.oppRecord)+'</div>':'')
    +'</div>';
  const vs='<div class="hero-vs"><div class="hero-rule"></div><span>AT</span><div class="hero-rule"></div></div>';
  const kickerText=t.sport+' · '+t.name+(data.featuredStatus==='starting'?' starting':' live')
    +(f.isPlayoff?' · '+fmtPlayoffNote(f.gameNote):'');
  const broadcast=[f.broadcast,f.venue].filter(Boolean).join(' · ');
  const situationText=[f.situation,f.possession].filter(Boolean).join(' · ');
  return '<section class="hero" id="hero" style="--team-color:'+t.color+'">'
    +'<div class="hero-top">'
      +'<div class="hero-kicker"><span class="dot" aria-hidden="true"></span><span>'+escHtml(kickerText)+'</span></div>'
      +(broadcast?'<div class="hero-broadcast">'+escHtml(broadcast)+'</div>':'')
    +'</div>'
    +'<div class="hero-grid">'+(f.isHome?oppSide+vs+phiSide:phiSide+vs+oppSide)+'</div>'
    +'<div class="hero-foot">'
      +'<div class="hero-clock">'+escHtml(f.note||'')+'</div>'
      +(situationText?'<div class="sep"></div><div class="hero-situation">'+escHtml(situationText)+'</div>':'')
    +'</div>'
  +'</section>';
}

function soonText(ms){
  const min=Math.round((ms-Date.now())/60000);
  if(min<=0) return 'Starting now';
  if(min===1) return 'In 1 min';
  return 'In '+min+' min';
}
function nextBadge(data){
  const ms=data.nextGameDateMs, left=ms-Date.now();
  if(ms&&left>-60000&&left<=60*60*1000)
    return '<span class="soon-badge" data-start="'+ms+'">'+soonText(ms)+'</span>';
  return data.nextGameToday?'<span class="today-badge">Today</span>':'';
}
function tickSoonBadges(){
  document.querySelectorAll('.soon-badge').forEach(el=>{
    const ms=+el.dataset.start;
    if(ms-Date.now()>60*60*1000||ms-Date.now()<-60000){ el.remove(); return; }
    const txt=soonText(ms);
    if(el.textContent!==txt) el.textContent=txt;
  });
}

function renderCard(key,data){
  const t=TEAMS[key];
  const off=data.featuredStatus==='offseason';
  const days=off?daysUntil(data.nextGameDateMs):null;

  const meta=off
    ? '<span class="card-offlabel">Off-season</span>'
    : '<span class="card-record">'+escHtml(data.teamRecord||'—')+'</span>'
      +(data.standing?'<span class="card-place">'+escHtml(data.standing)+'</span>':'');
  const pillText=off?null:(data.nextGameIsPlayoff?'Playoffs':data.isPreseason?'Preseason':null);
  const pill=pillText?'<span class="pill">'+escHtml(pillText)+'</span>'
    :(!off&&data.form&&data.form.length
      ?'<span class="form" role="img" aria-label="Last '+data.form.length+' results, oldest first: '+data.form.map(o=>o==='W'?'win':o==='L'?'loss':'draw').join(', ')+'" title="Last '+data.form.length+': '+data.form.join(' ')+'">'
        +data.form.map((o,i)=>'<i class="f'+o.toLowerCase()+(i===data.form.length-1?' cur':'')+'"></i>').join('')
        +'</span>'
      :'');

  let body;
  if(off){
    body=days
      ? '<div class="card-count"><b>'+days+'</b><span>days out</span></div>'
      : '<div class="card-count"><span style="padding-bottom:0">'+escHtml(data.offseasonNote||'Between seasons')+'</span></div>';
  } else {
    const g=data.lastResult;
    if(g){
      const r=g.phiScore>g.oppScore?{c:'w',l:'W'}:g.phiScore<g.oppScore?{c:'l',l:'L'}:{c:'d',l:'D'};
      const aged=(Date.now()-g.dateMs)>24*60*60*1000?' aged':'';
      body='<div class="card-scoreline'+aged+'"><div class="card-score">'+g.phiScore+'–'+g.oppScore+'</div>'
        +'<div class="card-result '+r.c+'">'+r.l+'</div></div>'
        +'<div class="card-last">Last · '+(g.home?'vs ':'@ ')+escHtml(g.opp)+' · '+escHtml(g.date)+' · '+g.phiScore+'–'+g.oppScore+'</div>';
    } else {
      body='<div class="card-count"><span style="padding-bottom:0">No games played yet</span></div>';
    }
  }

  const footLabel=off?'Opens':'Next';
  const footText=off
    ? (data.nextGame||data.offseasonNote||'TBD')
    : (data.nextGame?data.nextGame+nextBadge(data):'Schedule TBD');

  // In season but nothing happening: last game is old and nothing is imminent.
  const nextMs=data.nextGameDateMs||0;
  const idle=!off && data.featuredStatus!=='live' && data.featuredStatus!=='starting'
    && !data.nextGameToday
    && !!data.lastResult && (Date.now()-(data.lastResult.dateMs||0))>24*60*60*1000
    && !(nextMs && nextMs-Date.now()<=60*60*1000);

  return '<article class="card'+(off?' off':'')+(idle?' idle':'')+'" data-team="'+key+'" style="--team-color:'+t.color+'">'
    +'<div class="card-wm'+(t.liftLogo?' lift':'')+'" style="background-image:url('+t.logo+')"></div>'
    +'<div class="card-spine"></div>'
    +'<div class="card-head"><div class="card-name">'+escHtml(t.name)+'</div><div class="card-sport">'+t.sport+'</div></div>'
    +'<div class="card-meta"><div class="card-meta-text">'+meta+'</div>'+pill+'</div>'
    +'<div class="card-body">'+body+'</div>'
    +'<div class="card-foot"><span class="card-foot-label">'+footLabel+'</span>'
      +'<span class="card-foot-text">'+footText+'</span></div>'
  +'</article>';
}

function renderCollapse(entries){
  const rows=entries.map(({key,data})=>{
    const t=TEAMS[key];
    const days=daysUntil(data.nextGameDateMs);
    const opener=data.nextGame||data.offseasonNote||'Schedule TBD';
    return '<div class="collapse-row" style="--team-color:'+t.color+'">'
      +'<span class="cdot"></span>'
      +'<span class="cname">'+escHtml(t.name)+'</span>'
      +'<span class="csport">'+t.sport+'</span>'
      +'<span class="cspacer"></span>'
      +(days?'<span class="cdays">'+days+'d</span>':'')
      +'<span class="copen">'+escHtml(opener)+'</span>'
    +'</div>';
  }).join('');
  return '<section class="collapse">'
    +'<div class="collapse-head"><b>Off-season</b><span>'+entries.length+' teams waiting</span></div>'
    +'<div class="collapse-rows">'+rows+'</div>'
  +'</section>';
}

async function retryNews(){
  document.getElementById('wire-grid').innerHTML='<div class="wire-loading">Loading headlines…</div>';
  newsCache.fetchedAt=0; newsFailed=false;
  renderWire(await fetchNews());
}
let wireAutoTimer=null;
function initWireNav(){
  const grid=document.getElementById('wire-grid'), prev=document.getElementById('wire-prev'), next=document.getElementById('wire-next');
  if(!grid||!prev||!next) return;
  const step=()=>grid.querySelector('.wire-item')?.getBoundingClientRect().width||240;
  const atEnd=()=>grid.scrollLeft>=grid.scrollWidth-grid.clientWidth-2;
  const update=()=>{
    prev.disabled=grid.scrollLeft<=2;
    next.disabled=atEnd();
  };
  const smoothTo=(target,ms)=>{
    const start=grid.scrollLeft, dist=target-start, t0=performance.now();
    const ease=x=>1-Math.pow(1-x,3);
    const tick=now=>{
      const p=Math.min(1,(now-t0)/ms);
      grid.scrollLeft=start+dist*ease(p);
      if(p<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const advance=()=>{
    if(atEnd()) smoothTo(0,1400);
    else smoothTo(grid.scrollLeft+step(),1400);
  };
  prev.onclick=()=>{ stopAuto(); smoothTo(Math.max(0,grid.scrollLeft-step()),1400); };
  next.onclick=()=>{ stopAuto(); smoothTo(grid.scrollLeft+step(),1400); };
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stopAuto=()=>{ clearInterval(wireAutoTimer); wireAutoTimer=null; };
  const startAuto=()=>{
    if(reduced||wireAutoTimer||grid.scrollWidth<=grid.clientWidth+2) return;
    wireAutoTimer=setInterval(advance,9500);
  };
  grid.onscroll=update;
  grid.addEventListener('mouseenter',stopAuto);
  grid.addEventListener('mouseleave',startAuto);
  grid.addEventListener('focusin',stopAuto);
  grid.addEventListener('focusout',startAuto);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) stopAuto(); else startAuto(); });
  new ResizeObserver(update).observe(grid);
  update();
  stopAuto();
  startAuto();
}
function renderWire(items){
  const grid=document.getElementById('wire-grid');
  if(!items.length){
    grid.innerHTML=newsFailed
      ? '<div class="wire-loading">Headlines unavailable · <button type="button" class="wire-retry" onclick="retryNews()">Retry</button></div>'
      : '<div class="wire-loading">No headlines right now</div>';
    return;
  }
  requestAnimationFrame(initWireNav);
  grid.innerHTML=items.map(item=>{
    const tk=TEAM_LOGO_BY_NAME[item.team], tt=TEAMS[tk];
    return '<a class="wire-item" style="--tag:'+item.color+'" href="'+safeUrl(item.link)+'" target="_blank" rel="noopener noreferrer">'
    +(tt?.logo?'<div class="wire-logo" style="background-image:url('+tt.logo+')"></div>':'')
    +'<div class="wire-item-text">'
      +'<div class="wire-title">'+escHtml(item.title)+'</div>'
      +'<div class="wire-meta">'
        +'<span class="wire-tag" style="--tag:'+item.color+';border-bottom-color:'+item.color+'b3">'+escHtml(item.team)+'</span>'
        +'<span class="wire-time">'+timeAgo(item.pubDate)+'</span>'
      +'</div>'
    +'</div></a>';
  }).join('');
}

function renderAll(sorted,newsItems){
  sorted.forEach(({key,data})=>{ _cardData[key]=data; });
  const heroEntry=sorted.find(e=>e.data.featuredStatus==='live'||e.data.featuredStatus==='starting');
  const offEntries=sorted.filter(e=>e.data.featuredStatus==='offseason'&&e!==heroEntry)
    .sort((a,b)=>(daysUntil(a.data.nextGameDateMs)||9999)-(daysUntil(b.data.nextGameDateMs)||9999));
  // Three or more teams between seasons collapse into one strip so the teams
  // actually playing keep the cards to themselves.
  const collapse=offEntries.length>=3;
  const cardEntries=sorted.filter(e=>e!==heroEntry&&!(collapse&&e.data.featuredStatus==='offseason'));

  document.getElementById('hero-slot').innerHTML=heroEntry?renderHero(heroEntry.key,heroEntry.data):'';
  const main=document.getElementById('cards-container');
  main.className=heroEntry?'':'no-hero';
  main.innerHTML=cardEntries.map(({key,data})=>renderCard(key,data)).join('');
  balanceCards();
  document.getElementById('collapse-slot').innerHTML=collapse?renderCollapse(offEntries):'';
  renderWire(newsItems);
}

// ── Balance card rows so the last row is never a lone orphan ──
function balanceCards(){
  const main=document.getElementById('cards-container');
  const n=main.children.length;
  if(!n) return;
  const gap=14, minW=232;
  const cs=getComputedStyle(main);
  const avail=main.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  const fit=Math.max(1,Math.min(n,Math.floor((avail+gap)/(minW+gap))));
  let cols=Math.ceil(n/Math.ceil(n/fit));
  while(cols>2&&n%cols===1) cols--;   // never leave a lone card on its own row
  main.style.setProperty('--cols',cols);
}
window.addEventListener('resize',balanceCards);

// ── Countdown & refresh ──
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    hiddenAt=Date.now();
    clearInterval(countdownInterval); clearTimeout(refreshTimeout);
    setStatus('idle',lastOkTime?'Paused · '+lastOkTime:'Paused');
  } else {
    // Away long enough that the numbers could have moved — refetch now,
    // otherwise resume both the clock and the pending refresh where they left off.
    if(Date.now()-hiddenAt>60*1000){ fetchScores(); }
    else {
      const secs=Math.max(1,countdownSeconds);
      startCountdown(secs);
      clearTimeout(refreshTimeout);
      refreshTimeout=setTimeout(()=>fetchScores(true),secs*1000);
      setStatus('ok',lastOkTime?'Updated '+lastOkTime:'Updated');
    }
  }
});

let countdownSeconds=300, countdownInterval=null, refreshTimeout=null, prevScores={};

function getRefreshInterval(scores){
  const vals=Object.values(scores);
  const now=Date.now();
  if(vals.some(s=>s.featuredStatus==='live'||s.featuredStatus==='starting')) return 30;
  const in15=now+15*60*1000, ago30=now-30*60*1000;
  if(vals.some(s=>s.nextGameDateMs>ago30&&s.nextGameDateMs<=in15)) return 30;
  const in60=now+60*60*1000;
  if(vals.some(s=>s.nextGameDateMs>now&&s.nextGameDateMs<=in60)) return 900;
  return 1800;
}

function startCountdown(seconds){
  countdownSeconds=seconds;
  clearInterval(countdownInterval);
  countdownInterval=setInterval(()=>{
    countdownSeconds--;
    if(countdownSeconds<0) countdownSeconds=0;
    const m=Math.floor(countdownSeconds/60);
    const s=String(countdownSeconds%60).padStart(2,'0');
    document.getElementById('countdown').textContent=m+':'+s;
    if(countdownSeconds%15===0) tickSoonBadges();
  },1000);
}

function scheduleNextRefresh(scores){
  clearTimeout(refreshTimeout);
  const secs=getRefreshInterval(scores);
  startCountdown(secs);
  refreshTimeout=setTimeout(()=>fetchScores(true),secs*1000);
}

// ── Startup / recovery retry state ──
let firstLoadDone = false;
let startupRetryTimer = null;
let startupRetryCount = 0;
let lastFetchAt = 0;
const STARTUP_RETRY_DELAYS = [5, 15, 30, 60, 120];

function scheduleStartupRetry() {
  clearTimeout(startupRetryTimer);
  if (startupRetryCount >= STARTUP_RETRY_DELAYS.length) return;
  const secs = STARTUP_RETRY_DELAYS[startupRetryCount++];
  setStatus('loading', 'No connection — retrying in ' + secs + 's…');
  startupRetryTimer = setTimeout(() => fetchScores(), secs * 1000);
}

window.addEventListener('online', () => {
  if (!firstLoadDone) {
    clearTimeout(startupRetryTimer);
    startupRetryCount = 0;
    fetchScores();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (!firstLoadDone) {
    clearTimeout(startupRetryTimer);
    startupRetryCount = 0;
    fetchScores();
  } else if (Date.now() - lastFetchAt > 60000) {
    clearTimeout(refreshTimeout);
    fetchScores(true);
  }
});

async function fetchScores(silent=false){
  const btn=document.getElementById('refresh-btn');
  if(!silent){ btn.disabled=true; btn.classList.add('spinning'); hideError(); setStatus('loading','Fetching live scores…'); if(!hasPaint) showSkeletons(); }
  if(Date.now()-mlsRecordsFetchedAt>MLS_RECORDS_TTL) fetchMlsRecords();
  lastFetchAt=Date.now();
  try{
    const [results,newsItems]=await Promise.all([
      Promise.allSettled(TEAM_ORDER.map(k=>fetchTeamData(k))),
      fetchNews(),
    ]);
    const scores={};
    TEAM_ORDER.forEach((k,i)=>{
      scores[k]=results[i].status==='fulfilled'
        ?results[i].value
        :{featuredStatus:'offseason',featured:null,lastResult:null,nextGame:null,completedDateMs:0,offseasonNote:'Data unavailable',featuredDateMs:0,nextGameDateMs:0};
    });
    const hasRealData=newsItems.length>0||TEAM_ORDER.some(k=>scores[k].lastResult||scores[k].featured||scores[k].nextGame);
    if(!hasRealData){
      firstLoadDone=false;
      scheduleStartupRetry();
      return;
    }
    const rank=s=>({live:0,starting:0,upcoming:1,final:2,offseason:3}[s]??3);
    const sorted=TEAM_ORDER.map(k=>({key:k,data:scores[k]})).sort((a,b)=>{
      const rd=rank(a.data.featuredStatus)-rank(b.data.featuredStatus);
      if(rd!==0) return rd;
      return (b.data.completedDateMs||0)-(a.data.completedDateMs||0);
    });
    renderAll(sorted,newsItems);
    hasPaint=true;

    // Motion on score change — flash the hero, or the card, whose score moved.
    TEAM_ORDER.forEach(k=>{
      const curr=scores[k]?.featured, prev=prevScores[k]?.featured;
      if(curr&&prev&&(curr.phiScore!==prev.phiScore||curr.oppScore!==prev.oppScore)){
        const el=document.querySelector('#hero[style*="'+TEAMS[k].color+'"]')
          ||document.querySelector('.card[data-team="'+k+'"]');
        if(el){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
      }
    });
    prevScores=scores;
    const t=new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    lastOkTime=t;
    setStatus('ok','Updated '+t);
    saveSnapshot(sorted,newsItems,t);
    firstLoadDone=true;
    clearTimeout(startupRetryTimer);
    scheduleNextRefresh(scores);
  } catch(err){
    console.error(err);
    if(!firstLoadDone){
      scheduleStartupRetry();
    } else {
      setStatus('error',lastOkTime?'Stale · '+lastOkTime:'Update failed');
      if(!silent) showError('Could not fetch scores: '+err.message);
    }
  } finally{
    if(!silent){ btn.disabled=false; btn.classList.remove('spinning'); }
  }
}

if('serviceWorker' in navigator && location.protocol!=='file:')
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

if(!paintSnapshot()) showSkeletons();
fetchScores();
