const SOURCES = [
  { id: 'pcInternational', name: 'PC International', page: 'https://pcinternational.co.za/products/' },
  { id: 'pcGpu', name: 'PC International - Graphics Cards', page: 'https://pcinternational.co.za/product-category/computer-components/all-graphics-cards/' },
  { id: 'titanIce', name: 'Titan-Ice', page: 'https://www.titan-ice.co.za/hardware/?items_per_page=96&layout=products_without_options&sort_by=timestamp&sort_order=desc' },
  { id: 'dreamware', name: 'Dreamware Technology', page: 'https://www.dreamwaretech.co.za/' },
  { id: 'evetech', name: 'Evetech', page: 'https://www.evetech.co.za/components' },
  { id: 'wootware', name: 'Wootware', page: 'https://www.wootware.co.za/computer-hardware' },
  { id: 'wootGpu', name: 'Wootware - Graphics Cards', page: 'https://www.wootware.co.za/computer-hardware/video-cards-video-devices' },
  { id: 'takealot', name: 'Takealot', page: 'https://www.takealot.com/computers/graphics-cards-26421' }
];

const RULES = [
  ['GPU', /graphics card|geforce|radeon|\barc\s+[a-z0-9]/i],
  ['CPU', /processor|\bcpu\b|ryzen\s+[3579]|core\s+i[3579]|core\s+ultra|threadripper|xeon|epyc/i],
  ['Motherboard', /motherboard|mainboard|b650|b550|x670|x570|z790|z690|b760|h610|h510|a520/i],
  ['RAM', /\bddr[345]\b|memory|dimm|udimm|sodimm|vengeance|ripjaws|trident z|fury beast/i],
  ['SSD', /\bssd\b|nvme|solid state|990 pro|980 pro|sn770|sn850|mx500|crucial p[35]/i],
  ['HDD', /\bhdd\b|hard drive|hard disk|barracuda|ironwolf/i],
  ['PSU', /power supply|\bpsu\b|80\s*plus|rm650|rm750|rm850|focus gx|supernova|straight power|pure power/i],
  ['Case', /pc case|computer case|chassis|tower|meshify|nzxt.*h[567]|fractal.*north|lancool/i],
  ['Case Fan', /case fan|120mm.*fan|140mm.*fan|pwm fan/i],
  ['CPU Cooler', /cpu cooler|air cooler|aio|liquid cooler|water cooler|deepcool|arctic.*liquid|kraken|nh-d15|hyper 212/i],
  ['Monitor', /monitor|display|ultrawide|odyssey|gaming monitor|\d+.*hz/i],
  ['Keyboard', /keyboard|keychron|mechanical keyboard/i],
  ['Mouse', /gaming mouse|computer mouse|wireless mouse|deathadder|g502|viper|basilisk/i],
  ['Headset', /headset|headphones|cloud iii|blackshark|arctis/i],
  ['Microphone', /microphone|\bmic\b|quadcast|yeti|seiren/i],
  ['Webcam', /webcam|web camera|c920|c922|brio/i],
  ['Networking', /router|switch|access point|wifi adapter|network adapter|ethernet|wi-fi/i],
  ['Capture Cards', /capture card|elgato/i],
  ['Cables', /hdmi cable|displayport cable|usb cable|ethernet cable|power cable|adapter|converter/i],
  ['Speakers', /speaker|soundbar|audio/i],
  ['Combos', /keyboard.*mouse.*combo|combo.*keyboard/i],
  ['Gaming Devices', /controller|gamepad|gaming device/i],
  ['UPS', /\bups\b|inverter|power station|surge protector/i],
  ['Docking', /docking station|dock/i],
  ['Bags', /laptop bag|backpack|carry bag/i],
  ['Laptop', /laptop|notebook|macbook/i],
  ['Desktop', /desktop pc|office pc|gaming pc|mini pc/i],
  ['Printer', /printer|scanner|toner|cartridge/i],
  ['Projector', /projector/i],
  ['Accessories', /accessor|stand|bracket|hub|holder|lighting|thermal paste|cable tie|cleaning/i]
];

const MIN_PRICE = {
  GPU: 500,
  CPU: 500,
  RAM: 100,
  SSD: 150,
  HDD: 150,
  Motherboard: 400,
  PSU: 300,
  Case: 250,
  Monitor: 500,
  Keyboard: 100,
  Mouse: 80,
  Headset: 150
};

function category(text) {
  for (const [c, r] of RULES) if (r.test(text)) return c;
  return 'Other';
}

function clean(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function absUrl(base, value) {
  try {
    const u = new URL(String(value || ''), base);
    return /^https?:$/i.test(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
}

function stripHtml(s) {
  return clean(String(s || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&'));
}

function numericPrice(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = clean(value);
  if (!text) return 0;
  if (/^\d+(?:\.\d{1,2})?$/.test(text)) return Number(text);
  return currencyPrice(text);
}

function currencyPrice(value) {
  const text = String(value || '').replace(/&nbsp;/gi, ' ');
  const match = text.match(/(?:^|[^A-Za-z])(?:R|ZAR)\s*([0-9]{1,3}(?:[\s,][0-9]{3})+|[0-9]{3,6})(?:\.([0-9]{2}))?(?![0-9])/i);
  if (!match) return 0;
  const price = Number(String(match[1]).replace(/[\s,]/g, '') + (match[2] ? `.${match[2]}` : ''));
  return Number.isFinite(price) ? price : 0;
}

function plausiblePrice(name, price) {
  const p = Number(price);
  if (!Number.isFinite(p) || p < 10 || p > 1000000) return false;
  const text = String(name || '');
  const c = category(text);
  return p >= (MIN_PRICE[c] || 10);
}

function meta(html, name, attr = 'property') {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
  const b = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escaped}["'][^>]*>`, 'i');
  return (html.match(a) || html.match(b))?.[1] || '';
}

function anyMeta(html, names) {
  for (const name of names) {
    const value = meta(html, name, 'property') || meta(html, name, 'name');
    if (value) return value;
  }
  return '';
}

function jsonLd(html) {
  const products = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    try {
      const value = JSON.parse(match[1].trim());
      const walk = node => {
        if (!node) return;
        if (Array.isArray(node)) return node.forEach(walk);
        if (typeof node !== 'object') return;
        const type = node['@type'];
        if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) products.push(node);
        Object.values(node).forEach(walk);
      };
      walk(value);
    } catch {}
  }
  return products;
}

function pickOffer(product) {
  const offers = Array.isArray(product?.offers) ? product.offers : (product?.offers ? [product.offers] : []);
  return offers.find(o => numericPrice(o?.price) || numericPrice(o?.priceSpecification?.price)) || offers[0] || {};
}

function pickImage(product, html, base) {
  const candidates = [];
  const image = product?.image;
  if (Array.isArray(image)) candidates.push(...image);
  else candidates.push(image);
  candidates.push(
    anyMeta(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']),
    html.match(/<(?:img|source)[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i)?.[1],
    html.match(/<(?:img|source)[^>]+srcset=["']([^"']+)["']/i)?.[1]?.split(',')[0]?.trim()?.split(/\s+/)[0]
  );

  for (const candidate of candidates) {
    if (!candidate || typeof candidate === 'object') continue;
    const raw = String(candidate).trim();
    if (!raw || /\[object\s+Object\]|undefined|null/i.test(raw)) continue;
    const url = absUrl(base, raw);
    if (!url) continue;
    if (/\/(?:undefined|null)(?:$|[?#])/i.test(url)) continue;
    if (/\[object(?:%20|\s)+Object\]/i.test(url)) continue;
    if (!/\.(?:jpe?g|png|webp|avif|gif)(?:[?#].*)?$/i.test(url) && !/image|media|cdn/i.test(url)) continue;
    return url;
  }
  return '';
}

function pickDescription(product, html) {
  const description = stripHtml(product?.description || '') || stripHtml(anyMeta(html, ['og:description', 'description']));
  if (description) return description;
  const match = html.match(/<(?:div|section|p)[^>]+(?:class|id)=["'][^"']*(?:description|product-description|woocommerce-product-details__short-description)[^"']*["'][^>]*>([\s\S]*?)<\//i);
  return stripHtml(match?.[1] || '');
}

function pickUrl(product, html, base) {
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return absUrl(base, product?.url || canonical?.[1] || base);
}

function extractProductLinks(html, base) {
  const links = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html))) {
    const url = absUrl(base, match[1]);
    const text = stripHtml(match[2]);
    if (!url || !text) continue;
    if (/\/product(?:s)?\//i.test(url) || /\/product\?/i.test(url) || /\/p\//i.test(url)) links.push(url);
  }
  return [...new Set(links)].slice(0, 2);
}

function extractProduct(product, html, pageUrl, retailer) {
  const offer = pickOffer(product);
  const name = clean(product?.name) || stripHtml(anyMeta(html, ['og:title', 'twitter:title']));
  let price = numericPrice(offer?.price) || numericPrice(offer?.priceSpecification?.price) || numericPrice(meta(html, 'product:price:amount'));
  if (!plausiblePrice(name, price)) price = currencyPrice(html);
  if (!name || !plausiblePrice(name, price)) return null;

  return {
    id: clean(product?.mpn || product?.sku || name),
    name,
    mpn: clean(product?.mpn || product?.sku || ''),
    description: pickDescription(product, html),
    image: pickImage(product, html, pageUrl),
    category: category([name, product?.description || ''].join(' ')),
    offer: {
      retailer,
      price,
      stock: clean(String(offer?.availability || '').split('/').pop()) || (/out of stock/i.test(html) ? 'Out of stock' : 'Check retailer'),
      url: pickUrl(product, html, pageUrl)
    }
  };
}

function parseProductPage(html, url, retailer) {
  const products = jsonLd(html);
  if (products.length) {
    const parsed = products.map(p => extractProduct(p, html, url, retailer)).filter(Boolean);
    if (parsed.length) return parsed[0];
  }

  const name = stripHtml(anyMeta(html, ['og:title', 'twitter:title']));
  const price = currencyPrice(html);
  if (!name || !plausiblePrice(name, price)) return null;
  return {
    id: name,
    name,
    mpn: '',
    description: pickDescription({}, html),
    image: pickImage({}, html, url),
    category: category(name),
    offer: { retailer, price, stock: /out of stock/i.test(html) ? 'Out of stock' : 'Check retailer', url: pickUrl({}, html, url) }
  };
}

async function fetchPage(url, retailer) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 PCDealFinder/2.0',
        accept: 'text/html,application/xhtml+xml'
      },
      cache: 'no-store'
    });
    if (!response.ok) {
      response.body?.cancel();
      return [];
    }

    const html = await response.text();
    const direct = jsonLd(html).map(p => extractProduct(p, html, url, retailer)).filter(Boolean);
    if (direct.length) return dedupe(direct);

    const links = extractProductLinks(html, url);
    const detailRows = [];
    for (const link of links) {
      try {
        const detail = await fetch(link, {
          headers: { 'user-agent': 'Mozilla/5.0 PCDealFinder/2.0', accept: 'text/html,application/xhtml+xml' },
          cache: 'no-store'
        });
        if (!detail.ok) {
          detail.body?.cancel();
          continue;
        }
        const parsed = parseProductPage(await detail.text(), link, retailer);
        if (parsed) detailRows.push(parsed);
      } catch {}
    }
    return dedupe(detailRows);
  } catch {
    return [];
  }
}

function keyFor(row) {
  return String(row?.mpn || row?.id || row?.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

function dedupe(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const key = keyFor(row);
    if (!key || !row?.name || !plausiblePrice(row.name, row.offer?.price)) continue;
    const existing = map.get(key);
    if (!existing || row.offer.price < existing.offer.price || (!existing.image && row.image) || (!existing.description && row.description)) {
      map.set(key, row);
    }
  }
  return [...map.values()];
}

async function ensureTables(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS catalog_products (id TEXT PRIMARY KEY,name TEXT NOT NULL,mpn TEXT,category TEXT NOT NULL,description TEXT,image TEXT,updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS catalog_offers (product_id TEXT NOT NULL,retailer TEXT NOT NULL,price REAL NOT NULL,stock TEXT,url TEXT,updated_at INTEGER NOT NULL,PRIMARY KEY(product_id,retailer))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS catalog_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL)`)
  ]);
}

async function setMeta(db, key, value) {
  await db.prepare(`INSERT INTO catalog_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
    .bind(key, String(value)).run();
}

async function getMeta(db, key) {
  try {
    const row = await db.prepare('SELECT value FROM catalog_meta WHERE key=?').bind(key).first();
    return row?.value || null;
  } catch {
    return null;
  }
}

async function saveRows(db, rows) {
  const now = Math.floor(Date.now() / 1000);
  for (const row of rows) {
    const id = keyFor(row);
    const price = Number(row.offer?.price);
    if (!id || !row.name || !plausiblePrice(row.name, price)) continue;

    await db.prepare(`INSERT INTO catalog_products(id,name,mpn,category,description,image,updated_at)
      VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        mpn=excluded.mpn,
        category=excluded.category,
        description=CASE WHEN excluded.description<>'' THEN excluded.description ELSE catalog_products.description END,
        image=CASE WHEN excluded.image<>'' THEN excluded.image ELSE catalog_products.image END,
        updated_at=excluded.updated_at`)
      .bind(id, row.name, row.mpn || '', row.category || category(row.name), row.description || '', row.image || '', now).run();

    await db.prepare(`INSERT INTO catalog_offers(product_id,retailer,price,stock,url,updated_at)
      VALUES(?,?,?,?,?,?)
      ON CONFLICT(product_id,retailer) DO UPDATE SET
        price=excluded.price,stock=excluded.stock,url=excluded.url,updated_at=excluded.updated_at`)
      .bind(id, row.offer.retailer, price, row.offer.stock || 'Check retailer', row.offer.url || '', now).run();
  }
}

async function cleanCatalogue(db) {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 48 * 60 * 60;

  // Remove the broken prices that caused values such as R4/R16 to survive from earlier scraper runs.
  await db.prepare(`DELETE FROM catalog_offers WHERE price < 10 OR price > 1000000`).run();
  await db.prepare(`DELETE FROM catalog_offers WHERE updated_at < ?`).bind(cutoff).run();
  await db.prepare(`DELETE FROM catalog_products WHERE id NOT IN (SELECT DISTINCT product_id FROM catalog_offers)`).run();
}

export async function refreshLiveCatalogue(db) {
  await ensureTables(db);

  // The old implementation walked six pages per retailer and then opened many product pages.
  // That could exceed the Workers Free external-subrequest budget and leave PC International
  // as the only supplier. One current catalogue page per supplier is intentionally used here.
  const results = await Promise.all(SOURCES.map(async source => ({
    source,
    rows: await fetchPage(source.page, source.name)
  })));

  let imported = 0;
  let successfulSources = 0;
  for (const result of results) {
    if (result.rows.length) {
      await saveRows(db, result.rows);
      imported += result.rows.length;
      successfulSources++;
      await setMeta(db, `source_${result.source.id}`, 'ok');
    } else {
      await setMeta(db, `source_${result.source.id}`, 'no-data');
    }
  }

  await cleanCatalogue(db);
  const stamp = new Date().toISOString();
  await setMeta(db, 'last_refresh', stamp);
  await setMeta(db, 'successful_sources', successfulSources);

  return { imported, successfulSources, updatedAt: stamp };
}

export async function getLiveCatalogue(db) {
  await ensureTables(db);
  await cleanCatalogue(db);

  const products = await db.prepare(`SELECT * FROM catalog_products ORDER BY updated_at DESC, name ASC`).all();
  const offers = await db.prepare(`SELECT * FROM catalog_offers WHERE price >= 10 AND price <= 1000000 ORDER BY price ASC`).all();

  const map = new Map(products.results.map(product => [product.id, {
    id: product.id,
    name: product.name,
    mpn: product.mpn,
    category: product.category,
    description: product.description,
    image: product.image || null,
    updatedAt: product.updated_at,
    offers: []
  }]));

  for (const offer of offers.results) {
    const product = map.get(offer.product_id);
    if (!product) continue;
    product.offers.push({
      retailer: offer.retailer,
      price: Number(offer.price),
      stock: offer.stock || 'Check retailer',
      url: offer.url || '',
      updatedAt: offer.updated_at
    });
  }

  return [...map.values()]
    .filter(product => product.offers.length)
    .map(product => ({
      ...product,
      offers: product.offers.sort((a, b) => a.price - b.price)
    }));
}
