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
      <div class="emptyState">
        <div class="emptyIcon">⌕</div>
        <h3>No products found</h3>
        <p>
          Try searching for a CPU, GPU, RAM kit, SSD,
          motherboard or PSU.
        </p>
      </div>
    `;

    return;
  }


  list.forEach(p => {

    const offers = [...(p.offers || [])]
      .filter(o => Number.isFinite(Number(o.price)))
      .sort(
        (a, b) =>
          Number(a.price) - Number(b.price)
      );

    if (!offers.length) return;


    const best = offers[0];

    const low = Number(best.price);

    const high =
      Number(offers[offers.length - 1].price);

    const savings =
      high > low
        ? high - low
        : 0;


    const el =
      document.createElement('article');

    el.className = 'product';


    /* =====================================================
       PRODUCT HEADER
    ===================================================== */

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
          <span>RETAILER OFFERS</span>

          <span>
            ${offers.length}
            ${offers.length === 1 ? 'offer' : 'offers'}
          </span>
        </div>


        <div class="offers">

          ${offers.map((o, i) => `

            <div class="offer">

              <div class="retailerInfo">

                <div class="retailerLogo">
                  ${getRetailerInitial(o.retailer)}
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
   PRODUCT CARD HELPERS
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
