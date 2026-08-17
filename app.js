let products = [];

/* =========================================================
   MONEY
========================================================= */

const money = n =>
  'R' + Number(n || 0).toLocaleString('en-ZA');


/* =========================================================
   LOAD PRODUCT DATA
========================================================= */

fetch('data.json')
  .then(r => {
    if (!r.ok) {
      throw new Error('Could not load data.json');
    }

    return r.json();
  })
  .then(data => {
    products = Array.isArray(data) ? data : [];

    render(products);
  })
  .catch(error => {
    console.error('PCDealFinder data error:', error);

    const box = document.getElementById('results');

    if (box) {
      box.innerHTML = `
        <p class="muted">
          Product data could not be loaded.
        </p>
      `;
    }
  });


/* =========================================================
   PRODUCT HELPERS
========================================================= */

function bestOffer(product) {

  if (!product.offers || !product.offers.length) {
    return {
      price: Infinity,
      retailer: 'Unavailable',
      stock: 'Unknown',
      url: '#'
    };
  }

  return [...product.offers]
    .sort((a, b) => Number(a.price) - Number(b.price))[0];
}


function productPrice(product) {
  return Number(bestOffer(product).price);
}


function withOffer(product) {
  return {
    ...product,
    bestOffer: bestOffer(product)
  };
}


/* =========================================================
   PRODUCT SEARCH / RESULTS
========================================================= */

function render(list) {

  const box = document.getElementById('results');

  if (!box) return;

  box.innerHTML = '';

  const count = document.getElementById('count');

  if (count) {
    count.textContent =
      list.length +
      ' product' +
      (list.length === 1 ? '' : 's');
  }

  if (!list.length) {

    box.innerHTML = `
      <p class="muted">
        No products found.
      </p>
    `;

    return;
  }


  list.forEach(p => {

    const offers = [...(p.offers || [])]
      .sort((a, b) => Number(a.price) - Number(b.price));

    if (!offers.length) return;

    const low = Number(offers[0].price);
    const high = Number(offers[offers.length - 1].price);

    const el = document.createElement('article');

    el.className = 'product';

    el.innerHTML = `
      <div class="productHead">

        <div>

          <div class="tag">
            ${p.category || 'PRODUCT'}
          </div>

          <h3>
            ${p.name || 'Unnamed product'}
          </h3>

          <div class="mpn">
            ${p.mpn || ''}
          </div>

        </div>


        <div class="best">

          <small>
            BEST LISTED PRICE
          </small>

          <strong>
            ${money(low)}
          </strong>

          <div class="save">

            ${
              high > low
                ? 'Save ' +
                  money(high - low) +
                  ' vs highest listing'
                : 'Lowest listed offer'
            }

          </div>

        </div>

      </div>


      <div class="offers">

        ${offers.map((o, i) => `

          <div class="offer">

            <div>

              <b>
                ${i === 0 ? '🏆 ' : ''}
                ${o.retailer || 'Retailer'}
              </b>

              <small>
                ● ${o.stock || 'Stock unknown'}
              </small>

            </div>


            <div>

              <div class="price">
                ${money(o.price)}
              </div>

              ${
                o.url
                  ? `
                    <a
                      href="${o.url}"
                      target="_blank"
                      rel="noopener"
                    >
                      View deal
                    </a>
                  `
                  : ''
              }

            </div>

          </div>

        `).join('')}

      </div>
    `;

    box.appendChild(el);

  });
}


/* =========================================================
   SEARCH
========================================================= */

function search(q) {

  const input = document.getElementById('q');

  if (input) {
    input.value = q;
  }

  const x = (q || '').trim().toLowerCase();

  const filtered = x
    ? products.filter(p => {

        const searchable = [
          p.name,
          p.category,
          p.mpn,
          p.socket,
          p.memory,
          p.capacity
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(x);

      })
    : products;


  render(filtered);


  const compare = document.getElementById('compare');

  if (compare) {

    compare.scrollIntoView({
      behavior: 'smooth'
    });

  }
}


function runSearch() {

  const input = document.getElementById('q');

  search(input ? input.value : '');

}


function focusSearch() {

  const input = document.getElementById('q');

  if (input) {
    input.focus();
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


const searchInput = document.getElementById('q');

if (searchInput) {

  searchInput.addEventListener(
    'keydown',
    e => {

      if (e.key === 'Enter') {
        runSearch();
      }

    }
  );

}

/* =========================================================
   PC BUILDER
========================================================= */

function generateBuild() {

  const budget = Number(
    document.getElementById('buildBudget')?.value || 0
  );

  const game =
    document.getElementById('buildGame')?.value || 'general';

  const resolution =
    document.getElementById('buildResolution')?.value || '1080p';

  const priority =
    document.getElementById('buildPriority')?.value || 'value';

  const result =
    document.getElementById('buildResult');

  if (!result) return;


  /* =====================================================
     MONEY
  ===================================================== */

  const money = n =>
    'R' + Number(n || 0).toLocaleString('en-ZA');


  /* =====================================================
     VALIDATE BUDGET
  ===================================================== */

  if (!budget || budget <= 0) {

    result.innerHTML = `
      <div class="buildResultHead">
        <div>
          <small>INVALID BUDGET</small>
          <h3>Enter a valid budget</h3>
        </div>
      </div>

      <p class="muted">
        Choose a budget and try again.
      </p>
    `;

    return;
  }


  /* =====================================================
     LABELS
  ===================================================== */

  const gameNames = {
    fortnite: 'Fortnite',
    warzone: 'Call of Duty: Warzone',
    gta: 'GTA V',
    cyberpunk: 'Cyberpunk 2077',
    general: 'General Gaming'
  };


  const resolutionNames = {
    '1080p': '1080p',
    '1440p': '1440p',
    '4k': '4K'
  };


  const priorityNames = {
    fps: 'Best FPS',
    value: 'Best Value',
    balanced: 'Balanced'
  };


  /* =====================================================
     PREPARE PRODUCTS
  ===================================================== */

  const cheapest = product => {

    if (!product.offers?.length) {
      return null;
    }

    return product.offers.reduce(
      (best, offer) =>
        Number(offer.price) < Number(best.price)
          ? offer
          : best
    );

  };


  const prepare = category =>

    products
      .filter(p => p.category === category)
      .map(p => ({
        ...p,
        bestOffer: cheapest(p)
      }))
      .filter(p => p.bestOffer);


  const cpus = prepare('CPU');
  const gpus = prepare('GPU');
  const rams = prepare('RAM');
  const ssds = prepare('SSD');
  const boards = prepare('Motherboard');
  const psus = prepare('PSU');


  /* =====================================================
     CHECK CATALOGUE
  ===================================================== */

  if (
    !cpus.length ||
    !gpus.length ||
    !rams.length ||
    !ssds.length ||
    !boards.length ||
    !psus.length
  ) {

    result.innerHTML = `
      <div class="buildResultHead">

        <div>
          <small>BUILD DATA INCOMPLETE</small>
          <h3>More components are needed</h3>
        </div>

      </div>

      <p class="muted">
        The catalogue needs a CPU, GPU, RAM, SSD,
        motherboard and PSU before a complete build
        can be generated.
      </p>
    `;

    return;
  }


  /* =====================================================
     GPU PERFORMANCE
  ===================================================== */

  const gpuTier = {
    entry: 1,
    mid: 2,
    high: 3,
    enthusiast: 4
  };


  function gpuScore(gpu) {
    return gpuTier[gpu.tier] || 1;
  }


  /* =====================================================
     CPU PERFORMANCE
  ===================================================== */

  function cpuScore(cpu) {

    const name =
      String(cpu.name || '').toLowerCase();


    if (
      name.includes('ryzen 9') ||
      name.includes('ryzen 7') ||
      name.includes('i9') ||
      name.includes('i7')
    ) {
      return 4;
    }


    if (
      name.includes('ryzen 5') ||
      name.includes('i5')
    ) {
      return 3;
    }


    if (
      name.includes('ryzen 3') ||
      name.includes('i3')
    ) {
      return 2;
    }


    return 1;
  }


  /* =====================================================
     RAM
  ===================================================== */

  function ramScore(ram) {

    const capacity =
      Number(ram.capacity || 0);


    if (capacity >= 32) return 3;

    if (capacity >= 16) return 2;

    return 1;
  }


  /* =====================================================
     SSD
  ===================================================== */

  function ssdScore(ssd) {

    const capacity =
      Number(ssd.capacity || 0);


    if (capacity >= 2000) return 3;

    if (capacity >= 1000) return 2;

    if (capacity >= 500) return 1;

    return 0;
  }


  /* =====================================================
     RESOLUTION
  ===================================================== */

  const resolutionWeight = {

    '1080p': 1,

    '1440p': 1.35,

    '4k': 1.75

  };


  const gpuWeight =
    resolutionWeight[resolution] || 1;


  /* =====================================================
     PSU REQUIREMENT
  ===================================================== */

  function requiredPSU(gpu) {

    const score =
      gpuScore(gpu);


    if (score >= 4) return 750;

    if (score >= 3) return 650;

    if (score >= 2) return 550;

    return 500;
  }


  /* =====================================================
     COMPATIBILITY
  ===================================================== */

  function compatible(cpu, board, ram) {

    if (
      cpu.socket &&
      board.socket &&
      cpu.socket !== board.socket
    ) {
      return false;
    }


    if (
      cpu.memory &&
      ram.memory &&
      cpu.memory !== ram.memory
    ) {
      return false;
    }


    if (
      board.memory &&
      ram.memory &&
      board.memory !== ram.memory
    ) {
      return false;
    }


    return true;
  }


  /* =====================================================
     BUILD CANDIDATES
  ===================================================== */

  const candidates = [];


  for (const cpu of cpus) {

    for (const gpu of gpus) {

      for (const ram of rams) {

        for (const ssd of ssds) {

          for (const board of boards) {

            for (const psu of psus) {


              /* CPU / motherboard / RAM */

              if (
                !compatible(
                  cpu,
                  board,
                  ram
                )
              ) {
                continue;
              }


              /* Minimum 16GB RAM */

              if (
                Number(ram.capacity || 0) < 16
              ) {
                continue;
              }


              /* PSU */

              if (
                Number(psu.wattage || 0) <
                requiredPSU(gpu)
              ) {
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


              const total =
                parts.reduce(
                  (sum, part) =>
                    sum +
                    Number(part.bestOffer.price),
                  0
                );


              /* Don't exceed budget */

              if (total > budget) {
                continue;
              }


              const remaining =
                budget - total;


              /* =================================================
                 BASE SCORE
              ================================================= */

              let score = 0;


              /* GPU */

              score +=
                gpuScore(gpu) *
                1500 *
                gpuWeight;


              /* CPU */

              score +=
                cpuScore(cpu) *
                500;


              /* RAM */

              score +=
                ramScore(ram) *
                100;


              /* SSD */

              score +=
                ssdScore(ssd) *
                60;


              /* =================================================
                 PRIORITY
              ================================================= */

              if (priority === 'fps') {

                score +=
                  gpuScore(gpu) *
                  1200;

                score +=
                  cpuScore(cpu) *
                  450;
              }


              if (priority === 'balanced') {

                score +=
                  gpuScore(gpu) *
                  500;

                score +=
                  cpuScore(cpu) *
                  400;

                score +=
                  ramScore(ram) *
                  150;
              }


              if (priority === 'value') {

                const budgetUsed =
                  total / budget;


                score +=
                  budgetUsed * 800;


                score -=
                  remaining * 0.15;
              }


              /* =================================================
                 GAME-SPECIFIC
              ================================================= */

              if (game === 'fortnite') {

                score +=
                  cpuScore(cpu) *
                  300;

                score +=
                  gpuScore(gpu) *
                  200;
              }


              if (game === 'warzone') {

                score +=
                  gpuScore(gpu) *
                  350;

                score +=
                  ramScore(ram) *
                  200;
              }


              if (game === 'gta') {

                score +=
                  gpuScore(gpu) *
                  300;
              }


              if (game === 'cyberpunk') {

                score +=
                  gpuScore(gpu) *
                  600;
              }


              /* =================================================
                 BUDGET EFFICIENCY
              ================================================= */

              const efficiency =
                total / budget;


              score +=
                efficiency * 300;


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


  /* =====================================================
     NO BUILD
  ===================================================== */

  if (!candidates.length) {

    result.innerHTML = `

      <div class="buildResultHead">

        <div>

          <small>
            NO COMPLETE BUILD FOUND
          </small>

          <h3>
            ${gameNames[game] || 'Gaming'}
            ·
            ${resolutionNames[resolution] || resolution}
          </h3>

        </div>

      </div>


      <p class="muted">

        PCDealFinder could not find a compatible
        gaming PC within ${money(budget)} using
        the current catalogue.

        Try increasing the budget or adding more
        affordable components.

      </p>

    `;

    result.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    return;
  }


  /* =====================================================
     SELECT BEST BUILD
  ===================================================== */

  candidates.sort(
    (a, b) =>
      b.score - a.score
  );


  const build =
    candidates[0];


  /* =====================================================
     RENDER BUILD
  ===================================================== */

  result.innerHTML = `

    <div class="buildResultHead">

      <div>

        <small>
          RECOMMENDED BUILD
        </small>

        <h3>
          ${gameNames[game] || 'General Gaming'}
          ·
          ${resolutionNames[resolution] || resolution}
        </h3>

      </div>


      <div class="buildTotal">

        <small>
          TOTAL
        </small>

        <strong>
          ${money(build.total)}
        </strong>

      </div>

    </div>


    <div class="buildParts">

      ${build.parts.map(part => {

        const offer =
          part.bestOffer;


        return `

          <div class="buildPart">

            <div>

              <small>
                ${part.category || 'COMPONENT'}
              </small>

              <b>
                ${part.name || 'Unnamed component'}
              </b>

              <small>
                Best: ${offer.retailer || 'Retailer'}
              </small>

            </div>


            <strong>
              ${money(offer.price)}
            </strong>

          </div>

        `;

      }).join('')}

    </div>


    <div class="buildSummary">

      <span>

        Budget:

        <b>
          ${money(budget)}
        </b>

      </span>


      <span>

        ${
          build.remaining === 0
            ? 'Budget fully used'
            : 'Remaining ' +
              money(build.remaining)
        }

      </span>


      <span>

        Priority:

        <b>
          ${priorityNames[priority] || priority}
        </b>

      </span>

    </div>


    <p class="muted">

      Built for
      <b>${gameNames[game] || 'General Gaming'}</b>
      at
      <b>${resolutionNames[resolution] || resolution}</b>.

      PCDealFinder prioritised GPU performance,
      CPU balance, component compatibility and
      your selected budget strategy.

      Prices are based on the current catalogue and
      should be verified before purchase.

    </p>

  `;


  /* =====================================================
     SCROLL TO RESULT
  ===================================================== */

  result.scrollIntoView({

    behavior: 'smooth',

    block: 'start'

  });

}

/* =========================================================
   AI PC BUILDER
========================================================= */

async function askPCDealFinderAI() {

  const budget =
    Number(document.getElementById('buildBudget')?.value || 0);

  const game =
    document.getElementById('buildGame')?.value || 'general';

  const resolution =
    document.getElementById('buildResolution')?.value || '1080p';

  const priority =
    document.getElementById('buildPriority')?.value || 'value';

  const result =
    document.getElementById('buildResult');

  if (!result) return;

  if (!budget || budget <= 0) {
    result.innerHTML = `
      <p class="muted">
        Please choose a valid budget first.
      </p>
    `;
    return;
  }

  result.innerHTML = `
    <div class="buildResultHead">
      <div>
        <small>PCDEALFINDER AI</small>
        <h3>Thinking about your build...</h3>
      </div>
    </div>

    <p class="muted">
      Analysing your budget, game, resolution and available hardware.
    </p>
  `;

  try {

    const response = await fetch(
      'https://pcdealfinder-ai.liamvandermerwe961.workers.dev',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          budget,
          game,
          resolution,
          priority,

          products

        })

      }
    );

    if (!response.ok) {
      throw new Error('AI request failed');
    }

    const data = await response.json();

    if (!data || !data.answer) {
      throw new Error('Invalid AI response');
    }

    result.innerHTML = `
      <div class="buildResultHead">

        <div>
          <small>PCDEALFINDER AI</small>

          <h3>
            AI Recommendation
          </h3>
        </div>

      </div>

      <div class="aiAnswer">
        ${data.answer}
      </div>
    `;

  } catch (error) {

    console.error(
      'PCDealFinder AI error:',
      error
    );

    result.innerHTML = `
      <div class="buildResultHead">

        <div>
          <small>AI UNAVAILABLE</small>

          <h3>
            Using PCDealFinder's normal builder
          </h3>

        </div>

      </div>

      <p class="muted">
        The AI assistant could not be reached,
        so we're generating your build normally.
      </p>
    `;

    generateBuild();

  }

}     
