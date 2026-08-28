import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
const APP=Deno.env.get("NEXORA_APP_URL")||"https://academy.nexora-84f.workers.dev";
const WEBHOOK=`${SUPABASE_URL}/functions/v1/nexora-mercadopago-webhook`;
const allowed=new Set((Deno.env.get("NEXORA_ALLOWED_ORIGINS")||APP).split(",").map(x=>x.trim()).filter(Boolean));

function cors(req:Request){const origin=req.headers.get("origin")||"";return {"Access-Control-Allow-Origin":allowed.has(origin)?origin:APP,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Max-Age":"86400","Vary":"Origin"}}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...cors(req)}})}
async function rest(path:string,init:RequestInit={}){const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,"Content-Type":"application/json","Accept-Profile":"nexora","Content-Profile":"nexora",...(init.headers||{})}});const text=await response.text();const data=text?JSON.parse(text):null;if(!response.ok)throw new Error(data?.message||`DB ${response.status}`);return data}
async function userFrom(req:Request){const authorization=req.headers.get("authorization")||"";if(!authorization.startsWith("Bearer "))return null;const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SERVICE,Authorization:authorization}});return response.ok?await response.json():null}

Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method_not_allowed"},405);
  const origin=req.headers.get("origin");
  if(origin&&!allowed.has(origin))return json(req,{error:"origin_not_allowed"},403);
  if(!MP)return json(req,{error:"mercadopago_not_configured"},503);
  try{
    const body=await req.json().catch(()=>({}));
    if(String(body?.website||"").trim())return json(req,{ok:true});
    const name=String(body?.name||"").trim().slice(0,120),email=String(body?.email||"").trim().toLowerCase().slice(0,254),amount=Number(body?.amount),message=String(body?.message||"").trim().slice(0,500)||null,publicListing=body?.public_listing===true;
    if(name.length<2)return json(req,{error:"name_required",message:"Informe seu nome."},422);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(req,{error:"email_required",message:"Informe um e-mail válido."},422);
    if(!Number.isFinite(amount)||amount<1||amount>100000)return json(req,{error:"invalid_amount",message:"Você pode contribuir com qualquer valor a partir de R$ 1."},422);
    const user=await userFrom(req);
    let supporter=(await rest(`supporters?email=eq.${encodeURIComponent(email)}&select=*&limit=1`))?.[0];
    if(!supporter)supporter=(await rest("supporters",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({user_id:user?.id||null,name,email,message,public_listing:publicListing})}))?.[0];
    else await rest(`supporters?id=eq.${supporter.id}`,{method:"PATCH",body:JSON.stringify({name,message,public_listing:publicListing,user_id:supporter.user_id||user?.id||null,updated_at:new Date().toISOString()})});
    const donation=(await rest("donations",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({supporter_id:supporter.id,user_id:user?.id||null,amount:Number(amount.toFixed(2)),payer_email:email,donor_name:name,message,status:"pending",provider:"mercadopago"})}))[0];
    const preference={items:[{id:`nexora-donation-${donation.id}`,title:"Contribuição voluntária — Nexora Academy",description:"Ajude a manter a educação gratuita",quantity:1,currency_id:"BRL",unit_price:Number(amount.toFixed(2))}],payer:{name,email},external_reference:`nexora-donation:${donation.id}`,notification_url:WEBHOOK,back_urls:{success:`${APP}/pages/apoie.html?payment=success`,pending:`${APP}/pages/apoie.html?payment=pending`,failure:`${APP}/pages/apoie.html?payment=failure`},auto_return:"approved",payment_methods:{installments:12},metadata:{project:"nexora",donation_id:donation.id,supporter_id:supporter.id}};
    const response=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${MP}`,"Content-Type":"application/json"},body:JSON.stringify(preference)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){await rest(`donations?id=eq.${donation.id}`,{method:"PATCH",body:JSON.stringify({status:"rejected",updated_at:new Date().toISOString()})});return json(req,{error:"mercadopago_error",message:"Não foi possível abrir o Mercado Pago."},502)}
    await rest(`donations?id=eq.${donation.id}`,{method:"PATCH",body:JSON.stringify({provider_preference_id:String(data.id),updated_at:new Date().toISOString()})});
    if(typeof data.init_point!=="string"||!data.init_point.startsWith("https://"))throw new Error("invalid_checkout_url");
    return json(req,{ok:true,donation_id:donation.id,preference_id:data.id,init_point:data.init_point});
  }catch(error){console.error(JSON.stringify({event:"nexora_donation_error",message:error instanceof Error?error.message:String(error)}));return json(req,{error:"internal_error",message:"Não foi possível iniciar a contribuição."},500)}
});
