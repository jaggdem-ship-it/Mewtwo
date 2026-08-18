let forecasts=[];
let sport='All', market='All markets';
const pct=x=>Number.isFinite(x)?(x*100).toFixed(1)+'%':'—';
const byMarket=x=>({h2h:'Moneyline',spreads:'Spread',totals:'Total'}[x]||x||'Unknown');
const safeTime=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?d.toLocaleTimeString():'—'};
async function loadForecasts(){
  try{
    const response=await fetch('/api/forecasts',{cache:'no-store'});
    if(!response.ok) throw new Error(`Live API ${response.status}`);
    const payload=await response.json();
    forecasts=(payload.forecasts||[]).map(x=>({...x,sport:x.sport||'NBA',event:`${x.homeTeam||'Home'} vs. ${x.awayTeam||'Away'}`,market:byMarket(x.marketType||'h2h'),pick:x.side==='HOME'?x.homeTeam:x.side==='AWAY'?x.awayTeam:(x.side||'No qualified side'),grade:x.action==='BET'?'QUALIFIED':x.status==='NO_BET'?'NO BET':'WATCH',factors:[['Model probability',pct(x.modelProbability)],['Market probability',pct(x.marketProbability)],['Edge',pct(x.edge)],['Expected value',pct(x.ev)],['Decision',x.action||x.status||'NO BET'],['Risk flags',(x.reasons||[]).join(', ')||'None']]}));
    document.querySelector('#lastSync').textContent=safeTime(payload.fetchedAt);
    document.querySelector('#statusText').textContent=payload.sourceStatus||'LIVE DATA CONNECTED';
    const diagnostics=payload.diagnostics||{};
    document.querySelector('#calibrationMetric').textContent=diagnostics.calibrationError!=null?pct(diagnostics.calibrationError):'—';
    document.querySelector('#agreementMetric').textContent=diagnostics.modelAgreement!=null?pct(diagnostics.modelAgreement):'—';
    document.querySelector('#completenessMetric').textContent=diagnostics.dataCompleteness!=null?pct(diagnostics.dataCompleteness):'—';
    document.querySelector('#calibrationBar').style.width=`${Math.max(0,Math.min(100,(1-(diagnostics.calibrationError??1))*100))}%`;
    document.querySelector('#agreementBar').style.width=`${Math.max(0,Math.min(100,(diagnostics.modelAgreement??0)*100))}%`;
    document.querySelector('#completenessBar').style.width=`${Math.max(0,Math.min(100,(diagnostics.dataCompleteness??0)*100))}%`;
    render(); if(forecasts.length) show(0);
  }catch(error){
    forecasts=[]; document.querySelector('#statusText').textContent='LIVE DATA UNAVAILABLE';
    document.querySelector('#opportunities').innerHTML=`<div class="empty">Live forecasts unavailable. ${error.message}. Configure the provider API key and model state before using this dashboard.</div>`;
    updateStats([]);
  }
}
function updateStats(list){const positive=list.filter(x=>x.action==='BET');const edges=list.map(x=>x.edge).filter(Number.isFinite);document.querySelector('#events').textContent=list.length;document.querySelector('#positive').textContent=positive.length;document.querySelector('#avgEdge').textContent=edges.length?`${(edges.reduce((a,b)=>a+b,0)/edges.length*100).toFixed(1)}%`:'—';}
function render(){const list=forecasts.filter(x=>(sport==='All'||x.sport===sport)&&(market==='All markets'||x.market===market)).sort((a,b)=>(b.edge??-1)-(a.edge??-1));updateStats(list);document.querySelector('#opportunities').innerHTML=list.map(x=>`<div class="op" data-i="${forecasts.indexOf(x)}"><div class="event"><b>${x.pick}</b><small>${x.sport} · ${x.event}</small></div><div><span class="muted">MODEL</span><div class="num">${pct(x.modelProbability)}</div></div><div><span class="muted">IMPLIED</span><div class="num">${pct(x.marketProbability)}</div></div><div><span class="muted">EDGE</span><div class="edge ${x.action==='BET'?'good':''}">${x.edge>=0?'+':''}${pct(x.edge)}</div></div><div><span class="muted">DECISION</span><div class="grade">${x.grade}</div></div></div>`).join('')||'<div class="empty">No live forecasts match the current filters.</div>';document.querySelectorAll('.op').forEach(el=>el.onclick=()=>show(+el.dataset.i));}
function show(i){const x=forecasts[i];if(!x)return;document.querySelector('#selectedGame').textContent=`${x.sport} · ${x.event} · ${x.market}`;document.querySelector('#factors').innerHTML=x.factors.map(f=>`<div class="factor"><span>${f[0]}</span><b>${f[1]}</b></div>`).join('');}
document.querySelector('#tabs').onclick=e=>{if(e.target.tagName!=='BUTTON')return;document.querySelectorAll('#tabs button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');sport=e.target.dataset.sport;render()};
document.querySelector('#market').onchange=e=>{market=e.target.value;render()};
document.querySelector('#refresh').onclick=loadForecasts;
loadForecasts();setInterval(loadForecasts,60000);
