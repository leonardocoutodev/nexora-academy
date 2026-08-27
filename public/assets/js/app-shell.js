function enhanceNexoraShell(){
  qsa('.brand').forEach(el=>{el.innerHTML='<img src="../assets/brand/nexora-logo.svg" alt="Nexora Academy">'});
  const side=qs('.sidebar');
  if(side && !qs('.sidebar-extra',side)){
    const nav=qs('nav',side);
    const extra=document.createElement('div');
    extra.className='sidebar-extra';
    extra.innerHTML='<a href="projetos.html" style="display:flex;gap:11px;padding:11px 12px;color:#9cafc6;font-weight:700"><span>◉</span><span>Comunidade</span></a><a href="mailto:suporte@nexora.academy" style="display:flex;gap:11px;padding:11px 12px;color:#9cafc6;font-weight:700"><span>?</span><span>Suporte</span></a>';
    nav.after(extra);
    const foot=qs('.side-footer',side);
    if(foot) foot.remove();
    const f=document.createElement('div');f.className='side-footer';
    f.innerHTML='<div class="lc-promo"><div class="lc-mark"><span class="lc-symbol">LC</span><span><b>LC SOLUÇÕES</b><br>DIGITAIS</span></div><p>Sites, sistemas, automações e soluções digitais que transformam ideias em resultados.</p><a href="https://wa.me/5573981250366?text=Ol%C3%A1%2C%20vim%20pela%20Nexora%20Academy%20e%20quero%20conhecer%20a%20LC%20Solu%C3%A7%C3%B5es%20Digitais" target="_blank" rel="noopener">Conheça nossos serviços ↗</a></div><div class="side-user"><span class="side-avatar">N</span><div><b data-user-name>Aluno</b><small data-user-role>Estudante</small></div></div>';
    side.appendChild(f);
  }
}
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
  return {u,profile,name};
}
window.nexoraBoot=nexoraBoot;