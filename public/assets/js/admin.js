const AdminOps=(()=>{
  const state={courses:[],activeTab:'overview',studentRows:[],bossRows:[],certificateRows:[],donationRows:[],affiliateRows:[],affiliatePayoutRows:[]};
  const one=x=>Array.isArray(x)?x[0]:x;
  const fmtDate=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
  const pct=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
  const num=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const moneyCents=v=>money(Number(v||0)/100);
  const donationStatusLabel=v=>({approved:'Aprovada',pending:'Pendente',rejected:'Rejeitada',refunded:'Reembolsada',cancelled:'Cancelada',in_process:'Em processamento',unknown:'Desconhecida'}[v]||v||'—');
  const goalLabel=v=>({primeiro_emprego:'Primeiro emprego',web:'Sites e sistemas',automacao:'Python e automação',dados:'Dados',ia:'IA no trabalho',fundamentos:'Fundamentos','não informado':'Não informado'}[v]||v||'Não informado');
  const statusLabel=v=>({active:'Ativo',blocked:'Bloqueado',inactive:'Inativo',completed:'Concluída',paused:'Pausada',cancelled:'Cancelada',submitted:'Em avaliação',revision_requested:'Ajustes solicitados',approved:'Aprovado',reviewed:'Avaliado',suspended:'Suspenso',closed:'Encerrado',requested:'Solicitado',paid:'Pago',rejected:'Rejeitado'}[v]||v||'—');
  const statusClass=v=>['active','completed','approved','reviewed','paid'].includes(v)?'ok':['blocked','cancelled','rejected','closed'].includes(v)?'bad':['submitted','revision_requested','paused','requested','suspended'].includes(v)?'warn':'';
  function toast(msg,kind='ok'){const el=qs('#adminToast');el.textContent=msg;el.className='lc-admin-toast '+kind;el.hidden=false;clearTimeout(window.__adminToastTimer);window.__adminToastTimer=setTimeout(()=>el.hidden=true,3200)}
  function setTab(name){
    state.activeTab=name;
    qsa('[data-admin-tab]').forEach(b=>{const on=b.dataset.adminTab===name;b.classList.toggle('active',on);if(b.closest('.lc-admin-tabs')){b.setAttribute('role','tab');b.setAttribute('aria-selected',String(on))}else{b.removeAttribute('aria-selected');if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')}});
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
      const certByCourse=new Map(certs.flatMap(c=>[[c.course_id,c],[c.course_title,c]]).filter(([key])=>key));
      body.innerHTML='<div class="lc-admin-detail-head"><div><div class="eyebrow">ALUNO</div><h2>'+esc(p.full_name||'Aluno LC')+'</h2><p>'+esc(p.email||'')+' • cadastro '+esc(fmtDate(p.created_at))+'</p></div><span class="lc-status '+statusClass(p.status)+'">'+esc(statusLabel(p.status))+'</span></div>'+
        '<div class="lc-admin-detail-grid"><section class="card card-pad"><h3>Acesso</h3><label>Status</label><select id="detailStatus"><option value="active">Ativo</option><option value="inactive">Inativo</option><option value="blocked">Bloqueado</option></select><label>Perfil</label><select id="detailRole"><option value="student">Aluno</option><option value="instructor">Instrutor</option><option value="admin">Administrador</option></select><button class="v3-btn" type="button" id="saveProfileAdmin">Salvar acesso</button></section>'+
        '<section class="card card-pad"><h3>Nova matrícula</h3><label>Curso</label><select id="newEnrollmentCourse"><option value="">Selecione</option>'+state.courses.filter(c=>!enrolled.has(c.id)).map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join('')+'</select><button class="v3-btn secondary" type="button" id="createEnrollmentAdmin">Ativar matrícula</button></section></div>'+
        '<section class="lc-admin-detail-section"><div class="v3-section-head"><div><div class="eyebrow">MATRÍCULAS</div><h3>Progresso por curso</h3></div></div><div class="lc-admin-stack">'+(enrolls.length?enrolls.map(e=>{const cert=certByCourse.get(e.course_id)||certByCourse.get(e.course_title);return '<article class="lc-admin-enrollment"><div><b>'+esc(e.course_title)+'</b><small>'+e.completed_lessons+'/'+e.total_lessons+' aulas • '+pct(e.progress_percent)+'</small></div><select data-enrollment-status="'+e.id+'"><option value="active">Ativa</option><option value="completed">Concluída</option><option value="paused">Pausada</option><option value="cancelled">Cancelada</option></select>'+(cert?'<a class="v3-btn secondary" href="../verificar.html?code='+encodeURIComponent(cert.verification_code)+'" target="_blank" rel="noopener">Certificado '+esc(cert.verification_code)+' ↗</a>':'<button class="v3-btn secondary" type="button" data-issue-certificate="'+e.course_id+'">Emitir certificado</button>')+'</article>'+(!cert?'<div class="card card-pad" data-cert-override="'+e.course_id+'" hidden><div class="v3-feedback warn" data-cert-override-reason="'+e.course_id+'"></div><label>Justificativa da emissão manual</label><textarea rows="3" data-cert-override-text="'+e.course_id+'" placeholder="Explique por que este certificado deve ser emitido antes da conclusão automática."></textarea><div class="v3-toolbar"><button class="v3-btn" type="button" data-issue-certificate-override="'+e.course_id+'">Emitir manualmente</button><button class="v3-btn secondary" type="button" data-cert-override-cancel="'+e.course_id+'">Cancelar</button></div></div>':'')}).join(''):'<div class="lc-admin-empty">Nenhuma matrícula.</div>')+'</div></section>'+
        '<section class="lc-admin-detail-section"><div class="eyebrow">AVALIAÇÕES</div><div class="lc-admin-stack">'+(attempts.length?attempts.map(a=>'<article class="lc-admin-history"><span><b>'+esc(a.assessment_title)+'</b><small>'+esc(a.course_title)+(a.module_title?' • '+esc(a.module_title):'')+'</small></span><strong>'+pct(a.score)+'</strong><small>'+esc(fmtDate(a.submitted_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhuma avaliação enviada.</div>')+'</div></section>'+
        '<section class="lc-admin-detail-section"><div class="eyebrow">BOSS FIGHTS</div><div class="lc-admin-stack">'+(subs.length?subs.map(s=>'<article class="lc-admin-history"><span><b>'+esc(s.project_title)+'</b><small>'+esc(s.course_title)+'</small></span><span class="lc-status '+statusClass(s.status)+'">'+esc(statusLabel(s.status))+'</span><small>'+esc(fmtDate(s.submitted_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhuma entrega.</div>')+'</div></section>'+
        '<section class="lc-admin-detail-section"><div class="eyebrow">CERTIFICADOS</div><div class="lc-admin-stack">'+(certs.length?certs.map(c=>'<article class="lc-admin-history"><span><b>'+esc(c.course_title)+'</b><small>'+esc(c.verification_code)+'</small></span><a class="v3-btn secondary" href="../verificar.html?code='+encodeURIComponent(c.verification_code)+'" target="_blank" rel="noopener">Verificar ↗</a><small>'+esc(fmtDate(c.issued_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhum certificado emitido.</div>')+'</div></section>';
      qs('#detailStatus').value=p.status;qs('#detailRole').value=p.role;
      qs('#saveProfileAdmin').onclick=async()=>{try{await LCSupabase.rpc('admin_update_profile',{p_user_id:userId,p_status:qs('#detailStatus').value,p_role:qs('#detailRole').value});toast('Acesso do aluno atualizado.');await Promise.all([loadStudents(),loadSummary(),loadAudit()]);openStudent(userId)}catch(e){toast(e.message,'bad')}};
      qs('#createEnrollmentAdmin').onclick=async()=>{const course=qs('#newEnrollmentCourse').value;if(!course)return toast('Selecione um curso.','bad');try{await LCSupabase.rpc('admin_create_enrollment',{p_user_id:userId,p_course_id:course});toast('Matrícula ativada.');await Promise.all([loadStudents(),loadSummary(),loadAudit()]);openStudent(userId)}catch(e){toast(e.message,'bad')}};
      qsa('[data-enrollment-status]').forEach(sel=>{const found=enrolls.find(e=>e.id===sel.dataset.enrollmentStatus);if(found)sel.value=found.status;sel.onchange=async()=>{try{await LCSupabase.rpc('admin_update_enrollment',{p_enrollment_id:sel.dataset.enrollmentStatus,p_status:sel.value});toast('Status da matrícula atualizado.');await Promise.all([loadStudents(),loadSummary(),loadAudit()])}catch(e){toast(e.message,'bad');if(found)sel.value=found.status}}});
      const refreshCertificate=async()=>{await Promise.all([loadCertificates(),loadStudents(),loadSummary(),loadAudit()]);await openStudent(userId)};
      qsa('[data-issue-certificate]').forEach(btn=>btn.onclick=async()=>{const courseId=btn.dataset.issueCertificate;btn.disabled=true;try{const status=one(await LCSupabase.rpc('admin_certificate_status',{p_user_id:userId,p_course_id:courseId}))||{};if(status.issued){toast('Este certificado já foi emitido.');await refreshCertificate();return}if(!status.eligible){const panel=qs('[data-cert-override="'+courseId+'"]'),reason=qs('[data-cert-override-reason="'+courseId+'"]');if(reason)reason.textContent=status.reason||'Existem requisitos acadêmicos pendentes.';if(panel)panel.hidden=false;toast('Há requisitos acadêmicos pendentes. Revise antes da emissão manual.','bad');return}const result=one(await LCSupabase.rpc('admin_issue_certificate',{p_user_id:userId,p_course_id:courseId,p_override:false,p_reason:null}))||{};if(!result.issued)throw new Error(result.reason||'Não foi possível emitir o certificado.');toast('Certificado emitido com sucesso.');await refreshCertificate()}catch(e){toast(e.message,'bad')}finally{btn.disabled=false}});
      qsa('[data-issue-certificate-override]').forEach(btn=>btn.onclick=async()=>{const courseId=btn.dataset.issueCertificateOverride,reasonEl=qs('[data-cert-override-text="'+courseId+'"]'),reason=(reasonEl?.value||'').trim();if(reason.length<12)return toast('Informe uma justificativa com pelo menos 12 caracteres.','bad');btn.disabled=true;try{const result=one(await LCSupabase.rpc('admin_issue_certificate',{p_user_id:userId,p_course_id:courseId,p_override:true,p_reason:reason}))||{};if(!result.issued)throw new Error(result.reason||'Não foi possível emitir o certificado.');toast('Certificado emitido manualmente e registrado na auditoria.');await refreshCertificate()}catch(e){toast(e.message,'bad')}finally{btn.disabled=false}});
      qsa('[data-cert-override-cancel]').forEach(btn=>btn.onclick=()=>{const panel=qs('[data-cert-override="'+btn.dataset.certOverrideCancel+'"]');if(panel)panel.hidden=true});
    }catch(e){body.innerHTML='<div class="v3-feedback bad">'+esc(e.message)+'</div>'}
  }
  async function loadBoss(){
    const f=filters('boss');
    const rows=await LCSupabase.rpc('admin_boss_roster',{p_status:f.status||null,p_course_id:f.course||null});
    state.bossRows=Array.isArray(rows)?rows:[];
    qs('#bossCount').textContent=state.bossRows.length+' entrega'+(state.bossRows.length===1?'':'s');
    qs('#bossList').innerHTML=state.bossRows.length?state.bossRows.map(r=>{const criteria=Array.isArray(r.rubric?.criteria)?r.rubric.criteria:[],canReview=r.status==='submitted';return '<article class="lc-admin-boss"><div class="lc-admin-boss-head"><div><div class="eyebrow">'+esc(r.course_title)+(r.module_title?' • '+esc(r.module_title):'')+'</div><h3>'+esc(r.project_title)+'</h3><p><b>'+esc(r.student_name)+'</b> • '+esc(r.email||'')+' • '+esc(fmtDate(r.submitted_at))+'</p></div><span class="lc-status '+statusClass(r.status)+'">'+esc(statusLabel(r.status))+'</span></div><div class="v3-rubric">'+criteria.map(x=>'<div><b>'+esc(x.weight)+'%</b><br>'+esc(x.name||x.label||'Critério')+'</div>').join('')+'</div><div class="v3-toolbar"><a class="v3-btn secondary" href="'+esc(r.submission_url||'#')+'" target="_blank" rel="noopener">Abrir entrega ↗</a>'+(!canReview&&r.score!=null?'<span class="v3-pill">Nota '+pct(r.score)+'</span>':'')+'</div>'+(r.feedback?'<div class="v3-feedback '+(r.status==='revision_requested'?'bad':'ok')+'">'+esc(r.feedback)+'</div>':'')+(canReview?'<div class="lc-admin-review"><label>Nota (0–100)</label><input aria-label="Nota da Boss Fight de 0 a 100" type="number" min="0" max="100" inputmode="decimal" data-boss-score="'+r.submission_id+'"><label>Feedback</label><textarea aria-label="Feedback da Boss Fight" rows="4" data-boss-feedback="'+r.submission_id+'" placeholder="Feedback objetivo e acionável."></textarea><div class="v3-toolbar"><button class="v3-btn" type="button" data-boss-action="approved" data-boss-id="'+r.submission_id+'">Aprovar</button><button class="v3-btn secondary" type="button" data-boss-action="revision_requested" data-boss-id="'+r.submission_id+'">Solicitar ajustes</button></div></div>':'')+'</article>'}).join(''):'<div class="lc-admin-empty">Nenhuma Boss Fight com esses filtros.</div>';
    qsa('[data-boss-action]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.bossId,status=btn.dataset.bossAction,scoreEl=qs('[data-boss-score="'+id+'"]'),feedbackEl=qs('[data-boss-feedback="'+id+'"]'),score=scoreEl.value===''?null:Number(scoreEl.value);if(status==='approved'&&score===null)return toast('Informe uma nota antes de aprovar.','bad');try{qsa('[data-boss-id="'+id+'"]').forEach(x=>x.disabled=true);await LCSupabase.rpc('review_project_submission',{p_submission_id:id,p_status:status,p_score:score,p_feedback:feedbackEl.value.trim()});toast(status==='approved'?'Boss Fight aprovada.':'Ajustes solicitados.');await Promise.all([loadBoss(),loadSummary(),loadAudit()])}catch(e){toast(e.message,'bad');qsa('[data-boss-id="'+id+'"]').forEach(x=>x.disabled=false)}});
  }
  async function loadCertificates(){
    const f=filters('certificate');
    const rows=await LCSupabase.rpc('admin_certificate_roster',{p_search:f.search||null,p_course_id:f.course||null});
    state.certificateRows=Array.isArray(rows)?rows:[];
    qs('#certificateCount').textContent=state.certificateRows.length+' certificado'+(state.certificateRows.length===1?'':'s');
    qs('#certificateList').innerHTML=state.certificateRows.length?state.certificateRows.map(r=>'<article class="lc-admin-cert"><span><b>'+esc(r.student_name)+'</b><small>'+esc(r.email||'')+'</small></span><span><b>'+esc(r.course_title)+'</b><small>'+esc(r.verification_code)+'</small></span><span><small>Emitido</small><b>'+esc(fmtDate(r.issued_at))+'</b></span><a class="v3-btn secondary" href="../verificar.html?code='+encodeURIComponent(r.verification_code)+'" target="_blank" rel="noopener">Verificar ↗</a></article>').join(''):'<div class="lc-admin-empty">Nenhum certificado encontrado.</div>';
  }
  function renderDailyChart(rows){
    const el=qs('#analyticsDailyChart');if(!el)return;
    const values=rows.map(r=>Number(r.sessions||0)),max=Math.max(1,...values),w=680,h=170,p=18;
    const points=values.map((v,i)=>{const x=rows.length<=1?w/2:p+(i/(rows.length-1))*(w-p*2),y=h-p-(v/max)*(h-p*2);return x.toFixed(1)+','+y.toFixed(1)}).join(' ');
    const area=points?((p+','+(h-p))+' '+points+' '+((w-p)+','+(h-p))):'';
    el.innerHTML='<svg class="lc-analytics-spark" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Sessões por dia"><polygon class="lc-chart-area" points="'+area+'"></polygon><polyline class="lc-chart-line" points="'+points+'"></polyline></svg>';
    const total=rows.reduce((s,r)=>s+Number(r.sessions||0),0),active=Math.max(0,...rows.map(r=>Number(r.active_users||0))),minutes=rows.reduce((s,r)=>s+Number(r.engagement_minutes||0),0);
    qs('#analyticsDailyMeta').textContent=total+' sessões no período • pico diário de '+active+' usuário(s) ativo(s) • '+num(minutes)+' min de engajamento acumulado';
  }
  function renderBars(el,rows,labelFn,valueFn,detailFn){
    if(!el)return;const values=rows.map(valueFn),max=Math.max(1,...values);
    el.innerHTML=rows.length?rows.map(r=>{const value=Number(valueFn(r)||0),width=Math.max(value>0?4:0,Math.round(value/max*100));return '<div class="lc-analytics-bar"><div><b>'+esc(labelFn(r))+'</b><small>'+esc(detailFn(r))+'</small></div><div class="lc-analytics-bar-track"><span style="width:'+width+'%"></span></div><strong>'+num(value)+'</strong></div>'}).join(''):'<div class="lc-admin-empty">Ainda não há dados suficientes neste período.</div>';
  }
  async function loadLessonAnalytics(){
    const courseId=qs('#analyticsLessonCourse')?.value||'',days=Number(qs('#analyticsDays')?.value||30),host=qs('#analyticsLessons');
    if(!host)return;
    if(!courseId){host.innerHTML='<div class="lc-admin-empty">Selecione um curso para analisar as aulas.</div>';return}
    host.innerHTML='<div class="loading">Calculando desempenho das aulas</div>';
    try{
      const rows=await LCSupabase.rpc('admin_analytics_lessons',{p_course_id:courseId,p_days:days});
      host.innerHTML=(Array.isArray(rows)?rows:[]).length?'<div class="lc-analytics-row lc-analytics-row-head"><span>Aula</span><span>Aberturas</span><span>Conclusão</span><span>Tempo</span><span>Scroll</span><span>Checagens</span><span>Labs</span></div>'+rows.map(r=>'<div class="lc-analytics-row"><span><b>'+esc(r.lesson_title)+'</b><small>'+esc(r.module_title)+'</small></span><span><b>'+num(r.opens)+'</b><small>'+num(r.unique_learners)+' aluno(s)</small></span><span><b>'+pct(r.completion_from_opens)+'</b><small>'+num(r.completions)+' conclusão(ões)</small></span><span><b>'+num(Number(r.avg_engagement_seconds||0)/60)+' min</b><small>tempo ativo</small></span><span><b>'+pct(r.avg_scroll_percent)+'</b><small>profundidade média</small></span><span><b>'+pct(r.inline_correct_rate)+'</b><small>'+num(r.inline_checks)+' tentativa(s)</small></span><span><b>'+num(r.lab_completions)+'</b><small>Lab concluído</small></span></div>').join(''):'<div class="lc-admin-empty">Ainda não há eventos de aula para este curso no período.</div>';
    }catch(e){host.innerHTML='<div class="v3-feedback bad">'+esc(e.message)+'</div>'}
  }
  async function loadAnalytics(){
    const days=Number(qs('#analyticsDays')?.value||30);
    try{
      const[overviewRaw,funnel,daily,courses,devices,goals]=await Promise.all([
        LCSupabase.rpc('admin_analytics_overview',{p_days:days}),
        LCSupabase.rpc('admin_analytics_funnel',{p_days:days}),
        LCSupabase.rpc('admin_analytics_daily',{p_days:days}),
        LCSupabase.rpc('admin_analytics_courses',{p_days:days}),
        LCSupabase.rpc('admin_analytics_devices',{p_days:days}),
        LCSupabase.rpc('admin_analytics_goals',{})
      ]);
      const o=one(overviewRaw)||{};
      const metrics={analyticsActive:o.active_users,analyticsSessions:o.sessions,analyticsLessonOpens:o.lesson_opens,analyticsLessonDone:o.lesson_completions,analyticsEngagement:num(o.avg_engagement_minutes)+' min',analyticsQuizPass:pct(o.quiz_pass_rate),analyticsMobile:pct(o.mobile_share),analyticsEvents:o.events};
      Object.entries(metrics).forEach(([id,v])=>{const el=qs('#'+id);if(el)el.textContent=typeof v==='number'?num(v):v});
      qs('#analyticsSince').textContent=o.instrumented_since?'Instrumentação ativa desde '+fmtDate(o.instrumented_since)+'. O painel de eventos reflete o comportamento observado a partir desse momento.':'A instrumentação entra em vigor com esta versão. Os primeiros eventos aparecerão assim que alunos navegarem pela plataforma.';
      const f=Array.isArray(funnel)?funnel:[],fmax=Math.max(1,...f.map(x=>Number(x.people||0)));
      qs('#analyticsFunnel').innerHTML=f.map(x=>'<div class="lc-funnel-row"><span><b>'+esc(x.stage)+'</b><small>'+num(x.people)+' pessoa(s)/sessão(ões)</small></span><div><i style="width:'+Math.round(Number(x.people||0)/fmax*100)+'%"></i></div><strong>'+num(x.people)+'</strong></div>').join('');
      renderDailyChart(Array.isArray(daily)?daily:[]);
      const cr=Array.isArray(courses)?courses:[];
      qs('#analyticsCourses').innerHTML=cr.length?'<div class="lc-course-analytics-row lc-course-analytics-head"><span>Curso</span><span>Alunos ativos</span><span>Aulas</span><span>Quiz</span><span>Boss</span><span>Cert.</span><span>Engajamento</span></div>'+cr.map(r=>'<div class="lc-course-analytics-row"><span><b>'+esc(r.course_title)+'</b><small>'+num(r.enrollments)+' matrícula(s) • '+num(r.course_opens)+' abertura(s)</small></span><span><b>'+num(r.active_learners)+'</b><small>no período</small></span><span><b>'+num(r.lesson_completions)+'</b><small>'+num(r.lesson_opens)+' abertas</small></span><span><b>'+pct(r.quiz_pass_rate)+'</b><small>média '+pct(r.avg_quiz_score)+'</small></span><span><b>'+num(r.boss_submissions)+'</b><small>envios</small></span><span><b>'+num(r.certificates)+'</b><small>emitidos</small></span><span><b>'+num(r.engagement_minutes)+' min</b><small>tempo ativo</small></span></div>').join(''):'<div class="lc-admin-empty">Ainda não há dados por curso no período.</div>';
      renderBars(qs('#analyticsDevices'),Array.isArray(devices)?devices:[],r=>({mobile:'Mobile',tablet:'Tablet',desktop:'Desktop',unknown:'Desconhecido'}[r.device_type]||r.device_type),r=>Number(r.sessions||0),r=>num(r.active_users)+' usuário(s) • '+num(r.events)+' eventos');
      renderBars(qs('#analyticsGoals'),Array.isArray(goals)?goals:[],r=>goalLabel(r.goal),r=>Number(r.learners||0),r=>'diagnóstico médio '+num(r.avg_diagnostic_score)+'/6 • '+num(r.mastered)+' base dominada');
      await loadLessonAnalytics();
    }catch(e){toast('Analytics: '+e.message,'bad')}
  }

  async function loadAffiliates(){
    const payoutStatus=qs('#affiliatePayoutStatus')?.value||'';
    try{
      const[summaryRaw,rows,payouts]=await Promise.all([
        LCSupabase.rpc('admin_affiliate_summary',{}),
        LCSupabase.rpc('admin_affiliate_roster',{}),
        LCSupabase.rpc('admin_affiliate_payout_roster',{p_status:payoutStatus||null})
      ]);
      const s=one(summaryRaw)||{};
      const metrics={
        affiliateCount:s.affiliates,affiliateActive:s.active_affiliates,affiliateClicks:s.clicks_30d,affiliateSales:s.paid_sales,
        affiliatePending:moneyCents(s.commission_pending_cents),affiliateAvailable:moneyCents(s.commission_available_cents),
        affiliatePayoutsOpen:moneyCents(s.payouts_requested_cents),affiliatePaid:moneyCents(s.payouts_paid_cents)
      };
      Object.entries(metrics).forEach(([id,v])=>{const el=qs('#'+id);if(el)el.textContent=typeof v==='number'?Number(v||0).toLocaleString('pt-BR'):v});
      state.affiliateRows=Array.isArray(rows)?rows:[];
      state.affiliatePayoutRows=Array.isArray(payouts)?payouts:[];
      const host=qs('#affiliateList');
      if(host)host.innerHTML=state.affiliateRows.length?state.affiliateRows.map(r=>'<article class="lc-admin-affiliate-row"><span><b>'+esc(r.full_name||'Afiliado LC')+'</b><small>'+esc(r.email||'')+' • '+esc(r.code)+'</small></span><span><small>Status</small><b class="lc-status '+statusClass(r.status)+'">'+esc(statusLabel(r.status))+'</b></span><span><small>Cliques</small><b>'+Number(r.clicks||0).toLocaleString('pt-BR')+'</b></span><span><small>Vendas</small><b>'+Number(r.paid_sales||0).toLocaleString('pt-BR')+'</b></span><span><small>Disponível / pago</small><b>'+moneyCents(r.available_cents)+'</b><small>'+moneyCents(r.paid_cents)+' pagos</small></span><span class="lc-admin-affiliate-actions"><label><small>Comissão personalizada (%)</small><input type="number" min="0" max="100" step="0.01" placeholder="padrão" data-aff-commission="'+r.affiliate_id+'" value="'+(r.commission_bps_override==null?'':Number(r.commission_bps_override)/100)+'"></label><button class="v3-btn secondary" type="button" data-aff-save="'+r.affiliate_id+'">Salvar</button><button class="v3-btn secondary" type="button" data-aff-toggle="'+r.affiliate_id+'" data-next-status="'+(r.status==='active'?'suspended':'active')+'">'+(r.status==='active'?'Suspender':'Reativar')+'</button></span></article>').join(''):'<div class="lc-admin-empty">Nenhum afiliado cadastrado ainda.</div>';
      qsa('[data-aff-save]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.affSave,input=qs('[data-aff-commission="'+id+'"]'),raw=(input?.value||'').trim(),clear=raw==='',pctv=clear?null:Number(raw);if(!clear&&(!Number.isFinite(pctv)||pctv<0||pctv>100))return toast('Informe comissão entre 0% e 100%.','bad');btn.disabled=true;try{await LCSupabase.rpc('admin_update_affiliate',{p_affiliate_id:id,p_status:null,p_commission_bps_override:clear?null:Math.round(pctv*100),p_clear_override:clear});toast(clear?'Comissão voltou ao padrão do produto.':'Comissão personalizada atualizada.');await Promise.all([loadAffiliates(),loadAudit()])}catch(e){toast(e.message,'bad')}finally{btn.disabled=false}});
      qsa('[data-aff-toggle]').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{await LCSupabase.rpc('admin_update_affiliate',{p_affiliate_id:btn.dataset.affToggle,p_status:btn.dataset.nextStatus,p_commission_bps_override:null,p_clear_override:false});toast(btn.dataset.nextStatus==='active'?'Afiliado reativado.':'Afiliado suspenso.');await Promise.all([loadAffiliates(),loadAudit()])}catch(e){toast(e.message,'bad')}finally{btn.disabled=false}});
      const ph=qs('#affiliatePayoutList');
      if(ph)ph.innerHTML=state.affiliatePayoutRows.length?state.affiliatePayoutRows.map(r=>'<article class="lc-admin-payout"><span><b>'+esc(r.full_name||'Afiliado LC')+'</b><small>'+esc(r.email||'')+' • '+esc(r.code)+'</small></span><span><small>Valor</small><b>'+moneyCents(r.amount_cents)+'</b><small>bruto '+moneyCents(r.gross_commission_cents)+(Number(r.clawback_offset_cents||0)>0?' • ajuste -'+moneyCents(r.clawback_offset_cents):'')+'</small></span><span><small>Pix</small><b>'+esc(r.pix_key||'Não cadastrado')+'</b><small>'+esc(r.holder_name||'')+'</small></span><span><small>Status</small><b class="lc-status '+statusClass(r.status)+'">'+esc(statusLabel(r.status))+'</b><small>'+esc(fmtDate(r.requested_at))+'</small></span>'+(['requested','approved'].includes(r.status)?'<div class="lc-admin-payout-actions"><label>Referência do pagamento<input data-payout-ref="'+r.payout_id+'" placeholder="ID/comprovante do Pix"></label>'+(r.status==='requested'?'<button class="v3-btn secondary" data-payout-action="approve" data-payout-id="'+r.payout_id+'" type="button">Aprovar</button>':'')+'<button class="v3-btn" data-payout-action="paid" data-payout-id="'+r.payout_id+'" type="button">Marcar pago</button><button class="v3-btn secondary" data-payout-action="reject" data-payout-id="'+r.payout_id+'" type="button">Rejeitar</button></div>':'')+'</article>').join(''):'<div class="lc-admin-empty">Nenhum saque encontrado.</div>';
      qsa('[data-payout-action]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.payoutId,action=btn.dataset.payoutAction,ref=(qs('[data-payout-ref="'+id+'"]')?.value||'').trim();if(action==='paid'&&ref.length<3)return toast('Informe a referência do Pix antes de marcar como pago.','bad');qsa('[data-payout-id="'+id+'"]').forEach(x=>x.disabled=true);try{await LCSupabase.rpc('admin_review_affiliate_payout',{p_request_id:id,p_action:action,p_payment_reference:ref||null,p_notes:null});toast(action==='paid'?'Saque conciliado como pago.':action==='approve'?'Saque aprovado.':'Saque rejeitado.');await Promise.all([loadAffiliates(),loadAudit()])}catch(e){toast(e.message,'bad');qsa('[data-payout-id="'+id+'"]').forEach(x=>x.disabled=false)}});
    }catch(e){toast('Afiliados: '+e.message,'bad')}
  }

  async function loadGrowth(){
    const days=Number(qs('#growthDays')?.value||30);
    try{
      const [g,reviews]=await Promise.all([
        LCSupabase.adminGrowth(days),
        LCSupabase.rpc('admin_course_review_roster',{p_status:null})
      ]);
      const acquisition=g?.acquisition||{},activation=g?.activation||{},retention=g?.retention||{},learning=g?.learning||{},commerce=g?.commerce||{},social=g?.social||{};
      const metricMap={
        growthSessions:acquisition.sessions,
        growthAccounts:activation.new_accounts,
        growthActivated:activation.activated_users,
        growthThreeLessons:activation.three_lesson_users,
        growthActive7:retention.active_7d,
        growthPaidOrders:commerce.paid_orders,
        growthRevenue:moneyCents(commerce.gross_cents),
        growthReferrals:social.student_referrals
      };
      Object.entries(metricMap).forEach(([id,v])=>{const el=qs('#'+id);if(el)el.textContent=typeof v==='string'?v:num(v||0)});
      const stages=[
        ['Novas contas',activation.new_accounts],
        ['Diagnóstico',activation.diagnostic_users],
        ['1ª aula concluída',activation.first_lesson_users],
        ['Aluno ativado',activation.activated_users],
        ['3+ aulas',activation.three_lesson_users]
      ],max=Math.max(1,...stages.map(x=>Number(x[1]||0)));
      qs('#growthActivation').innerHTML=stages.map(([label,value])=>'<div class="lc-funnel-row"><span><b>'+esc(label)+'</b><small>'+num(value||0)+' pessoa(s)</small></span><div><i style="width:'+Math.round(Number(value||0)/max*100)+'%"></i></div><strong>'+num(value||0)+'</strong></div>').join('');
      renderBars(qs('#growthSources'),Array.isArray(acquisition.sources)?acquisition.sources:[],r=>r.source||'(direct)',r=>Number(r.count||0),r=>num(r.count||0)+' evento(s)/sessão(ões) atribuídos');
      qs('#growthLearning').innerHTML=[
        ['Aulas concluídas',learning.completed_lessons],
        ['Tentativas de avaliação',learning.assessment_attempts],
        ['Boss Fights enviados',learning.project_submissions],
        ['Cursos concluídos',learning.completed_enrollments],
        ['Certificados',learning.certificates],
        ['Streak ativo',retention.streak_users]
      ].map(([label,value])=>'<div><span><b>'+esc(label)+'</b></span><strong>'+num(value||0)+'</strong></div>').join('');
      qs('#growthCommerce').innerHTML=[
        ['Visitas LC Pro',commerce.pro_views],
        ['Pedidos criados',commerce.orders],
        ['Vendas pagas',commerce.paid_orders],
        ['Receita',moneyCents(commerce.gross_cents)],
        ['Reviews recebidos',social.reviews],
        ['Reviews públicos',social.public_reviews],
        ['Cliques afiliados',social.affiliate_clicks],
        ['Vendas afiliadas',social.affiliate_sales]
      ].map(([label,value])=>'<div><span><b>'+esc(label)+'</b></span><strong>'+esc(typeof value==='string'?value:num(value||0))+'</strong></div>').join('');
      const rr=Array.isArray(reviews)?reviews:[];
      qs('#growthReviewList').innerHTML=rr.length?rr.map(r=>'<article class="lc-review-moderation-row"><div><div class="eyebrow">'+esc(r.course_title)+'</div><h4>'+esc(r.student_name)+'</h4><div class="lc-review-stars">'+('★'.repeat(Number(r.rating||0)))+('☆'.repeat(Math.max(0,5-Number(r.rating||0))))+'</div><p>'+esc(r.comment||'Sem comentário.')+'</p><small>'+esc(fmtDate(r.created_at))+' • '+(r.consent_public?'autorizou publicação':'não autorizou publicação')+'</small></div><div class="lc-review-moderation-actions"><span class="lc-status '+statusClass(r.status)+'">'+esc(statusLabel(r.status))+'</span>'+(r.status==='pending'?'<button class="v3-btn secondary" type="button" data-review-action="approve" data-review-id="'+r.review_id+'" '+(!r.consent_public?'disabled title="Sem autorização para publicação"':'')+'>Aprovar público</button><button class="v3-btn secondary" type="button" data-review-action="reject" data-review-id="'+r.review_id+'">Rejeitar</button>':'')+'</div></article>').join(''):'<div class="lc-admin-empty">Nenhuma avaliação de curso recebida ainda.</div>';
      qsa('[data-review-action]').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;try{await LCSupabase.moderateCourseReview({id:btn.dataset.reviewId,status:btn.dataset.reviewAction==='approve'?'approved':'rejected'});toast(btn.dataset.reviewAction==='approve'?'Avaliação aprovada para exibição pública.':'Avaliação rejeitada.');await loadGrowth()}catch(e){toast(e.message,'bad');btn.disabled=false}});
    }catch(e){toast('Growth Center: '+e.message,'bad')}
  }

  async function loadDonations(){
    const status=qs('#donationStatus')?.value||'';
    const rows=await LCSupabase.rpc('admin_donation_roster',{p_status:status||null,p_limit:100});
    state.donationRows=Array.isArray(rows)?rows:[];
    const count=qs('#donationCount');if(count)count.textContent=state.donationRows.length+' contribuiç'+(state.donationRows.length===1?'ão':'ões');
    const host=qs('#donationList');if(!host)return;
    host.innerHTML=state.donationRows.length?state.donationRows.map(r=>'<article class="lc-admin-history"><span><b>'+esc(r.donor_name)+'</b><small>'+esc(r.payer_email)+' • '+esc(r.provider||'—')+(r.payment_method?' • '+esc(r.payment_method):'')+'</small></span><strong>'+money(r.amount)+'</strong><span class="lc-status '+statusClass(r.status)+'">'+esc(donationStatusLabel(r.status))+'</span><small>'+esc(fmtDate(r.approved_at||r.created_at))+'</small></article>').join(''):'<div class="lc-admin-empty">Nenhuma contribuição encontrada com este filtro.</div>';
  }
  async function saveManualDonation(){
    const name=qs('#manualDonationName')?.value.trim()||'',email=qs('#manualDonationEmail')?.value.trim()||'',amount=Number(qs('#manualDonationAmount')?.value||0),message=qs('#manualDonationMessage')?.value.trim()||'',publicListing=!!qs('#manualDonationPublic')?.checked;
    if(name.length<2)return toast('Informe o nome do contribuinte.','bad');
    if(!/^\S+@\S+\.\S+$/.test(email))return toast('Informe um e-mail válido.','bad');
    if(!Number.isFinite(amount)||amount<1)return toast('Informe um valor recebido a partir de R$ 1.','bad');
    const btn=qs('#manualDonationSave');if(btn)btn.disabled=true;
    try{
      await LCSupabase.rpc('admin_register_manual_donation',{p_name:name,p_email:email,p_amount:amount,p_message:message||null,p_public_listing:publicListing,p_approved_at:new Date().toISOString()});
      ['manualDonationName','manualDonationEmail','manualDonationAmount','manualDonationMessage'].forEach(id=>{const el=qs('#'+id);if(el)el.value=''});
      if(qs('#manualDonationPublic'))qs('#manualDonationPublic').checked=false;
      toast('Pix direto registrado e conciliado.');
      await Promise.all([loadDonations(),loadAudit(),loadSummary()]);
    }catch(e){toast(e.message,'bad')}
    finally{if(btn)btn.disabled=false}
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
      ['studentCourse','bossCourse','certificateCourse','analyticsLessonCourse'].forEach(id=>{const sel=qs('#'+id);state.courses.forEach(c=>sel.insertAdjacentHTML('beforeend','<option value="'+c.id+'">'+esc(c.title)+'</option>'))});
      qsa('[data-admin-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.adminTab));
      qs('#studentDialogClose').onclick=()=>qs('#studentDialog').close();
      qs('#studentDialog').addEventListener('click',e=>{if(e.target===qs('#studentDialog'))qs('#studentDialog').close()});
      wireFilters();qs('#analyticsDays').onchange=()=>loadAnalytics();qs('#analyticsLessonCourse').onchange=()=>loadLessonAnalytics();qs('#growthDays').onchange=()=>loadGrowth();qs('#growthRefresh').onclick=()=>loadGrowth();
      qs('#affiliateRefresh').onclick=()=>loadAffiliates();qs('#affiliatePayoutStatus').onchange=()=>loadAffiliates();
      qs('#donationApply').onclick=()=>loadDonations();qs('#donationStatus').onchange=()=>loadDonations();qs('#manualDonationSave').onclick=()=>saveManualDonation();
      await Promise.all([loadSummary(),loadStudents(),loadBoss(),loadCertificates(),loadAffiliates(),loadDonations(),loadAudit(),loadAnalytics(),loadGrowth()]);
      qs('#state').classList.add('hidden');qs('#content').classList.remove('hidden');
      const initial=location.hash.replace('#','');setTab(['overview','analytics','growth','students','boss','certificates','affiliates','donations','audit'].includes(initial)?initial:'overview');
    }catch(e){setState(qs('#state'),'error',e.message)}
  }
  return{init,setTab,loadStudents,loadBoss,loadCertificates,loadAffiliates,loadDonations,loadAudit,loadAnalytics,loadLessonAnalytics,loadGrowth}
})();
AdminOps.init();
