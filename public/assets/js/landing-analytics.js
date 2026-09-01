(()=>{
  if(!window.LCAnalytics)return;
  const pageEventKey='landing-page-view';
  window.LCAnalytics.once(pageEventKey,()=>window.LCAnalytics.track('landing_page_viewed',{}, {
    page_kind:'sales_landing'
  }));

  document.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(!link)return;
    const href=link.getAttribute('href')||'';
    const isPrimaryCTA=/cadastro\.html|login\.html|apoie\.html/.test(href);
    if(!isPrimaryCTA)return;
    const label=(link.textContent||'').trim().replace(/\s+/g,' ').slice(0,120);
    window.LCAnalytics.track('landing_cta_clicked',{}, {
      page_kind:'sales_landing',
      cta_label:label,
      target_path:href.slice(0,220)
    }).catch(()=>{});
  },{capture:true});
})();
