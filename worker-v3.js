import legacy from './worker.js';
import { refreshLiveCatalogue, getLiveCatalogue } from './live-catalog-v3.js';

const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(!env.DB)return legacy.fetch(request,env,ctx);

    if(url.pathname==='/api/catalog/refresh'){
      try{return json({ok:true,...await refreshLiveCatalogue(env.DB)});}catch(error){console.error('CATALOG REFRESH',error);return json({ok:false,error:String(error?.message||error)},500)}
    }

    if(url.pathname==='/api/catalog'){
      try{
        const products=await getLiveCatalogue(env.DB);
        const category=url.searchParams.get('category');
        const supplier=url.searchParams.get('supplier');
        let filtered=products;
        if(category)filtered=filtered.filter(p=>String(p.category).toLowerCase()===String(category).toLowerCase());
        if(supplier)filtered=filtered.filter(p=>(p.offers||[]).some(o=>String(o.retailer).toLowerCase().includes(String(supplier).toLowerCase())));
        const meta=products.reduce((m,p)=>Math.max(m,...(p.offers||[]).map(o=>Number(o.updatedAt)||0)),0);
        return json({ok:true,source:'live',updatedAt:meta?new Date(meta*1000).toISOString():new Date().toISOString(),count:filtered.length,products:filtered});
      }catch(error){console.error('CATALOG API',error);return json({ok:false,error:String(error?.message||error)},500)}
    }

    if(url.pathname==='/data.json'){
      try{return json(await getLiveCatalogue(env.DB));}catch(error){console.error('DATA API',error);return json([],200)}
    }

    return legacy.fetch(request,env,ctx);
  },
  async scheduled(controller,env,ctx){ctx.waitUntil(refreshLiveCatalogue(env.DB));}
};
