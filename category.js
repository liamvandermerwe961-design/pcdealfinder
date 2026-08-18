/* PCDealFinder — single live catalogue renderer for every category page. */
(()=>{
  const qs=new URLSearchParams(location.search);
  const raw=qs.get('category')||document.body.dataset.category||location.pathname.split('/').pop().replace(/\.html$/i,'');
  const target=String(raw||'').toLowerCase().trim();
  const box=document.getElementById('categoryResults');
  const sortBox=document.getElementById('sort');
  const retailerBox=document.getElementById('retailer');
  const countBox=document.getElementById('categoryCount');
  const pillBox=document.getElementById('categoryPill');
  const introBox=document.getElementById('categoryIntro');
  const titleBox=document.getElementById('catalogueTitle');
  if(!box)return;

  const aliases={
    cpu:'cpu',cpus:'cpu',processor:'cpu',processors:'cpu',
    gpu:'gpu',gpus:'gpu','graphics card':'gpu','graphics cards':'gpu',
    ram:'ram',memory:'ram',
    ssd:'ssd',ssds:'ssd',hdd:'hdd',hdds:'hdd',storage:'storage',
    motherboard:'motherboard',motherboards:'motherboard',
    psu:'psu',psus:'psu','power supply':'psu','power supplies':'psu',
    case:'case',cases:'case',cooling:'cooling','cpu cooler':'cooling','cpu coolers':'cooling',
    monitor:'monitor',monitors:'monitor',keyboard:'keyboard',keyboards:'keyboard',
    mouse:'mouse',mice:'mouse',headset:'headset',headsets:'headset',
    microphone:'microphone',microphones:'microphone',webcam:'webcam',webcams:'webcam',
    networking:'networking',network:'networking',rgb:'rgb',cable:'cables',cables:'cables',
    usb:'usb','usb accessories':'usb',capture:'capture card','capture card':'capture card','capture cards':'capture card',
    mousepad:'mousepad','mouse pad':'mousepad','mouse pads':'mousepad',
    'external storage':'external storage','gaming devices':'gaming devices',ups:'ups',
    docking:'docking',bags:'bags',laptop:'laptop',desktop:'desktop',printer:'printer',projector:'projector',speakers:'speakers',speaker:'speakers'
  };
  const norm=v=>{const s=String(v||'').toLowerCase().trim();return aliases[s]||s.replace(/s$/,'')};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const pname=p=>String(p?.name||p?.title||p?.productName||p?.id||'Unnamed product').trim();
  const category=p=>{
    const explicit=norm(p?.category),text=`${pname(p)} ${p?.description||''} ${p?.id||''}`.toLowerCase();
    if(/gpu|graphics card|geforce|rtx\b|radeon|rx[- ]\d|arc [ab]\d|quadro/.test(text))return'gpu';
    if(/cpu|processor|ryzen|core i[3579]|core ultra|threadripper|xeon|epyc/.test(text))return'cpu';
    if(/hdd|hard drive|hard disk|barracuda|ironwolf/.test(text))return'hdd';
    if(/ssd|nvme|solid state|990 pro|980 pro|sn770|sn850|mx500|crucial p[35]/.test(text))return'ssd';
    if(/ram|memory|ddr[345]|dimm|udimm|sodimm|vengeance|ripjaws|trident z|fury beast/.test(text))return'ram';
    if(/motherboard|mainboard|b650|b550|x670|x570|z790|z690|b760|h610|h510|a520/.test(text))return'motherboard';
    if(/power supply|\bpsu\b|80\s*plus|rm650|rm750|rm850|focus gx|supernova|straight power|pure power/.test(text))return'psu';
    if(/case|chassis|tower|meshify|nzxt.*h[567]|fractal.*north|lancool/.test(text))return'case';
    if(/case fan|120mm.*fan|140mm.*fan|pwm fan/.test(text))return'case fan';
    if(/cpu cooler|cooler|cooling|aio|liquid cooler|air cooler|deepcool|arctic.*liquid|kraken|nh-d15|hyper 212/.test(text))return'cooling';
    if(/monitor|display|ultrawide|odyssey|gaming monitor|\d+\s*hz/.test(text))return'monitor';
    if(/keyboard|keychron|mechanical keyboard/.test(text))return'keyboard';
    if(/mousepad|mouse pad|desk mat/.test(text))return'mousepad';
    if(/gaming mouse|computer mouse|wireless mouse|deathadder|g502|viper|basilisk/.test(text))return'mouse';
    if(/headset|headphones|cloud iii|blackshark|arctis/.test(text))return'headset';
    if(/microphone|\bmic\b|quadcast|yeti|seiren/.test(text))return'microphone';
    if(/webcam|web camera|c920|c922|brio/.test(text))return'webcam';
    if(/router|switch|access point|wifi|wi-fi|ethernet|network adapter/.test(text))return'networking';
    if(/capture card|elgato/.test(text))return'capture card';
    if(/external ssd|external hdd|portable ssd|portable hard drive/.test(text))return'external storage';
    if(/usb hub|usb drive|flash drive|usb accessory/.test(text))return'usb';
    if(/rgb|argb|addressable rgb|lighting kit/.test(text))return'rgb';
    if(/speaker|soundbar/.test(text))return'speakers';
    if(/controller|gamepad/.test(text))return'gaming devices';
    if(/\bups\b|inverter|surge protector/.test(text))return'ups';
    if(/docking station|\bdock\b/.test(text))return'docking';
    if(/laptop bag|backpack|carry bag|sleeve/.test(text))return'bags';
    if(/laptop|notebook|macbook/.test(text))return'laptop';
    if(/desktop pc|office pc|gaming pc|mini pc/.test(text))return'desktop';
    if(/printer|scanner|toner|cartridge/.test(text))return'printer';
    if(/projector/.test(text))return'projector';
    return explicit||'other';
  };
  const label=()=>({cpu:'CPUs',gpu:'GPUs',ram:'RAM',ssd:'SSDs',hdd:'HDDs',motherboard:'Motherboards',psu:'PSUs',case:'Cases',cooling:'Cooling',monitor:'Monitors',keyboard:'Keyboards',mouse:'Mice',mousepad:'Mousepads',headset:'Headsets',microphone:'Microphones',webcam:'Webcams',networking:'Networking',rgb:'RGB',cables:'Cables',usb:'USB Accessories','capture card':'Capture Cards','external storage':'External Storage','gaming devices':'Gaming Devices',ups:'UPS',docking:'Docking',bags:'Bags',laptop:'Laptops',desktop:'Desktops',printer:'Printers',projector:'Projectors',speakers:'Speakers'})[norm(target)]||String(raw||'Catalogue').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const money=n=>'R'+Number(n).toLocaleString('en-ZA',{maximumFractionDigits:0});

  let all=[];
  const live=async()=>{
    for(let attempt=0;attempt<3;attempt++){
      try{
        const r=await fetch(`/api/catalog?live=1&refresh=1&_=${Date.now()}`,{cache:'no-store'});
        if(!r.ok)throw new Error(`HTTP ${r.status}`);
        const j=await r.json();
        const products=Array.isArray(j)?j:(Array.isArray(j.products)?j.products:(Array.isArray(j.data?.products)?j.data.products:[]));
        if(Array.isArray(products))return products;
      }catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,700*(attempt+1)))}
    }
    return [];
  };
  const offers=p=>(p.offers||[]).filter(o=>Number(o.price)>0&&(retailerBox?.value||'all')==='all'||Number(o.price)>0&&o.retailer===retailerBox?.value).sort((a,b)=>Number(a.price)-Number(b.price));
  const rows=()=>all.filter(p=>{const t=norm(target);return !t||t==='all'||category(p)===t}).map(p=>{const os=offers(p);return os.length?{p,os}:null}).filter(Boolean);
  const render=()=>{
    let data=rows();
    const sort=sortBox?.value||'priceAsc';
    if(sort==='priceDesc')data.sort((a,b)=>b.os[0].price-a.os[0].price);else if(sort==='name')data.sort((a,b)=>pname(a.p).localeCompare(pname(b.p)));else data.sort((a,b)=>a.os[0].price-b.os[0].price);
    if(countBox)countBox.textContent=`${data.length} product${data.length===1?'':'s'}`;
    if(pillBox)pillBox.textContent=label().toUpperCase();
    if(titleBox)titleBox.textContent=`${label()} catalogue`;
    if(introBox)introBox.textContent=`Compare live ${label().toLowerCase()} offers from participating South African retailers.`;
    if(!data.length){box.innerHTML='<div class="emptyCategory"><h2>No live products in this category yet</h2><p>The live catalogue has not returned a matching product from the current retailer feeds.</p></div>';return}
    box.innerHTML=data.map(({p,os})=>{const best=os[0],n=pname(p),img=p.image||p.imageUrl||'',id=p.id||n;return `<article class="categoryProduct product" data-id="${esc(id)}"><div class="categoryImage productVisual">${img?`<img src="${esc(img)}" alt="${esc(n)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('imageFailed')">`:`<span>${esc(category(p).slice(0,3).toUpperCase())}</span>`}</div><div class="categoryProductInfo"><span class="tag">${esc(category(p).toUpperCase())}</span><h2 class="categoryProductName">${esc(n)}</h2>${p.description?`<p>${esc(p.description)}</p>`:''}<div class="categoryMeta">${p.mpn?`<span>MPN ${esc(p.mpn)}</span>`:''}</div></div><div class="categoryPrice"><small>LOWEST PRICE</small><strong>${money(best.price)}</strong><span>${esc(best.retailer||'Retailer')}</span></div><div class="categoryOffers">${os.map(o=>`<div class="categoryOffer"><div><b>${esc(o.retailer||'Retailer')}</b><br><span>${esc(String(o.stock||'Check retailer').toLowerCase()==='prototype'?'Check retailer':o.stock||'Check retailer')}</span></div><div><b>${money(o.price)}</b>${o.url?` <a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">View Deal →</a>`:''}</div></div>`).join('')}</div></article>`}).join('');
  };
  const start=async()=>{box.innerHTML='<div class="emptyCategory"><h2>Loading live catalogue…</h2><p>Pulling current products and retailer offers.</p></div>';try{all=await live();const retailers=[...new Set(all.flatMap(p=>(p.offers||[]).map(o=>o.retailer).filter(Boolean)))].sort();if(retailerBox)retailerBox.innerHTML='<option value="all">All retailers</option>'+retailers.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');render()}catch(e){console.error(e);box.innerHTML='<div class="emptyCategory"><h2>Live catalogue temporarily unavailable</h2><p>Refresh the page and try again.</p></div>'}};
  sortBox?.addEventListener('change',render);retailerBox?.addEventListener('change',render);start();
})();
