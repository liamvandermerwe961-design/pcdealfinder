/* Live catalogue boot: never show the old prototype catalogue first. */
(async function(){
  const box=document.getElementById('results');
  if(box){box.innerHTML='<div class="emptyState"><div class="emptyIcon">↻</div><h3>Loading live catalogue…</h3><p>Checking current South African retailer prices.</p></div>';}
  try{
    const response=await fetch('/api/catalog/refresh',{cache:'no-store'});
    if(!response.ok)throw new Error('Live catalogue refresh failed');
    const refresh=await response.json();
    if(!refresh.ok||refresh.published===false)throw new Error('Not enough live suppliers returned');
    const live=await fetch('/api/catalog?live=1',{cache:'no-store'});
    if(!live.ok)throw new Error('Live catalogue request failed');
    const payload=await live.json();
    const products=Array.isArray(payload.products)?payload.products:[];
    if(typeof render==='function')render(products);
  }catch(error){
    console.warn('Live homepage catalogue:',error);
    if(box)box.innerHTML='<div class="emptyState"><div class="emptyIcon">⚠</div><h3>Live catalogue is refreshing</h3><p>No stale prototype products are being shown. Try again in a moment.</p></div>';
  }
})();
