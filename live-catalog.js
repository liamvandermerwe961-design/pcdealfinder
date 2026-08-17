const SOURCES = [
  { id:'pcInternational', name:'PC International', urls:['https://pcinternational.co.za/products/'] },
  { id:'titanIce', name:'Titan-Ice', urls:['https://www.titan-ice.co.za/'] },
  { id:'takealot', name:'Takealot', urls:['https://www.takealot.com/computers/graphics-cards-26421'] },
  { id:'dreamware', name:'Dreamware Technology', urls:['https://www.dreamwaretech.co.za/'] }
];

const RULES=[
 ['GPU',/graphics card|geforce|radeon|arc\s+[a-z0-9]/i],['CPU',/processor|\bcpu\b|ryzen\s+[3579]|core\s+i[3579]|core\s+ultra/i],
 ['Motherboard',/motherboard|mainboard/i],['RAM',/\bddr[345]\b|desktop memory|dimm|sodimm/i],['SSD',/\bssd\b|nvme|solid state/i],['HDD',/\bhdd\b|hard drive|barracuda|ironwolf/i],
 ['PSU',/power supply|\bpsu\b|80\s*plus/i],['Case',/pc case|computer case|chassis/i],['CPU Cooler',/cpu cooler|air cooler|aio|liquid cooler|water cooler/i],['Case Fan',/case fan|\b120mm\b.*fan|\b140mm\b.*fan|pwm fan/i],
 ['Monitor',/monitor|display|ultrawide|\b144hz\b|\b165hz\b|\b240hz\b|oled/i],['Keyboard',/keyboard/i],['Mouse',/gaming mouse|computer mouse|wireless mouse/i],['Headset',/headset|headphones/i],['Mousepad',/mouse ?pad|desk mat/i],['Microphone',/microphone|streaming mic/i],['Webcam',/webcam|web camera/i],
 ['Networking',/router|switch|access point|wifi adapter|network adapter|ethernet/i],['Capture Card',/capture card|elgato/i],['Cable',/hdmi cable|displayport cable|usb cable|ethernet cable|power cable/i]
];

function category(text){for(const [c,r] of RULES)if(r.test(text))return c;return 'Other'}
function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
function price(s){const m=String(s||'').replace(/\s/g,'').replace(/,/g,'').match(/(?:R|ZAR)?([0-9]+(?:\.[0-9]{1,2})?)/i);return m?Number(m[1]):0}
function absUrl(base,u){try{return new URL(u,base).href}catch{return ''}}
function stripHtml(s){return clean(String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' '))}

function jsonLd(html){const out=[];const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;let m;while((m=re.exec(html))){try{const v=JSON.parse(m[1]);const walk=x=>{if(!x)return;if(Array.isArray(x))return x.forEach(walk);if(typeof x==='object'){if(x['@type']==='Product'||(Array.isArray(x['@type'])&&x['@type'].includes('Product')))out.push(x);for(const k of Object.keys(x))if(k!=='offers')walk(x[k])}};walk(v)}catch{}}return out}

function htmlProducts(html,base,retailer){
  const products=jsonLd(html,base).map(p=>{const o=Array.isArray(p.offers)?p.offers[0]:(p.offers||{});const img=Array.isArray(p.image)?p.image[0]:p.image;const name=clean(p.name);return name?{id:p.sku||p.mpn||name,name,mpn:p.mpn||p.sku||'',description:stripHtml(p.description||''),image:absUrl(base,img),category:category([name,p.description,p.mpn].join(' ')),offer:{retailer,price:price(o.price),stock:String(o.availability||'').split('/').pop()||'Check retailer',url:absUrl(base,p.url||o.url)}}:null}).filter(x=>x&&x.offer.price>0);
  if(products.length)return products;
  const blocks=html.match(/<(?:article|li|div)[^>]*class=["'][^"']*(?:product|item)[^"']*["'][\s\S]*?<\/(?:article|li|div)>/gi)||[];
  return blocks.map(b=>{const n=(b.match(/<(?:h2|h3|h4)[^>]*>([\s\S]*?)<\//i)||[])[1];const p=(b.match(/(?:R|ZAR)\s?([0-9][0-9\s,.]*)/i)||[])[1];const a=(b.match(/href=["']([^"']+)["']/i)||[])[1];const im=(b.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)||[])[1];const name=stripHtml(n);return name&&price(p)?{id:name,name,mpn:'',description:'',image:absUrl(base,im),category:category(name),offer:{retailer,price:price(p),stock:'Check retailer',url:absUrl(base,a)}}:null}).filter(Boolean);
}

async function fetchSource(source){const all=[];for(const url of source.urls){try{const r=await fetch(url,{headers:{'user-agent':'PCDealFinder/1.0 catalogue comparison bot'}});if(!r.ok)continue;const html=await r.text();all.push(...htmlProducts(html,url,source.name))}catch(e){console.log('supplier fetch failed',source.name,String(e))}}return all}

async function ensureTables(db){await db.batch([
 db.prepare(`CREATE TABLE IF NOT EXISTS catalog_products (id TEXT PRIMARY KEY,name TEXT NOT NULL,mpn TEXT,category TEXT NOT NULL,description TEXT,image TEXT,updated_at INTEGER NOT NULL)`),
 db.prepare(`CREATE TABLE IF NOT EXISTS catalog_offers (product_id TEXT NOT NULL,retailer TEXT NOT NULL,price REAL NOT NULL,stock TEXT,url TEXT,updated_at INTEGER NOT NULL,PRIMARY KEY(product_id,retailer))`),
 db.prepare(`CREATE TABLE IF NOT EXISTS catalog_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL)`)])}

export async function refreshLiveCatalogue(db){await ensureTables(db);const rows=[];for(const s of SOURCES)rows.push(...await fetchSource(s));const now=Math.floor(Date.now()/1000);let count=0;for(const r of rows){const id=String(r.mpn||r.id||r.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,180);await db.prepare(`INSERT INTO catalog_products(id,name,mpn,category,description,image,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,mpn=excluded.mpn,category=excluded.category,description=CASE WHEN excluded.description<>'' THEN excluded.description ELSE catalog_products.description END,image=CASE WHEN excluded.image<>'' THEN excluded.image ELSE catalog_products.image END,updated_at=excluded.updated_at`).bind(id,r.name,r.mpn,r.category,r.description||'',r.image||'',now).run();await db.prepare(`INSERT INTO catalog_offers(product_id,retailer,price,stock,url,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(product_id,retailer) DO UPDATE SET price=excluded.price,stock=excluded.stock,url=excluded.url,updated_at=excluded.updated_at`).bind(id,r.offer.retailer,r.offer.price,r.offer.stock,r.offer.url,now).run();count++}await db.prepare(`INSERT INTO catalog_meta(key,value) VALUES('last_refresh',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(new Date().toISOString()).run();return {imported:count,updatedAt:new Date().toISOString()}}

export async function getLiveCatalogue(db){await ensureTables(db);const p=await db.prepare('SELECT * FROM catalog_products ORDER BY name').all();const o=await db.prepare('SELECT * FROM catalog_offers WHERE price>0 ORDER BY price').all();const map=new Map(p.results.map(x=>[x.id,{id:x.id,name:x.name,mpn:x.mpn,category:x.category,description:x.description,image:x.image,offers:[]} ]));for(const x of o.results){const v=map.get(x.product_id);if(v)v.offers.push({retailer:x.retailer,price:x.price,stock:x.stock,url:x.url})}return [...map.values()].filter(x=>x.offers.length)}
