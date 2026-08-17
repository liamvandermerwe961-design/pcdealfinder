let products=[];const money=n=>'R'+Number(n).toLocaleString('en-ZA');fetch('data.json').then(r=>r.json()).then(d=>{products=d;render(d)});function render(list){const box=document.getElementById('results');box.innerHTML='';document.getElementById('count').textContent=list.length+' product'+(list.length===1?'':'s');list.forEach(p=>{const offers=[...p.offers].sort((a,b)=>a.price-b.price),low=offers[0].price,high=offers.at(-1).price;const el=document.createElement('article');el.className='product';el.innerHTML=`<div class="productHead"><div><div class="tag">${p.category}</div><h3>${p.name}</h3><div class="mpn">${p.mpn}</div></div><div class="best"><small>BEST LISTED PRICE</small><strong>${money(low)}</strong><div class="save">${high>low?'Save '+money(high-low)+' vs highest listing':'Lowest listed offer'}</div></div></div><div class="offers">${offers.map((o,i)=>`<div class="offer"><div><b>${i===0?'🏆 ':''}${o.retailer}</b><small>● ${o.stock}</small></div><div><div class="price">${money(o.price)}</div><a href="${o.url}" target="_blank" rel="noopener">View deal</a></div></div>`).join('')}</div>`;box.appendChild(el)})}function search(q){document.getElementById('q').value=q;const x=(q||'').toLowerCase();render(x?products.filter(p=>(p.name+' '+p.category+' '+p.mpn).toLowerCase().includes(x)):products);document.getElementById('compare').scrollIntoView({behavior:'smooth'})}function runSearch(){search(document.getElementById('q').value)}function focusSearch(){document.getElementById('q').focus();window.scrollTo({top:0,behavior:'smooth'})}document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')runSearch()});
  function generateBuild(){
  const budget=Number(document.getElementById('buildBudget').value);
  const game=document.getElementById('buildGame').value;
  const resolution=document.getElementById('buildResolution').value;
  const priority=document.getElementById('buildPriority').value;
  const result=document.getElementById('buildResult');

  const getBest=(category)=>{
    const matches=products.filter(p=>p.category===category);
    if(!matches.length)return null;

    return matches
      .map(p=>({...p,bestOffer:[...p.offers].sort((a,b)=>a.price-b.price)[0]}))
      .sort((a,b)=>a.bestOffer.price-b.bestOffer.price)[0];
  };

  const cpu=getBest('CPU');
  const gpu=getBest('GPU');
  const ram=getBest('RAM');
  const ssd=getBest('SSD');
  const motherboard=getBest('Motherboard');
  const psu=getBest('PSU');

  const parts=[cpu,gpu,ram,ssd,motherboard,psu].filter(Boolean);

  const total=parts.reduce((sum,p)=>sum+p.bestOffer.price,0);

  const remaining=budget-total;

  const gameNames={
    fortnite:'Fortnite',
    warzone:'Call of Duty: Warzone',
    gta:'GTA V',
    cyberpunk:'Cyberpunk 2077',
    general:'General gaming'
  };

  result.innerHTML=`
    <div class="buildResultHead">
      <div>
        <small>RECOMMENDED STARTING BUILD</small>
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
      <span>${remaining>=0?'Under budget by '+money(remaining):'Over budget by '+money(Math.abs(remaining))}</span>
      <span>Priority: <b>${priority}</b></span>
    </div>

    <p class="muted">
      Prototype recommendation using the current PCDealFinder
      component database. Compatibility and performance should
      be verified before purchasing.
    </p>
  `;

  result.scrollIntoView({behavior:'smooth',block:'start'});
}
  
  
