import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP=Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")||"";
const APP=(Deno.env.get("LC_APP_URL")||"https://academy.learnandcreate.workers.dev").replace(/\/$/,"");
const WEBHOOK=`${SUPABASE_URL}/functions/v1/lc-pro-mercadopago-webhook`;
const allowed=new Set([APP,"https://academy.learnandcreate.workers.dev"]);
function cors(req:Request){const origin=req.headers.get("origin")||"";const allow=allowed.has(origin)?origin:APP;return {"Access-Control-Allow-Origin":allow,"Vary":"Origin","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Max-Age":"86400"}}
const json=(req:Request,b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json",...cors(req)}});
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,"Content-Type":"application/json","Accept-Profile":"nexora","Content-Profile":"nexora",...(init.headers||{})}});const t=await r.text();const d=t?JSON.parse(t):null;if(!r.ok)throw new Error(d?.message||`DB ${r.status}`);return d}
async function userFrom(req:Request){const auth=req.headers.get("authorization")||"";if(!auth.startsWith("Bearer "))return null;const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SERVICE,Authorization:auth}});return r.ok?await r.json():null}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method_not_allowed"},405);
  if(!MP)return json(req,{error:"mercadopago_not_configured",message:"Pagamento ainda não está disponível."},503);
  try{
    const user=await userFrom(req);
    if(!user)return json(req,{error:"unauthorized",message:"Entre na sua conta para continuar."},401);
    const body=await req.json().catch(()=>({}));
    const slug=String(body?.product_slug||"").trim();
    if(!slug)return json(req,{error:"product_required",message:"Produto não informado."},422);

    const product=(await rest(`commerce_products?slug=eq.${encodeURIComponent(slug)}&select=id,slug,title,description,currency,list_price_cents,current_price_cents,affiliate_commission_bps,sales_status,checkout_provider&limit=1`))?.[0];
    if(!product)return json(req,{error:"product_not_found",message:"Formação não encontrada."},404);
    if(product.sales_status!=="active")return json(req,{error:"sales_not_active",message:"Esta formação ainda está em preparação. Nenhuma cobrança foi iniciada."},409);
    if(product.checkout_provider!=="mercadopago")return json(req,{error:"provider_not_available",message:"Checkout indisponível."},409);

    const links=await rest(`commerce_product_courses?product_id=eq.${product.id}&select=course_id,position&order=position.asc`);
    if(!links?.length)return json(req,{error:"product_not_ready",message:"A formação ainda não está vinculada ao conteúdo acadêmico."},409);
    const courseIds=links.map((x:any)=>x.course_id);
    const entitlements=await rest(`course_entitlements?user_id=eq.${user.id}&status=eq.active&course_id=in.(${courseIds.join(",")})&select=course_id`);
    if(entitlements?.length===courseIds.length)return json(req,{ok:true,already_owned:true,message:"Você já possui acesso a esta formação."});

    let affiliateId:null|string=null,affiliateCode:null|string=null,affiliateBps:null|number=null,attributionCapturedAt:null|string=null;
    const candidate=String(body?.affiliate_code||"").trim().toUpperCase();
    const capturedRaw=String(body?.affiliate_captured_at||"").trim();
    if(/^[A-Z0-9]{8,20}$/.test(candidate)&&capturedRaw){
      const captured=new Date(capturedRaw),now=Date.now();
      const cfg=(await rest("affiliate_program_settings?singleton=eq.true&enabled=eq.true&select=attribution_days&limit=1"))?.[0];
      const maxAge=Math.max(1,Number(cfg?.attribution_days||30))*86400000;
      if(Number.isFinite(captured.getTime())&&captured.getTime()<=now+600000&&now-captured.getTime()<=maxAge){
        const affiliate=(await rest(`affiliate_profiles?code=eq.${encodeURIComponent(candidate)}&status=eq.active&select=id,user_id,code,commission_bps_override&limit=1`))?.[0];
        if(affiliate&&affiliate.user_id!==user.id){
          affiliateId=affiliate.id;affiliateCode=affiliate.code;attributionCapturedAt=captured.toISOString();
          affiliateBps=Math.max(0,Math.min(10000,Number(affiliate.commission_bps_override??product.affiliate_commission_bps??0)));
        }
      }
    }

    const orderBody:any={user_id:user.id,product_id:product.id,amount_cents:product.current_price_cents,currency:product.currency,provider:"mercadopago",status:"pending"};
    if(affiliateId&&affiliateBps){
      orderBody.affiliate_id=affiliateId;orderBody.affiliate_code=affiliateCode;orderBody.affiliate_commission_bps=affiliateBps;
      orderBody.attribution_session_id=String(body?.attribution_session_id||"").slice(0,96)||null;
      orderBody.attribution_captured_at=attributionCapturedAt;
    }
    const order=(await rest("commerce_orders",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(orderBody)}))?.[0];
    if(!order)throw new Error("order_creation_failed");

    const payload={items:[{id:product.slug,title:product.title,description:product.description||"Formação LC Pro",quantity:1,currency_id:product.currency,unit_price:Number(product.current_price_cents)/100}],payer:{email:user.email},external_reference:`lc-pro-order:${order.id}`,notification_url:WEBHOOK,back_urls:{success:`${APP}/pages/pro.html?slug=${encodeURIComponent(product.slug)}&payment=success`,pending:`${APP}/pages/pro.html?slug=${encodeURIComponent(product.slug)}&payment=pending`,failure:`${APP}/pages/pro.html?slug=${encodeURIComponent(product.slug)}&payment=failure`},auto_return:"approved",payment_methods:{installments:12},metadata:{project:"lc_pro",order_id:order.id,user_id:user.id,product_id:product.id,affiliate_code:affiliateCode||undefined}};
    const mp=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${MP}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await mp.json().catch(()=>({}));
    if(!mp.ok){
      await rest(`commerce_orders?id=eq.${order.id}`,{method:"PATCH",body:JSON.stringify({status:"rejected",updated_at:new Date().toISOString()})});
      return json(req,{error:"mercadopago_error",message:data?.message||data?.error||"Não foi possível abrir o checkout."},502);
    }
    await rest(`commerce_orders?id=eq.${order.id}`,{method:"PATCH",body:JSON.stringify({provider_preference_id:String(data.id),updated_at:new Date().toISOString()})});
    return json(req,{ok:true,order_id:order.id,preference_id:data.id,init_point:data.init_point,sandbox_init_point:data.sandbox_init_point||null,affiliate_attributed:!!affiliateId});
  }catch(error){
    console.error(JSON.stringify({event:"lc_pro_checkout_error",message:error instanceof Error?error.message:String(error)}));
    return json(req,{error:"internal_error",message:"Não foi possível iniciar a compra."},500);
  }
});