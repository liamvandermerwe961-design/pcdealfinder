let products = [];

/* =========================================================
   CONFIG
========================================================= */

const AI_WORKER_URL =
  'https://pcdealfinder-ai.liamvandermerwe961.workers.dev';


/* =========================================================
   MONEY
========================================================= */

function money(n) {
  return 'R' + Number(n || 0).toLocaleString('en-ZA');
}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

fetch('data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Could not load data.json');
    }

    return response.json();
  })
  .then(data => {
    products = Array.isArray(data) ? data : [];
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


/* =========================================================
   PRODUCT RENDER
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


  list.forEach(product => {

    const offers =
      [...(product.offers || [])]
        .filter(
          offer =>
            Number.isFinite(
              Number(offer.price)
            )
        )
        .sort(
          (a, b) =>
            Number(a.price) -
            Number(b.price)
        );


    if (!offers.length) return;


    const lowest =
      Number(offers[0].price);


    const highest =
      Number(
        offers[offers.length - 1].price
      );


    const savings =
      highest > lowest
        ? highest - lowest
        : 0;


    const element =
      document.createElement('article');

    element.className = 'product';


    element.innerHTML = `

      <div class="productVisual">

        <div class="productGlow"></div>

        <div class="productPlaceholder">

          <span>
            ${getProductIcon(product.category)}
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
              ${product.category || 'PRODUCT'}
            </div>

            <h3>
              ${product.name || 'Unnamed product'}
            </h3>

            ${
              product.mpn
                ? `
                  <div class="mpn">
                    MPN: ${product.mpn}
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
              ${money(lowest)}
            </strong>

            <span>
              ${
                savings > 0
                  ? `Save ${money(savings)}`
                  : 'Best listed price'
              }
            </span>

          </div>

        </div>


        <div class="productSpecs">

          ${
            product.socket
              ? `
                <div>
                  <small>SOCKET</small>
                  <b>${product.socket}</b>
                </div>
              `
              : ''
          }


          ${
            product.memory
              ? `
                <div>
                  <small>MEMORY</small>
                  <b>${product.memory}</b>
                </div>
              `
              : ''
          }


          ${
            product.capacity
              ? `
                <div>
                  <small>CAPACITY</small>
                  <b>${product.capacity}GB</b>
                </div>
              `
              : ''
          }


          ${
            product.wattage
              ? `
                <div>
                  <small>POWER</small>
                  <b>${product.wattage}W</b>
                </div>
              `
              : ''
          }


          ${
            product.tier
              ? `
                <div>
                  <small>PERFORMANCE</small>
                  <b>${capitalize(product.tier)}</b>
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
            ${offers.length === 1 ? 'offer' : 'offers'}
          </span>

        </div>


        <div class="offers">

          ${offers.map((offer, index) => `

            <div class="offer">

              <div class="retailerInfo">

                <div class="retailerLogo">
                  ${getRetailerInitial(offer.retailer)}
                </div>

                <div>

                  <b>
                    ${offer.retailer || 'Retailer'}
                  </b>

                  <small>
                    <span class="stockDot"></span>
                    ${offer.stock || 'Stock unknown'}
                  </small>

                </div>

              </div>


              <div class="offerRight">

                <div class="offerPrice">
                  ${money(offer.price)}
                </div>

                ${
                  index === 0
                    ? `
                      <span class="lowestLabel">
                        LOWEST
                      </span>
                    `
                    : ''
                }

                ${
                  offer.url
                    ? `
                      <a
                        class="dealButton"
                        href="${offer.url}"
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


    box.appendChild(element);

  });

}


/* =========================================================
   NORMAL PC BUILDER
========================================================= */

function generateBuild() {

  const budget =
    Number(
      document.getElementById('buildBudget')?.value || 15000
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


  const build =
    createBuild(
      budget,
      game,
      resolution,
      priority
    );


  if (!build) {

    result.innerHTML = `
      <div class="aiAnswer">
        <strong>⚠️ Build unavailable</strong>
        <p>
          We couldn't create a compatible build
          from the current catalogue.
        </p>
      </div>
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
            ${money(productPrice(part.product))}
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
    products.filter(p => p.category === 'CPU');

  const gpus =
    products.filter(p => p.category === 'GPU');

  const rams =
    products.filter(p => p.category === 'RAM');

  const ssds =
    products.filter(p => p.category === 'SSD');

  const motherboards =
    products.filter(p => p.category === 'Motherboard');

  const psus =
    products.filter(p => p.category === 'PSU');


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
    gpuWeights[resolution] ||
    gpuWeights['1080p'];


  const gpuCandidates =
    [...gpus].sort(
      (a, b) =>
        scoreGPU(b, weight, priority) -
        scoreGPU(a, weight, priority)
    );


  for (const gpu of gpuCandidates) {

    const cpuCandidates =
      cpus.filter(
        cpu =>
          !gpu.socket ||
          !cpu.socket ||
          cpu.socket === gpu.socket
      );


    if (!cpuCandidates.length) continue;


    const cpu =
      chooseCPU(
        cpuCandidates,
        priority
      );


    if (!cpu) continue;


    const ram =
      chooseRAM(
        rams,
        cpu
      );


    if (!ram) continue;


    const motherboard =
      chooseMotherboard(
        motherboards,
        cpu,
        ram
      );


    if (!motherboard) continue;


    const ssd =
      chooseSSD(ssds);


    if (!ssd) continue;


    const requiredWattage =
      Number(gpu.wattage || 0) + 250;


    const compatiblePSUs =
      psus
        .filter(
          psu =>
            Number(psu.wattage || 0) >= requiredWattage
        )
        .sort(
          (a, b) =>
            productPrice(a) -
            productPrice(b)
        );


    if (!compatiblePSUs.length) continue;


    const psu =
      compatiblePSUs[0];


    const parts = [

      {
        category: 'CPU',
        product: cpu
      },

      {
        category: 'GPU',
        product: gpu
      },

      {
        category: 'RAM',
        product: ram
      },

      {
        category: 'Motherboard',
        product: motherboard
      },

      {
        category: 'SSD',
        product: ssd
      },

      {
        category: 'PSU',
        product: psu
      }

    ];


    const total =
      parts.reduce(
        (sum, part) =>
          sum + productPrice(part.product),
        0
      );


    if (total <= budget) {

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

  }


  return null;

}


/* =========================================================
   BUILD HELPERS
========================================================= */

function scoreGPU(gpu, weight, priority) {

  const tier =
    gpu.tier || 'entry';

  const tierScore =
    Number(weight[tier] || 1);

  const price =
    Math.max(productPrice(gpu), 1);


  if (priority === 'fps') {
    return tierScore * 10000;
  }


  if (priority === 'balanced') {
    return (tierScore * 10000) / price;
  }


  return (tierScore * 15000) / price;

}


function chooseCPU(cpus, priority) {

  if (!cpus.length) return null;


  return [...cpus].sort((a, b) => {

    const priceA = productPrice(a);
    const priceB = productPrice(b);


    if (priority === 'fps') {
      return priceB - priceA;
    }


    return priceA - priceB;

  })[0];

}


function chooseRAM(rams, cpu) {

  const compatible =
    rams.filter(
      ram =>
        !cpu.memory ||
        !ram.memory ||
        ram.memory === cpu.memory
    );


  return (

    compatible
      .filter(
        ram =>
          Number(ram.capacity || 0) >= 16
      )
      .sort(
        (a, b) =>
          productPrice(a) -
          productPrice(b)
      )[0]

  ) || compatible[0] || rams[0];

}


function chooseMotherboard(
  boards,
  cpu,
  ram
) {

  const compatible =
    boards.filter(
      board =>

        (
          !cpu.socket ||
          !board.socket ||
          board.socket === cpu.socket
        )

        &&

        (
          !ram.memory ||
          !board.memory ||
          board.memory === ram.memory
        )
    );


  return (

    compatible
      .sort(
        (a, b) =>
          productPrice(a) -
          productPrice(b)
      )[0]

  ) || null;

}


function chooseSSD(ssds) {

  const preferred =
    ssds
      .filter(
        s =>
          Number(s.capacity || 0) >= 1000
      )
      .sort(
        (a, b) =>
          productPrice(a) -
          productPrice(b)
      );


  return preferred[0] || ssds[0];

}


/* =========================================================
   AI BUILDER
========================================================= */

async function askPCDealFinderAI() {

  const result =
    document.getElementById('buildResult');

  if (!result) return;


  const budget =
    Number(
      document.getElementById('buildBudget')?.value || 15000
    );

  const game =
    document.getElementById('buildGame')?.value || 'general';

  const resolution =
    document.getElementById('buildResolution')?.value || '1080p';

  const priority =
    document.getElementById('buildPriority')?.value || 'value';


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

    console.log(
      'PCDealFinder AI → sending request'
    );


    const response =
      await fetch(
        AI_WORKER_URL,
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


    const rawText =
      await response.text();


    console.log(
      'PCDealFinder AI ← status:',
      response.status
    );

    console.log(
      'PCDealFinder AI ← response:',
      rawText
    );


    let data;

    try {
      data = JSON.parse(rawText);
    }

    catch {
      throw new Error(
        `Worker returned non-JSON response: ${rawText.slice(0, 300)}`
      );
    }


    if (!response.ok) {

      throw new Error(
        data.details ||
        data.error ||
        `Worker returned HTTP ${response.status}`
      );

    }


    if (!data.ok) {

      throw new Error(
        data.error ||
        'AI Worker returned an error.'
      );

    }


    if (!data.answer) {

      throw new Error(
        'AI Worker returned no answer.'
      );

    }


    result.innerHTML = `

      <div class="aiAnswer">

        <strong>
          ✨ PCDealFinder AI
        </strong>

        <div>
          ${formatAIAnswer(data.answer)}
        </div>

      </div>

    `;

  }

  catch (error) {

    console.error(
      'PCDealFinder AI ERROR:',
      error
    );


    result.innerHTML = `

      <div class="aiAnswer">

        <strong>
          ⚠️ AI ERROR
        </strong>

        <p>
          ${escapeHTML(error.message)}
        </p>

        <p class="muted">
          The normal PC Builder is still available.
        </p>

      </div>

    `;

  }

}


/* =========================================================
   AI FORMATTER
========================================================= */

function formatAIAnswer(text) {

  return escapeHTML(String(text))

    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    )

    .replace(
      /^### (.*?)$/gm,
      '<h4>$1</h4>'
    )

    .replace(
      /^## (.*?)$/gm,
      '<h3>$1</h3>'
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


/* =========================================================
   MISC
========================================================= */

function capitalize(value) {

  if (!value) return '';

  return String(value)
    .charAt(0)
    .toUpperCase() +
    String(value).slice(1);

}


function getRetailerInitial(retailer) {

  if (!retailer) return 'R';

  return String(retailer)
    .trim()
    .charAt(0)
    .toUpperCase();

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
