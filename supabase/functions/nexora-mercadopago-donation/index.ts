// Legacy slug retained only for backward compatibility. Public brand and checkout are LC.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
const APP=Deno.env.get("LC_APP_URL")||Deno.env.get("NEXORA_APP_URL")||"https://academy.nexora-84f.workers.dev";
const WEBHOOK=`${SUPABASE_URL}/functions/v1/lc-mercadopago-webhook`;
const allowed=new Set((Deno.env.get("LC_ALLOWED_ORIGINS")||Deno.env.get("NEXORA_ALLOWED_ORIGINS")||APP).split(",").map(x=>x.trim()).filter(Boolean));

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allow=allowed.has("*")?"*":allowed.has(origin)?origin:APP;
  return {
    "Access-Control-Allow-Origin":allow,
    "Vary":"Origin",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age":"86400"
  };
}
const json=(req:Request,b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json",...cors(req)}});

async function rest(path:string,init:RequestInit={}){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{
    apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,"Content-Type":"application/json",
    "Accept-Profile":"nexora","Content-Profile":"nexora",...(init.headers||{})
  }});
  const t=await r.text(); const d=t?JSON.parse(t):null;
  if(!r.ok) throw new Error(d?.message||`DB ${r.status}`);
  return d;
}
async function userFrom(req:Request){
  const auth=req.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer "))return null;
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SERVICE,Authorization:auth}});
  return r.ok?await r.json():null;
}

Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST") return json(req,{error:"method_not_allowed"},405);
  if(!MP) return json(req,{error:"mercadopago_not_configured"},503);
  try{
    const body=await req.json().catch(()=>({}));
    if(String(body?.website||"").trim()) return json(req,{ok:true});
    const name=String(body?.name||"").trim();
    const email=String(body?.email||"").trim().toLowerCase();
    const amount=Number(body?.amount);
    const message=String(body?.message||"").trim().slice(0,500)||null;
    const publicListing=body?.public_listing===true;
    if(name.length<2)return json(req,{error:"name_required",message:"Informe seu nome."},422);
    if(!/^\S+@\S+\.\S+$/.test(email))return json(req,{error:"email_required",message:"Informe um e-mail válido."},422);
    if(!Number.isFinite(amount)||amount<1||amount>100000)return json(req,{error:"invalid_amount",message:"Você pode contribuir com qualquer valor a partir de R$ 1."},422);

    const user=await userFrom(req);
    let supporter=(await rest(`supporters?email=eq.${encodeURIComponent(email)}&select=*&limit=1`))?.[0];
    if(!supporter){
      supporter=(await rest("supporters",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({user_id:user?.id||null,name,email,message,public_listing:publicListing})}))?.[0];
    }else{
      await rest(`supporters?id=eq.${supporter.id}`,{method:"PATCH",body:JSON.stringify({name,message,public_listing:publicListing,user_id:supporter.user_id||user?.id||null,updated_at:new Date().toISOString()})});
    }

    const donation=(await rest("donations",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({
      supporter_id:supporter.id,user_id:user?.id||null,amount:Number(amount.toFixed(2)),payer_email:email,donor_name:name,message,status:"pending",provider:"mercadopago"
    })}))[0];

    const payload={
      items:[{id:`lc-donation-${donation.id}`,title:"Contribuição voluntária — LC",description:"Ajude a manter a aprendizagem gratuita",quantity:1,currency_id:"BRL",unit_price:Number(amount.toFixed(2))}],
      payer:{name,email},
      external_reference:`lc-donation:${donation.id}`,
      notification_url:WEBHOOK,
      back_urls:{success:`${APP}/pages/apoie.html?payment=success`,pending:`${APP}/pages/apoie.html?payment=pending`,failure:`${APP}/pages/apoie.html?payment=failure`},
      auto_return:"approved",
      payment_methods:{installments:12},
      metadata:{project:"lc",donation_id:donation.id,supporter_id:supporter.id}
    };

    const mp=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${MP}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await mp.json().catch(()=>({}));
    if(!mp.ok){
      await rest(`donations?id=eq.${donation.id}`,{method:"PATCH",body:JSON.stringify({status:"rejected",updated_at:new Date().toISOString()})});
      return json(req,{error:"mercadopago_error",message:data?.message||data?.error||"Não foi possível abrir o Mercado Pago.",details:data},502);
    }
    await rest(`donations?id=eq.${donation.id}`,{method:"PATCH",body:JSON.stringify({provider_preference_id:String(data.id),updated_at:new Date().toISOString()})});
    return json(req,{ok:true,donation_id:donation.id,preference_id:data.id,init_point:data.init_point,sandbox_init_point:data.sandbox_init_point||null});
  }catch(error){
    console.error(JSON.stringify({event:"lc_donation_error",message:error instanceof Error?error.message:String(error)}));
    return json(req,{error:"internal_error",message:"Não foi possível iniciar a contribuição."},500);
  }
});