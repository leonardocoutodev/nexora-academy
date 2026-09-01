(()=>{
  const fmt=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
  const device=v=>({mobile:'Celular',tablet:'Tablet',desktop:'Desktop',unknown:'Não identificado'}[v]||v||'—');
  const safe=v=>window.esc?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  async function load(){
    const panel=document.querySelector('[data-admin-panel="analytics"]');
    if(!panel||!window.LCSupabase)return;
    let host=document.querySelector('#publicLandingAnalytics');
    if(!host){
      host=document.createElement('section');
      host.id='publicLandingAnalytics';
      host.className='card card-pad lc-analytics-section';
      host.innerHTML='<div class="v3-section-head"><div><div class="eyebrow">PÁGINA DE VENDAS</div><h3>Quem está chegando à LC</h3><p class="muted">Visitas à página pública, origem, dispositivo e identificação quando a própria pessoa posteriormente entra ou cria uma conta na mesma sessão. Sessões que nunca se identificam permanecem anônimas.</p></div></div><div id="landingVisitorMetrics" class="v3-metrics lc-analytics-metrics"></div><div id="landingVisitorList" class="lc-admin-stack"><div class="loading">Carregando acessos públicos</div></div>';
      const firstSection=panel.querySelector('.lc-analytics-section');
      if(firstSection)panel.insertBefore(host,firstSection);else panel.appendChild(host);
    }
    const list=document.querySelector('#landingVisitorList'),metrics=document.querySelector('#landingVisitorMetrics');
    try{
      const days=Number(document.querySelector('#analyticsDays')?.value||30);
      const me=await LCSupabase.user();
      const rows=await LCSupabase.rpc('admin_analytics_public_visitors',{p_days:days});
      const all=Array.isArray(rows)?rows:[];
      const others=all.filter(r=>!r.user_id||r.user_id!==me?.id);
      const identified=others.filter(r=>r.user_id);
      const anonymous=others.filter(r=>!r.user_id);
      const views=others.reduce((s,r)=>s+Number(r.page_views||0),0);
      const clicks=others.reduce((s,r)=>s+Number(r.cta_clicks||0),0);
      metrics.innerHTML='<div class="v3-metric"><small>Sessões além de mim</small><strong>'+others.length+'</strong></div><div class="v3-metric"><small>Identificadas</small><strong>'+identified.length+'</strong></div><div class="v3-metric"><small>Anônimas</small><strong>'+anonymous.length+'</strong></div><div class="v3-metric"><small>Visualizações</small><strong>'+views+'</strong></div><div class="v3-metric"><small>Cliques em CTA</small><strong>'+clicks+'</strong></div>';
      list.innerHTML=others.length?others.map(r=>'<article class="lc-admin-history"><span><b>'+safe(r.full_name||'Sessão anônima')+'</b><small>'+(r.user_id?'Usuário identificado':'Não se identificou')+' • '+safe(device(r.device_type))+'</small></span><span><b>'+safe(r.referrer_host||r.utm_source||'Acesso direto')+'</b><small>'+(r.utm_campaign?'Campanha: '+safe(r.utm_campaign):'Origem')+'</small></span><span><b>'+Number(r.page_views||0)+' visita(s)</b><small>'+Number(r.cta_clicks||0)+' clique(s) em CTA</small></span><small>Primeiro: '+safe(fmt(r.first_seen))+'<br>Último: '+safe(fmt(r.last_seen))+'</small></article>').join(''):'<div class="lc-admin-empty">Ainda não há visitas registradas à página pública além das suas neste período. A coleta desta página começa a partir desta atualização.</div>';
    }catch(e){list.innerHTML='<div class="v3-feedback bad">'+safe(e.message)+'</div>'}
  }

  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(window.LCSupabase&&document.querySelector('[data-admin-panel="analytics"]')){clearInterval(timer);load();document.querySelector('#analyticsDays')?.addEventListener('change',()=>setTimeout(load,0));}
      else if(tries>80)clearInterval(timer);
    },100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
