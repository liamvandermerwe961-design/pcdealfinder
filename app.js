let products = [];

/* =========================================================
   MONEY
========================================================= */

function money(n) {
  const value = Number(n);
  return Number.isFinite(value)
    ? 'R' + value.toLocaleString('en-ZA')
    : '—';
}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

fetch('data.json?v=20260817', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error('Could not load data.json');
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error('data.json is not an array');
    products = data;
    render(products);
  })
  .catch(error => {
    console.error('DATA ERROR:', error);
    const box = document.getElementById('results');
    if (box) {
      box.innerHTML = `
        <div class="emptyState">
          <div class="emptyIcon">⚠</div>
          <h3>Product data could not be loaded</h3>
          <p>Please check that data.json is available.</p>
        </div>
      `;
    }
  });


/* =========================================================
   SEARCH
========================================================= */

function focusSearch() {
  const input = document.getElementById('q');
  if (!input) return;
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function runSearch() {
  const input = document.getElementById('q');
  if (input) search(input.value);
}

function search(query) {
  const value = String(query || '').trim().toLowerCase();
  const input = document.getElementById('q');

  if (input && query) input.value = query;

  if (!value) {
    render(products);
    document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const results = products.filter(product => {
    const searchable = [
      product.name,
      product.category,
      product.mpn,
      product.socket,
      product.memory,
      product.tier
    ].filter(Boolean).join(' ').toLowerCase();

    return searchable.includes(value);
  });

  render(results);
  document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' });
}


/* =========================================================
   PRODUCT HELPERS
========================================================= */

function validOffers(product) {
  return [...(product?.offers || [])]
    .filter(offer => Number.isFinite(Number(offer.price)) && Number(offer.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price));
}

function bestOffer(product) {
  const offers = validOffers(product);
  return offers[0] || {
    price: NaN,
    retailer: 'Unavailable',
    stock: 'Unknown',
    url: ''
  };
}

function productPrice(product) {
  return Number(bestOffer(product).price);
}


/* =========================================================
   PRODUCT RENDER
========================================================= */

function render(list) {
  const box = document.getElementById('results');
  if (!box) return;

  box.innerHTML = '';

  const count = document.getElementById('count');
  if (count) {
    count.textContent =
      list.length + ' product' + (list.length === 1 ? '' : 's');
  }

  if (!list.length) {
    box.innerHTML = `
      <div class="emptyState">
        <div class="emptyIcon">⌕</div>
        <h3>No products found</h3>
        <p>Try searching for a CPU, GPU, RAM, SSD, motherboard or PSU.</p>
      </div>
    `;
    return;
  }

  list.forEach(product => {
    const offers = validOffers(product);
    if (!offers.length) return;

    const lowest = Number(offers[0].price);
    const highest = Number(offers[offers.length - 1].price);
    const savings = Math.max(0, highest - lowest);

    const element = document.createElement('article');
    element.className = 'product';

    element.innerHTML = `
      <div class="productVisual">
        <div class="productGlow"></div>
        <div class="productPlaceholder">
          <span>${getProductIcon(product.category)}</span>
        </div>
        <div class="dealBadge">🏆 BEST DEAL</div>
      </div>

      <div class="productContent">
        <div class="productTop">
          <div class="productInfo">
            <div class="tag">${escapeHTML(product.category || 'PRODUCT')}</div>
            <h3>${escapeHTML(product.name || 'Unnamed product')}</h3>
            ${product.mpn ? `<div class="mpn">MPN: ${escapeHTML(product.mpn)}</div>` : ''}
          </div>

          <div class="bestPrice">
            <small>LOWEST PRICE</small>
            <strong>${money(lowest)}</strong>
            <span>${savings > 0 ? `Save ${money(savings)}` : 'Best listed price'}</span>
          </div>
        </div>

        <div class="productSpecs">
          ${product.socket ? `
            <div><small>SOCKET</small><b>${escapeHTML(product.socket)}</b></div>
          ` : ''}
          ${product.memory ? `
            <div><small>MEMORY</small><b>${escapeHTML(product.memory)}</b></div>
          ` : ''}
          ${product.capacity ? `
            <div><small>CAPACITY</small><b>${product.capacity}GB</b></div>
          ` : ''}
          ${product.wattage ? `
            <div><small>POWER</small><b>${product.wattage}W</b></div>
          ` : ''}
          ${product.tier ? `
            <div><small>PERFORMANCE</small><b>${capitalize(product.tier)}</b></div>
          ` : ''}
        </div>

        <div class="offerTitle">
          <span>RETAILER OFFERS</span>
          <span>${offers.length} ${offers.length === 1 ? 'offer' : 'offers'}</span>
        </div>

        <div class="offers">
          ${offers.map((offer, index) => `
            <div class="offer">
              <div class="retailerInfo">
                <div class="retailerLogo">${getRetailerInitial(offer.retailer)}</div>
                <div>
                  <b>${escapeHTML(offer.retailer || 'Retailer')}</b>
                  <small>
                    <span class="stockDot"></span>
                    ${escapeHTML(offer.stock || 'Stock unknown')}
                  </small>
                </div>
              </div>

              <div class="offerRight">
                <div class="offerPrice">${money(offer.price)}</div>
                ${index === 0 ? '<span class="lowestLabel">LOWEST</span>' : ''}
                ${offer.url ? `
                  <a class="dealButton"
                     href="${escapeAttribute(offer.url)}"
                     target="_blank"
                     rel="noopener noreferrer">
                    View Deal →
                  </a>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="productFooter">
          <span>💡 Prices shown are from the current catalogue</span>
          <span>Compare before buying</span>
        </div>
      </div>
    `;

    box.appendChild(element);
  });
}


/* =========================================================
   NORMAL PC BUILDER
   - Uses the selected budget.
   - Tests complete compatible builds instead of picking parts
     one at a time.
   - Never mixes AM4/AM5 or DDR4/DDR5.
========================================================= */

function generateBuild() {
  const budget = Number(document.getElementById('buildBudget')?.value || 15000);
  const game = document.getElementById('buildGame')?.value || 'general';
  const resolution = document.getElementById('buildResolution')?.value || '1080p';
  const priority = document.getElementById('buildPriority')?.value || 'value';
  const result = document.getElementById('buildResult');

  if (!result) return;

  const build = createBuild(budget, game, resolution, priority);

  if (!build) {
    result.innerHTML = `
      <div class="aiAnswer">
        <strong>⚠️ No compatible build found</strong>
        <p>There isn't a complete compatible build in the current catalogue under ${money(budget)}.</p>
      </div>
    `;
    return;
  }

  const total = build.total;
  const remaining = budget - total;

  result.innerHTML = `
    <div class="buildResultHead">
      <div>
        <small>PCDEALFINDER RECOMMENDATION</small>
        <h3>${escapeHTML(build.title)}</h3>
      </div>

      <div class="buildTotal">
        <small>BUILD TOTAL</small>
        <strong>${money(total)}</strong>
      </div>
    </div>

    <div class="buildParts">
      ${build.parts.map(part => `
        <div class="buildPart">
          <div>
            <small>${escapeHTML(part.category)}</small>
            <b>${escapeHTML(part.product.name)}</b>
          </div>
          <strong>${money(productPrice(part.product))}</strong>
        </div>
      `).join('')}
    </div>

    <div class="buildSummary">
      <span>🎮 Game: <b>${escapeHTML(gameLabel(game))}</b></span>
      <span>🖥️ Resolution: <b>${escapeHTML(resolution)}</b></span>
      <span>💰 Budget: <b>${money(budget)}</b></span>
      <span>📊 Priority: <b>${escapeHTML(priorityLabel(priority))}</b></span>
      <span>💵 Remaining: <b>${money(remaining)}</b></span>
    </div>
  `;
}

function createBuild(budget, game, resolution, priority) {
  const cpus = products.filter(p => p.category === 'CPU' && Number.isFinite(productPrice(p)));
  const gpus = products.filter(p => p.category === 'GPU' && Number.isFinite(productPrice(p)));
  const rams = products.filter(p => p.category === 'RAM' && Number.isFinite(productPrice(p)));
  const ssds = products.filter(p => p.category === 'SSD' && Number.isFinite(productPrice(p)));
  const motherboards = products.filter(p => p.category === 'Motherboard' && Number.isFinite(productPrice(p)));
  const psus = products.filter(p => p.category === 'PSU' && Number.isFinite(productPrice(p)));

  if (!cpus.length || !gpus.length || !rams.length || !ssds.length || !motherboards.length || !psus.length) {
    return null;
  }

  const candidates = [];

  for (const gpu of gpus) {
    for (const cpu of cpus) {
      if (cpu.socket && gpu.socket && cpu.socket !== gpu.socket) continue;

      for (const ram of rams) {
        if (cpu.memory && ram.memory && cpu.memory !== ram.memory) continue;

        for (const motherboard of motherboards) {
          if (cpu.socket && motherboard.socket && cpu.socket !== motherboard.socket) continue;
          if (ram.memory && motherboard.memory && ram.memory !== motherboard.memory) continue;

          const ssd = chooseSSD(ssds);
          if (!ssd) continue;

          const requiredWattage = estimatedGpuPower(gpu) + 200;
          const compatiblePSUs = psus.filter(psu => Number(psu.wattage || 0) >= requiredWattage);
          if (!compatiblePSUs.length) continue;

          const psu = compatiblePSUs
            .slice()
            .sort((a, b) => productPrice(a) - productPrice(b))[0];

          const parts = [
            { category: 'CPU', product: cpu },
            { category: 'GPU', product: gpu },
            { category: 'RAM', product: ram },
            { category: 'Motherboard', product: motherboard },
            { category: 'SSD', product: ssd },
            { category: 'PSU', product: psu }
          ];

          const total = parts.reduce((sum, part) => sum + productPrice(part.product), 0);
          if (total > budget) continue;

          const performance = buildPerformanceScore(parts, game, resolution);
          const value = performance / Math.max(total, 1);
          const budgetUse = total / Math.max(budget, 1);

          let score;
          if (priority === 'fps') {
            score = performance;
          } else if (priority === 'balanced') {
            score = performance * 0.75 + value * 250000 + budgetUse * 1000;
          } else {
            score = value * 300000 + performance * 0.25;
          }

          candidates.push({ parts, total, score });
        }
      }
    }
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return {
    title: buildTitle(game, resolution, priority),
    parts: best.parts,
    total: best.total
  };
}


/* =========================================================
   BUILDER SCORING / COMPATIBILITY
========================================================= */

function chooseSSD(ssds) {
  const preferred = ssds
    .filter(s => Number(s.capacity || 0) >= 1000)
    .sort((a, b) => productPrice(a) - productPrice(b));

  return preferred[0] || ssds.slice().sort((a, b) => productPrice(a) - productPrice(b))[0] || null;
}

function estimatedGpuPower(gpu) {
  if (Number(gpu.wattage) > 0) return Number(gpu.wattage);

  const name = String(gpu.name || '').toLowerCase();

  if (name.includes('5070 ti')) return 300;
  if (name.includes('5070')) return 250;
  if (name.includes('4070 super')) return 220;
  if (name.includes('4070')) return 200;
  if (name.includes('7800 xt')) return 263;
  if (name.includes('7700 xt')) return 245;
  if (name.includes('7600 xt')) return 190;
  if (name.includes('7600')) return 165;
  if (name.includes('4060 ti')) return 160;
  if (name.includes('4060')) return 115;
  if (name.includes('6600')) return 132;

  return 180;
}

function gpuScore(gpu, resolution, game) {
  const name = String(gpu.name || '').toLowerCase();
  const tier = String(gpu.tier || 'entry').toLowerCase();

  const tierScore = {
    entry: 40,
    mid: 65,
    high: 90,
    enthusiast: 115
  }[tier] || 40;

  let score = tierScore;

  if (name.includes('6600')) score = 42;
  if (name.includes('4060')) score = 62;
  if (name.includes('4060 ti')) score = 72;
  if (name.includes('7600')) score = 64;
  if (name.includes('7600 xt')) score = 72;
  if (name.includes('7700 xt')) score = 86;
  if (name.includes('7800 xt')) score = 98;
  if (name.includes('4070')) score = 96;
  if (name.includes('4070 super')) score = 104;
  if (name.includes('5070')) score = 108;
  if (name.includes('5070 ti')) score = 125;

  const resolutionMultiplier = {
    '1080p': 1,
    '1440p': 1.12,
    '4k': 1.28
  }[resolution] || 1;

  const gameMultiplier = {
    fortnite: 1.05,
    warzone: 1.08,
    gta: 1,
    cyberpunk: 1.12,
    general: 1
  }[game] || 1;

  return score * resolutionMultiplier * gameMultiplier;
}

function cpuScore(cpu, game) {
  const name = String(cpu.name || '').toLowerCase();

  let score = 35;

  if (name.includes('5500')) score = 48;
  if (name.includes('5600')) score = 60;
  if (name.includes('5700x')) score = 72;
  if (name.includes('5800x3d')) score = 88;
  if (name.includes('12400f')) score = 60;
  if (name.includes('13400f')) score = 73;
  if (name.includes('7600')) score = 78;
  if (name.includes('7700')) score = 88;
  if (name.includes('7800x3d')) score = 100;

  if (game === 'warzone' || game === 'fortnite') score *= 1.05;
  return score;
}

function ramScore(ram) {
  const capacity = Number(ram.capacity || 0);
  const memory = String(ram.memory || '').toUpperCase();

  let score = capacity >= 32 ? 80 : capacity >= 16 ? 60 : 35;
  if (memory === 'DDR5') score += 10;
  return score;
}

function buildPerformanceScore(parts, game, resolution) {
  const gpu = parts.find(p => p.category === 'GPU').product;
  const cpu = parts.find(p => p.category === 'CPU').product;
  const ram = parts.find(p => p.category === 'RAM').product;

  return (
    gpuScore(gpu, resolution, game) * 1.0 +
    cpuScore(cpu, game) * 0.35 +
    ramScore(ram) * 0.15
  );
}


/* =========================================================
   LABELS
========================================================= */

function gameLabel(game) {
  const labels = {
    fortnite: 'Fortnite',
    warzone: 'Call of Duty: Warzone',
    gta: 'GTA V',
    cyberpunk: 'Cyberpunk 2077',
    general: 'Gaming'
  };
  return labels[game] || 'Gaming';
}

function priorityLabel(priority) {
  const labels = {
    fps: 'Maximum FPS',
    value: 'Best Value',
    balanced: 'Balanced'
  };
  return labels[priority] || 'Best Value';
}

function buildTitle(game, resolution, priority) {
  return `${resolution} ${gameLabel(game)} ${priorityLabel(priority)} Build`;
}


/* =========================================================
   MISC
========================================================= */

function capitalize(value) {
  if (!value) return '';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function getRetailerInitial(retailer) {
  if (!retailer) return 'R';
  return String(retailer).trim().charAt(0).toUpperCase();
}

function getProductIcon(category) {
  const icons = {
    CPU: '⚙️',
    GPU: '🎮',
    RAM: '🧠',
    SSD: '💾',
    Motherboard: '🧩',
    PSU: '⚡'
  };
  return icons[category] || '🖥️';
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHTML(value);
}
