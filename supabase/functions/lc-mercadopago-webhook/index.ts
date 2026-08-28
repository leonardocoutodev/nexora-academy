import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json"}});

async function rest(path:string,init:RequestInit={}){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{
    apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,"Content-Type":"application/json",
    "Accept-Profile":"nexora","Content-Profile":"nexora",...(init.headers||{})
  }});
  const t=await r.text(); const d=t?JSON.parse(t):null;
  if(!r.ok)throw new Error(d?.message||`DB ${r.status}`);
  return d;
}

Deno.serve(async req=>{
  if(req.method!=="POST")return json({ok:true});
  try{
    const url=new URL(req.url);
    const body=await req.json().catch(()=>({}));
    const type=String(body?.type||url.searchParams.get("type")||body?.topic||"");
    const paymentId=String(body?.data?.id||url.searchParams.get("data.id")||body?.id||"");
    if(!paymentId||!type.includes("payment"))return json({ok:true,ignored:true});
    if(!MP)return json({ok:false,error:"mercadopago_not_configured"},503);

    const r=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${MP}`}});
    if(!r.ok)return json({ok:true,ignored:true,reason:"payment_not_found"});
    const p=await r.json();
    const ext=String(p?.external_reference||"");
    const project=String(p?.metadata?.project||"");
    const lcRef=ext.startsWith("lc-donation:");
    const legacyRef=ext.startsWith("nexora-donation:");
    const donationId=String(p?.metadata?.donation_id||((lcRef||legacyRef)?ext.split(":")[1]:""));
    if(project!=="lc"&&project!=="nexora"&&!lcRef&&!legacyRef)return json({ok:true,ignored:true,reason:"not_lc"});
    if(!donationId)return json({ok:true,ignored:true,reason:"donation_id_missing"});

    const rows=await rest(`donations?id=eq.${encodeURIComponent(donationId)}&select=id,supporter_id,status&limit=1`);
    const donation=rows?.[0];
    if(!donation)return json({ok:true,ignored:true,reason:"donation_not_found"});

    let status=String(p.status||"unknown");
    if(!["pending","approved","rejected","cancelled","refunded","in_process"].includes(status))status="unknown";
    await rest(`donations?id=eq.${donation.id}`,{method:"PATCH",body:JSON.stringify({
      provider_payment_id:String(p.id),status,payment_method:String(p.payment_method_id||""),
      approved_at:status==="approved"?(p.date_approved||new Date().toISOString()):null,updated_at:new Date().toISOString()
    })});

    const approved=await rest(`donations?supporter_id=eq.${donation.supporter_id}&status=eq.approved&select=amount,approved_at`);
    const total=(approved||[]).reduce((s:number,x:any)=>s+Number(x.amount||0),0);
    const count=(approved||[]).length;
    const last=(approved||[]).map((x:any)=>x.approved_at).filter(Boolean).sort().pop()||null;
    await rest(`supporters?id=eq.${donation.supporter_id}`,{method:"PATCH",body:JSON.stringify({
      total_donated:Number(total.toFixed(2)),donation_count:count,last_donation_at:last,updated_at:new Date().toISOString()
    })});
    return json({ok:true,status});
  }catch(error){
    console.error(JSON.stringify({event:"lc_webhook_error",message:error instanceof Error?error.message:String(error)}));
    return json({ok:false,error:"internal_error"},500);
  }
});