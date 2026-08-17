(async function(){
  const enhance=products=>{
    if(typeof render==='function')render(products);
    requestAnimationFrame(()=>{
      document.querySelectorAll('#results .product').forEach((card,i)=>{
        const p=products[i];if(!p)return;
        const visual=card.querySelector('.productPlaceholder');
        if(visual&&p.image){visual.innerHTML=`<img src="${escapeAttribute(p.image)}" alt="${escapeHTML(p.name||'PC component')}" loading="lazy" referrerpolicy="no-referrer">`;visual.classList.add('hasProductImage')}
        const content=card.querySelector('.productContent');
        if(content&&!content.querySelector('.liveDescription')&&p.description){const d=document.createElement('p');d.className='liveDescription';d.textContent=p.description;content.querySelector('.productSpecs')?.before(d)}
        const footer=card.querySelector('.productFooter');if(footer)footer.innerHTML='<span>🟢 Live supplier catalogue</span><span>Price checked automatically</span>';
      });
    });
  };
  try{const r=await fetch('/api/catalog',{cache:'no-store'});if(!r.ok)throw new Error('live catalogue unavailable');const data=await r.json();if(data.ok&&Array.isArray(data.products)&&data.products.length)enhance(data.products)}catch(e){console.warn('Live catalogue:',e)}
})();
