/* PCDealFinder — Phase 1 Builder upgrade
   Adds compatibility checks, save/share controls and a clearer build health panel.
*/
(function () {
  const money = value => 'R' + Number(value || 0).toLocaleString('en-ZA');
  let catalog = [];

  fetch('data.json?v=20260817', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).then(data => { catalog = Array.isArray(data) ? data : []; }).catch(() => {});

  function productByName(name) {
    const target = String(name || '').trim().toLowerCase();
    return catalog.find(p => String(p.name || '').trim().toLowerCase() === target) || null;
  }

  function getBuildState() {
    return {
      budget: Number(document.getElementById('buildBudget')?.value || 15000),
      game: document.getElementById('buildGame')?.value || 'general',
      resolution: document.getElementById('buildResolution')?.value || '1080p',
      priority: document.getElementById('buildPriority')?.value || 'value'
    };
  }

  function saveBuild(state) {
    try { localStorage.setItem('pcdf-saved-build', JSON.stringify(state)); return true; } catch (_) { return false; }
  }

  function shareBuild(state) {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    const url = location.origin + location.pathname + '#build=' + encoded;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Build link copied ✓')).catch(() => prompt('Copy your build link:', url));
    else prompt('Copy your build link:', url);
  }

  function toast(message) {
    let el = document.getElementById('builderToast');
    if (!el) { el = document.createElement('div'); el.id = 'builderToast'; el.className = 'builderToast'; document.body.appendChild(el); }
    el.textContent = message; el.classList.add('show'); clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function compatibilityChecks() {
    const parts = [...document.querySelectorAll('#buildResult .buildPart')].map(row => {
      const category = row.querySelector('small')?.textContent?.trim() || '';
      const name = row.querySelector('b')?.textContent?.trim() || '';
      return { category, product: productByName(name) };
    }).filter(x => x.product);
    const find = category => parts.find(x => x.category.toLowerCase() === category.toLowerCase())?.product;
    const cpu = find('CPU'), gpu = find('GPU'), ram = find('RAM'), motherboard = find('Motherboard'), psu = find('PSU');
    const checks = [];

    if (cpu && motherboard && cpu.socket && motherboard.socket) checks.push({ ok: cpu.socket === motherboard.socket, title: 'CPU ↔ motherboard', detail: cpu.socket === motherboard.socket ? cpu.socket + ' socket matched' : cpu.socket + ' CPU vs ' + motherboard.socket + ' motherboard' });
    if (ram && motherboard && ram.memory && motherboard.memory) checks.push({ ok: ram.memory === motherboard.memory, title: 'RAM ↔ motherboard', detail: ram.memory === motherboard.memory ? ram.memory + ' memory matched' : ram.memory + ' RAM vs ' + motherboard.memory + ' motherboard' });
    if (gpu && psu) {
      const gpuPower = Number(gpu.wattage) || estimateGpuPower(gpu), psuPower = Number(psu.wattage) || 0, required = gpuPower + 200;
      checks.push({ ok: psuPower >= required, title: 'GPU ↔ PSU', detail: psuPower ? money(psuPower) + ' PSU / ' + money(required) + ' recommended' : 'PSU wattage not listed' });
    }
    return checks;
  }

  function estimateGpuPower(gpu) {
    const name = String(gpu?.name || '').toLowerCase();
    if (name.includes('5070 ti')) return 300; if (name.includes('5070')) return 250; if (name.includes('4070 super')) return 220; if (name.includes('4070')) return 200; if (name.includes('7800 xt')) return 263; if (name.includes('7700 xt')) return 245; if (name.includes('7600 xt')) return 190; if (name.includes('7600')) return 165; if (name.includes('4060 ti')) return 160; if (name.includes('4060')) return 115; return 180;
  }

  function enhanceResult() {
    const result = document.getElementById('buildResult');
    if (!result?.querySelector('.buildResultHead')) return;
    result.querySelector('.phase1Panel')?.remove();
    const checks = compatibilityChecks(), failures = checks.filter(c => !c.ok), panel = document.createElement('div');
    panel.className = 'phase1Panel';
    panel.innerHTML = `<div class="phase1Head"><div><small>BUILD HEALTH</small><h4>${failures.length ? 'Compatibility needs attention' : 'Compatible build'}</h4></div><span>${failures.length ? '⚠ Review the warning below' : '✓ Core compatibility checks passed'}</span></div><div class="compatibilityGrid">${checks.length ? checks.map(c => `<div class="compatibilityItem ${c.ok ? 'ok' : 'bad'}"><b>${c.ok ? '✓' : '⚠'} ${c.title}</b><span>${c.detail}</span></div>`).join('') : '<div class="compatibilityItem ok"><b>✓ Catalogue compatibility</b><span>No conflicting specifications were found.</span></div>'}</div><div class="phase1Actions"><button type="button" class="builderSecondary" id="saveCurrentBuild">♡ Save build</button><button type="button" class="builderSecondary" id="shareCurrentBuild">↗ Share build</button></div>`;
    result.appendChild(panel);
    const state = getBuildState();
    panel.querySelector('#saveCurrentBuild')?.addEventListener('click', () => { saveBuild(state); toast('Build saved on this device ✓'); });
    panel.querySelector('#shareCurrentBuild')?.addEventListener('click', () => shareBuild(state));
  }

  function wrap() {
    if (typeof window.generateBuild !== 'function' || window.__pcdfPhase1Wrapped) return false;
    const original = window.generateBuild; window.__pcdfPhase1Wrapped = true;
    window.generateBuild = function () { original.apply(this, arguments); setTimeout(enhanceResult, 150); };
    return true;
  }

  function loadSharedBuild() {
    const match = location.hash.match(/^#build=(.+)$/); if (!match) return;
    try {
      const state = JSON.parse(decodeURIComponent(escape(atob(match[1]))));
      const set = (id, value) => { const el = document.getElementById(id); if (el && value != null) el.value = value; };
      set('buildBudget', state.budget); set('buildGame', state.game); set('buildResolution', state.resolution); set('buildPriority', state.priority);
      setTimeout(() => { if (typeof window.generateBuild === 'function') window.generateBuild(); }, 500);
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    const timer = setInterval(() => { if (wrap()) clearInterval(timer); }, 100);
    setTimeout(() => { clearInterval(timer); loadSharedBuild(); }, 3000);
  });
})();
