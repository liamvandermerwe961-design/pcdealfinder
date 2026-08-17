/* PCDealFinder — Phase 3 deals + local price history */
(function(){
  const root=document.getElementById('categoryResults'); if(!root)return;
  const HISTORY_KEY='pcdf_price_history_v1';
  const TARGET_KEY='pcdf_price_targets_v1';
  const money=n=>'R'+Number(n||0).toLocaleString('en-ZA');
  const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  fetch('data.json?v=20260817',{cache:'no-store'}).then(r=>r.json()).then(items=>{
    const history=load(HISTORY_KEY,{}),targets=load(TARGET_KEY,{}),today=new Date().toISOString().slice(0,10);
    items.forEach(p=>{const prices=(p.offers||[]).map(o=>Number(o.price)).filter(Boolean);if(!prices.length)return;history[p.id] ||= [];if(!history[p.id].some(x=>x.date===today)){history[p.id].push({date:today,price:Math.min(...prices)});history[p.id]=history[p.id].slice(-90)}});save(HISTORY_KEY,history);
    document.querySelectorAll('.categoryProduct').forEach(card=>{
      const id=card.dataset.id;if(!id)return;const p=items.find(x=>x.id===id);if(!p)return;const prices=(p.offers||[]).map(o=>Number(o.price)).filter(Boolean);if(!prices.length)return;
      const now=Math.min(...prices),h=history[id]||[],low=Math.min(...h.map(x=>x.price),now),avg=h.length?h.reduce((s,x)=>s+x.price,0)/h.length:now;const drop=low<now?0:Math.round((1-now/Math.max(avg,1))*100);
      const badge=drop>=10?'🔥 Great deal':now===low?'🏆 Lowest price':'💜 Good price';
      const box=document.createElement('div');box.className='dealMeta';box.innerHTML=`<span>${badge}</span><span>Lowest: <b>${money(low)}</b></span><span>Avg: <b>${money(avg)}</b></span><button type="button" data-target="${id}">🔔 Alert me</button>`;card.appendChild(box);
      box.querySelector('button').onclick=()=>{const current=Number(prompt('Alert me when this drops below (R):',Math.round(now*.9)));if(!current||current<=0)return;targets[id]=current;save(TARGET_KEY,targets);box.querySelector('button').textContent='🔔 Alert set';};
    });
  }).catch(()=>{});
})();
