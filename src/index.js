import { LC_SOURCE_BUILD_ID } from "./build-id.js";
const SUPABASE_URL = "https://kvwsqfnyebyjncfgvqnd.supabase.co";
const SUPABASE_KEY = "sb_publishable_CssKC6R2Nqtl3McbvR3f4A_jNJtz3hg";
const buildId=env=>String(env?.LC_BUILD_ID||LC_SOURCE_BUILD_ID||env?.CF_VERSION_METADATA?.id||"local");
const SECURITY_HEADERS={"x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin","permissions-policy":"camera=(), microphone=(), geolocation=()","x-frame-options":"SAMEORIGIN","strict-transport-security":"max-age=31536000; includeSubDomains"};
function json(data,status=200,headers={}) { return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...SECURITY_HEADERS,...headers}}); }
async function body(req){ try{return await req.json()}catch{return {}} }
function bearer(req){const h=req.headers.get("authorization")||"";return h.startsWith("Bearer ")?h.slice(7):null}
function cookieValue(req,name){const raw=req.headers.get("cookie")||"";const hit=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="));if(!hit)return null;try{return decodeURIComponent(hit.slice(name.length+1))}catch{return null}}
function authToken(req){return bearer(req)||cookieValue(req,"lc_media_session")}
function esc(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]))}
async function supabaseUser(req){ const token=authToken(req); if(!token)return null; const r=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${token}`}}); if(!r.ok)return null; return await r.json(); }
async function requireUser(req){const u=await supabaseUser(req);if(!u)throw Object.assign(new Error("Não autenticado"),{status:401});return u}
async function rest(req,path,options={}){ const token=authToken(req); const headers={apikey:SUPABASE_KEY,"content-type":"application/json","accept-profile":"nexora","content-profile":"nexora",...(token?{authorization:`Bearer ${token}`}:{ } ),...(options.headers||{})}; return fetch(SUPABASE_URL+"/rest/v1/"+path,{...options,headers}); }
async function createProfile(req){ const u=await requireUser(req), b=await body(req); const r=await rest(req,"profiles",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({id:u.id,full_name:String(b.full_name||u.user_metadata?.full_name||""),role:"student",status:"active"})}); const data=await r.json().catch(()=>({})); if(!r.ok)return json({error:data.message||"Falha ao criar perfil"},r.status); return json({profile:Array.isArray(data)?data[0]:data}); }
async function me(req){ const u=await requireUser(req); const r=await rest(req,`profiles?id=eq.${encodeURIComponent(u.id)}&select=id,full_name,role,status`); const data=await r.json(); return json({user:u,profile:data[0]||null}); }
async function courses(req){ await requireUser(req); const r=await rest(req,"courses?select=id,slug,title,description,status,minimum_score,position&order=position.asc"); const data=await r.json(); return json({courses:data}); }
async function progress(req){ const u=await requireUser(req), b=await body(req); const payload={user_id:u.id,lesson_id:b.lesson_id,progress:Math.max(0,Math.min(100,Number(b.progress??100))),updated_at:new Date().toISOString(),completed_at:Number(b.progress??100)>=100?new Date().toISOString():null}; const r=await rest(req,"lesson_progress?on_conflict=user_id,lesson_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify(payload)}); const data=await r.json().catch(()=>({})); if(!r.ok)return json({error:data.message||"Falha ao salvar progresso"},r.status);return json({ok:true,data}); }

function validUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||""))}
async function mediaSession(req){
  if(req.method==="DELETE")return json({ok:true},200,{"set-cookie":"lc_media_session=; Path=/api/lc/media; Max-Age=0; HttpOnly; Secure; SameSite=Strict"});
  const token=bearer(req);if(!token)throw Object.assign(new Error("Não autenticado"),{status:401});
  await requireUser(req);
  return json({ok:true},200,{"set-cookie":`lc_media_session=${encodeURIComponent(token)}; Path=/api/lc/media; Max-Age=3600; HttpOnly; Secure; SameSite=Strict`});
}
async function mediaManifest(req){
  await requireUser(req);
  const url=new URL(req.url),lesson=url.searchParams.get("lesson");
  if(!validUuid(lesson))return json({error:"Aula inválida"},400);
  const r=await rest(req,"rpc/lesson_media_manifest",{method:"POST",body:JSON.stringify({p_lesson_id:lesson})});
  const data=await r.json().catch(()=>null);
  if(!r.ok)return json({error:data?.message||"Não foi possível carregar a mídia da aula"},r.status);
  const manifest=Array.isArray(data)?data[0]:data;
  if(!manifest||typeof manifest!=="object")return json({lesson_id:lesson,available:false,videos:[],audio:[],images:[],documents:[]});
  const decorate=(items,kind)=>(Array.isArray(items)?items:[]).map(item=>({
    index:Number(item.index||0),
    label:String(item.label||kind),
    mime:String(item.mime||"application/octet-stream"),
    url:`/api/lc/media/file?lesson=${encodeURIComponent(lesson)}&kind=${encodeURIComponent(kind)}&index=${Number(item.index||0)}`
  }));
  const videos=decorate(manifest.videos,"video"),audio=decorate(manifest.audio,"audio"),images=decorate(manifest.images,"image"),documents=decorate(manifest.documents,"document");
  return json({lesson_id:lesson,available:Boolean(manifest.available),videos,audio,images,documents,video_count:Number(manifest.video_count??videos.length),audio_count:Number(manifest.audio_count??audio.length),image_count:Number(manifest.image_count??images.length),document_count:Number(manifest.document_count??documents.length)});
}
async function mediaFile(req){
  await requireUser(req);
  if(!["GET","HEAD"].includes(req.method))return new Response(null,{status:405,headers:{allow:"GET, HEAD",...SECURITY_HEADERS}});
  const url=new URL(req.url),lesson=url.searchParams.get("lesson"),kind=url.searchParams.get("kind"),index=Number(url.searchParams.get("index"));
  if(!validUuid(lesson)||!["video","audio","image","document"].includes(kind)||!Number.isInteger(index)||index<0)return new Response("Mídia inválida",{status:400,headers:{"content-type":"text/plain; charset=utf-8",...SECURITY_HEADERS}});
  const r=await rest(req,"rpc/lesson_media_resolve",{method:"POST",body:JSON.stringify({p_lesson_id:lesson,p_kind:kind,p_index:index})});
  const data=await r.json().catch(()=>null);
  if(!r.ok)return new Response("Mídia indisponível",{status:r.status,headers:SECURITY_HEADERS});
  const resolved=Array.isArray(data)?data[0]:data;
  if(!resolved?.url)return new Response("Mídia não encontrada",{status:404,headers:SECURITY_HEADERS});
  let upstreamUrl;
  try{upstreamUrl=new URL(resolved.url)}catch{return new Response("Origem de mídia inválida",{status:502,headers:SECURITY_HEADERS})}
  if(upstreamUrl.protocol!=="https:"||upstreamUrl.hostname.toLowerCase()!=="jupiter.omcursos.com.br")return new Response("Origem de mídia não permitida",{status:502,headers:SECURITY_HEADERS});
  const upstreamHeaders=new Headers();
  for(const name of ["range","if-range","if-none-match","if-modified-since"]){const value=req.headers.get(name);if(value)upstreamHeaders.set(name,value)}
  upstreamHeaders.set("accept",req.headers.get("accept")||"*/*");
  upstreamHeaders.set("referer",upstreamUrl.origin+"/ead/");
  upstreamHeaders.set("user-agent","Mozilla/5.0 (compatible; LearnCreateMedia/1.0)");
  upstreamHeaders.set("accept-language","pt-BR,pt;q=0.9,en;q=0.6");
  const upstream=await fetch(upstreamUrl.toString(),{method:req.method,headers:upstreamHeaders,redirect:"follow"});
  const headers=new Headers();
  for(const name of ["content-type","content-length","content-range","accept-ranges","etag","last-modified"]){const value=upstream.headers.get(name);if(value)headers.set(name,value)}
  if(!headers.get("content-type")&&resolved.mime)headers.set("content-type",String(resolved.mime));
  headers.set("cache-control","private, max-age=300");
  headers.set("cross-origin-resource-policy","same-origin");
  headers.set("content-disposition","inline");
  Object.entries(SECURITY_HEADERS).forEach(([name,value])=>headers.set(name,value));
  return new Response(req.method==="HEAD"?null:upstream.body,{status:upstream.status,statusText:upstream.statusText,headers});
}
async function publicCoursePage(req,slug){
  const r=await rest(req,"rpc/public_course_detail",{method:"POST",body:JSON.stringify({p_slug:slug})});
  const course=await r.json().catch(()=>null);
  if(!r.ok||!course)return new Response("Curso não encontrado",{status:404,headers:{"content-type":"text/plain; charset=utf-8",...SECURITY_HEADERS}});
  const modules=Array.isArray(course.modules)?course.modules:[];
  const paid=course.access_tier==="pro";
  const moduleCards=modules.map((m,index)=>`<article class="lc-sales-module"><span>${String(index+1).padStart(2,"0")}</span><div><h3>${esc(m.title)}</h3>${m.description?`<p>${esc(m.description)}</p>`:""}</div><small>${Number(m.lesson_count||0)} aula(s)</small></article>`).join("");
  const canonical=`https://academy.learnandcreate.workers.dev/cursos/${encodeURIComponent(course.slug)}/`;
  const next=`cursos.html?focus=${encodeURIComponent(course.slug)}`;
  const primaryHref=paid?`/pages/cadastro.html?next=${encodeURIComponent(next)}`:`/pages/cadastro.html?course=${encodeURIComponent(course.slug)}`;
  const primaryLabel=paid?"Quero esta formação →":"Começar gratuitamente →";
  const offerLabel=paid?"FORMAÇÃO PROFISSIONAL PAGA":"ACESSO GRATUITO";
  const offerCopy=paid
    ?"O acesso às aulas é liberado após matrícula. Crie sua conta para continuar o processo dentro da Learn & Create."
    :"Crie uma conta gratuita e comece a estudar no seu ritmo.";
  const offerBadge=paid?"Formação paga":"Gratuito";
  const description=course.description||`Conheça ${course.title} na Learn & Create.`;
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#05080d"><link rel="icon" href="/assets/brand/lc-mark.svg"><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="LC — Learn & Create"><meta property="og:title" content="${esc(course.title)} — Learn & Create"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://academy.learnandcreate.workers.dev/assets/brand/lc-mark.svg"><title>${esc(course.title)} — Learn & Create</title><link rel="stylesheet" href="/assets/css/lc.css"><link rel="stylesheet" href="/assets/css/commerce.css"></head><body class="lc-public-page"><header class="public-header"><div class="container public-nav"><a class="brand" href="/"><img src="/assets/brand/lc-mark.svg" alt="LC"><span class="lc-brand-signature">Learn <span class="lc-brand-amp">&amp;</span> Create</span></a><nav class="public-links"><a href="/cursos/">Catálogo</a><a href="/#gratuitos">Gratuitos</a><a href="/#profissionais">Formações profissionais</a></nav><div class="public-actions"><a class="v3-btn secondary" href="/pages/login.html?next=${encodeURIComponent(next)}">Entrar</a><a class="v3-btn" href="${primaryHref}">${primaryLabel}</a></div></div></header><main>
  <section class="container public-section"><div class="lc-commerce-hero"><div class="eyebrow">${offerLabel} • ${esc(course.category_label||"FORMAÇÃO")}</div><h1>${esc(course.title)}</h1><p>${esc(description)}</p><div class="lc-commerce-proof"><span><strong>${Number(course.module_count||0)}</strong><small>módulos</small></span><span><strong>${Number(course.lesson_count||0)}</strong><small>aulas</small></span><span><strong>${esc(course.minimum_score||70)}%</strong><small>nota mínima</small></span><span><strong>${offerBadge}</strong><small>tipo de acesso</small></span></div><div class="lc-commerce-actions"><a class="v3-btn" href="${primaryHref}">${primaryLabel}</a><a class="v3-btn secondary" href="/cursos/">Voltar ao catálogo</a></div></div></section>
  <section class="container public-section"><div class="lc-home-section-title"><div><div class="eyebrow">CONTEÚDO DA FORMAÇÃO</div><h2>O que você vai estudar.</h2></div><p>Os módulos ficam organizados em sequência para facilitar sua progressão.</p></div><div class="lc-sales-module-list">${moduleCards||'<div class="academic-empty">Conteúdo em organização.</div>'}</div></section>
  <section class="container public-section"><div class="lc-sales-cta"><div><div class="eyebrow">${offerLabel}</div><h2>${paid?"Pronto para iniciar sua matrícula?":"Pronto para começar?"}</h2><p>${offerCopy}</p></div><a class="v3-btn" href="${primaryHref}">${primaryLabel}</a></div></section>
</main><script src="/assets/js/supabase-lc.js"></script><script src="/assets/js/analytics.js"></script><script>window.LCAnalytics?.track?.('public_course_viewed',{}, {course_slug:${JSON.stringify(course.slug)},access_tier:${JSON.stringify(course.access_tier)}});</script></body></html>`;
  return new Response(html,{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=300",...SECURITY_HEADERS}});
}
async function staticAsset(req,env){
  const response=await env.ASSETS.fetch(req);
  if(!response)return response;
  const url=new URL(req.url);
  const headers=new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([name,value])=>headers.set(name,value));
  if(url.protocol!=='https:'){
    const csp=headers.get('content-security-policy');
    if(csp)headers.set('content-security-policy',csp.split(';').map(x=>x.trim()).filter(x=>x&&x.toLowerCase()!=='upgrade-insecure-requests').join('; '));
  }
  const dynamicAsset=/\.(?:html|css|js)$/i.test(url.pathname)||url.pathname==='/'||!url.pathname.split('/').pop()?.includes('.');
  if(dynamicAsset){
    headers.set('cache-control','no-store, max-age=0, must-revalidate');
    headers.set('pragma','no-cache');
    headers.set('expires','0');
    headers.set('x-lc-build',buildId(env));
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
async function router(req,env){
  const url=new URL(req.url);
  if(url.pathname==="/api/health")return json({ok:true,service:"lc-learn-supabase",database:"supabase",build:buildId(env),time:new Date().toISOString()});
  const publicCourseMatch=url.pathname.match(/^\/cursos\/([a-z0-9][a-z0-9-]{1,119})\/?$/);
  if(publicCourseMatch&&req.method==="GET"){
    const staticResponse=await staticAsset(req,env);
    if(staticResponse&&staticResponse.status!==404)return staticResponse;
    return publicCoursePage(req,publicCourseMatch[1]);
  }
  const apiPath=url.pathname.replace(/^\/api\/nexora\//,"/api/lc/");
  if(apiPath==="/api/lc/profile"&&req.method==="POST")return createProfile(req);
  if(apiPath==="/api/lc/me")return me(req);
  if(apiPath==="/api/lc/courses")return courses(req);
  if(apiPath==="/api/lc/progress"&&req.method==="POST")return progress(req);
  if(apiPath==="/api/lc/media/session"&&(req.method==="POST"||req.method==="DELETE"))return mediaSession(req);
  if(apiPath==="/api/lc/media/manifest"&&req.method==="GET")return mediaManifest(req);
  if(apiPath==="/api/lc/media/file"&&(req.method==="GET"||req.method==="HEAD"))return mediaFile(req);
  return staticAsset(req,env);
}
export default {async fetch(req,env,ctx){try{return await router(req,env)}catch(e){return json({error:e.message||"Erro interno"},e.status||500)}}};