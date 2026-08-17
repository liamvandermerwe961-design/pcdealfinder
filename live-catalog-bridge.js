/* PCDealFinder live catalogue bridge: replaces prototype data.json reads with D1-backed catalogue. */
(function(){
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(/(?:^|\/)data\.json(?:\?|$)/i.test(url)){
      try{
        const response=await nativeFetch('/api/catalog?v=live',Object.assign({},init,{cache:'no-store'}));
        if(response.ok){
          const payload=await response.clone().json();
          const products=Array.isArray(payload)?payload:(Array.isArray(payload.products)?payload.products:[]);
          if(products.length || payload.ok){
            return new Response(JSON.stringify(products),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
          }
        }
      }catch(error){console.warn('Live catalogue bridge failed:',error)}
    }
    return nativeFetch(input,init);
  };
})();
