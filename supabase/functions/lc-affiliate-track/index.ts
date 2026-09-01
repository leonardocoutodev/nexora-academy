import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP=(Deno.env.get("LC_APP_URL")||"https://academy.learnandcreate.workers.dev").replace(/\/$/,"");
const allowed=new Set([APP,"https://academy.learnandcreate.workers.dev"]);
function cors(req:Request){const origin=req.headers.get("origin")||"";const allow=allowed.has(origin)?origin:APP;return {"Access-Control-Allow-Origin":allow,"Vary":"Origin","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"apikey, content-type","Access-Control-Max-Age":"86400"}}
const json=(req:Request,b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json",...cors(req)}});
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,"Content-Type":"application/json","Accept-Profile":"nexora","Content-Profile":"nexora",...(init.headers||{})}});const t=await r.text();const d=t?JSON.parse(t):null;if(!r.ok)throw new Error(d?.message||`DB ${r.status}`);return d}
function clean(value:any,max=120){return String(value||"").trim().slice(0,max)}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method_not_allowed"},405);
  try{
    const body=await req.json().catch(()=>({}));
    const code=clean(body?.code,20).toUpperCase(),sessionId=clean(body?.session_id,96);
    if(!/^[A-Z0-9]{8,20}$/.test(code)||sessionId.length<8)return json(req,{ok:false,reason:"invalid_ref"});
    const settings=(await rest("affiliate_program_settings?singleton=eq.true&enabled=eq.true&select=enabled&limit=1"))?.[0];
    if(!settings)return json(req,{ok:false,reason:"program_disabled"});
    const affiliate=(await rest(`affiliate_profiles?code=eq.${encodeURIComponent(code)}&status=eq.active&select=id,code&limit=1`))?.[0];
    if(!affiliate)return json(req,{ok:false,reason:"affiliate_not_active"});
    const attribution:any={};
    for(const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"]){
      const v=clean(body?.attribution?.[key],120);if(v)attribution[key]=v;
    }
    await rest("affiliate_clicks?on_conflict=affiliate_id,session_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({
      affiliate_id:affiliate.id,session_id:sessionId,product_slug:clean(body?.product_slug,100)||null,
      landing_path:clean(body?.landing_path,300)||null,attribution,clicked_at:new Date().toISOString()
    })});
    return json(req,{ok:true,code:affiliate.code});
  }catch(error){
    console.error(JSON.stringify({event:"lc_affiliate_track_error",message:error instanceof Error?error.message:String(error)}));
    return json(req,{ok:false},200);
  }
});