/* Homepage: hydrate from the current live D1 catalogue without triggering a slow scraper refresh on page load. */
(async function(){
  try{
    const response=await fetch('/api/catalog?v=live-home',{cache:'no-store'});
    if(!response.ok)throw new Error('Live catalogue request failed');
    const payload=await response.json();
    const products=Array.isArray(payload)?payload:(Array.isArray(payload.products)?payload.products:[]);
    if(typeof render!=='function')return;
    render(products);
  }catch(error){console.warn('Live homepage catalogue:',error)}
})();
