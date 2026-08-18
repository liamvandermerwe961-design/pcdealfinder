/* PCDealFinder live category renderer */
(async () => {
  const root = document.getElementById('categoryResults');
  if (!root) return;

  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[c]));
  const name = p => String(p?.name || p?.title || p?.productName || p?.id || 'Unnamed product').trim();
  const norm = v => String(v || '').toLowerCase().trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

  const aliases = {
    cpu:'cpu', cpus:'cpu', processor:'cpu', processors:'cpu',
    gpu:'gpu', gpus:'gpu', 'graphics card':'gpu', 'graphics cards':'gpu', 'video card':'gpu', 'video cards':'gpu',
    ram:'ram', memory:'ram', memories:'ram',
    ssd:'ssd', ssds:'ssd', nvme:'ssd', hdd:'hdd', hdds:'hdd', 'hard drive':'hdd', 'hard drives':'hdd',
    storage:'storage', 'computer storage':'storage', motherboard:'motherboard', motherboards:'motherboard', mainboard:'motherboard',
    psu:'psu', psus:'psu', 'power supply':'psu', 'power supplies':'psu', case:'case', cases:'case', chassis:'case', 'pc case':'case', 'computer case':'case',
    cooling:'cooling', 'cpu cooler':'cooling', 'cpu coolers':'cooling', 'liquid cooling':'cooling', 'case fan':'case fan', 'case fans':'case fan', fans:'case fan',
    monitor:'monitor', monitors:'monitor', display:'monitor', displays:'monitor', keyboard:'keyboard', keyboards:'keyboard', mouse:'mouse', mice:'mouse',
    headset:'headset', headsets:'headset', headphones:'headset', mousepad:'mousepad', 'mouse pad':'mousepad', 'mouse pads':'mousepad',
    microphone:'microphone', microphones:'microphone', mic:'microphone', webcam:'webcam', webcams:'webcam', networking:'networking', network:'networking', router:'networking', routers:'networking',
    rgb:'rgb', lighting:'rgb', 'rgb lighting':'rgb', cable:'cables', cables:'cables', usb:'usb', 'usb accessories':'usb', speakers:'speakers', speaker:'speakers', audio:'speakers',
    'capture card':'capture cards', 'capture cards':'capture cards', 'external storage':'external storage', 'gaming device':'gaming devices', 'gaming devices':'gaming devices',
    controllers:'gaming devices', gamepads:'gaming devices', ups:'ups', inverter:'ups', 'power station':'ups', 'surge protector':'ups', accessory:'accessories', accessories:'accessories'
  };
  const cat = v => aliases[norm(v)] || norm(v);

  const infer = p => {
    const supplied = cat(p?.category);
    const t = `${name(p)} ${p?.description || ''} ${p?.id || ''} ${p?.mpn || ''} ${p?.brand || ''} ${p?.category || ''}`.toLowerCase();
    if (/case fan|120mm.*fan|140mm.*fan|pwm fan/.test(t)) return 'case fan';
    if (/cpu cooler|cooler|cooling|aio|liquid cooler|water cooler|deepcool|arctic.*liquid|kraken|nh-d15|hyper 212/.test(t)) return 'cooling';
    if (/pc case|computer case|chassis|tower|meshify|nzxt.*h[567]|fractal.*north|lancool/.test(t)) return 'case';
    if (/gpu|graphics card|video card|geforce|rtx\b|radeon|rx[- ]\d|quadro|arc\s*[ab]\d/.test(t)) return 'gpu';
    if (/motherboard|mainboard|b650|b550|x670|x570|z790|z690|b760|h610|h510|a520/.test(t)) return 'motherboard';
    if (/ddr[345]|\bram\b|memory|dimm|udimm|sodimm|vengeance|ripjaws|trident z|fury beast/.test(t)) return 'ram';
    if (/external.*ssd|external.*hdd|portable.*ssd|portable.*hard drive/.test(t)) return 'external storage';
    if (/\bssd\b|nvme|solid state|990 pro|980 pro|sn770|sn850|mx500|crucial p[35]/.test(t)) return 'ssd';
    if (/\bhdd\b|hard drive|hard disk|barracuda|ironwolf/.test(t)) return 'hdd';
    if (/power supply|\bpsu\b|80\s*plus|rm650|rm750|rm850|focus gx|supernova|straight power|pure power/.test(t)) return 'psu';
    if (/cpu|processor|ryzen|core i[3579]|core ultra|threadripper|xeon|epyc/.test(t)) return 'cpu';
    if (/monitor|display|ultrawide|odyssey|gaming monitor|\d+\s*hz/.test(t)) return 'monitor';
    if (/keyboard|keychron|mechanical keyboard/.test(t)) return 'keyboard';
    if (/mousepad|mouse pad|desk mat/.test(t)) return 'mousepad';
    if (/gaming mouse|computer mouse|wireless mouse|deathadder|g502|viper|basilisk/.test(t)) return 'mouse';
    if (/headset|headphones|cloud iii|blackshark|arctis/.test(t)) return 'headset';
    if (/microphone|\bmic\b|quadcast|yeti|seiren/.test(t)) return 'microphone';
    if (/webcam|web camera|c920|c922|brio/.test(t)) return 'webcam';
    if (/router|switch|access point|wifi|wi-fi|ethernet|network adapter/.test(t)) return 'networking';
    if (/capture card|elgato/.test(t)) return 'capture cards';
    if (/speaker|soundbar|audio/.test(t)) return 'speakers';
    if (/hdmi cable|displayport cable|usb cable|ethernet cable|power cable/.test(t)) return 'cables';
    if (/usb hub|usb drive|flash drive|usb accessory/.test(t)) return 'usb';
    if (/rgb|argb|addressable rgb|lighting kit/.test(t)) return 'rgb';
    if (/controller|gamepad|gaming device/.test(t)) return 'gaming devices';
    if (/\bups\b|inverter|power station|surge protector/.test(t)) return 'ups';
    if (/accessor|stand|bracket|hub|holder|thermal paste|cable tie|cleaning/.test(t)) return 'accessories';
    return supplied || 'other';
  };

  const targetRaw = document.body.dataset.category || new URLSearchParams(location.search).get('category') || location.pathname.split('/').pop().replace(/\.html$/i, '');
  const target = cat(targetRaw);
  const matches = p => {
    const c = infer(p);
    if (!target || target === 'all') return true;
    if (target === 'storage') return ['ssd', 'hdd', 'external storage'].includes(c);
    return c === target;
  };

  const asProducts = j => {
    if (Array.isArray(j)) return j;
    if (Array.isArray(j?.products)) return j.products;
    if (Array.isArray(j?.data?.products)) return j.data.products;
    if (Array.isArray(j?.data)) return j.data;
    return [];
  };

  const loadJson = async url => {
    const r = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw Error(`${url} returned ${r.status}`);
    return asProducts(await r.json());
  };

  // Never use the legacy static catalogue here. Category pages must only show verified live supplier data.
  const validOffers = p => [...(p?.offers || [])]
    .map(o => ({ ...o, price: Number(o?.price) }))
    .filter(o => Number.isFinite(o.price) && o.price >= 50 && o.price <= 1000000)
    .sort((a, b) => a.price - b.price);

  let live = [];
  try {
    live = await loadJson(`/api/catalog?v=category-live&_=${Date.now()}`);
  } catch (e) {
    console.warn('[PCDealFinder] live catalogue unavailable', e);
  }

  const products = live.filter(matches).filter(p => validOffers(p).length);
  const rb = document.getElementById('retailer');
  const retailers = [...new Set(products.flatMap(p => validOffers(p).map(o => o.retailer).filter(Boolean)))].sort();
  if (rb) rb.innerHTML = '<option value="all">All retailers</option>' + retailers.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');

  const render = () => {
    const selected = rb?.value || 'all';
    const sort = document.getElementById('sort')?.value || 'priceAsc';
    let rows = products.map(p => {
      const offers = validOffers(p).filter(o => selected === 'all' || o.retailer === selected);
      return offers.length ? { p, offers } : null;
    }).filter(Boolean);

    if (sort === 'priceDesc') rows.sort((a,b) => b.offers[0].price - a.offers[0].price);
    else if (sort === 'name') rows.sort((a,b) => name(a.p).localeCompare(name(b.p)));
    else rows.sort((a,b) => a.offers[0].price - b.offers[0].price);

    const count = document.getElementById('categoryCount');
    if (count) count.textContent = `${rows.length} product${rows.length === 1 ? '' : 's'}`;

    root.innerHTML = rows.length ? rows.map(({p, offers}) => {
      const o = offers[0];
      const img = p.image || p.imageUrl || p.thumbnail || '';
      const image = img && !/undefined|\[object object\]/i.test(img)
        ? `<img src="${esc(img)}" alt="${esc(name(p))}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove();this.parentElement.classList.add('imageFailed')">`
        : `<span>${esc(infer(p).slice(0,3).toUpperCase())}</span>`;
      return `<article class="categoryProduct product liveProduct">
        <div class="categoryImage productVisual">${image}</div>
        <div class="categoryProductInfo">
          <span class="tag">${esc(infer(p).toUpperCase())}</span>
          <h2 class="categoryProductName">${esc(name(p))}</h2>
          <p>${esc(p.description || 'Verified live supplier listing.')}</p>
          <div class="categoryMeta">${p.brand ? `<span>${esc(p.brand)}</span>` : ''}${p.mpn ? `<span>MPN ${esc(p.mpn)}</span>` : ''}</div>
        </div>
        <div class="categoryPrice"><small>LOWEST PRICE</small><strong>R${o.price.toLocaleString('en-ZA')}</strong><span>${esc(o.retailer || 'Retailer')}</span></div>
        <div class="categoryOffers">${offers.map(x => `<div class="categoryOffer"><div><b>${esc(x.retailer || 'Retailer')}</b><br><span>${esc(x.stock || 'Stock unknown')}</span></div><div><b>R${x.price.toLocaleString('en-ZA')}</b>${x.url ? ` <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">View Deal →</a>` : ''}</div></div>`).join('')}</div>
      </article>`;
    }).join('') : `<div class="emptyCategory"><h2>No live products found</h2><p>The live catalogue returned no verified products for this category yet. No old catalogue data is being shown.</p></div>`;
  };

  render();
  document.getElementById('sort')?.addEventListener('change', render);
  rb?.addEventListener('change', render);
})();