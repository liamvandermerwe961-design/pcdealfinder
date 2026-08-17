const featuredConfig = [
  { key: 'RTX 5070', label: 'GRAPHICS', title: 'RTX 5070', subtitle: 'Next-gen gaming graphics', icon: 'GPU', link: 'category.html?category=GPU' },
  { key: 'Ryzen 7', label: 'PROCESSOR', title: 'AMD Ryzen 7', subtitle: 'High-performance gaming CPU', icon: 'CPU', link: 'cpu.html' },
  { key: 'Samsung SSD', label: 'STORAGE', title: 'Samsung SSD', subtitle: 'Fast storage for your build', icon: 'SSD', link: 'ssd.html' },
  { key: 'Gaming Monitor', label: 'DISPLAY', title: 'Gaming Monitor', subtitle: 'High refresh-rate gaming', icon: 'MON', link: 'category.html?category=Monitor' },
  { key: 'Mechanical Keyboard', label: 'PERIPHERAL', title: 'Mechanical Keyboard', subtitle: 'Responsive gaming input', icon: 'KEY', link: 'category.html?category=Keyboard' }
];

let featuredProducts = [];
let activeSlide = 0;
let slideTimer = null;

function escapeHome(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function homeMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? 'R' + n.toLocaleString('en-ZA') : 'Browse category';
}

function getFeaturedProduct(item) {
  const key = item.key.toLowerCase();
  return featuredProducts.find(p => String(p.name || '').toLowerCase().includes(key)) ||
    featuredProducts.find(p => key.includes(String(p.category || '').toLowerCase()) && p.offers?.length);
}

function renderFeatured() {
  const track = document.getElementById('featuredTrack');
  const dots = document.getElementById('featuredDots');
  if (!track) return;

  track.innerHTML = featuredConfig.map((item, index) => {
    const product = getFeaturedProduct(item);
    const best = product?.offers?.filter(o => Number(o.price) > 0).sort((a,b) => Number(a.price)-Number(b.price))[0];
    const image = product?.image || product?.imageUrl || '';
    return `
      <article class="featuredCard" data-slide="${index}">
        <div class="featuredVisual">
          <div class="featuredGlow"></div>
          ${image ? `<img src="${escapeHome(image)}" alt="${escapeHome(item.title)}" loading="lazy">` : `<div class="featuredPlaceholder"><span>${escapeHome(item.icon)}</span></div>`}
          <span class="featuredBadge">FEATURED</span>
        </div>
        <div class="featuredContent">
          <small>${escapeHome(item.label)}</small>
          <h3>${escapeHome(item.title)}</h3>
          <p>${escapeHome(item.subtitle)}</p>
          <div class="featuredBottom"><strong>${best ? homeMoney(best.price) : 'Explore deals'}</strong><a href="${item.link}">View deals →</a></div>
        </div>
      </article>`;
  }).join('');

  if (dots) {
    dots.innerHTML = featuredConfig.map((_, i) => `<button type="button" class="featuredDot${i === activeSlide ? ' active' : ''}" data-index="${i}" aria-label="Show featured product ${i + 1}"></button>`).join('');
    dots.querySelectorAll('button').forEach(button => button.addEventListener('click', () => goToSlide(Number(button.dataset.index))));
  }
  updateFeaturedPosition();
}

function updateFeaturedPosition() {
  const track = document.getElementById('featuredTrack');
  if (track) track.style.transform = `translateX(-${activeSlide * 100}%)`;
  document.querySelectorAll('.featuredDot').forEach((dot, i) => dot.classList.toggle('active', i === activeSlide));
}

function goToSlide(index) {
  activeSlide = (index + featuredConfig.length) % featuredConfig.length;
  updateFeaturedPosition();
  restartFeaturedTimer();
}

function restartFeaturedTimer() {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => goToSlide(activeSlide + 1), 5000);
}

function search(query) {
  const value = String(query || '').trim();
  const input = document.getElementById('q');
  if (input && value) input.value = value;
  if (!value) return;
  const lower = value.toLowerCase();
  const routes = [
    ['cpu', 'cpu.html'], ['ryzen', 'cpu.html'], ['intel', 'cpu.html'],
    ['gpu', 'gpu.html'], ['rtx', 'gpu.html'], ['radeon', 'gpu.html'],
    ['ram', 'ram.html'], ['memory', 'ram.html'], ['ssd', 'ssd.html'],
    ['hdd', 'hdd.html'], ['motherboard', 'motherboard.html'], ['psu', 'psu.html'],
    ['monitor', 'category.html?category=Monitor'], ['keyboard', 'category.html?category=Keyboard'],
    ['mouse', 'category.html?category=Mouse'], ['headset', 'category.html?category=Headset']
  ];
  const route = routes.find(([term]) => lower.includes(term));
  window.location.href = route ? route[1] : `parts.html?search=${encodeURIComponent(value)}`;
}

function runSearch() {
  const input = document.getElementById('q');
  search(input?.value || '');
}

function focusSearch() {
  const input = document.getElementById('q');
  if (!input) return;
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('data.json?v=20260817', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      featuredProducts = Array.isArray(data) ? data : [];
      renderFeatured();
    })
    .catch(() => renderFeatured());

  document.getElementById('featuredPrev')?.addEventListener('click', () => goToSlide(activeSlide - 1));
  document.getElementById('featuredNext')?.addEventListener('click', () => goToSlide(activeSlide + 1));
  restartFeaturedTimer();
});
