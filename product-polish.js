/* PCDealFinder — product/deal presentation layer */
(function(){
  const money=v=>'R'+Number(v).toLocaleString('en-ZA');
  const escape=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function decorate(){
    const box=document.getElementById('results');
    if(!box)return;
    box.querySelectorAll('.product').forEach(card=>{
      if(card.dataset.polished==='1')return;
      card.dataset.polished='1';
      const offers=[...card.querySelectorAll('.offerPrice')].map(x=>Number(x.textContent.replace(/[^0-9.]/g,''))).filter(Number.isFinite).filter(v=>v>0);
      if(!offers.length)return;
      const low=Math.min(...offers), high=Math.max(...offers), avg=offers.reduce((a,b)=>a+b,0)/offers.length;
      const spread=Math.max(0,high-low);
      const score=offers.length>1?Math.round(Math.min(100,55+(spread/Math.max(avg,1))*260)):72;
      const label=score>=85?'Excellent deal':score>=72?'Good deal':score>=60?'Fair price':'Worth watching';
      const tone=score>=85?'excellent':score>=72?'good':score>=60?'fair':'watch';
      const visual=card.querySelector('.productVisual');
      if(visual){
        const badge=visual.querySelector('.dealBadge');
        if(badge)badge.innerHTML=`✦ ${label.toUpperCase()}`;
        const marker=document.createElement('div');marker.className='dealScorePill '+tone;marker.innerHTML=`<span></span>${label} · ${score}/100`;visual.appendChild(marker);
      }
      const content=card.querySelector('.productContent');
      if(!content)return;
      const stats=document.createElement('div');stats.className='priceInsight';
      const width=Math.max(8,Math.min(100,(low/Math.max(high,low))*100));
      stats.innerHTML=`<div class="priceInsightHead"><b>PRICE EVALUATION</b><span>${offers.length} retailer${offers.length===1?'':'s'}</span></div><div class="priceRange"><i style="width:${width}%"></i><span></span></div><div class="priceInsightGrid"><div><small>BEST PRICE</small><strong>${money(low)}</strong></div><div><small>AVERAGE</small><strong>${money(avg)}</strong></div><div><small>MAX SAVING</small><strong>${money(spread)}</strong></div></div><div class="priceHistoryHint">Current catalogue comparison · verify final price at checkout</div>`;
      const footer=content.querySelector('.productFooter');
      if(footer)content.insertBefore(stats,footer);else content.appendChild(stats);
    });
  }
  const observer=new MutationObserver(decorate);
  document.addEventListener('DOMContentLoaded',()=>{const box=document.getElementById('results');if(box)observer.observe(box,{childList:true});decorate()});
})();
