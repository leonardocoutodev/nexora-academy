const BUILD_ID = "6.1.0-phase3-20260828";
const SUPABASE_URL = "https://kvwsqfnyebyjncfgvqnd.supabase.co";
const SUPABASE_KEY = "sb_publishable_CssKC6R2Nqtl3McbvR3f4A_jNJtz3hg";
const SECURITY_HEADERS={"x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","permissions-policy":"camera=(), microphone=(), geolocation=()","x-frame-options":"SAMEORIGIN"};
function json(data,status=200,headers={}) { return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...SECURITY_HEADERS,...headers}}); }
async function body(req){ try{return await req.json()}catch{return {}} }
function bearer(req){const h=req.headers.get("authorization")||"";return h.startsWith("Bearer ")?h.slice(7):null}
async function supabaseUser(req){ const token=bearer(req); if(!token)return null; const r=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${token}`}}); if(!r.ok)return null; return await r.json(); }
async function requireUser(req){const u=await supabaseUser(req);if(!u)throw Object.assign(new Error("Não autenticado"),{status:401});return u}
async function rest(req,path,options={}){ const token=bearer(req); const headers={apikey:SUPABASE_KEY,"content-type":"application/json","accept-profile":"nexora","content-profile":"nexora",...(token?{authorization:`Bearer ${token}`}:{ } ),...(options.headers||{})}; return fetch(SUPABASE_URL+"/rest/v1/"+path,{...options,headers}); }
async function createProfile(req){ const u=await requireUser(req), b=await body(req); const r=await rest(req,"profiles",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({id:u.id,full_name:String(b.full_name||u.user_metadata?.full_name||""),role:"student",status:"active"})}); const data=await r.json().catch(()=>({})); if(!r.ok)return json({error:data.message||"Falha ao criar perfil"},r.status); return json({profile:Array.isArray(data)?data[0]:data}); }
async function me(req){ const u=await requireUser(req); const r=await rest(req,`profiles?id=eq.${encodeURIComponent(u.id)}&select=id,full_name,role,status`); const data=await r.json(); return json({user:u,profile:data[0]||null}); }
async function courses(req){ await requireUser(req); const r=await rest(req,"courses?select=id,slug,title,description,status,minimum_score,position&order=position.asc"); const data=await r.json(); return json({courses:data}); }
async function progress(req){ const u=await requireUser(req), b=await body(req); const payload={user_id:u.id,lesson_id:b.lesson_id,progress:Math.max(0,Math.min(100,Number(b.progress??100))),updated_at:new Date().toISOString(),completed_at:Number(b.progress??100)>=100?new Date().toISOString():null}; const r=await rest(req,"lesson_progress?on_conflict=user_id,lesson_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(payload)}); const data=await r.json().catch(()=>({})); if(!r.ok)return json({error:data.message||"Falha ao salvar progresso"},r.status);return json({ok:true,data}); }
async function staticAsset(req,env){
  const response=await env.ASSETS.fetch(req);
  if(!response)return response;
  const url=new URL(req.url);
  const headers=new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([name,value])=>headers.set(name,value));
  const dynamicAsset=/\.(?:html|css|js)$/i.test(url.pathname)||url.pathname==='/'||!url.pathname.split('/').pop()?.includes('.');
  if(dynamicAsset){
    headers.set('cache-control','no-store, max-age=0, must-revalidate');
    headers.set('pragma','no-cache');
    headers.set('expires','0');
    headers.set('x-lc-build',BUILD_ID);
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
async function router(req,env){ const url=new URL(req.url); if(url.pathname==="/api/health")return json({ok:true,service:"lc-learn-supabase",database:"supabase",build:BUILD_ID,time:new Date().toISOString()}); const apiPath=url.pathname.replace(/^\/api\/nexora\//,"/api/lc/"); if(apiPath==="/api/lc/profile"&&req.method==="POST")return createProfile(req); if(apiPath==="/api/lc/me")return me(req); if(apiPath==="/api/lc/courses")return courses(req); if(apiPath==="/api/lc/progress"&&req.method==="POST")return progress(req); return staticAsset(req,env); }
export default {async fetch(req,env,ctx){try{return await router(req,env)}catch(e){return json({error:e.message||"Erro interno"},e.status||500)}}};
