/* PCDealFinder — live deals layer */
(function(){
  const root=document.getElementById('categoryResults'); if(!root)return;
  const HISTORY_KEY='pcdf_price_history_v2';
  const TARGET_KEY='pcdf_price_targets_v2';
  const money=n=>'R'+Number(n||0).toLocaleString('en-ZA');
  const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  fetch('/api/catalog?live=1',{cache:'no-store'}).then(r=>r.json()).then(payload=>{
    const items=Array.isArray(payload.products)?payload.products:[];
    const history=load(HISTORY_KEY,{}),targets=load(TARGET_KEY,{}),today=new Date().toISOString().slice(0,10);
    items.forEach(p=>{const prices=(p.offers||[]).map(o=>Number(o.price)).filter(Boolean);if(!prices.length)return;history[p.id] ||= [];if(!history[p.id].some(x=>x.date===today)){history[p.id].push({date:today,price:Math.min(...prices)});history[p.id]=history[p.id].slice(-90)}});save(HISTORY_KEY,history);
    document.querySelectorAll('.categoryProduct').forEach(card=>{
      const title=card.querySelector('.categoryProductName')?.textContent?.trim();
      const id=card.dataset.id;
      const p=items.find(x=>id&&x.id===id)||items.find(x=>String(x.name).trim().toLowerCase()===String(title||'').toLowerCase());
      if(!p)return;
      const prices=(p.offers||[]).map(o=>Number(o.price)).filter(Boolean);if(!prices.length)return;
      const now=Math.min(...prices),h=history[p.id]||[],low=Math.min(...h.map(x=>x.price),now),avg=h.length?h.reduce((s,x)=>s+x.price,0)/h.length:now;
      const discount=avg>now?Math.round((1-now/avg)*100):0;
      const badge=discount>=10?'🔥 Great deal':now===low?'🏆 Lowest price':'💜 Good price';
      if(card.querySelector('.dealMeta'))return;
      const box=document.createElement('div');box.className='dealMeta';box.innerHTML=`<span>${badge}</span><span>Best: <b>${money(now)}</b></span>${discount>=5?`<span>Save: <b>${discount}%</b></span>`:''}<button type="button">🔔 Alert me</button>`;card.appendChild(box);
      box.querySelector('button').onclick=()=>{const current=Number(prompt('Alert me when this drops below (R):',Math.round(now*.9)));if(!current||current<=0)return;targets[p.id]=current;save(TARGET_KEY,targets);box.querySelector('button').textContent='🔔 Alert set';};
    });
  }).catch(e=>console.debug('live deals:',e));
})();
