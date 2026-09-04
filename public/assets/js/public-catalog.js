(async()=>{
  if(!window.LCSupabase)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const moneyMinutes=mins=>{const n=Number(mins||0);if(!n)return'';const h=Math.max(1,Math.round(n/60));return h+'h aprox.'};
  let courses=[];
  try{
    courses=await LCSupabase.rpc('public_catalog_courses');
    if(!Array.isArray(courses))courses=[];
  }catch(error){
    document.querySelectorAll('[data-public-catalog-state]').forEach(el=>{el.textContent='Não foi possível carregar o catálogo agora.';el.hidden=false});
    return;
  }

  const free=courses.filter(c=>c.access_tier==='free');
  const paid=courses.filter(c=>c.access_tier==='pro');
  document.querySelectorAll('[data-public-free-count]').forEach(el=>el.textContent=free.length);
  document.querySelectorAll('[data-public-paid-count]').forEach(el=>el.textContent=paid.length);
  document.querySelectorAll('[data-public-total-count]').forEach(el=>el.textContent=courses.length);

  const grid=document.querySelector('#publicCatalogGrid');
  if(!grid)return;

  const search=document.querySelector('#publicCatalogSearch');
  const category=document.querySelector('#publicCatalogCategory');
  const level=document.querySelector('#publicCatalogLevel');
  const tabs=[...document.querySelectorAll('[data-offer-filter]')];
  let offer='all';

  const categories=[...new Set(courses.map(c=>String(c.category_label||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(category)category.innerHTML='<option value="">Todas as áreas</option>'+categories.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  const levels=[...new Set(courses.map(c=>String(c.level_label||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(level)level.innerHTML='<option value="">Todos os níveis</option>'+levels.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');

  function card(c){
    const isPaid=c.access_tier==='pro';
    const href=c.slug==='lc-pro-programador-full-stack'?'../programador-full-stack-pro/':c.slug+'/';
    const label=isPaid?'FORMAÇÃO PAGA':'ACESSO GRATUITO';
    const cta=isPaid?'Conhecer formação →':'Começar gratuitamente →';
    const meta=[
      Number(c.module_count||0)+' módulos',
      Number(c.lesson_count||0)+' aulas',
      moneyMinutes(c.estimated_minutes)
    ].filter(Boolean);
    return '<article class="lc-market-card '+(isPaid?'paid':'free')+'" data-tier="'+esc(c.access_tier)+'" data-category="'+esc(c.category_label||'')+'">'+
      '<span class="offer-tag">'+label+'</span>'+
      '<h3>'+esc(c.title)+'</h3>'+
      '<p>'+esc(c.description|| (isPaid?'Formação profissional completa, com acesso liberado após matrícula.':'Curso gratuito para estudar no seu ritmo.'))+'</p>'+
      '<div class="meta">'+meta.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>'+
      '<div class="card-actions"><a class="v3-btn '+(isPaid?'':'secondary')+'" href="'+href+'">'+cta+'</a></div>'+
    '</article>';
  }

  function render(){
    const q=normalize(search?.value||'');
    const cat=category?.value||'';
    const lvl=level?.value||'';
    const rows=courses.filter(c=>{
      const matchesOffer=offer==='all'||(offer==='free'&&c.access_tier==='free')||(offer==='paid'&&c.access_tier==='pro');
      const hay=normalize([c.title,c.description,c.category_label,c.level_label].join(' '));
      return matchesOffer&&(!q||hay.includes(q))&&(!cat||c.category_label===cat)&&(!lvl||c.level_label===lvl);
    });
    grid.innerHTML=rows.length?rows.map(card).join(''):'<div class="academic-empty">Nenhuma formação encontrada com esses filtros.</div>';
    const count=document.querySelector('#publicCatalogCount');if(count)count.textContent=rows.length;
    document.querySelectorAll('[data-public-catalog-state]').forEach(el=>el.hidden=true);
  }

  tabs.forEach(btn=>btn.onclick=()=>{
    offer=btn.dataset.offerFilter||'all';
    tabs.forEach(x=>x.classList.toggle('active',x===btn));
    render();
  });
  [search,category,level].filter(Boolean).forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));
  render();
})();