let products = [];

const money = n => 'R' + Number(n).toLocaleString('en-ZA');

fetch('data.json')
  .then(r => r.json())
  .then(d => {
    products = d;
    render(d);
  });

function bestOffer(product) {
  return [...product.offers].sort((a, b) => a.price - b.price)[0];
}

function render(list) {
  const box = document.getElementById('results');
  box.innerHTML = '';

  document.getElementById('count').textContent =
    list.length + ' product' + (list.length === 1 ? '' : 's');

  list.forEach(p => {
    const offers = [...p.offers].sort((a, b) => a.price - b.price);
    const low = offers[0].price;
    const high = offers.at(-1).price;

    const el = document.createElement('article');
    el.className = 'product';

    el.innerHTML = `
      <div class="productHead">
        <div>
          <div class="tag">${p.category}</div>
          <h3>${p.name}</h3>
          <div class="mpn">${p.mpn}</div>
        </div>

        <div class="best">
          <small>BEST LISTED PRICE</small>
          <strong>${money(low)}</strong>
          <div class="save">
            ${high > low
              ? 'Save ' + money(high - low) + ' vs highest listing'
              : 'Lowest listed offer'}
          </div>
        </div>
      </div>

      <div class="offers">
        ${offers.map((o, i) => `
          <div class="offer">
            <div>
              <b>${i === 0 ? '🏆 ' : ''}${o.retailer}</b>
              <small>● ${o.stock}</small>
            </div>

            <div>
              <div class="price">${money(o.price)}</div>
              <a href="${o.url}" target="_blank" rel="noopener">
                View deal
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    box.appendChild(el);
  });
}

function search(q) {
  document.getElementById('q').value = q;

  const x = (q || '').toLowerCase();

  const filtered = x
    ? products.filter(p =>
        (p.name + ' ' + p.category + ' ' + p.mpn)
          .toLowerCase()
          .includes(x)
      )
    : products;

  render(filtered);

  document.getElementById('compare')
    .scrollIntoView({ behavior: 'smooth' });
}

function runSearch() {
  search(document.getElementById('q').value);
}

function focusSearch() {
  document.getElementById('q').focus();
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

document.getElementById('q').addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch();
});


/* =========================
   PC BUILDER
========================= */

function generateBuild() {

  const budget = Number(
    document.getElementById('buildBudget').value
  );

  const game =
    document.getElementById('buildGame').value;

  const resolution =
    document.getElementById('buildResolution').value;

  const priority =
    document.getElementById('buildPriority').value;

  const result =
    document.getElementById('buildResult');


  if (!budget || budget <= 0) {
    result.innerHTML = `
      <p class="muted">
        Please enter a valid budget first.
      </p>
    `;
    return;
  }


  const cpus = products
    .filter(p => p.category === 'CPU')
    .map(p => ({
      ...p,
      bestOffer: bestOffer(p)
    }));

  const gpus = products
    .filter(p => p.category === 'GPU')
    .map(p => ({
      ...p,
      bestOffer: bestOffer(p)
    }));

  const rams = products
    .filter(p =>
      p.category === 'RAM' &&
      p.memory === 'DDR4' &&
      p.capacity >= 16
    )
    .map(p => ({
      ...p,
      bestOffer: bestOffer(p)
    }));

  const ssds = products
    .filter(p =>
      p.category === 'SSD' &&
      p.capacity >= 500
    )
    .map(p => ({
      ...p,
      bestOffer: bestOffer(p)
    }));

  const boards = products
    .filter(p =>
      p.category === 'Motherboard' &&
      p.socket === 'AM4' &&
      p.memory === 'DDR4'
    )
    .map(p => ({
      ...p,
      bestOffer: bestOffer(p)
    }));

  const psus = products
    .filter(p => p.category === 'PSU')
    .map(p => ({
      ...p,
      bestOffer: bestOffer(p)
    }));


  const gameNames = {
    fortnite: 'Fortnite',
    warzone: 'Call of Duty: Warzone',
    gta: 'GTA V',
    cyberpunk: 'Cyberpunk 2077',
    general: 'General gaming'
  };


  /*
    GPU performance ranking.

    This is deliberately simple for the prototype.
    Later we can replace this with real benchmark data.
  */

  const gpuScore = {
    entry: 1,
    mid: 2,
    high: 3,
    enthusiast: 4
  };


  const cpuScore = {
    'AMD Ryzen 5 5500': 1,
    'AMD Ryzen 5 5600': 2,
    'AMD Ryzen 7 5700X': 3
  };


  /*
    Resolution determines how heavily we value the GPU.
  */

  const resolutionWeight = {
    '1080p': 1,
    '1440p': 1.25,
    '4K': 1.55
  };


  /*
    Minimum PSU requirements.
  */

  function requiredWattage(gpu) {

    if (gpu.tier === 'enthusiast') return 750;
    if (gpu.tier === 'high') return 650;
    if (gpu.tier === 'mid') return 550;

    return 500;
  }


  /*
    Build every possible compatible combination.

    With our current catalogue this is small enough
    to calculate instantly.
  */

  let candidates = [];


  for (const cpu of cpus) {

    for (const gpu of gpus) {

      for (const ram of rams) {

        for (const ssd of ssds) {

          for (const board of boards) {

            for (const psu of psus) {

              /*
                Compatibility checks
              */

              if (cpu.socket !== board.socket) continue;

              if (cpu.memory !== ram.memory) continue;

              if (board.memory !== ram.memory) continue;

              if (psu.wattage < requiredWattage(gpu)) {
                continue;
              }


              const parts = [
                cpu,
                gpu,
                ram,
                ssd,
                board,
                psu
              ];


              const total = parts.reduce(
                (sum, p) => sum + p.bestOffer.price,
                0
              );


              /*
                Never recommend a build over budget.
              */

              if (total > budget) continue;


              const remaining = budget - total;


              /*
                Build quality score.

                GPU matters most for gaming.
                CPU matters next.
                1TB storage gets a small bonus.
                32GB gets a small bonus.
              */

              let score = 0;


              score +=
                gpuScore[gpu.tier] *
                1000 *
                resolutionWeight[resolution];


              score +=
                (cpuScore[cpu.name] || 1) *
                500;


              if (ssd.capacity >= 1000) {
                score += 150;
              }


              if (ram.capacity >= 32) {
                score += 100;
              }


              /*
                Value builds should not waste money.

                We give a small bonus for getting
                closer to the user's budget.
              */

              if (priority === 'value') {

                score += Math.min(
                  remaining,
                  1500
                ) * -0.15;

              }


              /*
                Performance priority favours stronger GPUs.
              */

              if (priority === 'performance') {

                score +=
                  gpuScore[gpu.tier] * 500;

              }


              /*
                Balanced sits between the two.
              */

              if (priority === 'balanced') {

                score +=
                  gpuScore[gpu.tier] * 250;

                score +=
                  (cpuScore[cpu.name] || 1) * 150;
              }


              candidates.push({
                parts,
                total,
                remaining,
                score
              });

            }
          }
        }
      }
    }
  }


  /*
    If absolutely nothing fits,
    tell the user instead of producing nonsense.
  */

  if (!candidates.length) {

    result.innerHTML = `
      <div class="buildResultHead">
        <div>
          <small>NO COMPLETE BUILD FOUND</small>
          <h3>${gameNames[game]} · ${resolution}</h3>
        </div>
      </div>

      <p class="muted">
        The current catalogue does not contain enough
        compatible components to build a complete PC
        within ${money(budget)}.
      </p>
    `;

    result.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    return;
  }


  /*
    Highest-scoring build wins.
  */

  candidates.sort(
    (a, b) => b.score - a.score
  );


  const build = candidates[0];

  const remaining = build.remaining;


  /*
    Display the final build.
  */

  result.innerHTML = `
    <div class="buildResultHead">

      <div>
        <small>RECOMMENDED BUILD</small>
        <h3>
          ${gameNames[game]} · ${resolution}
        </h3>
      </div>

      <div class="buildTotal">
        <small>TOTAL</small>
        <strong>${money(build.total)}</strong>
      </div>

    </div>


    <div class="buildParts">

      ${build.parts.map(p => `
        <div class="buildPart">

          <div>
            <small>${p.category}</small>
            <b>${p.name}</b>
          </div>

          <strong>
            ${money(p.bestOffer.price)}
          </strong>

        </div>
      `).join('')}

    </div>


    <div class="buildSummary">

      <span>
        Budget:
        <b>${money(budget)}</b>
      </span>

      <span>
        ${remaining >= 0
          ? 'Remaining ' + money(remaining)
          : 'Over budget by ' + money(Math.abs(remaining))}
      </span>

      <span>
        Priority:
        <b>${priority}</b>
      </span>

    </div>


    <p class="muted">
      Build selected from the current PCDealFinder
      catalogue using budget, resolution, priority
      and component compatibility.
      Prices and compatibility should be verified
      before purchase.
    </p>
  `;


  result.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}
