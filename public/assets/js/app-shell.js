function enhanceNexoraShell(){
  qsa('.brand').forEach(el=>{el.innerHTML='<img src="../assets/brand/nexora-logo.svg" alt="Nexora Academy">'});
  const side=qs('.sidebar');
  if(side && !qs('.sidebar-extra',side)){
    const nav=qs('nav',side);
    const extra=document.createElement('div');
    extra.className='sidebar-extra';
    extra.innerHTML='<a href="projetos.html" style="display:flex;gap:11px;padding:10px 12px;color:#9cafc6;font-weight:700"><span>◉</span><span>Comunidade</span></a><a href="apoie.html" style="display:flex;gap:11px;margin:6px 2px;padding:11px 12px;border:1px solid #347cff;border-radius:12px;background:linear-gradient(135deg,#0b2144,#183978);color:#fff;font-weight:900;text-decoration:none"><span>♡</span><span>Apoie o projeto</span></a><a href="mailto:suporte@nexora.academy" style="display:flex;gap:11px;padding:10px 12px;color:#9cafc6;font-weight:700"><span>?</span><span>Suporte</span></a>';
    nav.after(extra);
    const foot=qs('.side-footer',side);if(foot)foot.remove();
    const f=document.createElement('div');f.className='side-footer';
    f.innerHTML='<a href="https://wa.me/5573981250366?text=Ol%C3%A1%2C%20conheci%20a%20LC%20pela%20Nexora%20Academy." target="_blank" rel="noopener" style="display:flex;align-items:center;gap:9px;padding:10px 11px;border:1px solid #1e4167;border-radius:11px;background:#071526;text-decoration:none"><span class="lc-symbol" style="width:30px;height:30px;font-size:13px;border-radius:9px">LC</span><span style="min-width:0"><b style="display:block;font-size:11px;color:#55c8ff">PARCEIRO TECNOLÓGICO</b><small style="color:#9cafc6">LC Soluções Digitais ↗</small></span></a><div class="side-user"><span class="side-avatar">N</span><div><b data-user-name>Aluno</b><small data-user-role>Estudante</small></div></div>';
    side.appendChild(f);
  }
}
if(location.pathname.endsWith('/aula.html')){
  const css=document.createElement('link');css.rel='stylesheet';css.href='../assets/css/lesson-enrich.css';document.head.appendChild(css);
  const js=document.createElement('script');js.src='../assets/js/lesson-enrich.js';js.defer=true;document.head.appendChild(js);
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