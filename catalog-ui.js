/* Phase 16 catalogue UI: live metadata, supplier labels and product imagery. */
(async function(){
  try {
    const response=await fetch('/api/catalog?v=20260817',{cache:'no-store'});
    if(!response.ok)return;
    const payload=await response.json();
    if(!payload.ok||!Array.isArray(payload.products))return;
    const byName=new Map(payload.products.map(p=>[String(p.name||'').toLowerCase(),p]));
    const hydrate=()=>document.querySelectorAll('.product').forEach(card=>{
      const title=card.querySelector('h3');
      if(!title)return;
      const product=byName.get(title.textContent.trim().toLowerCase());
      if(!product)return;
      const visual=card.querySelector('.productPlaceholder');
      if(visual&&product.image){visual.innerHTML=`<img src="${String(product.image).replace(/"/g,'&quot;')}" alt="${title.textContent.trim().replace(/"/g,'&quot;')}" loading="lazy" referrerpolicy="no-referrer">`;visual.classList.add('hasProductImage');}
      if(!card.querySelector('.liveDescription')&&product.description){const desc=document.createElement('p');desc.className='liveDescription';desc.textContent=product.description;const specs=card.querySelector('.productSpecs');if(specs)specs.insertAdjacentElement('beforebegin',desc);}
      const footer=card.querySelector('.productFooter');
      if(footer){const stamp=footer.querySelector('.catalogFreshness')||document.createElement('span');stamp.className='catalogFreshness';stamp.textContent=`Live catalogue checked ${new Date(payload.updatedAt).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}`;footer.appendChild(stamp);}
    });
    const style=document.createElement('style');style.textContent='.productPlaceholder.hasProductImage{display:flex;align-items:center;justify-content:center;overflow:hidden}.productPlaceholder.hasProductImage img{width:100%;height:100%;object-fit:contain;display:block}.liveDescription{margin:0 0 16px;color:rgba(255,255,255,.68);line-height:1.55;font-size:.92rem}.catalogFreshness{margin-left:auto;color:rgba(255,255,255,.55)}';document.head.appendChild(style);
    hydrate();
    new MutationObserver(hydrate).observe(document.getElementById('results')||document.body,{childList:true,subtree:true});
  }catch(error){console.debug('catalog-ui:',error)}
})();
