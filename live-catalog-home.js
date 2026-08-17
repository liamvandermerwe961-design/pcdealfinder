/* Replace the homepage prototype catalogue with the D1-backed live catalogue. */
(async function(){
  try{
    const response=await fetch('/api/catalog?v=live-home',{cache:'no-store'});
    if(!response.ok)return;
    const payload=await response.json();
    const products=Array.isArray(payload)?payload:(Array.isArray(payload.products)?payload.products:[]);
    if(!products.length||typeof render!=='function')return;
    render(products);
  }catch(error){console.warn('Live homepage catalogue:',error)}
})();
