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

  const budgetInput =
    document.getElementById('buildBudget');

  const gameInput =
    document.getElementById('buildGame');

  const resolutionInput =
    document.getElementById('buildResolution');

  const priorityInput =
    document.getElementById('buildPriority');

  const result =
    document.getElementById('buildResult');


  if (!result) {
    console.error('buildResult element not found.');
    return;
  }


  const budget =
    Number(budgetInput?.value || 0);

  const game =
    gameInput?.value || 'general';

  const resolution =
    resolutionInput?.value || '1080p';

  const priority =
    priorityInput?.value || 'balanced';


  /* =====================================================
     VALIDATE BUDGET
  ===================================================== */

  if (!budget || budget <= 0) {

    result.innerHTML = `
      <div class="buildResultHead">

        <div>

          <small>
            INVALID BUDGET
          </small>

          <h3>
            Enter a valid budget
          </h3>

        </div>

      </div>

      <p class="muted">
        Enter the amount you want to spend on the PC,
        then try again.
      </p>
    `;

    result.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    return;
  }


  /* =====================================================
     GAME NAMES
  ===================================================== */

  const gameNames = {

    fortnite:
      'Fortnite',

    warzone:
      'Call of Duty: Warzone',

    gta:
      'GTA V',

    cyberpunk:
      'Cyberpunk 2077',

    general:
      'General Gaming'

  };


  /* =====================================================
     BUILD COMPONENT DATABASE
  ===================================================== */

  const cpus = products
    .filter(p =>
      p.category === 'CPU'
    )
    .map(withOffer)
    .filter(p =>
      Number.isFinite(productPrice(p))
    );


  const gpus = products
    .filter(p =>
      p.category === 'GPU'
    )
    .map(withOffer)
    .filter(p =>
      Number.isFinite(productPrice(p))
    );


  const rams = products
    .filter(p =>
      p.category === 'RAM'
    )
    .map(withOffer)
    .filter(p =>
      Number.isFinite(productPrice(p))
    );


  const ssds = products
    .filter(p =>
      p.category === 'SSD'
    )
    .map(withOffer)
    .filter(p =>
      Number.isFinite(productPrice(p))
    );


  const boards = products
    .filter(p =>
      p.category === 'Motherboard'
    )
    .map(withOffer)
    .filter(p =>
      Number.isFinite(productPrice(p))
    );


  const psus = products
    .filter(p =>
      p.category === 'PSU'
    )
    .map(withOffer)
    .filter(p =>
      Number.isFinite(productPrice(p))
    );


  /* =====================================================
     BASIC CATALOGUE CHECK
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

          <small>
            BUILD DATA INCOMPLETE
          </small>

          <h3>
            More components are needed
          </h3>

        </div>

      </div>

      <p class="muted">
        PCDealFinder needs at least one CPU, GPU, RAM,
        SSD, motherboard and PSU in the catalogue before
        it can generate a complete build.
      </p>

    `;

    result.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    return;
  }


  /* =====================================================
     PERFORMANCE TIERS
  ===================================================== */

  const tierScore = {

    entry: 1,

    mid: 2,

    high: 3,

    enthusiast: 4

  };


  function getGpuScore(gpu) {

    return tierScore[gpu.tier] || 1;

  }


  /* =====================================================
     CPU PERFORMANCE
  ===================================================== */

  function getCpuScore(cpu) {

    const name =
      String(cpu.name || '').toLowerCase();


    if (
      name.includes('ryzen 7') ||
      name.includes('i7') ||
      name.includes('i9')
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
     RESOLUTION WEIGHTS
  ===================================================== */

  const resolutionWeight = {

    '1080p': 1,

    '1440p': 1.25,

    '4K': 1.55

  };


  const gpuWeight =
    resolutionWeight[resolution] || 1;


  /* =====================================================
     PSU REQUIREMENTS
  ===================================================== */

  function requiredWattage(gpu) {

    const tier =
      getGpuScore(gpu);


    if (tier >= 4) return 850;

    if (tier === 3) return 650;

    if (tier === 2) return 550;

    return 500;

  }


  /* =====================================================
     RAM SCORE
  ===================================================== */

  function getRamScore(ram) {

    const capacity =
      Number(ram.capacity || 0);


    if (capacity >= 32) return 3;

    if (capacity >= 16) return 2;

    return 1;

  }


  /* =====================================================
     SSD SCORE
  ===================================================== */

  function getSsdScore(ssd) {

    const capacity =
      Number(ssd.capacity || 0);


    if (capacity >= 2000) return 3;

    if (capacity >= 1000) return 2;

    if (capacity >= 500) return 1;

    return 0;

  }


  /* =====================================================
     COMPATIBILITY
  ===================================================== */

  function compatible(cpu, board, ram) {

    /* CPU socket */

    if (
      cpu.socket &&
      board.socket &&
      cpu.socket !== board.socket
    ) {
      return false;
    }


    /* Memory */

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


              /* Compatibility */

              if (
                !compatible(
                  cpu,
                  board,
                  ram
                )
              ) {
                continue;
              }


              /* PSU */

              if (
                Number(psu.wattage || 0) <
                requiredWattage(gpu)
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
                    sum + productPrice(part),
                  0
                );


              /* Never exceed budget */

              if (total > budget) {
                continue;
              }


              const remaining =
                budget - total;


              /* =================================================
                 SCORE
              ================================================= */

              let score = 0;


              /*
                GPU is the most important component
                for a gaming PC.
              */

              score +=
                getGpuScore(gpu) *
                1000 *
                gpuWeight;


              /*
                CPU is second.
              */

              score +=
                getCpuScore(cpu) *
                450;


              /*
                RAM.
              */

              score +=
                getRamScore(ram) *
                100;


              /*
                Storage.
              */

              score +=
                getSsdScore(ssd) *
                60;


              /* =================================================
                 PRIORITY
              ================================================= */

              if (
                priority === 'performance'
              ) {

                score +=
                  getGpuScore(gpu) *
                  700;

                score +=
                  getCpuScore(cpu) *
                  300;

              }


              if (
                priority === 'balanced'
              ) {

                score +=
                  getGpuScore(gpu) *
                  350;

                score +=
                  getCpuScore(cpu) *
                  250;

              }


              if (
                priority === 'value'
              ) {

                /*
                  Value builds prefer getting close
                  to the budget without wasting money.
                */

                const budgetUse =
                  total / budget;


                score +=
                  budgetUse * 500;


                score -=
                  remaining * 0.1;

              }


              /* =================================================
                 GAME-SPECIFIC ADJUSTMENTS
              ================================================= */

              if (
                game === 'fortnite'
              ) {

                /*
                  Fortnite benefits strongly from
                  GPU + CPU balance.
                */

                score +=
                  getCpuScore(cpu) *
                  150;

              }


              if (
                game === 'warzone'
              ) {

                score +=
                  getGpuScore(gpu) *
                  200;

                score +=
                  getRamScore(ram) *
                  80;

              }


              if (
                game === 'cyberpunk'
              ) {

                score +=
                  getGpuScore(gpu) *
                  350;

              }


              if (
                game === 'gta'
              ) {

                score +=
                  getGpuScore(gpu) *
                  180;

              }


              /* =================================================
                 BUDGET EFFICIENCY
              ================================================= */

              /*
                Don't automatically choose a build
                that leaves half the budget unused.
              */

              const budgetEfficiency =
                total / budget;


              score +=
                budgetEfficiency * 250;


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
            ${gameNames[game] || 'Gaming'} · ${resolution}
          </h3>

        </div>

      </div>


      <p class="muted">

        The current PCDealFinder catalogue does not
        contain a compatible combination that fits
        within ${money(budget)}.

        Try increasing your budget or adding more
        components to the catalogue.

      </p>

    `;

    result.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    return;
  }


  /* =====================================================
     PICK BEST BUILD
  ===================================================== */

  candidates.sort(
    (a, b) => b.score - a.score
  );


  const build =
    candidates[0];


  /* =====================================================
     LABEL PRIORITY
  ===================================================== */

  const priorityNames = {

    performance:
      'Maximum Performance',

    balanced:
      'Balanced',

    value:
      'Best Value'

  };


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
          · ${resolution}
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

      ${build.parts.map(part => `

        <div class="buildPart">

          <div>

            <small>
              ${part.category || 'COMPONENT'}
            </small>

            <b>
              ${part.name || 'Unnamed component'}
            </b>

          </div>


          <strong>
            ${money(productPrice(part))}
          </strong>

        </div>

      `).join('')}

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
          build.remaining > 0
            ? 'Remaining ' +
              money(build.remaining)

            : build.remaining === 0
              ? 'Budget fully used'

              : 'Over budget by ' +
                money(Math.abs(build.remaining))
        }

      </span>


      <span>

        Priority:
        <b>
          ${
            priorityNames[priority] ||
            priority
          }
        </b>

      </span>

    </div>


    <p class="muted">

      Recommended for
      ${gameNames[game] || 'general gaming'}
      at ${resolution}.

      Components were selected from the current
      PCDealFinder catalogue using compatibility,
      budget and performance priorities.

      Prices and compatibility should always be
      verified before purchasing.

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
