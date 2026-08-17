let products=[];const money=n=>'R'+Number(n).toLocaleString('en-ZA');fetch('data.json').then(r=>r.json()).then(d=>{products=d;render(d)});function render(list){const box=document.getElementById('results');box.innerHTML='';document.getElementById('count').textContent=list.length+' product'+(list.length===1?'':'s');list.forEach(p=>{const offers=[...p.offers].sort((a,b)=>a.price-b.price),low=offers[0].price,high=offers.at(-1).price;const el=document.createElement('article');el.className='product';el.innerHTML=`<div class="productHead"><div><div class="tag">${p.category}</div><h3>${p.name}</h3><div class="mpn">${p.mpn}</div></div><div class="best"><small>BEST LISTED PRICE</small><strong>${money(low)}</strong><div class="save">${high>low?'Save '+money(high-low)+' vs highest listing':'Lowest listed offer'}</div></div></div><div class="offers">${offers.map((o,i)=>`<div class="offer"><div><b>${i===0?'🏆 ':''}${o.retailer}</b><small>● ${o.stock}</small></div><div><div class="price">${money(o.price)}</div><a href="${o.url}" target="_blank" rel="noopener">View deal</a></div></div>`).join('')}</div>`;box.appendChild(el)})}function search(q){document.getElementById('q').value=q;const x=(q||'').toLowerCase();render(x?products.filter(p=>(p.name+' '+p.category+' '+p.mpn).toLowerCase().includes(x)):products);document.getElementById('compare').scrollIntoView({behavior:'smooth'})}function runSearch(){search(document.getElementById('q').value)}function focusSearch(){document.getElementById('q').focus();window.scrollTo({top:0,behavior:'smooth'})}document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});function generateBuild(){
  const budget=Number(document.getElementById('buildBudget').value);
  const game=document.getElementById('buildGame').value;
  const resolution=document.getElementById('buildResolution').value;
  const priority=document.getElementById('buildPriority').value;
  const result=document.getElementById('buildResult');

  const cheapest=(category,filter=()=>true)=>{
    return products
      .filter(p=>p.category===category && filter(p))
      .map(p=>({...p,bestOffer:[...p.offers].sort((a,b)=>a.price-b.price)[0]}))
      .sort((a,b)=>a.bestOffer.price-b.bestOffer.price);
  };

  const cpus=cheapest('CPU');
  const gpus=cheapest('GPU');
  const rams=cheapest('RAM',p=>p.memory==='DDR4');
  const ssds=cheapest('SSD');
  const boards=cheapest('Motherboard',p=>p.socket==='AM4' && p.memory==='DDR4');
  const psus=cheapest('PSU');

  const gameNames={
    fortnite:'Fortnite',
    warzone:'Call of Duty: Warzone',
    gta:'GTA V',
    cyberpunk:'Cyberpunk 2077',
    general:'General gaming'
  };

  const gpuWeights={
    '1080p':0.34,
    '1440p':0.40,
    '4K':0.48
  };

  const gpuTarget=budget*gpuWeights[resolution];

  let gpu=gpus
    .filter(g=>g.bestOffer.price<=budget)
    .sort((a,b)=>{
      const aDiff=Math.abs(a.bestOffer.price-gpuTarget);
      const bDiff=Math.abs(b.bestOffer.price-gpuTarget);
      return aDiff-bDiff;
    })[0];

  if(!gpu)gpu=gpus[0];

  let cpu=cpus.find(c=>c.bestOffer.price<=budget*0.25)||cpus[0];

  let board=boards.find(b=>b.bestOffer.price<=budget*0.15)||boards[0];

  let ram=rams.find(r=>r.capacity>=16 && r.bestOffer.price<=budget*0.15)
    ||rams.find(r=>r.capacity>=16)
    ||rams[0];

  let ssd=ssds.find(s=>s.capacity>=1000 && s.bestOffer.price<=budget*0.15)
    ||ssds[0];

  let psu=psus.find(p=>{
    if(gpu.tier==='enthusiast')return p.wattage>=750;
    if(gpu.tier==='high')return p.wattage>=650;
    return p.wattage>=550;
  })||psus[0];

  let parts=[cpu,gpu,ram,ssd,board,psu];

  let total=parts.reduce((sum,p)=>sum+p.bestOffer.price,0);

  if(total>budget){
    const cheaperCpu=cpus.find(c=>c.bestOffer.price<cpu.bestOffer.price);
    if(cheaperCpu){
      cpu=cheaperCpu;
      parts=[cpu,gpu,ram,ssd,board,psu];
      total=parts.reduce((sum,p)=>sum+p.bestOffer.price,0);
    }
  }

  const remaining=budget-total;

  result.innerHTML=`
    <div class="buildResultHead">
      <div>
        <small>RECOMMENDED BUILD</small>
        <h3>${gameNames[game]} · ${resolution}</h3>
      </div>

      <div class="buildTotal">
        <small>TOTAL</small>
        <strong>${money(total)}</strong>
      </div>
    </div>

    <div class="buildParts">
      ${parts.map(p=>`
        <div class="buildPart">
          <div>
            <small>${p.category}</small>
            <b>${p.name}</b>
          </div>
          <strong>${money(p.bestOffer.price)}</strong>
        </div>
      `).join('')}
    </div>

    <div class="buildSummary">
      <span>Budget: <b>${money(budget)}</b></span>

      <span>
        ${remaining>=0
          ?'Under budget by '+money(remaining)
          :'Over budget by '+money(Math.abs(remaining))}
      </span>

      <span>Priority: <b>${priority}</b></span>
    </div>

    <p class="muted">
      Build selected from the current PCDealFinder prototype
      catalogue using budget, resolution and compatibility data.
      Prices and compatibility should be verified before purchase.
    </p>
  `;

  result.scrollIntoView({behavior:'smooth',block:'start'});
}

    
