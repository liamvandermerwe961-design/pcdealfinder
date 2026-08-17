const products=[
{id:'5600',name:'AMD Ryzen 5 5600',cat:'CPU',mpn:'100-100000927BOX',list:[['Wootware',2999,'In stock','https://www.wootware.co.za/'],['Evetech',0,'Partner price pending','https://www.evetech.co.za/']]},
{id:'5070ti',name:'Gigabyte GeForce RTX 5070 Ti WINDFORCE OC SFF 16G',cat:'GPU',mpn:'GV-N507TWF3OC-16GD',list:[['Wootware',21999,'Stock status must be verified','https://www.wootware.co.za/']]},
{id:'legend860',name:'ADATA Legend 860 1TB NVMe',cat:'SSD',mpn:'SLEG-860-1000GCS',list:[['Wootware',3199,'In stock','https://www.wootware.co.za/']]},
{id:'sf750',name:'Super Flower Leadex III GE 750W Gold',cat:'PSU',mpn:'SF-750F14GE',list:[['Wootware',1899,'In stock','https://www.wootware.co.za/']]},
{id:'a520',name:'ASUS PRIME A520M-K',cat:'Motherboard',mpn:'PRIME-A520M-K',list:[['Wootware',1099,'In stock','https://www.wootware.co.za/']]},
{id:'gskill16',name:'G.Skill Ripjaws V 16GB (2x8GB) DDR4-3200',cat:'RAM',mpn:'F4-3200C16D-16GVKB',list:[['Wootware',2299,'In stock','https://www.wootware.co.za/']]}
];
const money=n=>'R'+n.toLocaleString('en-ZA');
function search(q){q=(q===undefined?document.getElementById('q').value:q).toLowerCase().trim();const m=q?products.filter(p=>(p.name+' '+p.cat+' '+p.mpn).toLowerCase().includes(q)):products;document.getElementById('title').textContent=q?'Results for “'+q+'”':'Featured parts';document.getElementById('count').textContent=m.length+' products';document.getElementById('results').innerHTML=m.map(p=>{const live=p.list.filter(x=>x[1]>0).sort((a,b)=>a[1]-b[1]);return `<article class="card"><div class="eyebrow">${p.cat}</div><h3>${p.name}</h3><div class="meta">MPN: ${p.mpn}</div><div class="price">${live[0]?money(live[0][1]):'Price pending'}</div>${p.list.map(x=>`<div class="listing"><div><b>${x[0]}</b><div class="stock">${x[2]}</div></div>${x[1]>0?`<a class="buy" href="${x[3]}" target="_blank" rel="noopener">View deal</a>`:'<span class="stock">Pending</span>'}</div>`).join('')}</article>`}).join('')}
search('');
document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
