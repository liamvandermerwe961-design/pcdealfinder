/* PCDealFinder live catalogue bridge: the UI must use the live D1 catalogue, never the stale prototype data.json. */
(function(){
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async function(input, init){
    const url = typeof input === 'string' ? input : (input && input.url) || '';

    if (/(?:^|\/)data\.json(?:\?|$)/i.test(url)) {
      try {
        const response = await nativeFetch('/api/catalog?v=live-home', Object.assign({}, init, { cache: 'no-store' }));
        if (response.ok) {
          const payload = await response.clone().json();
          const products = Array.isArray(payload) ? payload : (Array.isArray(payload.products) ? payload.products : []);
          if (payload?.ok && Array.isArray(products)) {
            return new Response(JSON.stringify(products), {
              status: 200,
              headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store'
              }
            });
          }
        }
      } catch (error) {
        console.warn('Live catalogue bridge failed:', error);
      }

      // Do not silently fall back to data.json. That was the reason old catalogue
      // entries appeared before the live feed and made the site look inconsistent.
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        }
      });
    }

    return nativeFetch(input, init);
  };
})();
