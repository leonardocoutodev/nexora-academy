function injectV3(){if(!document.querySelector('link[href*="academy-v3.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='../assets/css/academy-v3.css';l.dataset.v3='1';document.head.appendChild(l)}}
function enhanceNexoraShell(){
  injectV3();
  qsa('.brand').forEach(el=>{el.innerHTML='<img src="../assets/brand/nexora-logo.svg" alt="Nexora Academy">'});
  const side=qs('.sidebar');if(!side)return;
  const nav=qs('nav',side);
  if(nav&&!qs('.sidebar-extra',side)){
    const extra=document.createElement('div');extra.className='sidebar-extra';
    extra.innerHTML='<a href="apoie.html" style="display:flex;gap:11px;margin:8px;padding:10px 12px;border:1px solid #24527d;border-radius:11px;background:#0a1c31;color:#dcefff;font-weight:850;text-decoration:none"><span>♡</span><span>Apoie a Nexora</span></a>';
    nav.after(extra);
  }
  let foot=qs('.side-footer',side);if(!foot){foot=document.createElement('div');foot.className='side-footer';side.appendChild(foot)}
  foot.innerHTML='<div id="sideGame" class="v3-gamification-mini"><div class="top"><span>NÍVEL <strong data-level>1</strong></span><span><strong data-xp>0</strong> XP</span></div><div class="v3-xpbar"><span data-xpbar style="width:0%"></span></div><div class="v3-streak">🔥 <span data-streak>0</span> dias de sequência</div></div><a href="https://wa.me/5573981250366?text=Ol%C3%A1%2C%20conheci%20a%20LC%20pela%20Nexora%20Academy." target="_blank" rel="noopener" style="display:flex;align-items:center;gap:9px;margin:8px;padding:9px 10px;border:1px solid #183a58;border-radius:11px;background:#071522;text-decoration:none"><span class="lc-symbol" style="width:28px;height:28px;font-size:12px;border-radius:8px">LC</span><span><b style="display:block;font-size:10px;color:#55c8ff">PARCEIRO TECNOLÓGICO</b><small style="color:#8fa7bf">LC Soluções Digitais ↗</small></span></a><div class="side-user"><span class="side-avatar">N</span><div><b data-user-name>Aluno</b><small data-user-role>Estudante</small></div></div>';
}
function nxCourseVisual(title){
  const t=(title||'').toLowerCase();
  if(t.includes('ia generativa'))return '../assets/visuals/course-ai.svg';
  if(t.includes('desenvolvimento de sistemas'))return '../assets/visuals/course-dev.svg';
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
function showNexoraCelebration({xp=0,level=1,previousLevel=1,title='Missão concluída',kind='xp'}={}){
  document.querySelector('.nx-celebration')?.remove();
  const levelUp=Number(level)>Number(previousLevel||level);
  const wrap=document.createElement('div');wrap.className='nx-celebration '+(levelUp?'level-up ':'')+'kind-'+kind;
  const particles=Array.from({length:22},(_,i)=>'<i style="--i:'+i+';--x:'+((i*47)%100)+'%;--d:'+(.55+(i%6)*.09)+'s"></i>').join('');
  wrap.innerHTML='<div class="nx-celebration-backdrop"></div>'+particles+'<div class="nx-celebration-card">'+
    (levelUp?'<img src="../assets/visuals/level-up.svg" alt="" class="nx-level-art">':kind==='boss'?'<div class="nx-xp-orb">⚔</div>':'<div class="nx-xp-orb">+'+Number(xp||0)+'</div>')+
    '<div class="eyebrow">'+(levelUp?'NOVO NÍVEL':'PROGRESSO SALVO')+'</div><h2>'+ (levelUp?'Level Up!':title) +'</h2>'+
    '<p>'+(levelUp?'Você chegou ao nível <b>'+level+'</b>.':kind==='boss'?'Sua entrega foi registrada e entrou na fila de avaliação.':'Você ganhou <b>+'+Number(xp||0)+' XP</b>.')+'</p>'+
    '<div class="nx-celebration-meta"><span>Nível '+level+'</span><span>XP creditado</span></div></div>';
  document.body.appendChild(wrap);
  requestAnimationFrame(()=>wrap.classList.add('show'));
  setTimeout(()=>{wrap.classList.remove('show');setTimeout(()=>wrap.remove(),350)},levelUp?2400:1450);
}
function decorateNexoraUI(){
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
    m.textContent=t.includes('sql')?'SQL':t.includes('react')?'R':t.includes('typescript')?'TS':t.includes('javascript')?'JS':t.includes('prompt')?'AI':t.includes('planilha')?'Σ':t.includes('api')?'API':t.includes('terminal')?'>_':t.includes('rag')?'RAG':'LAB';
    head.prepend(m);
  });
}
function watchNexoraDecorations(){
  decorateNexoraUI();
  let queued=false;
  const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorateNexoraUI()})});
  obs.observe(document.body,{childList:true,subtree:true});
}
async function loadGamification(){try{const g=await NexoraSupabase.gamification();if(!g)return;const within=((Number(g.xp_total)||0)%500)/5;qsa('[data-level]').forEach(x=>x.textContent=g.level||1);qsa('[data-xp]').forEach(x=>x.textContent=g.xp_total||0);qsa('[data-streak]').forEach(x=>x.textContent=g.current_streak||0);qsa('[data-xpbar]').forEach(x=>x.style.width=Math.max(0,Math.min(100,within))+'%');window.NexoraGamification=g;return g}catch{return null}}
async function nexoraBoot(active='dashboard'){
  enhanceNexoraShell();
  watchNexoraDecorations();
  const u=await NexoraSupabase.user();
  if(!u){location.replace('login.html');return null}
  const profile=await NexoraSupabase.profile().catch(()=>null);
  const name=profile?.full_name||u.user_metadata?.full_name||u.email?.split('@')[0]||'Aluno';
  qsa('[data-user-name]').forEach(el=>el.textContent=name);
  qsa('[data-user-role]').forEach(el=>el.textContent=profile?.role==='admin'?'Administrador':'Estudante');
  qsa('[data-logout]').forEach(el=>el.onclick=async()=>{await NexoraSupabase.signOut();location.replace('login.html')});
  qsa(`[data-nav="${active}"]`).forEach(el=>el.classList.add('active'));
  const gamification=await loadGamification();
  return {u,profile,name,gamification};
}
window.nexoraBoot=nexoraBoot;window.loadGamification=loadGamification;window.decorateNexoraUI=decorateNexoraUI;window.NexoraVisuals={course:nxCourseVisual,module:nxModuleVisual};window.NexoraCelebrate=showNexoraCelebration;