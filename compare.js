/* PCDealFinder — Phase 8 comparison experience */
(function(){
  const path=(location.pathname.split('/').pop()||'').replace(/\.html$/i,'').toLowerCase();
  const map={cpu:'CPUs',gpu:'GPUs',ram:'RAM',ssd:'SSDs',hdd:'HDDs',psu:'PSUs',motherboard:'Motherboards'};
  const category=map[path]||''; const root=document.getElementById('categoryResults'); if(!root||!category)return;
  const money=n=>'R'+Number(n||0).toLocaleString('en-ZA');
  const offers=p=>(p.offers||[]).filter(o=>Number(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price));
  const price=p=>Number(offers(p)[0]?.price||Infinity);
  const name=p=>String(p.name||p.title||p.id||'Unnamed product');
  function score(p){const n=name(p).toLowerCase();if(path==='gpu'){if(/5090/.test(n))return 100;if(/5080/.test(n))return 98;if(/5070 ti/.test(n))return 94;if(/5070/.test(n))return 89;if(/4070 ti super/.test(n))return 87;if(/4070 super/.test(n))return 84;if(/7800 xt/.test(n))return 83;if(/7700 xt/.test(n))return 76;if(/4060 ti/.test(n))return 68;if(/4060/.test(n))return 61}if(path==='cpu'){if(/9950x3d/.test(n))return 100;if(/9800x3d/.test(n))return 98;if(/7950x3d/.test(n))return 94;if(/7800x3d/.test(n))return 92;if(/9700x/.test(n))return 86;if(/9600x/.test(n))return 80;if(/7600x/.test(n))return 74;if(/5600/.test(n))return 55}return 50}
  function valueScore(p,items){const max=Math.max(...items.map(score));const min=Math.min(...items.map(price));const s=score(p);const pr=price(p);if(!Number.isFinite(pr)||!Number.isFinite(min)||pr<=0)return 0;const perf=s/Math.max(max,1);const priceFactor=min/pr;return Math.round((perf*.65+priceFactor*.35)*100)}
  function specs(p){return [['Lowest price',money(price(p))],['Brand',p.brand||'—'],['Socket',p.socket||'—'],['Memory',p.memory||'—'],['Capacity',p.capacity?p.capacity+'GB':'—'],['Power',p.wattage?p.wattage+'W':'—']].filter(x=>x[1]&&x[1]!=='—'||x[0]==='Lowest price')}
  fetch('data.json?v=20260817',{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const items=data.filter(p=>String(p.category||'').toLowerCase()===path&&offers(p).length).sort((a,b)=>price(a)-price(b)); if(items.length<2)return;
    const picks=[...items].sort((a,b)=>score(b)-score(a)).slice(0,2); const value=[...items].sort((a,b)=>valueScore(b,items)-valueScore(a,items))[0];
    const panel=document.createElement('section'); panel.className='comparePanel phase8Compare';
    panel.innerHTML=`<div class="compareHead"><div><div class="compareKicker">⚔ LIVE COMPARISON</div><h2>Compare ${category}.</h2><p>See the performance pick, value pick and retailer pricing at a glance.</p></div><div class="compareBadges"><span>⚡ Performance: <b>${escapeHtml(name(picks[0]))}</b></span><span>💎 Value: <b>${escapeHtml(name(value))}</b></span></div></div><div class="compareSpotlight"><div><small>🏆 PERFORMANCE PICK</small><strong>${escapeHtml(name(picks[0]))}</strong><span>PCDealFinder Performance Index <b>${score(picks[0])}/100</b></span></div><div><small>💰 BEST VALUE</small><strong>${escapeHtml(name(value))}</strong><span>Value Score <b>${valueScore(value,items)}/100</b></span></div></div><div class="compareTable">${picks.map((p,i)=>`<article class="compareCard ${i===0?'winner':''}">${i===0?'<b class="winnerBadge">🏆 TOP PERFORMANCE</b>':'<b class="runnerBadge">STRONG ALTERNATIVE</b>'}<div class="compareProductTop"><div><h3>${escapeHtml(name(p))}</h3><span class="comparePrice">${money(price(p))}</span></div><span class="scoreRing">${score(p)}</span></div><div class="compareRows">${specs(p).map(s=>`<div class="compareRow"><span>${escapeHtml(s[0])}</span><b>${escapeHtml(s[1])}</b></div>`).join('')}</div><div class="compareRetailers">${offers(p).slice(0,3).map(o=>`<div><span>${escapeHtml(o.retailer)}</span><b>${money(o.price)}</b>${o.url?`<a href="${escapeHtml(o.url)}" target="_blank" rel="noopener noreferrer">View deal ↗</a>`:''}</div>`).join('')}</div></article>`).join('')}</div>`;
    root.parentNode.insertBefore(panel,root);
  }).catch(()=>{});
  function escapeHtml(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
})();
