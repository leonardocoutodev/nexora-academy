const AdminOps=(()=>{
  const state={courses:[],activeTab:'overview',studentRows:[],bossRows:[],certificateRows:[]};
  const one=x=>Array.isArray(x)?x[0]:x;
  const fmtDate=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
  const pct=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
  const statusLabel=v=>({active:'Ativo',blocked:'Bloqueado',inactive:'Inativo',completed:'Concluída',paused:'Pausada',cancelled:'Cancelada',submitted:'Em avaliação',revision_requested:'Ajustes solicitados',approved:'Aprovado',reviewed:'Avaliado'}[v]||v||'—');
  const statusClass=v=>['active','completed','approved','reviewed'].includes(v)?'ok':['blocked','cancelled'].includes(v)?'bad':['submitted','revision_requested','paused'].includes(v)?'warn':'';
  function toast(msg,kind='ok'){const el=qs('#adminToast');el.textContent=msg;el.className='lc-admin-toast '+kind;el.hidden=false;clearTimeout(window.__adminToastTimer);window.__adminToastTimer=setTimeout(()=>el.hidden=true,3200)}
  function setTab(name){
    state.activeTab=name;
    qsa('[data-admin-tab]').forEach(b=>{const on=b.dataset.adminTab===name;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});
    qsa('[data-admin-panel]').forEach(p=>p.hidden=p.dataset.adminPanel!==name);
    history.replaceState(null,'','#'+name);
  }
  async function loadSummary(){
    const s=one(await LCSupabase.rpc('admin_operational_summary',{}))||{};
    const map={students:s.students,activeStudents:s.active_students,activeEnrollments:s.active_enrollments,completedLessons:s.completed_lessons,pendingBoss:s.pending_boss,certificates:s.certificates,publishedCourses:s.published_courses,publishedLessons:s.published_lessons};
    Object.entries(map).forEach(([id,v])=>{const el=qs('#'+id);if(el)el.textContent=Number(v||0).toLocaleString('pt-BR')});
    qs('#attentionList').innerHTML=[
      ['Boss Fights aguardando avaliação',s.pending_boss,'boss'],
      ['Boss Fights com ajustes solicitados',s.revision_boss,'boss'],
      ['Alunos bloqueados',s.blocked_students,'students'],
      ['Matrículas pausadas/canceladas',null,'students']
    ].map(([label,value,tab])=>'<button type="button" data-jump="'+tab+'" class="lc-admin-attention"><span>'+esc(label)+'</span>'+(value!==null?'<strong>'+Number(value||0)+'</strong>':'<span>Ver alunos →</span>')+'</button>').join('');
    qsa('[data-jump]').forEach(b=>b.onclick=()=>setTab(b.dataset.jump));
  }
  function filters(prefix){
    return {
      search:qs('#'+prefix+'Search')?.value.trim()||'',
      status:qs('#'+prefix+'Status')?.value||'',
      course:qs('#'+prefix+'Course')?.value||''
    }
  }
  async function loadStudents(){
    const f=filters('student');
    const rows=await LCSupabase.rpc('admin_student_roster',{p_search:f.search||null,p_status:f.status||null,p_course_id:f.course||null});
    state.studentRows=Array.isArray(rows)?rows:[];
    qs('#studentCount').textContent=state.studentRows.length+' resultado'+(state.studentRows.length===1?'':'s');
    qs('#studentList').innerHTML=state.studentRows.length?state.studentRows.map(r=>'<button type="button" class="lc-admin-row lc-admin-student-row" data-student="'+r.user_id+'"><span class="lc-admin-primary"><b>'+esc(r.full_name)+'</b><small>'+esc(r.email||'Sem e-mail')+'</small></span><span><small>Status</small><b class="lc-status '+statusClass(r.status)+'">'+esc(statusLabel(r.status))+'</b></span><span><small>Matrículas</small><b>'+r.active_enrollments+'/'+r.enrollments_count+'</b></span><span><small>Aulas concluídas</small><b>'+r.completed_lessons+'</b></span><span><small>Média</small><b>'+pct(r.average_score)+'</b></span><span><small>Última atividade</small><b>'+esc(fmtDate(r.last_activity))+'</b></span><span aria-hidden="true">→</span></button>').join(''):'<div class="lc-admin-empty">Nenhum aluno encontrado com esses filtros.</div>';
    qsa('[data-student]').forEach(b=>b.onclick=()=>openStudent(b.dataset.student));
  }
  async function openStudent(userId){
    const dlg=qs('#studentDialog'),body=qs('#studentDialogBody');
    body.innerHTML='<div class="loading">Carregando aluno</div>';if(!dlg.open)dlg.showModal();
    try{
      const d=one(await LCSupabase.rpc('admin_student_detail',{p_user_id:userId}));
      const p=d.profile||{},enrolls=d.enrollments||[],attempts=d.attempts||[],subs=d.submissions||[],certs=d.certificates||[];
      const enrolled=new Set(enrolls.map(x=>x.course_id));
      body.innerHTML='<div class="lc-admin-detail-head"><div><div class="eyebrow">ALUNO</div><h2>'+esc(p.full_name||'Aluno LC')+'</h2><p>'+esc(p.email||'')+' • cadastro '+esc(fmtDate(p.created_at))+'</p></div><span class="lc-status '+statusClass(p.status)+'">'+esc(statusLabel(p.status))+'</span></div>'+
        '<div class="lc-admin-detail-grid"><section class="card card-pad"><h3>Acesso</h3><label>Status</label><select id="detailStatus"><option value="active">Ativo</option><option value="inactive">Inativo</option><option value="blocked">Bloqueado</option></select><label>Perfil</label><select id="detailRole"><option value="student">Aluno</option><option value="instructor">Instrutor</option><option value="admin">Administrador</option></select><button class="v3-btn" type="button" id="saveProfileAdmin">Salvar acesso</button></section>'+
        '<section class="card card-pad"><h3>Nova matrícula</h3><label>Curso</label><select id="newEnrollmentCourse"><option value="">Selecione</option>'+state.courses.filter(c=>!enrolled.has(c.id)).map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join('')+'</select><button class="v3-btn secondary" type="button" id="createEnrollmentAdmin">Ativar matrícula</button></section></div>'+
        '<section class="lc-admin-detail-section"><div class="v3-section-head"><div><div class="eyebrow">MATRÍCULAS</div><h3>Progresso por curso</h3></div></div><div class="lc-admin-stack">'+(enrolls.length?enrolls.map(e=>'<article class="lc-admin-enrollment"><div><b>'+esc(e.course_title)+'</b><small>'+e.completed_lessons+'/'+e.total_lessons+' aulas • '+pct(e.progress_percent)+'</small></div><select data-enrollment-status="'+e.id+'"><option value="active">Ativa</option><option value="completed">Concluída</option><option value="paused">Pausada</option><option value="cancelled">Cancelada</option></select></article>').join(''):'<div class="lc-admin-empty">Nenhuma matrícula.</div>')+'</div></section>'+
        '<section class="lc-admin-detail-section"><div class="eyebrow">AVALIAÇÕES</div><div class="lc-admin-stack">'+(attempts.length?attempts.map(a=>'<article class="lc-admin-history"><span><b>'+esc(a.assessment_title)+'</b><small>'+esc(a.course_title)+(a.module_title?' • '+esc(a.module_title):'')+'</small></span><strong>'+pct(a.score)+'</strong><small>'+esc(fmtDate(a.submitted_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhuma avaliação enviada.</div>')+'</div></section>'+
        '<section class="lc-admin-detail-section"><div class="eyebrow">BOSS FIGHTS</div><div class="lc-admin-stack">'+(subs.length?subs.map(s=>'<article class="lc-admin-history"><span><b>'+esc(s.project_title)+'</b><small>'+esc(s.course_title)+'</small></span><span class="lc-status '+statusClass(s.status)+'">'+esc(statusLabel(s.status))+'</span><small>'+esc(fmtDate(s.submitted_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhuma entrega.</div>')+'</div></section>'+
        '<section class="lc-admin-detail-section"><div class="eyebrow">CERTIFICADOS</div><div class="lc-admin-stack">'+(certs.length?certs.map(c=>'<article class="lc-admin-history"><span><b>'+esc(c.course_title)+'</b><small>'+esc(c.verification_code)+'</small></span><a class="v3-btn secondary" href="../verificar.html?code='+encodeURIComponent(c.verification_code)+'" target="_blank" rel="noopener">Verificar ↗</a><small>'+esc(fmtDate(c.issued_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhum certificado emitido.</div>')+'</div></section>';
      qs('#detailStatus').value=p.status;qs('#detailRole').value=p.role;
      qs('#saveProfileAdmin').onclick=async()=>{try{await LCSupabase.rpc('admin_update_profile',{p_user_id:userId,p_status:qs('#detailStatus').value,p_role:qs('#detailRole').value});toast('Acesso do aluno atualizado.');await Promise.all([loadStudents(),loadSummary(),loadAudit()]);openStudent(userId)}catch(e){toast(e.message,'bad')}};
      qs('#createEnrollmentAdmin').onclick=async()=>{const course=qs('#newEnrollmentCourse').value;if(!course)return toast('Selecione um curso.','bad');try{await LCSupabase.rpc('admin_create_enrollment',{p_user_id:userId,p_course_id:course});toast('Matrícula ativada.');await Promise.all([loadStudents(),loadSummary(),loadAudit()]);openStudent(userId)}catch(e){toast(e.message,'bad')}};
      qsa('[data-enrollment-status]').forEach(sel=>{const found=enrolls.find(e=>e.id===sel.dataset.enrollmentStatus);if(found)sel.value=found.status;sel.onchange=async()=>{try{await LCSupabase.rpc('admin_update_enrollment',{p_enrollment_id:sel.dataset.enrollmentStatus,p_status:sel.value});toast('Status da matrícula atualizado.');await Promise.all([loadStudents(),loadSummary(),loadAudit()])}catch(e){toast(e.message,'bad');if(found)sel.value=found.status}}});
    }catch(e){body.innerHTML='<div class="v3-feedback bad">'+esc(e.message)+'</div>'}
  }
  async function loadBoss(){
    const f=filters('boss');
    const rows=await LCSupabase.rpc('admin_boss_roster',{p_status:f.status||null,p_course_id:f.course||null});
    state.bossRows=Array.isArray(rows)?rows:[];
    qs('#bossCount').textContent=state.bossRows.length+' entrega'+(state.bossRows.length===1?'':'s');
    qs('#bossList').innerHTML=state.bossRows.length?state.bossRows.map(r=>{const criteria=Array.isArray(r.rubric?.criteria)?r.rubric.criteria:[],canReview=r.status==='submitted';return '<article class="lc-admin-boss"><div class="lc-admin-boss-head"><div><div class="eyebrow">'+esc(r.course_title)+(r.module_title?' • '+esc(r.module_title):'')+'</div><h3>'+esc(r.project_title)+'</h3><p><b>'+esc(r.student_name)+'</b> • '+esc(r.email||'')+' • '+esc(fmtDate(r.submitted_at))+'</p></div><span class="lc-status '+statusClass(r.status)+'">'+esc(statusLabel(r.status))+'</span></div><div class="v3-rubric">'+criteria.map(x=>'<div><b>'+esc(x.weight)+'%</b><br>'+esc(x.name||x.label||'Critério')+'</div>').join('')+'</div><div class="v3-toolbar"><a class="v3-btn secondary" href="'+esc(r.submission_url||'#')+'" target="_blank" rel="noopener">Abrir entrega ↗</a>'+(!canReview&&r.score!=null?'<span class="v3-pill">Nota '+pct(r.score)+'</span>':'')+'</div>'+(r.feedback?'<div class="v3-feedback '+(r.status==='revision_requested'?'bad':'ok')+'">'+esc(r.feedback)+'</div>':'')+(canReview?'<div class="lc-admin-review"><label>Nota (0–100)</label><input type="number" min="0" max="100" inputmode="decimal" data-boss-score="'+r.submission_id+'"><label>Feedback</label><textarea rows="4" data-boss-feedback="'+r.submission_id+'" placeholder="Feedback objetivo e acionável."></textarea><div class="v3-toolbar"><button class="v3-btn" type="button" data-boss-action="approved" data-boss-id="'+r.submission_id+'">Aprovar</button><button class="v3-btn secondary" type="button" data-boss-action="revision_requested" data-boss-id="'+r.submission_id+'">Solicitar ajustes</button></div></div>':'')+'</article>'}).join(''):'<div class="lc-admin-empty">Nenhuma Boss Fight com esses filtros.</div>';
    qsa('[data-boss-action]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.bossId,status=btn.dataset.bossAction,scoreEl=qs('[data-boss-score="'+id+'"]'),feedbackEl=qs('[data-boss-feedback="'+id+'"]'),score=scoreEl.value===''?null:Number(scoreEl.value);if(status==='approved'&&score===null)return toast('Informe uma nota antes de aprovar.','bad');try{qsa('[data-boss-id="'+id+'"]').forEach(x=>x.disabled=true);await LCSupabase.rpc('review_project_submission',{p_submission_id:id,p_status:status,p_score:score,p_feedback:feedbackEl.value.trim()});toast(status==='approved'?'Boss Fight aprovada.':'Ajustes solicitados.');await Promise.all([loadBoss(),loadSummary(),loadAudit()])}catch(e){toast(e.message,'bad');qsa('[data-boss-id="'+id+'"]').forEach(x=>x.disabled=false)}});
  }
  async function loadCertificates(){
    const f=filters('certificate');
    const rows=await LCSupabase.rpc('admin_certificate_roster',{p_search:f.search||null,p_course_id:f.course||null});
    state.certificateRows=Array.isArray(rows)?rows:[];
    qs('#certificateCount').textContent=state.certificateRows.length+' certificado'+(state.certificateRows.length===1?'':'s');
    qs('#certificateList').innerHTML=state.certificateRows.length?state.certificateRows.map(r=>'<article class="lc-admin-cert"><span><b>'+esc(r.student_name)+'</b><small>'+esc(r.email||'')+'</small></span><span><b>'+esc(r.course_title)+'</b><small>'+esc(r.verification_code)+'</small></span><span><small>Emitido</small><b>'+esc(fmtDate(r.issued_at))+'</b></span><a class="v3-btn secondary" href="../verificar.html?code='+encodeURIComponent(r.verification_code)+'" target="_blank" rel="noopener">Verificar ↗</a></article>').join(''):'<div class="lc-admin-empty">Nenhum certificado encontrado.</div>';
  }
  async function loadAudit(){
    const rows=await LCSupabase.rpc('admin_audit_feed',{p_limit:50});
    qs('#auditList').innerHTML=(Array.isArray(rows)?rows:[]).length?rows.map(r=>'<article class="lc-admin-audit"><span><b>'+esc(r.actor_name)+'</b><small>'+esc(r.action)+' • '+esc(r.target_type)+'</small></span><small>'+esc(fmtDate(r.created_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhuma ação administrativa registrada ainda.</div>';
  }
  function wireFilters(){
    ['student','boss','certificate'].forEach(prefix=>{
      const apply=()=>prefix==='student'?loadStudents():prefix==='boss'?loadBoss():loadCertificates();
      qs('#'+prefix+'Apply')?.addEventListener('click',apply);
      qs('#'+prefix+'Search')?.addEventListener('keydown',e=>{if(e.key==='Enter')apply()});
      qs('#'+prefix+'Status')?.addEventListener('change',apply);
      qs('#'+prefix+'Course')?.addEventListener('change',apply);
    });
  }
  async function init(){
    const u=await LCSupabase.user();if(!u){location.replace('../login.html');return}
    const p=await LCSupabase.profile();if(p?.role!=='admin'){setState(qs('#state'),'error','Acesso administrativo não autorizado.');return}
    try{
      state.courses=await LCSupabase.rest('courses?status=eq.published&select=id,title&order=position.asc');
      ['studentCourse','bossCourse','certificateCourse'].forEach(id=>{const sel=qs('#'+id);state.courses.forEach(c=>sel.insertAdjacentHTML('beforeend','<option value="'+c.id+'">'+esc(c.title)+'</option>'))});
      qsa('[data-admin-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.adminTab));
      qs('#studentDialogClose').onclick=()=>qs('#studentDialog').close();
      qs('#studentDialog').addEventListener('click',e=>{if(e.target===qs('#studentDialog'))qs('#studentDialog').close()});
      wireFilters();
      await Promise.all([loadSummary(),loadStudents(),loadBoss(),loadCertificates(),loadAudit()]);
      qs('#state').classList.add('hidden');qs('#content').classList.remove('hidden');
      const initial=location.hash.replace('#','');setTab(['overview','students','boss','certificates','audit'].includes(initial)?initial:'overview');
    }catch(e){setState(qs('#state'),'error',e.message)}
  }
  return{init,setTab,loadStudents,loadBoss,loadCertificates,loadAudit}
})();
AdminOps.init();
