/* PCDealFinder — Phase 2 comparison engine */
(function(){
  const path=(location.pathname.split('/').pop()||'').replace(/\.html$/i,'').toLowerCase();
  const map={cpu:'CPUs',gpu:'GPUs',ram:'RAM',ssd:'SSDs',hdd:'HDDs',psu:'PSUs',motherboard:'Motherboards'};
  const category=map[path]||'';
  const root=document.getElementById('categoryResults'); if(!root||!category)return;
  const key=path;
  function money(n){return 'R'+Number(n||0).toLocaleString('en-ZA')}
  function offers(p){return (p.offers||[]).filter(o=>Number(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price))}
  function val(p){const o=offers(p)[0];return o?Number(o.price):Infinity}
  function metric(p){const n=String(p.name||'').toLowerCase();if(key==='gpu'){if(/5070 ti/.test(n))return 95;if(/5070/.test(n))return 90;if(/4070 super/.test(n))return 87;if(/7800 xt/.test(n))return 86;if(/7700 xt/.test(n))return 78;if(/4060 ti/.test(n))return 68;if(/4060/.test(n))return 60}if(key==='cpu'){if(/9800x3d/.test(n))return 100;if(/7800x3d/.test(n))return 94;if(/9700x/.test(n))return 88;if(/7600x/.test(n))return 75;if(/5600/.test(n))return 55}return 50}
  function specs(p){return [['Price',money(val(p))],['Brand',p.brand||'—'],['Socket',p.socket||'—'],['Memory',p.memory||'—'],['Capacity',p.capacity?p.capacity+'GB':'—'],['Power',p.wattage?p.wattage+'W':'—']]}
  fetch('data.json?v=20260817',{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const items=data.filter(p=>String(p.category||'').toLowerCase()===key&&offers(p).length).sort((a,b)=>val(a)-val(b));
    if(items.length<2)return;
    const picks=[...items].sort((a,b)=>metric(b)-metric(a)).slice(0,2);const value=[...items].sort((a,b)=>(metric(b)/Math.max(val(b),1))-(metric(a)/Math.max(val(a),1)))[0];
    const panel=document.createElement('section');panel.className='comparePanel';panel.innerHTML=`<div class="compareHead"><div><small>COMPARE ${category.toUpperCase()}</small><h2>Find your winner.</h2><p>Compare the strongest catalogue options side-by-side.</p></div><div class="compareBadges"><span>⚡ Best performance: ${picks[0].name}</span><span>💰 Best value: ${value.name}</span></div></div><div class="compareTable">${picks.map((p,i)=>`<div class="compareCard ${i===0?'winner':''}">${i===0?'<b class="winnerBadge">🏆 PERFORMANCE PICK</b>':''}<h3>${p.name}</h3>${specs(p).map(s=>`<div class="compareRow"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('')}<a class="compareDeal" href="#">Compare retailer offers →</a></div>`).join('')}</div>`;
    root.parentNode.insertBefore(panel,root);
  }).catch(()=>{});
})();
