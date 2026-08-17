let products = [];

/* =========================================================
   CONFIG
========================================================= */

const AI_WORKER_URL =
  'https://pcdealfinder-ai.liamvandermerwe961.workers.dev';


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
        <div class="emptyState">
          <div class="emptyIcon">⚠</div>
          <h3>Product data could not be loaded</h3>
          <p>Please check that data.json is in the same folder as the website.</p>
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

  input.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

}


function runSearch() {

  const input = document.getElementById('q');

  if (!input) return;

  search(input.value);

}


function search(query) {

  const value =
    String(query || '')
      .trim()
      .toLowerCase();

  const input =
    document.getElementById('q');

  if (input && query) {
    input.value = query;
  }

  if (!value) {

    render(products);

    document
      .getElementById('compare')
      ?.scrollIntoView({
        behavior: 'smooth'
      });

    return;
  }


  const results =
    products.filter(product => {

      const searchable = [

        product.name,
        product.category,
        product.mpn,
        product.socket,
        product.memory,
        product.tier

      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();


      return searchable.includes(value);

    });


  render(results);


  document
    .getElementById('compare')
    ?.scrollIntoView({
      behavior: 'smooth'
    });

}


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
    .sort(
      (a, b) =>
        Number(a.price) - Number(b.price)
    )[0];

}


function productPrice(product) {

  return Number(
    bestOffer(product).price
  );

}


function withOffer(product) {

  return {
    ...product,
    bestOffer: bestOffer(product)
  };

}


/* =========================================================
   PRODUCT RENDERING
========================================================= */

function render(list) {

  const box =
    document.getElementById('results');

  if (!box) return;

  box.innerHTML = '';


  const count =
    document.getElementById('count');


  if (count) {

    count.textContent =
      list.length +
      ' product' +
      (list.length === 1 ? '' : 's');

  }


  if (!list.length) {

    box.innerHTML = `

      <div class="emptyState">

        <div class="emptyIcon">
          ⌕
        </div>

        <h3>
          No products found
        </h3>

        <p>
          Try searching for a CPU, GPU, RAM,
          SSD, motherboard or PSU.
        </p>

      </div>

    `;

    return;

  }


  list.forEach(p => {

    const offers =
      [...(p.offers || [])]
        .filter(
          o =>
            Number.isFinite(
              Number(o.price)
            )
        )
        .sort(
          (a, b) =>
            Number(a.price) -
            Number(b.price)
        );


    if (!offers.length) return;


    const best = offers[0];

    const low =
      Number(best.price);


    const high =
      Number(
        offers[
          offers.length - 1
        ].price
      );


    const savings =
      high > low
        ? high - low
        : 0;


    const el =
      document.createElement('article');


    el.className = 'product';


    el.innerHTML = `

      <div class="productVisual">

        <div class="productGlow"></div>

        <div class="productPlaceholder">

          <span>
            ${getProductIcon(p.category)}
          </span>

        </div>

        <div class="dealBadge">
          🏆 BEST DEAL
        </div>

      </div>


      <div class="productContent">

        <div class="productTop">

          <div class="productInfo">

            <div class="tag">
              ${p.category || 'PRODUCT'}
            </div>

            <h3>
              ${p.name || 'Unnamed product'}
            </h3>

            ${
              p.mpn
                ? `
                  <div class="mpn">
                    MPN: ${p.mpn}
                  </div>
                `
                : ''
            }

          </div>


          <div class="bestPrice">

            <small>
              LOWEST PRICE
            </small>

            <strong>
              ${money(low)}
            </strong>

            ${
              savings > 0
                ? `
                  <span>
                    Save ${money(savings)}
                  </span>
                `
                : `
                  <span>
                    Best listed price
                  </span>
                `
            }

          </div>

        </div>


        <div class="productSpecs">

          ${
            p.socket
              ? `
                <div>
                  <small>SOCKET</small>
                  <b>${p.socket}</b>
                </div>
              `
              : ''
          }


          ${
            p.memory
              ? `
                <div>
                  <small>MEMORY</small>
                  <b>${p.memory}</b>
                </div>
              `
              : ''
          }


          ${
            p.capacity
              ? `
                <div>
                  <small>CAPACITY</small>
                  <b>${p.capacity}GB</b>
                </div>
              `
              : ''
          }


          ${
            p.wattage
              ? `
                <div>
                  <small>POWER</small>
                  <b>${p.wattage}W</b>
                </div>
              `
              : ''
          }


          ${
            p.tier
              ? `
                <div>
                  <small>PERFORMANCE</small>
                  <b>${capitalize(p.tier)}</b>
                </div>
              `
              : ''
          }

        </div>


        <div class="offerTitle">

          <span>
            RETAILER OFFERS
          </span>

          <span>
            ${offers.length}
            ${offers.length === 1
              ? 'offer'
              : 'offers'}
          </span>

        </div>


        <div class="offers">

          ${offers.map((o, i) => `

            <div class="offer">

              <div class="retailerInfo">

                <div class="retailerLogo">
                  ${getRetailerInitial(
                    o.retailer
                  )}
                </div>

                <div>

                  <b>
                    ${o.retailer || 'Retailer'}
                  </b>

                  <small>
                    <span class="stockDot"></span>
                    ${o.stock || 'Stock unknown'}
                  </small>

                </div>

              </div>


              <div class="offerRight">

                <div class="offerPrice">
                  ${money(o.price)}
                </div>

                ${
                  i === 0
                    ? `
                      <span class="lowestLabel">
                        LOWEST
                      </span>
                    `
                    : ''
                }


                ${
                  o.url
                    ? `
                      <a
                        class="dealButton"
                        href="${o.url}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Deal →
                      </a>
                    `
                    : ''
                }

              </div>

            </div>

          `).join('')}

        </div>


        <div class="productFooter">

          <span>
            💡 Prices shown are from the current catalogue
          </span>

          <span>
            Compare before buying
          </span>

        </div>

      </div>

    `;


    box.appendChild(el);

  });

}


/* =========================================================
   PC BUILDER
========================================================= */

function generateBuild() {

  const budget =
    Number(
      document.getElementById(
        'buildBudget'
      )?.value || 15000
    );


  const game =
    document.getElementById(
      'buildGame'
    )?.value || 'general';


  const resolution =
    document.getElementById(
      'buildResolution'
    )?.value || '1080p';


  const priority =
    document.getElementById(
      'buildPriority'
    )?.value || 'value';


  const result =
    document.getElementById(
      'buildResult'
    );


  if (!result) return;


  result.innerHTML = `

    <div class="buildResultHead">

      <div>

        <small>
          PCDEALFINDER RECOMMENDATION
        </small>

        <h3>
          Building your ${resolution} gaming PC
        </h3>

      </div>

      <div class="buildTotal">

        <small>
          TARGET BUDGET
        </small>

        <strong>
          ${money(budget)}
        </strong>

      </div>

    </div>

    <div class="buildParts">

      <div class="buildPart">
        <div>
          <small>STATUS</small>
          <b>Analysing catalogue...</b>
        </div>
      </div>

    </div>

  `;


  const build =
    createBuild(
      budget,
      game,
      resolution,
      priority
    );


  if (!build) {

    result.innerHTML += `

      <p class="muted">
        We couldn't create a compatible build
        from the current catalogue.
      </p>

    `;

    return;

  }


  const total =
    build.parts.reduce(
      (sum, part) =>
        sum + productPrice(part.product),
      0
    );


  result.innerHTML = `

    <div class="buildResultHead">

      <div>

        <small>
          PCDEALFINDER RECOMMENDATION
        </small>

        <h3>
          ${build.title}
        </h3>

      </div>

      <div class="buildTotal">

        <small>
          BUILD TOTAL
        </small>

        <strong>
          ${money(total)}
        </strong>

      </div>

    </div>


    <div class="buildParts">

      ${build.parts.map(part => `

        <div class="buildPart">

          <div>

            <small>
              ${part.category}
            </small>

            <b>
              ${part.product.name}
            </b>

          </div>

          <strong>
            ${money(
              productPrice(
                part.product
              )
            )}
          </strong>

        </div>

      `).join('')}

    </div>


    <div class="buildSummary">

      <span>
        🎮 Game:
        <b>${gameLabel(game)}</b>
      </span>

      <span>
        🖥️ Resolution:
        <b>${resolution}</b>
      </span>

      <span>
        💰 Budget:
        <b>${money(budget)}</b>
      </span>

      <span>
        📊 Priority:
        <b>${priorityLabel(priority)}</b>
      </span>

    </div>

  `;

}


/* =========================================================
   BUILD ALGORITHM
========================================================= */

function createBuild(
  budget,
  game,
  resolution,
  priority
) {

  const cpus =
    products.filter(
      p => p.category === 'CPU'
    );


  const gpus =
    products.filter(
      p => p.category === 'GPU'
    );


  const rams =
    products.filter(
      p => p.category === 'RAM'
    );


  const ssds =
    products.filter(
      p => p.category === 'SSD'
    );


  const motherboards =
    products.filter(
      p => p.category === 'Motherboard'
    );


  const psus =
    products.filter(
      p => p.category === 'PSU'
    );


  if (
    !cpus.length ||
    !gpus.length ||
    !rams.length ||
    !ssds.length ||
    !motherboards.length ||
    !psus.length
  ) {
    return null;
  }


  const gpuWeights = {

    '1080p': {
      entry: 1,
      mid: 2,
      high: 3,
      enthusiast: 4
    },

    '1440p': {
      entry: 1,
      mid: 3,
      high: 5,
      enthusiast: 7
    },

    '4k': {
      entry: 1,
      mid: 2,
      high: 5,
      enthusiast: 8
    }

  };


  const weight =
    gpuWeights[
      resolution
    ] || gpuWeights['1080p'];


  let gpuCandidates =
    [...gpus]
      .sort(
        (a, b) =>
          scoreGPU(
            b,
            weight,
            priority
          ) -
          scoreGPU(
            a,
            weight,
            priority
          )
      );


  let selectedGPU =
    gpuCandidates[0];


  if (!selectedGPU) return null;


  const cpuCandidates =
    cpus.filter(
      cpu =>
        cpu.socket ===
        selectedGPU.socket ||
        !selectedGPU.socket
    );


  const selectedCPU =
    chooseCPU(
      cpuCandidates,
      priority
    );


  const selectedRAM =
    chooseRAM(
      rams,
      selectedCPU
    );


  const selectedMB =
    chooseMotherboard(
      motherboards,
      selectedCPU,
      selectedRAM
    );


  const selectedSSD =
    chooseSSD(
      ssds,
      budget
    );


  const requiredWattage =
    Number(
      selectedGPU.wattage || 0
    ) + 250;


  const selectedPSU =
    psus
      .filter(
        p =>
          Number(
            p.wattage || 0
          ) >= requiredWattage
      )
      .sort(
        (a, b) =>
          productPrice(a) -
          productPrice(b)
      )[0] ||
    psus[0];


  const parts = [

    {
      category: 'CPU',
      product: selectedCPU
    },

    {
      category: 'GPU',
      product: selectedGPU
    },

    {
      category: 'RAM',
      product: selectedRAM
    },

    {
      category: 'Motherboard',
      product: selectedMB
    },

    {
      category: 'SSD',
      product: selectedSSD
    },

    {
      category: 'PSU',
      product: selectedPSU
    }

  ];


  let total =
    parts.reduce(
      (sum, part) =>
        sum +
        productPrice(
          part.product
        ),
      0
    );


  /*
    If the first build is over budget,
    downgrade the GPU until it fits.
  */

  if (total > budget) {

    const cheaperGPUs =
      [...gpus]
        .sort(
          (a, b) =>
            productPrice(a) -
            productPrice(b)
        );


    for (
      const gpu of cheaperGPUs
    ) {

      const newParts =
        parts.map(part =>
          part.category === 'GPU'
            ? {
                ...part,
                product: gpu
              }
            : part
        );


      const newTotal =
        newParts.reduce(
          (sum, part) =>
            sum +
            productPrice(
              part.product
            ),
          0
        );


      if (
        newTotal <= budget
      ) {

        return {

          title:
            buildTitle(
              game,
              resolution,
              priority
            ),

          parts:
            newParts

        };

      }

    }

  }


  return {

    title:
      buildTitle(
        game,
        resolution,
        priority
      ),

    parts

  };

}


/* =========================================================
   BUILDER HELPERS
========================================================= */

function scoreGPU(
  gpu,
  weight,
  priority
) {

  const tier =
    gpu.tier || 'entry';


  const tierScore =
    Number(
      weight[tier] || 1
    );


  const price =
    Math.max(
      productPrice(gpu),
      1
    );


  if (priority === 'fps') {

    return tierScore * 10000;

  }


  if (priority === 'balanced') {

    return (
      tierScore * 10000
    ) / price;

  }


  return (
    tierScore * 15000
  ) / price;

}


function chooseCPU(
  cpus,
  priority
) {

  if (!cpus.length) {
    return null;
  }


  return [...cpus]
    .sort((a, b) => {

      const priceA =
        productPrice(a);

      const priceB =
        productPrice(b);


      if (
        priority === 'fps'
      ) {

        return (
          priceB -
          priceA
        );

      }


      return (
        priceA -
        priceB
      );

    })[0];

}


function chooseRAM(
  rams,
  cpu
) {

  const compatible =
    rams.filter(
      r =>
        !cpu.memory ||
        !r.memory ||
        r.memory === cpu.memory
    );


  return (
    compatible
      .filter(
        r =>
          Number(
            r.capacity || 0
          ) >= 16
      )
      .sort(
        (a, b) =>
          productPrice(a) -
          productPrice(b)
      )[0]
  ) ||
  compatible[0] ||
  rams[0];

}


function chooseMotherboard(
  boards,
  cpu,
  ram
) {

  const compatible =
    boards.filter(
      b =>

        (!cpu.socket ||
          !b.socket ||
          b.socket === cpu.socket)

        &&

        (!ram.memory ||
          !b.memory ||
          b.memory === ram.memory)

    );


  return (
    compatible
      .sort(
        (a, b) =>
          productPrice(a) -
          productPrice(b)
      )[0]
  ) ||
  boards[0];

}


function chooseSSD(
  ssds,
  budget
) {

  const preferred =
    ssds.filter(
      s =>
        Number(
          s.capacity || 0
        ) >= 1000
    );


  return (
    preferred
      .sort(
        (a, b) =>
          productPrice(a) -
          productPrice(b)
      )[0]
  ) ||
  ssds[0];

}


function buildTitle(
  game,
  resolution,
  priority
) {

  return `
    ${resolution}
    ${gameLabel(game)}
    ${priorityLabel(priority)}
    Build
  `.trim();

}


function gameLabel(game) {

  const labels = {

    fortnite: 'Fortnite',

    warzone: 'Call of Duty: Warzone',

    gta: 'GTA V',

    cyberpunk: 'Cyberpunk 2077',

    general: 'Gaming'

  };


  return (
    labels[game] ||
    'Gaming'
  );

}


function priorityLabel(
  priority
) {

  const labels = {

    fps: 'Maximum FPS',

    value: 'Best Value',

    balanced: 'Balanced'

  };


  return (
    labels[priority] ||
    'Best Value'
  );

}


/* =========================================================
   PCDEALFINDER AI
========================================================= */

async function askPCDealFinderAI() {

  const result =
    document.getElementById(
      'buildResult'
    );


  if (!result) return;


  const budget =
    Number(
      document.getElementById(
        'buildBudget'
      )?.value || 15000
    );


  const game =
    document.getElementById(
      'buildGame'
    )?.value || 'general';


  const resolution =
    document.getElementById(
      'buildResolution'
    )?.value || '1080p';


  const priority =
    document.getElementById(
      'buildPriority'
    )?.value || 'value';


  result.innerHTML = `

    <div class="aiAnswer">

      <strong>
        ✨ PCDealFinder AI
      </strong>

      <p>
        Analysing your build...
      </p>

      <p class="muted">
        Budget: ${money(budget)} ·
        ${gameLabel(game)} ·
        ${resolution} ·
        ${priorityLabel(priority)}
      </p>

    </div>

  `;


  try {

    const response =
      await fetch(
        AI_WORKER_URL,
        {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({

              budget,
              game,
              resolution,
              priority,

              products

            })

        }
      );


    if (!response.ok) {

      throw new Error(
        `AI Worker returned ${response.status}`
      );

    }


    const data =
      await response.json();


    const answer =
      data.answer ||
      data.message ||
      data.response ||
      data.text;


    if (!answer) {

      throw new Error(
        'AI Worker returned no answer'
      );

    }


    result.innerHTML = `

      <div class="aiAnswer">

        <strong>
          ✨ PCDealFinder AI
        </strong>

        <div>
          ${formatAIAnswer(answer)}
        </div>

      </div>

    `;

  }

  catch (error) {

    console.error(
      'PCDealFinder AI error:',
      error
    );


    result.innerHTML = `

      <div class="aiAnswer">

        <strong>
          ⚠️ AI unavailable
        </strong>

        <p>
          The PCDealFinder AI Worker could not
          be reached.
        </p>

        <p class="muted">
          Your normal PC Builder still works.
        </p>

      </div>

    `;

  }

}


/* =========================================================
   AI TEXT FORMATTER
========================================================= */

function formatAIAnswer(text) {

  return String(text)

    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    )

    .replace(
      /\n\n/g,
      '<br><br>'
    )

    .replace(
      /\n/g,
      '<br>'
    );

}


/* =========================================================
   MISC HELPERS
========================================================= */

function capitalize(value) {

  if (!value) return '';

  return String(value)
    .charAt(0)
    .toUpperCase() +
    String(value).slice(1);

}


function getRetailerInitial(
  retailer
) {

  if (!retailer) return 'R';

  return String(retailer)
    .trim()
    .charAt(0)
    .toUpperCase();

}


function getProductIcon(
  category
) {

  const icons = {

    CPU: '⚙️',

    GPU: '🎮',

    RAM: '🧠',

    SSD: '💾',

    Motherboard: '🧩',

    PSU: '⚡'

  };


  return (
    icons[category] ||
    '🖥️'
  );

}
