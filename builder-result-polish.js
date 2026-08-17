/* PCDealFinder — recommended build presentation */
(function(){
  const icons={CPU:'🧠',GPU:'🎮',RAM:'⚡',Motherboard:'▣',SSD:'▤',PSU:'◈'};
  function decorate(){
    const result=document.getElementById('buildResult');
    if(!result||!Array.isArray(window.products)||!result.querySelector('.buildPart'))return;
    result.querySelectorAll('.buildPart').forEach(card=>{
      if(card.dataset.polished==='1')return;
      card.dataset.polished='1';
      const type=card.querySelector('small')?.textContent?.trim()||'Part';
      const name=card.querySelector('b')?.textContent?.trim()||'';
      const product=window.products.find(p=>p.name===name);
      const icon=document.createElement('span');icon.className='buildPartIcon';icon.textContent=icons[type]||'✦';card.prepend(icon);
      if(product){
        const offer=[...(product.offers||[])].filter(o=>Number(o.price)>0).sort((a,b)=>Number(a.price)-Number(b.price))[0];
        if(offer?.url){const link=document.createElement('a');link.className='buildDealLink';link.href=offer.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View best deal →';card.appendChild(link)}
      }
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{const result=document.getElementById('buildResult');if(result)new MutationObserver(decorate).observe(result,{childList:true,subtree:true});decorate()});
})();
