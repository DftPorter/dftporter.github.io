const TEAMS = {
  eagles:   { name:'Eagles',   sport:'NFL', icon:'🦅', color:'#004C54', path:'football/nfl',   teamId:'21',    logo:'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/phi.png'    },
  sixers:   { name:'76ers',    sport:'NBA', icon:'🏀', color:'#006BB6', path:'basketball/nba', teamId:'20',    logo:'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/phi.png'    },
  flyers:   { name:'Flyers',   sport:'NHL', icon:'🏒', color:'#F74902', path:'hockey/nhl',     teamId:'15',    logo:'https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/phi.png'    },
  phillies: { name:'Phillies', sport:'MLB', icon:'⚾', color:'#E81828', path:'baseball/mlb',   teamId:'22',    logo:'https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/phi.png'    },
  union:    { name:'Union',    sport:'MLS', icon:'⚽', color:'#8b6914', path:'soccer/usa.1',   teamId:'10739', logo:'https://a.espncdn.com/i/teamlogos/soccer/500/10739.png'},
};
const TEAM_ORDER = ['eagles','sixers','flyers','phillies','union'];

const NEWS_FEEDS = [
  { team:'Sixers',   color:'#006BB6', url:'https://www.libertyballers.com/rss/index.xml'     },
  { team:'Eagles',   color:'#004C54', url:'https://www.bleedinggreennation.com/rss/index.xml' },
  { team:'Flyers',   color:'#F74902', url:'https://www.broadstreethockey.com/rss/index.xml'   },
  { team:'Phillies', color:'#E81828', url:'https://www.thegoodphight.com/rss/index.xml'       },
  { team:'Union',    color:'#8b6914', url:'https://phillysoccerpage.net/feed/'                },
];

function fmtShort(ms){ return new Date(ms).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtFull(ms){
  const d = new Date(ms);
  return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+', '+
         d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
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
  // Sort TV-type entries before Streaming so RSNs/cable channels aren't pushed out by MLB.TV etc.
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
  const now=new Date(), yr=now.getFullYear(), m=now.getMonth(); // m: 0=Jan…11=Dec
  if(path.startsWith('football/nfl')){
    // First Thursday after Labor Day (first Monday of September)
    const sep1=new Date(yr,8,1);
    const thu=new Date(sep1);
    thu.setDate(1+(4-sep1.getDay()+7)%7);
    return 'Next season starts ~'+thu.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  }
  if(path.startsWith('baseball/mlb')){
    if(m>=10||m===0) return 'Spring Training starts February';   // Nov–Jan
    if(m===1)        return 'Spring Training underway';           // Feb
    if(m===2)        return 'Regular season starts late March';   // Mar
    return null;                                                  // Apr–Oct: in-season
  }
  if(path.startsWith('basketball/nba')){
    // Regular season opens mid-October
    return 'Next season starts ~October '+(m>=9?yr+1:yr);
  }
  if(path.startsWith('hockey/nhl')){
    // Regular season opens mid-October
    return 'Next season starts ~October '+(m>=9?yr+1:yr);
  }
  if(path.startsWith('soccer')){
    // MLS regular season opens late February
    return 'Next season starts ~February '+(m>=1?yr+1:yr);
  }
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

// Next game cache — sessionStorage, invalidated once game date passes
function getCachedNextGame(key){
  try{
    const raw = sessionStorage.getItem('nextgame:'+key);
    if(!raw) return null;
    const {dateMs, data} = JSON.parse(raw);
    if(Date.now() > dateMs) return null; // game date passed, invalidate
    return data;
  } catch(e){ return null; }
}
function setCachedNextGame(key, eventData, dateMs){
  try{ sessionStorage.setItem('nextgame:'+key, JSON.stringify({dateMs, data:eventData})); } catch(e){}
}
const OPP_LOGO_TTL = 30*24*60*60*1000;
const oppLogoCache = {};
(()=>{
  try{
    // v4: cache key now includes sport prefix to prevent cross-sport ID collisions
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
  // Soccer uses ID-based URLs; other sports use scoreboard/abbr format
  const slug = (!isSoccerLogo && oppAbbr) ? oppAbbr.toLowerCase() : oppId;
  const subdir = (!isSoccerLogo && oppAbbr) ? 'scoreboard/' : '';
  const url = 'https://a.espncdn.com/i/teamlogos/'+sport+'/500/'+subdir+slug+'.png';
  oppLogoCache[cacheKey]=url;
  saveOppLogos();
  return url;
}

// Opponent record cache — keyed as "sport:oppId" to prevent cross-sport collisions
const oppRecordCache = {};
async function fetchOppRecord(path, oppId){
  const sport=path.split('/')[0]; // e.g. 'football', 'basketball', 'hockey', 'baseball', 'soccer'
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
const MLS_RECORDS_TTL = 30 * 60 * 1000; // refresh standings every 30 min
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
  // Fetch schedule (cached for 1 hour)
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

  // If no next game found from schedule, scan upcoming scoreboards (catches playoffs)
  if(!nextGame && !isOffseason){
    for(let daysAhead = 1; daysAhead <= 7; daysAhead++){
      const dt = new Date(now + daysAhead*24*60*60*1000);
      const dateStr = dt.toISOString().slice(0,10).replace(/-/g,'');
      const sb = await espnFetch(base+'/scoreboard?dates='+dateStr).catch(()=>null);
      if(!sb?.events) continue;
      for(const ev of sb.events){
        const p = parseEvent(ev, teamId);
        if(p && !p.completed && p.dateMs > now - 30*60*1000){
          nextGame = p;
          break;
        }
      }
      if(nextGame) break;
    }
  }
  // If schedule has no completed games, scan recent scoreboards (catches season transitions)
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

  // Scoreboard override: if today's scoreboard has a completed game that is
  // more recent than what the schedule cache knows about, the cache is stale
  // (game finished while the 1-hour TTL was still active). Promote the
  // scoreboard result to lastCompleted and bust the stale cache entry so the
  // next refresh fetches a fresh schedule.
  const sbCompleted=liveGame?.completed?liveGame:null;
  if(sbCompleted&&(!lastCompleted||sbCompleted.dateMs>lastCompleted.dateMs)){
    lastCompleted=sbCompleted;
    if(!recentGames.some(g=>g.dateMs===sbCompleted.dateMs)) recentGames.push(sbCompleted);
    try{ sessionStorage.removeItem('sched:'+key); }catch(e){}
    // If the cached nextGame was actually this just-finished game, clear it
    if(nextGame&&Math.abs(nextGame.dateMs-sbCompleted.dateMs)<2*60*60*1000) nextGame=null;
  }

  const activeLive=liveGame?.featuredStatus==='live'?liveGame:null;
  const nextIsClose=nextGame&&(nextGame.dateMs-now)<=2*60*60*1000;

  // Detect season-ending states ESPN doesn't immediately flag as type=4
  const seasonTypeNum=typeof seasonType==='object'?seasonType?.type:seasonType;
  const isPlayoffSeason=seasonTypeNum===3;
  // Eliminated: playoff season with no upcoming games and at least one completed game.
  // Covers both "lost in playoffs" and "missed playoffs while league is in playoffs".
  // Edge case: may briefly trigger in the 1-2 day gap between rounds before ESPN schedules
  // the next series — self-corrects on the next refresh once games are posted.
  const isEliminated=!isOffseason&&isPlayoffSeason&&!nextGame&&!!lastCompleted;
  // Missed playoffs: regular season wrapped up with no upcoming games (ESPN sometimes lags on type→4)
  const isRegularSeason=seasonTypeNum===2;
  const missedPlayoffs=!isOffseason&&isRegularSeason&&!nextGame&&!!lastCompleted;
  const effectiveOffseason=isOffseason||isEliminated||missedPlayoffs;

  const featured=effectiveOffseason?null:
    activeLive?activeLive:
    nextIsClose?nextGame:
    lastCompleted?lastCompleted:
    nextGame?nextGame:null;
  const fs=effectiveOffseason?'offseason':
    !featured?'offseason':
    activeLive?'live':
    nextIsClose&&nextGame?'upcoming':
    lastCompleted?featured.featuredStatus:
    nextGame?'upcoming':
    'offseason';

  const showRecords=fs!=='offseason';
  const phiRecordFallback=lastCompleted?.phiRecord||null;
  const oppRecordFallback=(featured&&!featured.oppRecord&&featured.oppId&&fs!=='offseason')
    ?await fetchOppRecord(path,featured.oppId).catch(()=>null):null;
  const soccerPhiRecord=isSoccer?(mlsRecords[String(teamId)]||schRes?.team?.recordSummary||phiRecordFallback||null):null;
  const soccerOppRecord=isSoccer?(mlsRecords[featured?.oppId||'']||null):null;

  let streak=null;
  const allParsed=[...schedEvents].reverse().map(ev=>parseEvent(ev,teamId)).filter(p=>p?.completed);
  if(allParsed.length){
    const outcomes=allParsed.map(p=>p.phiScore>p.oppScore?'W':p.phiScore<p.oppScore?'L':'D');
    let count=1;
    for(let i=1;i<outcomes.length;i++){ if(outcomes[i]===outcomes[0]) count++; else break; }
    streak=outcomes[0]+count;
  }

  const completedDateMs=lastCompleted?.dateMs||0;
  const recentFiltered=effectiveOffseason?[]:recentGames
    .slice(-4).filter(g=>g.dateMs!==(featured?.dateMs||-1))
    .slice(-3).reverse();

  return {
    featuredStatus:fs,
    completedDateMs,
    featured:featured?{
      label:     fs==='starting'?'STARTING NOW':fs==='upcoming'?'NEXT GAME':null,
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
    recentGames:recentFiltered.map(g=>({opp:g.oppAbbr,home:g.isHome,phiScore:g.phiScore,oppScore:g.oppScore,date:fmtShort(g.dateMs)})),
    nextGame:nextGame&&fs!=='starting'&&fs!=='live'&&!nextIsClose
      ?(nextGame.isHome?'vs':'@')+' '+nextGame.oppAbbr+' · '+fmtFull(nextGame.dateMs):null,
    nextGameIsPlayoff:!!(nextGame?.isPlayoff),
    nextGameToday:nextGame?new Date(nextGame.dateMs).toDateString()===new Date().toDateString():false,
    featuredDateMs:featured?.dateMs||0,
    nextGameDateMs:nextGame?.dateMs||0,
    streak:effectiveOffseason?null:streak,
    standing:effectiveOffseason?null:(schRes?.team?.standingSummary||null),
    offseasonNote:fs==='offseason'?nextSeasonNote(path):null,
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
  return note
    .replace(/^\s*(NBA|NFL|NHL|MLB|MLS|WNBA)\s+/i,'')
    .replace(/\s*-\s*/g,' · ')
    .trim();
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
async function fetchNews(){
  if(Date.now()-newsCache.fetchedAt<NEWS_TTL) return newsCache.items;
  try{
    const results=await Promise.all(NEWS_FEEDS.map(async feed=>{
      const d=await fetch(RSS_PROXY+encodeURIComponent(feed.url)+'&_='+Math.floor(Date.now()/300000)).then(r=>r.json()).catch(()=>null);
      return (d?.items||[]).slice(0,5).map(item=>({title:item.title?.trim(),link:item.link,pubDate:item.pubDate,team:feed.team,color:feed.color}));
    }));
    const allItems=results.flat().filter(i=>i.title&&i.pubDate).sort((a,b)=>parseRssDate(b.pubDate)-parseRssDate(a.pubDate));
    const byTeam={};
    allItems.forEach(item=>{ if(!byTeam[item.team]) byTeam[item.team]=[]; if(byTeam[item.team].length<4) byTeam[item.team].push(item); });
    const merged=allItems.slice(0,5);
    newsCache={items:merged,byTeam,fetchedAt:Date.now()};
    return merged;
  } catch(err){ console.warn('News fetch failed',err); return newsCache.items; }
}
function renderNewsCard(items){
  const content=items.length
    ?items.map(item=>'<a class="news-item" href="'+safeUrl(item.link)+'" target="_blank" rel="noopener"><div class="news-item-title">'+escHtml(item.title)+'</div><div class="news-item-meta"><span class="news-team-tag" style="background:'+item.color+'22;color:'+item.color+';border:1px solid '+item.color+'44">'+escHtml(item.team)+'</span><span class="news-time">'+timeAgo(item.pubDate)+'</span></div></a>').join('')
    :'<div class="news-loading">Loading headlines…</div>';
  return '<div class="news-card"><div class="news-header"><span class="news-header-icon">📰</span><span class="news-header-title">Philly Sports News</span></div>'+content+'</div>';
}

// ── Modal ──
let modalOpenKey=null;

function syncModalStatus(){
  const dot=document.getElementById('status-dot');
  const mDot=document.getElementById('modal-status-dot');
  const mTime=document.getElementById('modal-update-time');
  const mCD=document.getElementById('modal-countdown');
  if(mDot) mDot.className=dot.className;
  if(mTime) mTime.textContent=document.getElementById('update-time').textContent;
  if(mCD) mCD.textContent=document.getElementById('countdown').textContent;
}

function updateModalScores(key){
  const data=_cardData[key];
  if(!data?.featured) return;
  const f=data.featured;
  const phiS=f.phiScore??0, oppS=f.oppScore??0;
  const phiEl=document.getElementById('modal-phi-score');
  const oppEl=document.getElementById('modal-opp-score');
  if(phiEl){ phiEl.textContent=phiS; phiEl.className='modal-team-score'+(phiS>oppS?' modal-winner':''); }
  if(oppEl){ oppEl.textContent=oppS; oppEl.className='modal-team-score'; }
  const noteEl=document.getElementById('modal-game-note');
  if(noteEl) noteEl.textContent=f.note||'';
  const sitEl=document.getElementById('modal-situation');
  if(sitEl){
    if(f.situation){
      const posStr=f.possession?' · 🏈 '+f.possession:'';
      sitEl.textContent=f.situation+posStr;
      sitEl.style.display='';
    } else {
      sitEl.textContent='';
      sitEl.style.display='none';
    }
  }
  syncModalStatus();
}

function openModal(key,data){
  if(window.innerWidth<=768) return;
  const team=TEAMS[key];
  const f=data?.featured;
  if(!f) return;
  modalOpenKey=key;
  const inner=document.getElementById('live-modal-inner');
  inner.style.setProperty('--modal-color',team.color);
  const sportEl=document.getElementById('modal-sport-text');
  const oppAbbrEl=document.getElementById('modal-opp-abbr');
  const phiLogoEl=document.getElementById('modal-phi-logo');
  const oppLogoEl=document.getElementById('modal-opp-logo');
  if(sportEl) sportEl.textContent=team.sport+' · LIVE NOW';
  if(oppAbbrEl) oppAbbrEl.textContent=f.oppAbbr||'OPP';
  if(phiLogoEl){ phiLogoEl.src=team.logo; phiLogoEl.style.display=''; }
  if(oppLogoEl){ oppLogoEl.src=f.oppLogo||''; oppLogoEl.style.display=f.oppLogo?'':'none'; }
  // Reorder modal sides based on home/away
  const teamsEl=document.getElementById('modal-teams');
  const phiSide=document.getElementById('modal-phi-side');
  const divider=document.getElementById('modal-divider');
  const oppSide=document.getElementById('modal-opp-side');
  if(teamsEl&&phiSide&&divider&&oppSide){
    teamsEl.innerHTML='';
    if(f.isHome){
      teamsEl.appendChild(oppSide);
      teamsEl.appendChild(divider);
      teamsEl.appendChild(phiSide);
    } else {
      teamsEl.appendChild(phiSide);
      teamsEl.appendChild(divider);
      teamsEl.appendChild(oppSide);
    }
  }
  updateModalScores(key);
  const modal=document.getElementById('live-modal');
  modal.classList.add('open');
  document.body.style.overflow='hidden';
  // Save focus origin and move focus into modal
  modal._previousFocus=document.activeElement;
  const closeBtn=document.getElementById('modal-close');
  if(closeBtn) closeBtn.focus();
  // Keyboard: Escape closes
  modal._onKeyDown=e=>{ if(e.key==='Escape') closeModal(); };
  document.addEventListener('keydown',modal._onKeyDown);
  // Click outside closes
  modal._onBgClick=e=>{ if(e.target===modal) closeModal(); };
  modal.addEventListener('click',modal._onBgClick);
  // Focus trap: keep Tab cycling within modal
  const focusable=modal.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])');
  if(focusable.length>1){
    const first=focusable[0], last=focusable[focusable.length-1];
    modal._trapFocus=e=>{
      if(e.key!=='Tab') return;
      if(e.shiftKey){ if(document.activeElement===first){ e.preventDefault(); last.focus(); } }
      else { if(document.activeElement===last){ e.preventDefault(); first.focus(); } }
    };
    modal.addEventListener('keydown',modal._trapFocus);
  }
}

function closeModal(){
  modalOpenKey=null;
  const modal=document.getElementById('live-modal');
  modal.classList.remove('open');
  document.body.style.overflow='';
  if(modal._onKeyDown) document.removeEventListener('keydown',modal._onKeyDown);
  if(modal._onBgClick) modal.removeEventListener('click',modal._onBgClick);
  if(modal._trapFocus){ modal.removeEventListener('keydown',modal._trapFocus); modal._trapFocus=null; }
  if(modal._previousFocus){ modal._previousFocus.focus(); modal._previousFocus=null; }
}

// ── Rendering ──
const _cardData={};

function showSkeletons(){
  document.getElementById('cards-container').innerHTML=TEAM_ORDER.map(()=>'<div class="skeleton-card"><div class="skeleton-header"><div class="sk sk-circle"></div><div style="flex:1;display:flex;flex-direction:column;gap:8px"><div class="sk sk-line" style="width:60%"></div><div class="sk sk-line" style="width:35%;height:10px"></div></div></div><div class="sk-body"><div class="sk sk-line" style="height:60px"></div><div class="sk sk-line" style="width:80%"></div><div class="sk sk-line" style="width:65%"></div><div class="sk sk-line" style="width:72%"></div></div></div>').join('');
}
function setStatus(state,text){
  document.getElementById('status-dot').className='pulse-dot'+(state!=='ok'?' '+state:'');
  document.getElementById('update-time').textContent=text;
  const a11y=document.getElementById('a11y-status');
  if(a11y&&state==='ok') a11y.textContent=text;
}
function showError(msg){ document.getElementById('error-banner').style.display='block'; document.getElementById('error-banner-inner').textContent='⚠ '+msg; }
function hideError(){ document.getElementById('error-banner').style.display='none'; }

function scoreHtml(score,winner,upcoming,isPhi,abbr){
  const label=abbr||(isPhi?'PHI':'OPP');
  if(upcoming||score===null) return '<div class="team-score no-score" aria-label="'+label+' score not yet available">&ndash;</div>';
  if(winner&&isPhi)  return '<div class="team-score winner" aria-label="'+label+' '+score+', winning">'+score+'</div>';
  if(winner&&!isPhi) return '<div class="team-score opp-winning" aria-label="'+label+' '+score+', winning">'+score+'</div>';
  return '<div class="team-score" aria-label="'+label+' '+score+'">'+score+'</div>';
}

function renderCard(key,data){
  _cardData[key]=data;
  const {name,sport,icon,color}=TEAMS[key];
  const fs=data.featuredStatus||'offseason';
  const statusLabel={live:'● Live',starting:'● Starting',final:'Final',upcoming:'Upcoming',offseason:'Off-Season'}[fs]||'Off-Season';
  const statusCls={live:'status-live',starting:'status-starting',final:'status-final',upcoming:'status-upcoming',offseason:'status-offseason'}[fs]||'status-offseason';
  const streakCls=data.streak?.startsWith('W')?'streak-w':data.streak?.startsWith('L')?'streak-l':'streak-d';
  const isLive=fs==='live'||fs==='starting';
  const clickAttr=isLive
    ?' role="button" tabindex="0" aria-label="'+name+' live game — click to expand" onclick="openModal(\''+key+'\',_cardData[\''+key+'\'])" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openModal(\''+key+'\',_cardData[\''+key+'\'])}"'
    :'';
  let featuredHtml='';
  if(data.featured&&fs!=='offseason'){
    const f=data.featured, upcoming=fs==='upcoming';
    const phiWins=!upcoming&&f.phiScore>f.oppScore;
    const oppWins=!upcoming&&f.oppScore>f.phiScore;
    const phiImg='<img class="team-logo" src="'+TEAMS[key].logo+'" alt="PHI" onerror="this.style.display=\'none\'">';
    const oppImg=f.oppLogo?'<img class="team-logo" src="'+f.oppLogo+'" alt="'+f.oppAbbr+'" onerror="this.style.display=\'none\'">':'';
    const phiSide='<div class="team-side"><div class="team-abv">PHI</div>'+phiImg+scoreHtml(f.phiScore,phiWins,upcoming,true,'PHI')+(f.phiRecord?'<div class="team-record">'+f.phiRecord+'</div>':'')+'</div>';
    const oppSide='<div class="team-side"><div class="team-abv">'+f.oppAbbr+'</div>'+oppImg+scoreHtml(f.oppScore,oppWins,upcoming,false,f.oppAbbr)+(f.oppRecord?'<div class="team-record">'+f.oppRecord+'</div>':'')+'</div>';
    const div='<div class="vs-divider"><div class="vs-line"></div><div class="vs-text">VS</div><div class="vs-line"></div></div>';
    const matchup=f.isHome?oppSide+div+phiSide:phiSide+div+oppSide;
    const seriesStr=f.isPlayoff&&f.seriesSummary?' · '+f.seriesSummary:'';
    const playoffBadge=f.isPlayoff?'<div class="playoff-badge">'+fmtPlayoffNote(f.gameNote)+seriesStr+'</div>':'';
    const datePrefix=fs==='final'&&data.featuredDateMs?fmtShort(data.featuredDateMs)+' · ':'';
    const broadcastRow=fs!=='final'&&f.broadcast?'<div class="broadcast-row">📺 '+f.broadcast+'</div>':'';
    featuredHtml='<div class="featured-game">'
      +playoffBadge
      +(f.label?'<div class="game-label">'+f.label+'</div>':'')
      +'<div class="matchup">'+matchup+'</div><div class="game-info-row">'+datePrefix+f.note+(f.venue?' · '+f.venue:'')+'</div>'+broadcastRow+'</div>';
  } else {
    featuredHtml='<div class="offseason-banner">'+(data.offseasonNote?'<div class="offseason-note">'+data.offseasonNote+'</div>':'')+'</div>';
  }
  const recentHtml=data.recentGames?.length?data.recentGames.map(g=>{ const r=g.phiScore>g.oppScore?{c:'win',l:'W'}:g.phiScore<g.oppScore?{c:'loss',l:'L'}:{c:'draw',l:'D'}; return '<div class="result-row"><div class="result-matchup">'+(g.home?'vs':'@')+' <span>'+g.opp+'</span></div><div class="result-score">'+g.phiScore+'&ndash;'+g.oppScore+'</div><div class="result-wl '+r.c+'">'+r.l+'</div><div class="result-date">'+g.date+'</div></div>'; }).join(''):'<div class="no-recent">No recent games</div>';
  const nextHtml=data.nextGame?'<div class="next-game-row'+(data.nextGameToday?' today':'')+(data.nextGameIsPlayoff?' playoffs':'')+'"><div class="next-game-label">'+(data.nextGameIsPlayoff?'Playoffs &#9654;':'Next &#9654;')+'</div><div class="next-game-info">'+data.nextGame+(data.nextGameToday?'<span class="today-badge">TODAY</span>':'')+'</div></div>':'';
  // During offseason, swap Recent Games for team-specific Recent Headlines
  const NEWS_TEAM_KEY={eagles:'Eagles',sixers:'Sixers',flyers:'Flyers',phillies:'Phillies',union:'Union'};
  const teamNewsKey=NEWS_TEAM_KEY[key];
  const teamNews=(fs==='offseason'&&teamNewsKey)?(newsCache.byTeam?.[teamNewsKey]||[]):[];
  const recentSection=teamNews.length
    ?'<div class="recent-results"><div class="results-label">Recent Headlines</div>'+teamNews.map(item=>'<a class="card-news-item" href="'+safeUrl(item.link)+'" target="_blank" rel="noopener noreferrer"><div class="card-news-title">'+escHtml(item.title)+'</div><div class="card-news-time">'+timeAgo(item.pubDate)+'</div></a>').join('')+'</div>'
    :'<div class="recent-results"><div class="results-label">Recent Games</div>'+recentHtml+nextHtml+'</div>';
  return '<div class="team-card'+(isLive?' is-live':'')+'" data-team="'+key+'" style="--team-color:'+color+'"'+clickAttr+'><div class="card-header"><div class="team-icon"><img src="'+TEAMS[key].logo+'" alt="'+escHtml(name)+'"></div><div class="team-meta"><div class="team-name">'+name+'</div><div class="team-sport">'+sport+'</div>'+(data.standing?'<div class="team-sport" style="margin-top:2px">'+data.standing+'</div>':'')+'</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px"><span class="card-status '+statusCls+'">'+statusLabel+'</span>'+(data.streak?'<span class="streak '+streakCls+'">'+data.streak+'</span>':'')+'</div></div>'+featuredHtml+recentSection+(isLive?'<div class="live-expand-hint">⛶ Click to expand</div>':'')+'</div>';
}

// ── Theme ──
const THEMES=['device','light','dark'];
const THEME_ICONS={device:'🖥️',light:'☀️',dark:'🌙'};
const _darkMQ=window.matchMedia('(prefers-color-scheme:dark)');
function cycleTheme(){
  const cur=localStorage.getItem('colorScheme')||'device';
  applyTheme(THEMES[(THEMES.indexOf(cur)+1)%THEMES.length]);
}
function applyTheme(theme){
  localStorage.setItem('colorScheme',theme);
  const effective=theme==='device'?(_darkMQ.matches?'dark':'light'):theme;
  document.documentElement.setAttribute('data-theme',effective);
  document.getElementById('theme-icon').textContent=THEME_ICONS[theme];
  const btn=document.getElementById('theme-btn');
  if(btn) btn.setAttribute('aria-label','Color scheme: '+theme);
}
_darkMQ.addEventListener('change',()=>{ if((localStorage.getItem('colorScheme')||'device')==='device') applyTheme('device'); });
applyTheme(localStorage.getItem('colorScheme')||'device');

// ── Countdown & refresh ──
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
    const txt=m+':'+s;
    document.getElementById('countdown').textContent=txt;
    const modal=document.getElementById('live-modal');
    if(modal?.classList.contains('open')){
      const mCD=document.getElementById('modal-countdown');
      if(mCD) mCD.textContent=txt;
    }
  },1000);
}

function scheduleNextRefresh(scores){
  clearTimeout(refreshTimeout);
  const secs=getRefreshInterval(scores);
  startCountdown(secs);
  refreshTimeout=setTimeout(()=>fetchScores(true),secs*1000);
}

// ── Startup retry state ──
let firstLoadDone = false;
let startupRetryTimer = null;
let startupRetryCount = 0;
const STARTUP_RETRY_DELAYS = [5, 15, 30, 60, 120]; // seconds

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

async function fetchScores(silent=false){
  const btn=document.getElementById('refresh-btn');
  if(!silent){ btn.disabled=true; btn.classList.add('spinning'); hideError(); setStatus('loading','Fetching live scores…'); showSkeletons(); }
  // Refresh MLS standings in the background if they've gone stale
  if(Date.now()-mlsRecordsFetchedAt>MLS_RECORDS_TTL) fetchMlsRecords();
  try{
    const [results,newsItems]=await Promise.all([
      Promise.allSettled(TEAM_ORDER.map(k=>fetchTeamData(k))),
      fetchNews(),
    ]);
    const scores={};
    TEAM_ORDER.forEach((k,i)=>{
      scores[k]=results[i].status==='fulfilled'
        ?results[i].value
        :{featuredStatus:'offseason',featured:null,recentGames:[],nextGame:null,completedDateMs:0,offseasonNote:'Data unavailable',featuredDateMs:0,nextGameDateMs:0};
    });
    const rank=s=>({live:0,starting:0,upcoming:1,final:2,offseason:3}[s]??3);
    const sorted=TEAM_ORDER.map(k=>({key:k,data:scores[k]})).sort((a,b)=>{
      const rd=rank(a.data.featuredStatus)-rank(b.data.featuredStatus);
      if(rd!==0) return rd;
      return (b.data.completedDateMs||0)-(a.data.completedDateMs||0);
    });
    document.getElementById('cards-container').innerHTML=sorted.map(({key,data})=>renderCard(key,data)).join('')+renderNewsCard(newsItems);
    TEAM_ORDER.forEach(k=>{
      const curr=scores[k]?.featured, prev=prevScores[k]?.featured;
      if(curr&&prev&&(curr.phiScore!==prev.phiScore||curr.oppScore!==prev.oppScore)){
        const card=document.querySelector('.team-card[data-team="'+k+'"]');
        if(card){ card.classList.remove('score-changed'); void card.offsetWidth; card.classList.add('score-changed'); }
      }
    });
    if(modalOpenKey){
      const modal=document.getElementById('live-modal');
      if(modal?.classList.contains('open')) updateModalScores(modalOpenKey);
    }
    prevScores=scores;
    const t=new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    setStatus('ok','Updated '+t);
    syncModalStatus();
    firstLoadDone=true;
    clearTimeout(startupRetryTimer);
    scheduleNextRefresh(scores);
  } catch(err){
    console.error(err);
    if(!firstLoadDone){
      scheduleStartupRetry();
    } else {
      setStatus('error','Update failed');
      if(!silent) showError('Could not fetch scores: '+err.message);
    }
  } finally{
    if(!silent){ btn.disabled=false; btn.classList.remove('spinning'); }
  }
}

fetchScores();
