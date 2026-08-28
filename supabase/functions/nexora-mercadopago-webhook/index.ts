import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
const SECRET=Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")||"";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
async function rest(path:string,init:RequestInit={}){const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,"Content-Type":"application/json","Accept-Profile":"nexora","Content-Profile":"nexora",...(init.headers||{})}});const text=await response.text();const data=text?JSON.parse(text):null;if(!response.ok)throw new Error(data?.message||`DB ${response.status}`);return data}
function constantTimeEqual(a:string,b:string){if(a.length!==b.length)return false;let result=0;for(let i=0;i<a.length;i++)result|=a.charCodeAt(i)^b.charCodeAt(i);return result===0}
async function validSignature(req:Request,dataId:string){if(!SECRET)return false;const parts=Object.fromEntries((req.headers.get("x-signature")||"").split(",").map(part=>part.trim().split("=",2)));const requestId=req.headers.get("x-request-id")||"";if(!parts.ts||!parts.v1)return false;const normalized=dataId.toLowerCase();const manifest=`${normalized?`id:${normalized};`:""}${requestId?`request-id:${requestId};`:""}ts:${parts.ts};`;const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(manifest)));const expected=[...bytes].map(value=>value.toString(16).padStart(2,"0")).join("");return constantTimeEqual(expected,parts.v1)}

Deno.serve(async req=>{
  if(req.method!=="POST")return json({ok:true});
  try{
    const url=new URL(req.url),body=await req.json().catch(()=>({}));
    const type=String(body?.type||url.searchParams.get("type")||body?.topic||"");
    const paymentId=String(url.searchParams.get("data.id")||body?.data?.id||body?.id||"");
    if(!paymentId||!type.includes("payment"))return json({ok:true,ignored:true});
    if(!await validSignature(req,paymentId))return json({ok:false,error:"invalid_signature"},401);
    if(!MP)return json({ok:false,error:"mercadopago_not_configured"},503);
    const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${MP}`}});
    if(!response.ok)return json({ok:true,ignored:true,reason:"payment_not_found"});
    const payment=await response.json(),external=String(payment?.external_reference||""),project=String(payment?.metadata?.project||"");
    const donationId=String(payment?.metadata?.donation_id||(external.startsWith("nexora-donation:")?external.split(":")[1]:""));
    if(project!=="nexora"&&!external.startsWith("nexora-donation:"))return json({ok:true,ignored:true,reason:"not_nexora"});
    if(!donationId)return json({ok:true,ignored:true,reason:"donation_id_missing"});
    const donation=(await rest(`donations?id=eq.${encodeURIComponent(donationId)}&select=id,supporter_id,status&limit=1`))?.[0];
    if(!donation)return json({ok:true,ignored:true,reason:"donation_not_found"});
    let status=String(payment.status||"unknown");if(!["pending","approved","rejected","cancelled","refunded","in_process"].includes(status))status="unknown";
    await rest(`donations?id=eq.${donation.id}`,{method:"PATCH",body:JSON.stringify({provider_payment_id:String(payment.id),status,payment_method:String(payment.payment_method_id||""),approved_at:status==="approved"?(payment.date_approved||new Date().toISOString()):null,updated_at:new Date().toISOString()})});
    const approved=await rest(`donations?supporter_id=eq.${donation.supporter_id}&status=eq.approved&select=amount,approved_at`),total=(approved||[]).reduce((sum:number,row:any)=>sum+Number(row.amount||0),0),last=(approved||[]).map((row:any)=>row.approved_at).filter(Boolean).sort().pop()||null;
    await rest(`supporters?id=eq.${donation.supporter_id}`,{method:"PATCH",body:JSON.stringify({total_donated:Number(total.toFixed(2)),donation_count:(approved||[]).length,last_donation_at:last,updated_at:new Date().toISOString()})});
    return json({ok:true,status});
  }catch(error){console.error(JSON.stringify({event:"nexora_webhook_error",message:error instanceof Error?error.message:String(error)}));return json({ok:false,error:"internal_error"},500)}
});
