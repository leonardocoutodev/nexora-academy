function injectV3(){if(!document.querySelector('link[href*="academy-v3.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='../assets/css/academy-v3.css';l.dataset.v3='1';document.head.appendChild(l)}}
function enhanceLCShell(active='dashboard'){
  injectV3();
  qsa('.brand').forEach(el=>{el.innerHTML='<img src="../assets/brand/lc-mark.svg" alt="LC"><span class="lc-brand-name">LC</span>'});
  const side=qs('.sidebar');if(!side)return;
  const nav=qs('nav',side);
  if(nav&&!qs('[data-nav="start"]',nav)){const first=nav.querySelector('a');const a=document.createElement('a');a.href='comece-aqui.html';a.dataset.nav='start';a.innerHTML='<span>◎</span><span>Comece aqui</span>';if(first)first.after(a);else nav.appendChild(a)}
  if(nav&&!qs('.sidebar-extra',side)){
    const extra=document.createElement('div');extra.className='sidebar-extra';
    extra.innerHTML='<a href="apoie.html" style="display:flex;gap:11px;margin:8px;padding:10px 12px;border:1px solid #24527d;border-radius:11px;background:#0a1c31;color:#dcefff;font-weight:850;text-decoration:none"><span>♡</span><span>Apoie a LC</span></a>';
    nav.after(extra);
  }
  let foot=qs('.side-footer',side);if(!foot){foot=document.createElement('div');foot.className='side-footer';side.appendChild(foot)}
  foot.innerHTML='<div id="sideGame" class="v3-gamification-mini"><div class="top"><span>NÍVEL <strong data-level>1</strong></span><span><strong data-xp>0</strong> XP</span></div><div class="v3-xpbar"><span data-xpbar style="width:0%"></span></div><div class="v3-streak">🔥 <span data-streak>0</span> dias de sequência</div></div><a href="https://wa.me/5573981250366?text=Ol%C3%A1%2C%20conheci%20a%20plataforma%20LC." target="_blank" rel="noopener" style="display:flex;align-items:center;gap:9px;margin:8px;padding:9px 10px;border:1px solid #183a58;border-radius:11px;background:#071522;text-decoration:none"><span class="lc-symbol" style="width:28px;height:28px;font-size:12px;border-radius:8px">LC</span><span><b style="display:block;font-size:10px;color:#55c8ff">IDEALIZADA E DESENVOLVIDA POR LEONARDO COUTO</b><small style="color:#8fa7bf">LC Soluções Digitais ↗</small></span></a><div class="side-user"><span class="side-avatar">N</span><div><b data-user-name>Aluno</b><small data-user-role>Estudante</small></div></div>';
  enhanceMobileNavigation(active);
}
function enhanceMobileNavigation(active='dashboard'){
  const nav=qs('.bottom-nav');if(!nav)return;
  const viewport=document.querySelector('meta[name="viewport"]');
  if(viewport&&!viewport.content.includes('viewport-fit=cover'))viewport.content+=',viewport-fit=cover';
  nav.classList.add('nx-mobile-nav');nav.setAttribute('aria-label','Navegação principal');
  nav.innerHTML='<a data-nav="dashboard" href="dashboard.html"><span aria-hidden="true">⌂</span><span>Início</span></a><a data-nav="courses" href="cursos.html"><span aria-hidden="true">▤</span><span>Cursos</span></a><a data-nav="start" href="comece-aqui.html"><span aria-hidden="true">◎</span><span>Comece</span></a><a data-nav="projects" href="projetos.html"><span aria-hidden="true">◇</span><span>Boss</span></a><button type="button" class="nx-mobile-more-toggle" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">•••</span><span>Mais</span></button>';
  qsa('[data-nav]',nav).forEach(el=>{const on=el.dataset.nav===active;el.classList.toggle('active',on);if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
  const moreButton=qs('.nx-mobile-more-toggle',nav),moreActive=['library','certs','profile'].includes(active);if(moreActive){moreButton.classList.add('active');moreButton.setAttribute('aria-current','page')}
  document.querySelector('.nx-mobile-more')?.remove();
  const panel=document.createElement('div');panel.className='nx-mobile-more';panel.hidden=true;panel.setAttribute('aria-hidden','true');
  panel.innerHTML='<div class="nx-mobile-more-backdrop" data-mobile-more-close></div><section class="nx-mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Mais opções"><div class="nx-mobile-more-handle" aria-hidden="true"></div><div class="nx-mobile-more-head"><div><div class="eyebrow">NAVEGAÇÃO</div><h2>Mais opções</h2></div><button class="nx-mobile-more-close" type="button" data-mobile-more-close aria-label="Fechar menu">×</button></div><div class="nx-mobile-more-grid"><a data-more-nav="library" href="biblioteca.html"><span aria-hidden="true">▥</span><span><b>Biblioteca</b><small>Apostilas e materiais</small></span></a><a data-more-nav="certs" href="certificados.html"><span aria-hidden="true">▣</span><span><b>Certificados</b><small>Emitir e verificar</small></span></a><a data-more-nav="profile" href="perfil.html"><span aria-hidden="true">⚙</span><span><b>Perfil</b><small>Progresso e conta</small></span></a><a href="apoie.html"><span aria-hidden="true">♡</span><span><b>Contribuir</b><small>Apoio voluntário</small></span></a></div><button class="nx-mobile-logout" type="button" data-mobile-logout>Sair da conta</button></section>';
  document.body.appendChild(panel);panel.querySelector('[data-more-nav="'+active+'"]')?.classList.add('active');
  let restoreFocus=null,closeTimer=null;
  const close=()=>{if(panel.hidden)return;panel.classList.remove('open');panel.setAttribute('aria-hidden','true');moreButton.setAttribute('aria-expanded','false');document.body.classList.remove('nx-mobile-menu-open');document.querySelector('.app-shell')?.removeAttribute('inert');clearTimeout(closeTimer);closeTimer=setTimeout(()=>{panel.hidden=true;restoreFocus?.focus()},180)};
  const open=()=>{restoreFocus=document.activeElement;panel.hidden=false;panel.setAttribute('aria-hidden','false');moreButton.setAttribute('aria-expanded','true');document.body.classList.add('nx-mobile-menu-open');document.querySelector('.app-shell')?.setAttribute('inert','');requestAnimationFrame(()=>panel.classList.add('open'));setTimeout(()=>panel.querySelector('.nx-mobile-more-close')?.focus(),30)};
  moreButton.onclick=()=>panel.hidden?open():close();qsa('[data-mobile-more-close]',panel).forEach(el=>el.onclick=close);
  panel.querySelector('[data-mobile-logout]').onclick=async()=>{await LCSupabase.signOut();location.replace('login.html')};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close()});
}

function nxCourseVisual(title){
  const t=(title||'').toLowerCase();
  if(t.includes('ia generativa'))return '../assets/visuals/course-ai.svg';
  if(t.includes('desenvolvimento de sistemas'))return '../assets/visuals/course-dev.svg';
  if(/lógica|pensamento computacional|pseudocódigo|matemática/.test(t))return '../assets/visuals/visual-logic-web.svg';
  if(/terminal|git/.test(t))return '../assets/visuals/visual-data-api.svg';
  if(/introdução à web/.test(t))return '../assets/visuals/visual-logic-web.svg';
  if(/python/.test(t))return '../assets/visuals/visual-react.svg';
  return '../assets/visuals/landing-orbit.svg';
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
          ?'Você concluiu todas as aulas deste módulo. O próximo passo é consolidar o aprendizado com quiz e Boss Fight.'
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
    if(!card.querySelector('.nx-course-art')&&(t.includes('ia generativa')||t.includes('desenvolvimento de sistemas'))){
      const art=document.createElement('img');art.className='nx-course-art';art.alt='';art.loading='lazy';art.src=nxCourseVisual(t);card.appendChild(art);
    }
    if(!card.querySelector('.nx-course-orb')){
      const mark=document.createElement('span');
      mark.className='nx-course-orb';
      mark.textContent=t.includes('ia generativa')?'AI':t.includes('desenvolvimento de sistemas')?'DEV':'NX';
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
  const u=await LCSupabase.user();
  if(!u){location.replace('login.html');return null}
  const profile=await LCSupabase.profile().catch(()=>null);
  const name=profile?.full_name||u.user_metadata?.full_name||u.email?.split('@')[0]||'Aluno';
  qsa('[data-user-name]').forEach(el=>el.textContent=name);
  qsa('[data-user-role]').forEach(el=>el.textContent=profile?.role==='admin'?'Administrador':'Estudante');
  qsa('[data-logout]').forEach(el=>el.onclick=async()=>{await LCSupabase.signOut();location.replace('login.html')});
  qsa(`[data-nav="${active}"]`).forEach(el=>el.classList.add('active'));
  const gamification=await loadGamification();
  return {u,profile,name,gamification};
}
window.lcBoot=lcBoot;window.loadGamification=loadGamification;window.decorateLCUI=decorateLCUI;window.LCVisuals={course:nxCourseVisual,module:nxModuleVisual};window.LCCelebrate=showLCCelebration;