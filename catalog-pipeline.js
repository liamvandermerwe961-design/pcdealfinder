/* PCDealFinder live catalogue pipeline.
 * Supplier connectors are intentionally separated from the UI so live feeds can be
 * added without changing product cards or the PC builder.
 */
export const SUPPLIERS = {
  takealot: {
    name: 'Takealot',
    homepage: 'https://www.takealot.com/',
    mode: 'api-or-feed',
    enabled: true
  },
  titanIce: {
    name: 'Titan-Ice',
    homepage: 'https://www.titan-ice.co.za/',
    catalogue: 'https://www.titan-ice.co.za/catalog/',
    mode: 'public-catalogue',
    enabled: true
  },
  dreamware: {
    name: 'Dreamware Technology',
    homepage: 'https://www.dreamwaretech.co.za/',
    mode: 'public-catalogue',
    enabled: true
  },
  pcInternational: {
    name: 'PC International',
    homepage: 'https://pcinternational.co.za/',
    catalogue: 'https://pcinternational.co.za/products/',
    mode: 'public-catalogue',
    enabled: true
  },
  amazon: {
    name: 'Amazon',
    homepage: 'https://www.amazon.com/',
    mode: 'official-api-required',
    enabled: true
  }
};

export const CATEGORY_RULES = [
  ['GPU', /graphics card|geforce|radeon|arc\s+[a-z0-9]/i],
  ['CPU', /processor|cpu|ryzen\s+[3579]|core\s+i[3579]|core\s+ultra/i],
  ['Motherboard', /motherboard|mainboard|\bb[0-9]{3}\b.*(wifi|gaming)|\bx[0-9]{3}\b.*mother/i],
  ['RAM', /memory|\bddr[45]\b|desktop ram|dimm|sodimm/i],
  ['SSD', /solid state|\bssd\b|nvme|m\.2.*storage/i],
  ['HDD', /hard drive|\bhdd\b|ironwolf|barracuda.*drive/i],
  ['PSU', /power supply|\bpsu\b|watt.*80\s*plus|80\s*plus.*watt/i],
  ['Case', /pc case|computer case|chassis|tower case/i],
  ['CPU Cooler', /cpu cooler|air cooler|aio|liquid cooler|water cooler/i],
  ['Case Fan', /case fan|120mm fan|140mm fan|pwm fan/i],
  ['Monitor', /monitor|display|ultrawide|144hz|165hz|240hz|oled.*display/i],
  ['Keyboard', /keyboard|mechanical keyboard/i],
  ['Mouse', /gaming mouse|computer mouse|wireless mouse/i],
  ['Headset', /gaming headset|headset|headphones/i],
  ['Mousepad', /mouse pad|mousepad|desk mat/i],
  ['Microphone', /microphone|mic arm|streaming mic/i],
  ['Webcam', /webcam|web camera/i],
  ['Networking', /router|switch|access point|wifi adapter|network adapter|ethernet/i],
  ['External Storage', /external.*ssd|external.*hdd|portable.*ssd|portable.*hard/i],
  ['Capture Card', /capture card|elgato/i],
  ['Cable', /hdmi cable|displayport cable|usb cable|ethernet cable|power cable/i]
];

export function normalizeCategory(product) {
  const supplied = String(product?.category || '').trim();
  const text = [product?.name, product?.description, product?.mpn, supplied].filter(Boolean).join(' ');
  for (const [category, rule] of CATEGORY_RULES) {
    if (rule.test(text)) return category;
  }
  return supplied || 'Other';
}

export function normalizeProduct(product) {
  const offers = Array.isArray(product?.offers) ? product.offers : [];
  return {
    ...product,
    category: normalizeCategory(product),
    description: String(product?.description || '').trim() || `${product?.name || 'PC hardware'} — compare current South African retailer offers on PCDealFinder.`,
    image: product?.image || product?.imageUrl || null,
    offers: offers.map(offer => ({
      ...offer,
      retailer: offer.retailer || 'Unknown supplier',
      price: Number(offer.price),
      stock: offer.stock || 'Check retailer',
      url: offer.url || ''
    }))
  };
}

export function mergeOffers(products) {
  const merged = new Map();
  for (const raw of products || []) {
    const product = normalizeProduct(raw);
    const key = String(product.mpn || product.id || product.name).trim().toLowerCase();
    if (!merged.has(key)) merged.set(key, product);
    else {
      const current = merged.get(key);
      current.offers = [...current.offers, ...product.offers];
      if (!current.image && product.image) current.image = product.image;
      if (!current.description && product.description) current.description = product.description;
    }
  }
  for (const product of merged.values()) {
    const byRetailer = new Map();
    for (const offer of product.offers) {
      const key = String(offer.retailer).toLowerCase();
      if (!byRetailer.has(key) || offer.price < byRetailer.get(key).price) byRetailer.set(key, offer);
    }
    product.offers = [...byRetailer.values()].sort((a, b) => a.price - b.price);
  }
  return [...merged.values()];
}
