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
async function loadGamification(){try{const g=await NexoraSupabase.gamification();if(!g)return;const within=((Number(g.xp_total)||0)%500)/5;qsa('[data-level]').forEach(x=>x.textContent=g.level||1);qsa('[data-xp]').forEach(x=>x.textContent=g.xp_total||0);qsa('[data-streak]').forEach(x=>x.textContent=g.current_streak||0);qsa('[data-xpbar]').forEach(x=>x.style.width=Math.max(0,Math.min(100,within))+'%');window.NexoraGamification=g;return g}catch{return null}}
async function nexoraBoot(active='dashboard'){
  enhanceNexoraShell();
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
window.nexoraBoot=nexoraBoot;window.loadGamification=loadGamification;