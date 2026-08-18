/* Live category renderer. One renderer only; accepts every live catalogue response shape. */
(async()=>{
  const root=document.getElementById('categoryResults');
  if(!root)return;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const name=p=>String(p.name||p.title||p.productName||p.id||'Unnamed product').trim();
  const norm=v=>String(v||'').toLowerCase().trim().replace(/\s+/g,' ').replace(/s$/,'');
  const aliases={cpu:'cpu',gpu:'gpu',ram:'ram',memory:'ram',ssd:'ssd',hdd:'hdd',motherboard:'motherboard',psu:'psu',case:'case',cooling:'cooling','cpu cooler':'cooling','case fan':'case fan',monitor:'monitor',keyboard:'keyboard',mouse:'mouse',headset:'headset',microphone:'microphone',webcam:'webcam',networking:'networking',network:'networking',rgb:'rgb',cable:'cables',cables:'cables',usb:'usb',speaker:'speakers',speakers:'speakers'};
  const cat=v=>aliases[norm(v)]||norm(v);
  const infer=p=>{
    const explicit=cat(p.category),t=`${name(p)} ${p.description||''} ${p.id||''}`.toLowerCase();
    if(/gpu|graphics|geforce|rtx\b|radeon|rx[- ]\d|arc a\d|quadro|titan/.test(t))return'gpu';
    if(/cpu|processor|ryzen|core i[3579]|core ultra|threadripper|xeon|epyc/.test(t))return'cpu';
    if(/hdd|hard drive|hard disk|barracuda|ironwolf/.test(t))return'hdd';
    if(/ssd|nvme|solid state|990 pro|980 pro|sn770|sn850|mx500|crucial p[35]/.test(t))return'ssd';
    if(/ram|memory|ddr[345]|dimm|udimm|sodimm|vengeance|ripjaws|trident z|fury beast/.test(t))return'ram';
    if(/motherboard|mainboard|b650|b550|x670|x570|z790|z690|b760|h610|h510|a520/.test(t))return'motherboard';
    if(/power supply|psu|rm650|rm750|rm850|focus gx|supernova|straight power|pure power/.test(t))return'psu';
    if(/case|chassis|tower|meshify|nzxt.*h[567]|fractal.*north|lancool/.test(t))return'case';
    if(/cpu cooler|cooler|cooling|aio|liquid cooler|air cooler|deepcool|arctic.*liquid|kraken|nh-d15|hyper 212/.test(t))return'cooling';
    if(/monitor|display|ultrawide|odyssey|gaming monitor|\d+.*hz/.test(t))return'monitor';
    if(/keyboard|keychron|mechanical keyboard/.test(t))return'keyboard';
    if(/mouse|deathadder|g502|viper|basilisk|gaming mouse/.test(t))return'mouse';
    if(/headset|headphones|cloud iii|blackshark|arctis/.test(t))return'headset';
    if(/microphone|\bmic\b|quadcast|yeti|seiren/.test(t))return'microphone';
    if(/webcam|web camera|c920|c922|brio/.test(t))return'webcam';
    if(/router|wifi|wi-fi|ethernet|network adapter|access point|switch/.test(t))return'networking';
    if(/speaker|soundbar|audio/.test(t))return'speakers';
    return explicit||'other';
  };
  const target=cat(document.body.dataset.category||new URLSearchParams(location.search).get('category')||location.pathname.split('/').pop().replace('.html',''));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const load=async()=>{
    let lastError;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const r=await fetch(`/api/catalog?live=1&refresh=1&_=${Date.now()}`,{cache:'no-store'});
        if(!r.ok)throw new Error(`catalog ${r.status}`);
        const j=await r.json();
        const products=Array.isArray(j)?j:(Array.isArray(j.products)?j.products:(Array.isArray(j.data?.products)?j.data.products:[]));
        return products;
      }catch(e){lastError=e;if(attempt<2)await sleep(900*(attempt+1));}
    }
    throw lastError||new Error('catalog unavailable');
  };
  try{
    const products=(await load()).filter(p=>!target||target==='all'||infer(p)===target);
    const rb=document.getElementById('retailer');
    const retailers=[...new Set(products.flatMap(p=>(p.offers||[]).map(o=>o.retailer).filter(Boolean)))].sort();
    if(rb)rb.innerHTML='<option value="all">All retailers</option>'+retailers.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    const render=()=>{
      const selected=rb?.value||'all',sort=document.getElementById('sort')?.value||'priceAsc';
      let rows=products.map(p=>{const offers=(p.offers||[]).filter(o=>Number.isFinite(Number(o.price))&&Number(o.price)>0&&(selected==='all'||o.retailer===selected)).sort((a,b)=>Number(a.price)-Number(b.price));return offers.length?{p,offers}:null}).filter(Boolean);
      if(sort==='priceDesc')rows.sort((a,b)=>b.offers[0].price-a.offers[0].price);else if(sort==='name')rows.sort((a,b)=>name(a.p).localeCompare(name(b.p)));else rows.sort((a,b)=>a.offers[0].price-b.offers[0].price);
      const count=document.getElementById('categoryCount');if(count)count.textContent=`${rows.length} product${rows.length===1?'':'s'}`;
      root.innerHTML=rows.length?rows.map(({p,offers})=>{const o=offers[0],img=p.image||p.imageUrl||'';return `<article class="categoryProduct product liveProduct" data-id="${esc(p.id||name(p))}"><div class="categoryImage productVisual">${img?`<img src="${esc(img)}" alt="${esc(name(p))}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('imageFailed');this.remove()">`:`<span>${esc(infer(p).slice(0,3).toUpperCase())}</span>`}</div><div class="categoryProductInfo"><span class="tag">${esc(infer(p).toUpperCase())}</span><h2 class="categoryProductName">${esc(name(p))}</h2><p>${esc(p.description||'Live retailer listing. Product details may vary by supplier.')}</p><div class="categoryMeta">${p.brand?`<span>${esc(p.brand)}</span>`:''}${p.mpn?`<span>MPN ${esc(p.mpn)}</span>`:''}</div></div><div class="categoryPrice"><small>LOWEST PRICE</small><strong>R${Number(o.price).toLocaleString('en-ZA')}</strong><span>${esc(o.retailer)}</span></div><div class="categoryOffers">${offers.map(x=>`<div class="categoryOffer"><div><b>${esc(x.retailer)}</b><br><span>${esc(String(x.stock||'Check retailer').toLowerCase()==='prototype'?'Check retailer':x.stock||'Check retailer')}</span></div><div><b>R${Number(x.price).toLocaleString('en-ZA')}</b>${x.url?` <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">View Deal →</a>`:''}</div></div>`).join('')}</div></article>`}).join(''):'<div class="emptyCategory"><h2>No live products found</h2><p>The live importer returned no products for this category. Refreshing the catalogue will try again automatically.</p></div>';
    };
    render();document.getElementById('sort')?.addEventListener('change',render);rb?.addEventListener('change',render);
  }catch(e){console.error('Live catalogue failed',e);root.innerHTML='<div class="emptyCategory"><h2>Live catalogue temporarily unavailable</h2><p>The supplier importer could not be reached after three attempts. Refresh shortly.</p></div>'}
})();
