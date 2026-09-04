const LC_APP_SHELL_URL=document.currentScript?.src||'';
(()=>{if(document.querySelector('link[data-lc-commerce]'))return;const l=document.createElement('link');l.rel='stylesheet';l.dataset.lcCommerce='1';l.href=LC_APP_SHELL_URL?new URL('../css/commerce.css',LC_APP_SHELL_URL).href:'../assets/css/commerce.css';document.head.appendChild(l)})();
let __lcAnalyticsPromise=null;
function ensureLCAnalytics(){if(window.LCAnalytics)return Promise.resolve(window.LCAnalytics);if(__lcAnalyticsPromise)return __lcAnalyticsPromise;__lcAnalyticsPromise=new Promise(resolve=>{const s=document.createElement('script');s.src=LC_APP_SHELL_URL?new URL('analytics.js',LC_APP_SHELL_URL).href:'../assets/js/analytics.js';s.onload=()=>resolve(window.LCAnalytics||null);s.onerror=()=>resolve(null);document.head.appendChild(s)});return __lcAnalyticsPromise}
const LC_ICON_PATHS={
  dashboard:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5.5h5V20"/>',
  courses:'<path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12.5H7.5A2.5 2.5 0 0 1 5 17z"/><path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H19"/><path d="M8.5 8h6.5"/>',
  start:'<circle cx="12" cy="12" r="8.5"/><path d="m14.7 9.3-1.8 4.1-4.1 1.8 1.8-4.1z"/>',
  projects:'<path d="M8 4h8"/><path d="M9 4v3.2L5.5 18a1.5 1.5 0 0 0 1.4 2h10.2a1.5 1.5 0 0 0 1.4-2L15 7.2V4"/><path d="M8 14h8"/>',
  library:'<path d="M5 4.5h6v15H5z"/><path d="M13 4.5h6v15h-6z"/><path d="M7.5 8h1"/><path d="M15.5 8h1"/>',
  certs:'<circle cx="12" cy="10" r="5"/><path d="m9 14-1 6 4-2 4 2-1-6"/>',
  profile:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/>',
  support:'<path d="M20 8.8c0 5.2-8 10.2-8 10.2S4 14 4 8.8A4.3 4.3 0 0 1 12 6a4.3 4.3 0 0 1 8 2.8Z"/>',
  affiliate:'<circle cx="9" cy="9" r="3"/><path d="M3.8 19c.5-3 2.3-4.8 5.2-4.8s4.7 1.8 5.2 4.8"/><path d="M15 7h6"/><path d="m18 4 3 3-3 3"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  logout:'<path d="M10 5H5v14h5"/><path d="M13 8l4 4-4 4"/><path d="M8 12h9"/>'
};
function lcIcon(name,label=''){const paths=LC_ICON_PATHS[name]||LC_ICON_PATHS.start;return '<svg class="lc-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" '+(label?'role="img" aria-label="'+label+'"':'aria-hidden="true"')+'>'+paths+'</svg>'}
function applyLCNavigationIcons(root=document){
  const map={dashboard:'dashboard',courses:'courses',formations:'courses',start:'start',projects:'projects',library:'library',certs:'certs',profile:'profile',affiliate:'affiliate'};
  root.querySelectorAll('[data-nav]').forEach(a=>{const slot=a.querySelector(':scope > span:first-child');if(slot&&map[a.dataset.nav])slot.innerHTML=lcIcon(map[a.dataset.nav])});
  root.querySelectorAll('[data-more-nav]').forEach(a=>{const slot=a.querySelector(':scope > span:first-child');if(slot&&map[a.dataset.moreNav])slot.innerHTML=lcIcon(map[a.dataset.moreNav])});
}
function enhanceLCShell(active='dashboard'){
  qsa('.brand').forEach(el=>{el.innerHTML='<img src="../assets/brand/lc-mark.svg" alt="LC"><span class="lc-brand-signature">Learn <span class="lc-brand-amp">&amp;</span> Create</span>'});
  const side=qs('.sidebar');if(!side)return;side.setAttribute('aria-label','Navegação principal');const courseLink=qs('[data-nav="courses"]',side);if(courseLink){const label=courseLink.querySelector('span:last-child');if(label)label.textContent='Catálogo'}
  const nav=qs('nav',side);
  if(nav&&!qs('[data-nav="start"]',nav)){const first=nav.querySelector('a');const a=document.createElement('a');a.href='comece-aqui.html';a.dataset.nav='start';a.innerHTML='<span>'+lcIcon('start')+'</span><span>Comece aqui</span>';if(first)first.after(a);else nav.appendChild(a)}
  if(nav&&!qs('.sidebar-extra',side)){
    const extra=document.createElement('div');extra.className='sidebar-extra';
    extra.innerHTML='<a data-nav="affiliate" href="painel-afiliado.html" class="lc-sidebar-affiliate"><span>'+lcIcon('affiliate')+'</span><span>Afiliados</span></a><a href="apoie.html" class="lc-sidebar-support"><span>'+lcIcon('support')+'</span><span>Apoie a LC</span></a>';
    nav.after(extra);
  }
  let foot=qs('.side-footer',side);if(!foot){foot=document.createElement('div');foot.className='side-footer';side.appendChild(foot)}
  foot.innerHTML='<div id="sideGame" class="v3-gamification-mini"><div class="top"><span>NÍVEL <strong data-level>1</strong></span><span><strong data-xp>0</strong> XP</span></div><div class="v3-xpbar"><span data-xpbar style="width:0%"></span></div><div class="v3-streak"><span aria-hidden="true">🔥</span> <span data-streak>0</span> dias de sequência</div></div><div class="side-user"><span class="side-avatar" data-user-avatar>AL</span><div><b data-user-name>Aluno</b><small data-user-role>Estudante</small></div></div>';
  applyLCNavigationIcons(side);enhanceMobileNavigation(active);
}
function enhanceMobileNavigation(active='dashboard'){
  const nav=qs('.bottom-nav');if(!nav)return;
  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport&&!viewport.content.includes('viewport-fit=cover'))viewport.content+=',viewport-fit=cover';
  nav.classList.add('nx-mobile-nav');nav.setAttribute('aria-label','Navegação principal');
  nav.innerHTML='<a data-nav="dashboard" href="dashboard.html"><span>'+lcIcon('dashboard')+'</span><span>Início</span></a><a data-nav="courses" href="cursos.html"><span>'+lcIcon('courses')+'</span><span>Cursos</span></a><a data-nav="start" href="comece-aqui.html"><span>'+lcIcon('start')+'</span><span>Comece</span></a><a data-nav="projects" href="projetos.html"><span>'+lcIcon('projects')+'</span><span>Boss</span></a><button type="button" class="nx-mobile-more-toggle" aria-haspopup="dialog" aria-expanded="false"><span>'+lcIcon('more')+'</span><span>Mais</span></button>';
  qsa('[data-nav]',nav).forEach(el=>{const on=el.dataset.nav===active;el.classList.toggle('active',on);if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
  const moreButton=qs('.nx-mobile-more-toggle',nav),moreActive=['formations','library','certs','profile','affiliate'].includes(active);if(moreActive){moreButton.classList.add('active');moreButton.setAttribute('aria-current','page')}
  document.querySelector('.nx-mobile-more')?.remove();
  const panel=document.createElement('div');panel.className='nx-mobile-more';panel.hidden=true;panel.setAttribute('aria-hidden','true');
  panel.innerHTML='<div class="nx-mobile-more-backdrop" data-mobile-more-close></div><section class="nx-mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Mais opções"><div class="nx-mobile-more-handle" aria-hidden="true"></div><div class="nx-mobile-more-head"><div><div class="eyebrow">NAVEGAÇÃO</div><h2>Mais opções</h2></div><button class="nx-mobile-more-close" type="button" data-mobile-more-close aria-label="Fechar menu">×</button></div><div class="nx-mobile-more-grid"><a data-more-nav="formations" href="formacoes.html"><span>'+lcIcon('courses')+'</span><span><b>Minhas formações</b><small>Matrículas profissionais</small></span></a><a data-more-nav="library" href="biblioteca.html"><span>'+lcIcon('library')+'</span><span><b>Biblioteca</b><small>Apostilas e materiais</small></span></a><a data-more-nav="certs" href="certificados.html"><span>'+lcIcon('certs')+'</span><span><b>Certificados</b><small>Emitir e verificar</small></span></a><a data-more-nav="profile" href="perfil.html"><span>'+lcIcon('profile')+'</span><span><b>Perfil</b><small>Progresso e conta</small></span></a><a data-more-nav="affiliate" href="painel-afiliado.html"><span>'+lcIcon('affiliate')+'</span><span><b>Afiliados</b><small>Links e comissões</small></span></a><a href="apoie.html"><span>'+lcIcon('support')+'</span><span><b>Contribuir</b><small>Apoio voluntário</small></span></a></div><button class="nx-mobile-logout" type="button" data-mobile-logout>'+lcIcon('logout')+'<span>Sair da conta</span></button></section>';
  document.body.appendChild(panel);applyLCNavigationIcons(panel);panel.querySelector('[data-more-nav="'+active+'"]')?.classList.add('active');
  let restoreFocus=null,closeTimer=null;
  const close=()=>{if(panel.hidden)return;panel.classList.remove('open');panel.setAttribute('aria-hidden','true');moreButton.setAttribute('aria-expanded','false');document.body.classList.remove('nx-mobile-menu-open');document.querySelector('.app-shell')?.removeAttribute('inert');clearTimeout(closeTimer);closeTimer=setTimeout(()=>{panel.hidden=true;restoreFocus?.focus()},180)};
  const open=()=>{restoreFocus=document.activeElement;panel.hidden=false;panel.setAttribute('aria-hidden','false');moreButton.setAttribute('aria-expanded','true');document.body.classList.add('nx-mobile-menu-open');document.querySelector('.app-shell')?.setAttribute('inert','');requestAnimationFrame(()=>panel.classList.add('open'));setTimeout(()=>panel.querySelector('.nx-mobile-more-close')?.focus(),30)};
  moreButton.onclick=()=>panel.hidden?open():close();qsa('[data-mobile-more-close]',panel).forEach(el=>el.onclick=close);
  panel.querySelector('[data-mobile-logout]').onclick=async()=>{await LCSupabase.signOut();location.replace('login.html')};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close()});
}

function nxHash(value){let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function nxSvgText(value){return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]))}
function nxCourseInitials(title){
  const stop=new Set(['de','da','do','das','dos','e','em','com','para','a','o']);
  const words=String(title||'LC').trim().split(/\s+/).filter(Boolean).filter(w=>!stop.has(w.toLowerCase()));
  return (words.length>1?words.slice(0,3).map(w=>w[0]):[words[0]?.slice(0,3)||'LC']).join('').toUpperCase().slice(0,3);
}
function nxCourseDomain(title,category=''){
  const t=(String(title||'')+' '+String(category||'')).toLowerCase();
  if(/canva|design|gráfico|corel|projetista|arte/.test(t))return'DESIGN';
  if(/marketing|mídia|social|youtuber|vendedor digital|tráfego/.test(t))return'MÍDIA';
  if(/program|desenvolv|web|python|java|app|games|lógica|algorit|git|código/.test(t))return'CODE';
  if(/excel|word|office|windows|informática|computador/.test(t))return'DIGITAL';
  if(/finance|contáb|cobrança|caixa|crédito/.test(t))return'FIN';
  if(/rh|recursos humanos|liderança|pessoal|administr|empresarial|escritório|comercial|vendas|telemarketing/.test(t))return'GESTÃO';
  if(/farmácia|saúde/.test(t))return'SAÚDE';
  if(/logística|drone/.test(t))return'OPERAÇÃO';
  return String(category||'FORMAÇÃO').toUpperCase().slice(0,12);
}
function nxCourseVisual(title,category=''){
  const key=String(title||'LC')+'|'+String(category||''),h=nxHash(key),variant=h%5;
  const initials=nxSvgText(nxCourseInitials(title)),domain=nxSvgText(nxCourseDomain(title,category));
  const x1=80+(h%180),y1=48+((h>>>5)%110),x2=440+((h>>>9)%180),y2=170+((h>>>13)%120);
  const accent=variant%2===0?'#2878FF':'#38E6B0',accent2=variant%2===0?'#38E6B0':'#2878FF';
  const motif=[
    '<path d="M70 280 C210 110 370 360 700 120" fill="none" stroke="'+accent+'" stroke-width="3" opacity=".34"/><circle cx="'+x2+'" cy="'+y2+'" r="72" fill="none" stroke="'+accent2+'" opacity=".18"/>',
    '<g fill="none" stroke="'+accent+'" opacity=".26"><rect x="66" y="72" width="164" height="104" rx="18"/><rect x="520" y="178" width="170" height="110" rx="18"/></g><path d="M230 124H520" stroke="'+accent2+'" stroke-width="3" stroke-dasharray="9 13" opacity=".3"/>',
    '<circle cx="'+x1+'" cy="'+y1+'" r="96" fill="'+accent+'" opacity=".12"/><circle cx="'+x2+'" cy="'+y2+'" r="128" fill="'+accent2+'" opacity=".08"/><path d="M72 316H700" stroke="#9DACC1" opacity=".13"/>',
    '<g stroke="'+accent+'" fill="none" opacity=".25"><path d="M72 100h210v92H72z"/><path d="M490 154h212v128H490z"/><path d="M282 146h208"/></g><circle cx="386" cy="146" r="10" fill="'+accent2+'" opacity=".75"/>',
    '<path d="M40 278 210 74l136 154 124-102 250 190" fill="none" stroke="'+accent+'" stroke-width="4" opacity=".22"/><path d="M48 318H720" stroke="'+accent2+'" stroke-width="2" opacity=".2"/>'
  ][variant];
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 360" role="img" aria-label="'+nxSvgText(title)+'"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07111F"/><stop offset="1" stop-color="#0D1B2E"/></linearGradient><radialGradient id="glow"><stop stop-color="'+accent+'" stop-opacity=".22"/><stop offset="1" stop-color="'+accent+'" stop-opacity="0"/></radialGradient></defs><rect width="760" height="360" fill="url(#bg)"/><circle cx="'+x1+'" cy="'+y1+'" r="190" fill="url(#glow)"/>'+motif+'<g font-family="Inter,Segoe UI,Arial,sans-serif"><text x="58" y="286" fill="#F6F8FC" font-size="82" font-weight="800" letter-spacing="-5">'+initials+'</text><text x="62" y="322" fill="#9DACC1" font-size="17" font-weight="700" letter-spacing="3">'+domain+'</text></g><rect x="58" y="42" width="54" height="4" rx="2" fill="'+accent+'"/><rect x="116" y="42" width="24" height="4" rx="2" fill="'+accent2+'" opacity=".72"/></svg>';
  return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
function nxModuleVisual(title,courseTitle=''){
  const t=(title||'').toLowerCase();
  if(/prompt|texto|comunicação/.test(t))return '../assets/visuals/visual-prompt.svg';
  if(/rag|agente|automação/.test(t))return '../assets/visuals/visual-rag.svg';
  if(/lógica|web essencial/.test(t))return '../assets/visuals/visual-logic-web.svg';
  if(/javascript|typescript|react/.test(t))return '../assets/visuals/visual-react.svg';
  if(/banco|api|autenticação|full stack|cloudflare|testes/.test(t))return '../assets/visuals/visual-data-api.svg';
  return nxCourseVisual(courseTitle||title);
}
function showLCCelebration({xp=0,level=1,previousLevel=1,title='Missão concluída',kind='xp',detail='',streak=0,duration=0}={}){
  document.querySelector('.nx-celebration')?.remove();
  const levelUp=Number(level)>Number(previousLevel||level);
  const defaults={mission:2800,quiz:3200,boss:3400,module:4300,streak:4000,certificate:4700,xp:2800};
  const baseHold=Number(duration||0)||(levelUp?4600:(defaults[kind]||3000));
  const hold=matchMedia('(max-width:820px)').matches?Math.min(baseHold,levelUp?3000:2400):baseHold;
  const labels={mission:'MISSÃO CONCLUÍDA',quiz:'CHECKPOINT APROVADO',boss:'BOSS FIGHT REGISTRADO',module:'MÓDULO CONCLUÍDO',streak:'SEQUÊNCIA ATIVA',certificate:'CERTIFICADO DESBLOQUEADO',xp:'PROGRESSO SALVO'};
  const icons={boss:'⚔',module:'✓',streak:'🔥',certificate:'▣'};
  const copy=levelUp
    ?'Você chegou ao nível <b>'+level+'</b>.'
    :detail
      ?detail
      :kind==='boss'
        ?'Sua entrega foi registrada e entrou na fila de avaliação.'
        :kind==='module'
          ?'Você concluiu todas as aulas deste módulo. Consulte a trilha para o próximo checkpoint ou projeto previsto.'
          :kind==='streak'
            ?'Você manteve uma sequência de <b>'+Number(streak||0)+' dias</b>. Consistência também é progresso.'
            :kind==='certificate'
              ?'Todos os requisitos acadêmicos foram atendidos. Seu certificado já está disponível.'
              :'Você ganhou <b>+'+Number(xp||0)+' XP</b>.';
  const wrap=document.createElement('div');wrap.className='nx-celebration '+(levelUp?'level-up ':'')+'kind-'+kind;wrap.style.setProperty('--nx-celebration-duration',hold+'ms');
  const particles=Array.from({length:26},(_,i)=>'<i style="--i:'+i+';--x:'+((i*47)%100)+'%;--d:'+(.7+(i%6)*.11)+'s"></i>').join('');
  const art=levelUp
    ?'<img src="../assets/visuals/level-up.svg" alt="" class="nx-level-art">'
    :icons[kind]
      ?'<div class="nx-xp-orb nx-icon-orb">'+icons[kind]+'</div>'
      :'<div class="nx-xp-orb">+'+Number(xp||0)+'</div>';
  wrap.innerHTML='<div class="nx-celebration-backdrop"></div>'+particles+'<div class="nx-celebration-card">'+art+
    '<div class="eyebrow">'+(levelUp?'NOVO NÍVEL':(labels[kind]||'PROGRESSO SALVO'))+'</div><h2>'+ (levelUp?'Level Up!':title) +'</h2>'+
    '<p>'+copy+'</p>'+
    '<div class="nx-celebration-meta"><span>Nível '+level+'</span>'+(streak?'<span>🔥 '+streak+' dias</span>':'')+(Number(xp)>0?'<span>+'+Number(xp)+' XP</span>':'')+'</div>'+
    '<div class="nx-celebration-timer"><span></span></div></div>';
  document.body.appendChild(wrap);
  requestAnimationFrame(()=>wrap.classList.add('show'));
  setTimeout(()=>{wrap.classList.remove('show');setTimeout(()=>wrap.remove(),380)},hold);
  return hold;
}
function decorateLCUI(){
  qsa('.v3-course-card').forEach(card=>{
    const t=(card.textContent||'').toLowerCase();
    if(t.includes('ia generativa'))card.classList.add('nx-theme-ai');
    if(t.includes('desenvolvimento de sistemas'))card.classList.add('nx-theme-dev');
    if(card.classList.contains('catalog-course'))return;
    if(!card.querySelector('.nx-course-art')&&(t.includes('ia generativa')||t.includes('desenvolvimento de sistemas'))){
      const art=document.createElement('img');art.className='nx-course-art';art.alt='';art.loading='lazy';art.src=nxCourseVisual(t);card.appendChild(art);
    }
    if(!card.querySelector('.nx-course-orb')){
      const mark=document.createElement('span');
      mark.className='nx-course-orb';
      mark.textContent=t.includes('ia generativa')?'AI':t.includes('desenvolvimento de sistemas')?'DEV':'LC';
      card.appendChild(mark);
    }
  });
  qsa('.v3-hero').forEach(hero=>{
    const t=(hero.textContent||'').toLowerCase();
    if((t.includes('ia generativa')||t.includes('desenvolvimento de sistemas'))&&!hero.querySelector('.nx-hero-course-art')){
      const art=document.createElement('img');art.className='nx-hero-course-art';art.alt='';art.src=nxCourseVisual(t);hero.appendChild(art);
    }
  });
  qsa('.v3-project-card').forEach(card=>{if(!card.querySelector('.nx-boss-stamp')){const s=document.createElement('span');s.className='nx-boss-stamp';s.textContent='BOSS';card.appendChild(s)}});
  qsa('.v3-lab').forEach(lab=>{
    const head=lab.querySelector('.v3-lab-head');if(!head||head.querySelector('.nx-lab-mark'))return;
    const t=(head.textContent||'').toLowerCase(),m=document.createElement('span');m.className='nx-lab-mark';
    m.textContent=t.includes('sql')?'SQL':t.includes('react')?'R':t.includes('typescript')?'TS':t.includes('python')?'PY':t.includes('javascript')?'JS':t.includes('pseudocódigo')?'PSEU':t.includes('lógica')?'ALG':t.includes('prompt')?'AI':t.includes('planilha')?'Σ':t.includes('automação')?'FLOW':t.includes('agente')?'AGT':t.includes('api')?'API':t.includes('terminal')?'>_':t.includes('rag')?'RAG':'LAB';
    head.prepend(m);
  });
}
function watchLCDecorations(){
  decorateLCUI();
  let queued=false;
  const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorateLCUI()})});
  obs.observe(document.body,{childList:true,subtree:true});
}
async function loadGamification(){try{const g=await LCSupabase.gamification();if(!g)return;const within=((Number(g.xp_total)||0)%500)/5;qsa('[data-level]').forEach(x=>x.textContent=g.level||1);qsa('[data-xp]').forEach(x=>x.textContent=g.xp_total||0);qsa('[data-streak]').forEach(x=>x.textContent=g.current_streak||0);qsa('[data-xpbar]').forEach(x=>x.style.width=Math.max(0,Math.min(100,within))+'%');window.LCGamification=g;return g}catch{return null}}
async function lcBoot(active='dashboard'){
  enhanceLCShell(active);
  watchLCDecorations();
  await ensureLCAnalytics();
  const u=await LCSupabase.user();
  if(!u){location.replace('login.html');return null}
  let profile=await LCSupabase.profile().catch(()=>null);
  if(!profile){try{await LCSupabase.api('/api/lc/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:u.user_metadata?.full_name||''})});profile=await LCSupabase.profile().catch(()=>null)}catch{}}
  window.LCAnalytics?.identify().catch(()=>{});window.LCAnalytics?.once('app-session',()=>window.LCAnalytics.track('app_session_started',{}, {entry_section:active}));
  const studentRef=window.LCStudentReferral?.code?.();
  if(studentRef&&window.LCSupabase?.claimStudentReferral){
    try{
      const claimed=await LCSupabase.claimStudentReferral(studentRef);
      if(claimed?.claimed||['already_attributed','self_referral_blocked','code_not_found','invalid_code'].includes(claimed?.reason)){
        window.LCStudentReferral?.clear?.();
      }
      if(claimed?.claimed)window.LCAnalytics?.track?.('student_referral_claimed',{}, {source:'student_referral'});
    }catch{}
  }
  if(active==='dashboard'&&profile?.role!=='admin'){
    const pref=await LCSupabase.learningPreference().catch(()=>null);
    if(!pref){location.replace('comece-aqui.html?first=1');return null}
  }
  const name=profile?.full_name||u.user_metadata?.full_name||u.email?.split('@')[0]||'Aluno';
  qsa('[data-user-name]').forEach(el=>el.textContent=name);const initials=String(name).trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'AL';qsa('[data-user-avatar]').forEach(el=>el.textContent=initials);
  qsa('[data-user-role]').forEach(el=>el.textContent=profile?.role==='admin'?'Administrador':'Estudante');
  qsa('[data-logout]').forEach(el=>el.onclick=async()=>{await LCSupabase.signOut();location.replace('login.html')});
  qsa(`[data-nav="${active}"]`).forEach(el=>el.classList.add('active'));
  const gamification=await loadGamification();
  return {u,profile,name,gamification};
}
function lcShareUrl({title='LC — Learn & Create',text='',url=location.href,channel='copy'}={}){
  const cleanUrl=String(url||location.href),message=[text,cleanUrl].filter(Boolean).join('\n');
  if(channel==='whatsapp'){window.open('https://wa.me/?text='+encodeURIComponent(message),'_blank','noopener');return true}
  if(channel==='linkedin'){window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(cleanUrl),'_blank','noopener');return true}
  if(channel==='native'&&navigator.share){return navigator.share({title,text,url:cleanUrl}).then(()=>true).catch(()=>false)}
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(message).then(()=>true).catch(()=>false);
  try{const t=document.createElement('textarea');t.value=message;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();return true}catch{return false}
}
window.lcIcon=lcIcon;window.applyLCNavigationIcons=applyLCNavigationIcons;window.lcBoot=lcBoot;window.loadGamification=loadGamification;window.decorateLCUI=decorateLCUI;window.LCVisuals={course:nxCourseVisual,module:nxModuleVisual};window.LCCelebrate=showLCCelebration;window.LCShare={share:lcShareUrl};