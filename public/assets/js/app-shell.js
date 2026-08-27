async function nexoraBoot(active="dashboard"){
  const u=await NexoraSupabase.user();
  if(!u){ location.replace("login.html"); return null; }
  const profile=await NexoraSupabase.profile().catch(()=>null);
  const name=profile?.full_name||u.user_metadata?.full_name||u.email?.split("@")[0]||"Aluno";
  qsa("[data-user-name]").forEach(el=>el.textContent=name);
  qsa("[data-logout]").forEach(el=>el.onclick=async()=>{await NexoraSupabase.signOut();location.replace("login.html")});
  qsa(`[data-nav="${active}"]`).forEach(el=>el.classList.add("active"));
  return {u,profile,name};
}
window.nexoraBoot=nexoraBoot;