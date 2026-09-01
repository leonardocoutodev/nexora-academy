import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;const MP=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";const WEBHOOK_SECRET=Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")||"";const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json"}});
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,"Content-Type":"application/json","Accept-Profile":"nexora","Content-Profile":"nexora",...(init.headers||{})}});const t=await r.text();const d=t?JSON.parse(t):null;if(!r.ok)throw new Error(d?.message||`DB ${r.status}`);return d}
function signatureParts(value:string){const out:Record<string,string>={};for(const part of value.split(",")){const i=part.indexOf("=");if(i>0)out[part.slice(0,i).trim()]=part.slice(i+1).trim()}return out}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function hmacHex(secret:string,message:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));return Array.from(new Uint8Array(signature)).map(x=>x.toString(16).padStart(2,"0")).join("")}
async function validSignature(req:Request,dataId:string){if(!WEBHOOK_SECRET)return false;const parts=signatureParts(req.headers.get("x-signature")||""),requestId=(req.headers.get("x-request-id")||"").trim(),ts=(parts.ts||"").trim(),expected=(parts.v1||"").trim().toLowerCase();if(!ts||!expected||!requestId||!dataId)return false;const manifest=`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;return safeEqual(await hmacHex(WEBHOOK_SECRET,manifest),expected)}

function mappedStatus(status:string){if(status==="approved")return "paid";if(status==="rejected")return "rejected";if(status==="cancelled")return "cancelled";if(status==="refunded")return "refunded";if(status==="charged_back")return "chargeback";return "pending"}
Deno.serve(async req=>{
  if(req.method!=="POST"&&req.method!=="GET")return json({error:"method_not_allowed"},405);
  if(!MP)return json({error:"mercadopago_not_configured"},503);
  if(!WEBHOOK_SECRET)return json({error:"webhook_secret_not_configured"},503);
  try{
    const url=new URL(req.url),body=req.method==="POST"?await req.json().catch(()=>({})):{};
    const type=String(body?.type||body?.topic||url.searchParams.get("type")||url.searchParams.get("topic")||"");
    const paymentId=String(body?.data?.id||url.searchParams.get("data.id")||url.searchParams.get("id")||"");
    if(type&&type!=="payment")return json({ok:true,ignored:true});
    if(!paymentId)return json({ok:true,ignored:true});
    if(!(await validSignature(req,paymentId)))return json({error:"invalid_signature"},401);

    const pr=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${MP}`}});
    if(!pr.ok)return json({error:"payment_lookup_failed"},502);
    const payment=await pr.json(),ref=String(payment?.external_reference||"");
    if(!ref.startsWith("lc-pro-order:"))return json({ok:true,ignored:true});
    const orderId=ref.slice("lc-pro-order:".length);
    const order=(await rest(`commerce_orders?id=eq.${encodeURIComponent(orderId)}&select=id,user_id,product_id,amount_cents,currency,status,paid_at,affiliate_id,affiliate_code,affiliate_commission_bps&limit=1`))?.[0];
    if(!order)return json({error:"order_not_found"},404);

    const paidCents=Math.round(Number(payment?.transaction_amount||0)*100),currency=String(payment?.currency_id||"");
    if(paidCents!==Number(order.amount_cents)||currency!==String(order.currency)){
      console.error(JSON.stringify({event:"lc_pro_payment_mismatch",order_id:order.id,payment_id:paymentId}));
      return json({error:"payment_mismatch"},409);
    }

    const status=mappedStatus(String(payment?.status||"")),patch:any={provider_payment_id:paymentId,status,updated_at:new Date().toISOString()};
    if(status==="paid"&&!order.paid_at)patch.paid_at=new Date().toISOString();
    await rest(`commerce_orders?id=eq.${order.id}`,{method:"PATCH",body:JSON.stringify(patch)});
    const links=await rest(`commerce_product_courses?product_id=eq.${order.product_id}&select=course_id,position&order=position.asc`);

    if(status==="refunded"||status==="chargeback"){
      await rest(`course_entitlements?user_id=eq.${order.user_id}&order_id=eq.${order.id}`,{method:"PATCH",body:JSON.stringify({status:"revoked",revoked_at:new Date().toISOString()})});
      for(const link of links||[]){
        const active=await rest(`course_entitlements?user_id=eq.${order.user_id}&course_id=eq.${link.course_id}&status=eq.active&select=id&limit=1`);
        if(!active?.length)await rest(`enrollments?user_id=eq.${order.user_id}&course_id=eq.${link.course_id}`,{method:"PATCH",body:JSON.stringify({status:"cancelled",completed_at:null})});
      }
      await rest("rpc/service_reverse_affiliate_commission",{method:"POST",body:JSON.stringify({p_order_id:order.id})}).catch(()=>null);
      console.log(JSON.stringify({event:"lc_pro_access_revoked",order_id:order.id,payment_id:paymentId,user_id:order.user_id,status,courses:(links||[]).length}));
      return json({ok:true,status,access_revoked:true});
    }
    if(status!=="paid")return json({ok:true,status});

    for(const link of links||[]){
      await rest("course_entitlements?on_conflict=user_id,course_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:order.user_id,course_id:link.course_id,product_id:order.product_id,order_id:order.id,source:"purchase",status:"active",granted_at:new Date().toISOString(),expires_at:null,revoked_at:null})});
      const course=(await rest(`courses?id=eq.${link.course_id}&select=id,status,access_tier&limit=1`))?.[0];
      if(course?.status==="published"&&course?.access_tier==="pro"){
        await rest("enrollments?on_conflict=user_id,course_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:order.user_id,course_id:link.course_id,status:"active",enrolled_at:new Date().toISOString()})});
      }
    }
    const commission=await rest("rpc/service_record_affiliate_commission",{method:"POST",body:JSON.stringify({p_order_id:order.id})}).catch(()=>null);
    console.log(JSON.stringify({event:"lc_pro_access_granted",order_id:order.id,payment_id:paymentId,user_id:order.user_id,product_id:order.product_id,courses:(links||[]).length,affiliate_commission:commission}));
    return json({ok:true,status:"paid",access_granted:true,affiliate_commission_recorded:!!commission?.created});
  }catch(error){
    console.error(JSON.stringify({event:"lc_pro_webhook_error",message:error instanceof Error?error.message:String(error)}));
    return json({error:"internal_error"},500);
  }
});